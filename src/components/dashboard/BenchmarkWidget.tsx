import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';

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
          <p className="text-xs text-muted-foreground mt-2">
            Þessi eiginleiki er í vinnslu
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
