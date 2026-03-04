// ============================================================
// Húsfélagið.is — BenchmarkWidget (Dashboard teaser)
// Links to /benchmarking instead of stub placeholder
// ============================================================

import { Link } from 'react-router-dom';
import { Scale, ArrowRight, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BenchmarkWidgetProps {
  numUnits?: number;
  subscriptionTier?: string | null;
}

export function BenchmarkWidget({ numUnits, subscriptionTier }: BenchmarkWidgetProps) {
  const hasPaidTier = subscriptionTier === 'plus' || subscriptionTier === 'pro';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Samanburður
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasPaidTier ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {numUnits
                ? `Sjáðu hvernig kostnaður ber saman við húsfélög með ${numUnits} íbúðir.`
                : 'Sjáðu hvernig kostnaður ber saman við sambærileg húsfélög.'}
            </p>
            <Link to="/benchmarking">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Skoða samanburð
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-2 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Uppfærðu í Plús</p>
              <p className="text-xs text-muted-foreground mt-1">
                Berðu saman kostnaðarliði við sambærileg húsfélög á landsvísu.
              </p>
            </div>
            <Button variant="default" size="sm" className="w-full">
              Uppfærðu í Plús
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
