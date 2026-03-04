// ============================================================
// Húsfélagið.is — Marketplace Page (placeholder)
// ============================================================

import { Card, CardContent } from '@/components/ui/card';
import { Store, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Marketplace() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Markaðstorg</h1>
        <Badge variant="secondary">Væntanlegt</Badge>
      </div>

      <Card className="border-dashed max-w-xl">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Store className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Markaðstorgið er í vinnslu</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Hér getur þú sent tilboðsbeiðnir til þjónustuaðila og borin saman tilboð
              hlið við hlið. Garðyrkja, ræsting, pípulagnir og fleira.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Fáanlegt í Plus og Pro áskrift
          </div>
          <Button variant="outline" size="sm" disabled>
            Tilkynna mér þegar tilbúið
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
