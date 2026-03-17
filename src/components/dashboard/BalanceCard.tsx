import { Card, CardContent } from '@/components/ui/card';
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
  income: 'text-financial-income',
  expense: 'text-financial-expense',
};

const glowMap = {
  balance: 'bg-primary/20',
  income: 'bg-[hsl(175,70%,42%,0.15)]',
  expense: 'bg-[hsl(347,70%,58%,0.15)]',
};

export function BalanceCard({ label, amount, isLoading, type, subtitle }: BalanceCardProps) {
  const Icon = iconMap[type];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="card-label">{label}</span>
          <div className={`w-8 h-8 rounded-lg ${glowMap[type]} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${colorMap[type]}`} />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-32" />
        ) : (
          <div className={`kpi-number ${colorMap[type]}`}>
            {amount != null ? formatIskAmount(amount) : '-'}
          </div>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
