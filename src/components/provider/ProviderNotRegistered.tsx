// ============================================================
// Húsfélagið.is — Provider Not Registered placeholder
// ============================================================

import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ProviderNotRegistered() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Briefcase className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Þjónustuaðilasvæðið</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Þú ert ekki skráður sem þjónustuaðili. Skráðu þig til að geta tekið þátt í
          tilboðsferlum og boðið þjónustu þína húsfélögum.
        </p>
      </div>
      <Button onClick={() => navigate('/provider/register')}>
        Skrá fyrirtæki mitt
      </Button>
    </div>
  );
}
