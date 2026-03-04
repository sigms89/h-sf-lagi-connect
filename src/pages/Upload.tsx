import { useNavigate } from 'react-router-dom';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { UploadTransactions } from '@/components/transactions/UploadTransactions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function UploadPage() {
  const navigate = useNavigate();
  const { data: association, isLoading } = useCurrentAssociation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Hleð...</div>;
  }

  if (!association) {
    return <div className="text-center py-16 text-muted-foreground">Ekkert húsfélag tengt.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hlaða upp færslum</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Límdu inn bankafærslur eða hladdu upp CSV skrá
        </p>
      </div>
      <UploadTransactions
        associationId={association.id}
        onSuccess={() => navigate('/transactions')}
        testModeDefault={false}
      />
    </div>
  );
}
