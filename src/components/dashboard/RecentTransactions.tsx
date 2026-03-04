import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatIskAmount } from '@/lib/categories';
import type { Transaction } from '@/types/database';
import { formatDateIs } from '@/lib/parseTransactions';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nýlegar færslur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Engar færslur</p>
        ) : (
          transactions.slice(0, 8).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                {tx.is_income ? (
                  <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm truncate max-w-[200px]">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDateIs(tx.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tx.category && (
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                    {tx.category.name_is}
                  </Badge>
                )}
                <span className={`text-sm font-medium whitespace-nowrap ${tx.is_income ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.is_income ? '+' : '-'}{formatIskAmount(Math.abs(tx.amount))}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
