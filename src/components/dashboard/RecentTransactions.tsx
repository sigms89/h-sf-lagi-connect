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
    <div className="space-y-1">
      {transactions.slice(0, 5).map((tx) => (
        <div key={tx.id} className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-zinc-400 tabular-nums w-20 flex-shrink-0">
              {formatDateIs(tx.date)}
            </span>
            <span className="text-sm text-zinc-900 truncate">{tx.description}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {tx.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                {tx.category.name_is}
              </span>
            )}
            <span className={`text-sm font-medium tabular-nums text-right ${tx.is_income ? 'text-teal-600' : 'text-rose-600'}`}>
              {tx.is_income ? '+' : '-'}{formatIskAmount(Math.abs(tx.amount))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
