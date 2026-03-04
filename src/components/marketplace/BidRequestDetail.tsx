import { Button } from '@/components/ui/button';

interface Props {
  bidRequestId: string;
  associationId: string;
  isAdmin: boolean;
  onBack: () => void;
}

export function BidRequestDetail({ onBack }: Props) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>← Til baka</Button>
      <p className="text-sm text-muted-foreground">Upplýsingar um tilboðsbeiðni — kemur fljótlega</p>
    </div>
  );
}
