// ============================================================
// Húsfélagið.is: Skjöl — Placeholder empty state
// Will gain real document storage in a later iteration.
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
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Skjöl</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {association?.name ?? "Húsfélagið þitt"}
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <div>
            <h3 className="font-semibold text-foreground">Engin skjöl enn</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Hladdu inn fundargerðum, reikningum eða öðrum skjölum húsfélagsins.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => toast.info("Skjalavistun kemur fljótlega.")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Hlaða inn skjali
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
