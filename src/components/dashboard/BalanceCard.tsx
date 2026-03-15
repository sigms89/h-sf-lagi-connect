import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatIskAmount } from '@/lib/categories';

interface BalanceCardProps {
  label: string;
  amount: number | null | undefined;
  isLoading: boolean;
  type: 'balance' | 'income' | 'expense';
  subtitle?: string;
}

const iconMap = {
  balance: Wallet,
  income: TrendingUp,
  expense: TrendingDown,
};

const colorMap = {
  balance: 'text-foreground',
  income: 'text-teal-600',
  expense: 'text-rose-600',
};

export function BalanceCard({ label, amount, isLoading, type, subtitle }: BalanceCardProps) {
  const Icon = iconMap[type];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${colorMap[type]}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-32" />
        ) : (
          <div className={`text-2xl font-bold tabular-nums ${colorMap[type]}`}>
            {amount != null ? formatIskAmount(amount) : '—'}
          </div>
        )}
        {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
