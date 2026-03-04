import type { BidRequest } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  requests: BidRequest[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}

export function BidRequestList({ requests, isLoading, onSelect }: Props) {
  if (isLoading) return <Skeleton className="h-48 w-full rounded-lg" />;
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Engar tilboðsbeiðnir enn</p>;
  }
  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <button key={r.id} onClick={() => onSelect(r.id)} className="w-full text-left rounded-lg border p-3 hover:bg-muted/50">
          <p className="font-medium text-sm">{r.title}</p>
          <p className="text-xs text-muted-foreground">{r.status}</p>
        </button>
      ))}
    </div>
  );
}
