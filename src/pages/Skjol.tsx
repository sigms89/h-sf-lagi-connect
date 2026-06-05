// ============================================================
// Húsfélagið.is: Skjöl — Honest empty state (feature coming soon)
// ============================================================

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, FileText, Receipt, FileSignature, ShieldCheck, ArrowLeft } from "lucide-react";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import { useNavigate } from "react-router-dom";

const DOC_TYPES = [
  { icon: FileText, label: "Fundargerðir" },
  { icon: Receipt, label: "Reikningar" },
  { icon: FileSignature, label: "Samningar" },
  { icon: ShieldCheck, label: "Tryggingar" },
];

export default function Skjol() {
  const { data: association } = useCurrentAssociation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">Skjöl</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
          {association?.name ?? "Húsfélagið þitt"}
        </h1>
      </div>

      <Card>
        <CardContent className="py-10 px-6 text-center space-y-6">
          <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Skjalageymsla á leiðinni</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Bráðlega getur þú geymt fundargerðir, samninga og tryggingapappír hér á einum stað.
              Við látum þig vita þegar þetta er tilbúið.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto pt-2">
            {DOC_TYPES.map((t) => (
              <div
                key={t.label}
                className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 text-[13px] text-muted-foreground"
              >
                <t.icon className="h-4 w-4 shrink-0" />
                <span>{t.label}</span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/")}
            className="w-full sm:w-auto h-12"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Til baka á yfirlit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
