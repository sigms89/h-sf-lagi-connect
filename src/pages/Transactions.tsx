import { useNavigate } from 'react-router-dom';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { TransactionList } from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function Transactions() {
  const navigate = useNavigate();
  const { data: association, isLoading } = useCurrentAssociation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Hleð...</div>;
  }

  if (!association) {
    return <div className="text-center py-16 text-muted-foreground">Ekkert húsfélag tengt.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Færslur</h1>
        <Button onClick={() => navigate('/upload')}>
          <Upload className="h-4 w-4 mr-2" />
          Hlaða upp
        </Button>
      </div>
      <TransactionList associationId={association.id} />
    </div>
  );
}
