import type { Association } from '@/types/database';

interface Props {
  open: boolean;
  onClose: () => void;
  association: Association;
}

export function BidRequestForm({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
      <div className="rounded-lg border bg-card p-6 max-w-md w-full">
        <p className="text-sm text-muted-foreground">Tilboðsform — kemur fljótlega</p>
        <button onClick={onClose} className="mt-4 text-sm underline">Loka</button>
      </div>
    </div>
  );
}
