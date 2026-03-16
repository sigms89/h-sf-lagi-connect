import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatIskAmount } from '@/lib/categories';
import type { Transaction } from '@/types/database';
import { formatDateIs } from '@/lib/parseTransactions';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
      </div>
    );
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-zinc-500 text-center py-4">Engar færslur</p>;
  }

  return (
    <div className="space-y-0">
      {transactions.slice(0, 5).map((tx) => (
        <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[11px] text-muted-foreground tabular-nums w-[72px] flex-shrink-0">
              {formatDateIs(tx.date)}
            </span>
            <span className="text-[13px] text-foreground truncate">{tx.description}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {tx.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {tx.category.name_is}
              </span>
            )}
            <span className={`text-[13px] font-medium tabular-nums text-right ${tx.is_income ? 'text-financial-income' : 'text-financial-expense'}`}>
              {tx.is_income ? '+' : '-'}{formatIskAmount(Math.abs(tx.amount))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
