// ============================================================
// Húsfélagið.is — BenchmarkWidget
// Dashboard widget linking to the benchmarking page
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BenchmarkWidgetProps {
  numUnits?: number;
}

export function BenchmarkWidget({ numUnits }: BenchmarkWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Samanburður
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            {numUnits
              ? `Samanburður við húsfélög með ${numUnits} íbúðir`
              : 'Samanburður væntanlegur'}
          </p>
          <Link to="/benchmarking">
            <Button variant="outline" size="sm" className="mt-3">
              Skoða samanburð
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
