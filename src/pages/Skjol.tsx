// ============================================================
// Húsfélagið.is: Skjöl — Placeholder empty state
// ============================================================

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Upload } from "lucide-react";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import { toast } from "sonner";

export default function Skjol() {
  const { data: association } = useCurrentAssociation();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">Skjöl</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
          {association?.name ?? "Húsfélagið þitt"}
        </h1>
      </div>

      <Card>
        <CardContent className="py-10 px-6 text-center space-y-5">
          <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Engin skjöl enn.</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Hér geymir þú fundargerðir, samninga og reikninga.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => toast.info("Skjalavistun kemur fljótlega.")}
            className="w-full sm:w-auto h-12"
          >
            <Upload className="h-4 w-4 mr-2" />
            Hlaða inn skjali
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
