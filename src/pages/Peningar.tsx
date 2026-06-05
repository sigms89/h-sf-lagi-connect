// ============================================================
// Húsfélagið.is: Peningar (Simplified Financials page)
// One page: upload + hreyfingar list + uncategorized hint + report
// ============================================================

import { useCurrentAssociation } from "@/hooks/useAssociation";
import { useTransactionStats } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, Loader2, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Peningar() {
  const navigate = useNavigate();
  const { data: association, isLoading } = useCurrentAssociation();
  const { data: stats } = useTransactionStats(association?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!association) {
    return (
      <div className="text-center py-16 text-zinc-500">Ekkert húsfélag tengt.</div>
    );
  }

  const uncategorizedCount = stats?.uncategorized_count ?? 0;
  const hasData = (stats?.total_income ?? 0) > 0 || (stats?.total_expenses ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Peningar</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{association.name}</p>
        </div>
      </div>

      {/* Stór upload takki */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Upload className="h-5 w-5 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Hlaða inn bankayfirliti</p>
              <p className="text-xs text-muted-foreground">CSV eða PDF frá bankanum þínum</p>
            </div>
          </div>
          <Button onClick={() => navigate("/upload")} className="shrink-0">
            <Upload className="h-4 w-4 mr-2" />
            Hlaða inn
          </Button>
        </CardContent>
      </Card>

      {/* Óflokkað bíður */}
      {uncategorizedCount > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold tabular-nums">{uncategorizedCount}</span>{" "}
              hreyfingar bíða flokkunar — smelltu á flokk í listanum að neðan til að flokka.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hreyfingar */}
      {hasData ? (
        <TransactionList associationId={association.id} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Wallet className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <div>
              <h3 className="font-semibold text-foreground">Engar hreyfingar enn</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Byrjaðu með því að hlaða inn bankayfirliti.
              </p>
            </div>
            <Button onClick={() => navigate("/upload")} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Hlaða inn bankayfirliti
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sækja skýrslu */}
      {hasData && (
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => navigate("/skyrsla")}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Sækja skýrslu
          </Button>
        </div>
      )}
    </div>
  );
}
