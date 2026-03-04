import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { usePaymentAnalysis } from '@/hooks/usePaymentAnalysis';

function formatISK(amount: number) {
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompact(amount: number) {
  return new Intl.NumberFormat('is-IS', {
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PaymentAnalysis() {
  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;
  const { data, isLoading } = usePaymentAnalysis(associationId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const individualPct =
    data.totalIncome > 0
      ? Math.round((data.individualTotal / data.totalIncome) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Innborgunargreining</h2>
        <p className="text-sm text-muted-foreground">
          Sundurliðun á einstaklings- og öðrum tekjum
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[#0d9488]" />
              <span className="text-xs text-muted-foreground">
                Einstaklingsgreiðslur
              </span>
            </div>
            <p className="text-xl font-bold">
              {formatISK(data.individualTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.individualCount} færslur · {individualPct}% af tekjum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="h-4 w-4 text-[#1e3a5f]" />
              <span className="text-xs text-muted-foreground">
                Aðrar tekjur
              </span>
            </div>
            <p className="text-xl font-bold">
              {formatISK(data.otherIncomeTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.otherIncomeCount} færslur · {100 - individualPct}% af tekjum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">
                Heildarfjöldi (einstakl.)
              </span>
            </div>
            <p className="text-xl font-bold">{data.individualCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Greiðslur síðustu 12 mán.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">
                Heildar tekjur
              </span>
            </div>
            <p className="text-xl font-bold">
              {formatISK(data.totalIncome)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Síðustu 12 mánuðir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Mánaðarlegar tekjur eftir gerð
          </CardTitle>
          <CardDescription className="text-xs">
            Einstaklingsgreiðslur vs. aðrar tekjur – síðustu 12 mánuðir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.monthlyData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month_label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCompact(v)}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatISK(value),
                  name === 'individual'
                    ? 'Einstaklingsgreiðslur'
                    : 'Aðrar tekjur',
                ]}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 12,
                }}
              />
              <Legend
                formatter={(value) =>
                  value === 'individual'
                    ? 'Einstaklingsgreiðslur'
                    : 'Aðrar tekjur'
                }
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="individual"
                fill="#0d9488"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
                stackId="a"
              />
              <Bar
                dataKey="other"
                fill="#1e3a5f"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
