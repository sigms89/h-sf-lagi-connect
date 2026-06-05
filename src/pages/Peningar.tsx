// ============================================================
// Húsfélagið.is: Peningar (Simplified Financials page)
// One page: upload + hreyfingar list + uncategorized hint + report
// ============================================================

import { useCurrentAssociation } from "@/hooks/useAssociation";
import { useTransactionStats } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, Wallet, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlyCategoryList } from "@/components/peningar/MonthlyCategoryList";
import { uploadPrompt } from "@/lib/insights";
import { useNavigate } from "react-router-dom";

export default function Peningar() {
  const navigate = useNavigate();
  const { data: association, isLoading } = useCurrentAssociation();
  const { data: stats } = useTransactionStats(association?.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-56" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
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
  const prompt = uploadPrompt(stats?.last_transaction_date ?? null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">Peningar</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">{association.name}</h1>
      </div>

      {/* Hvaða mánuð vantar? */}
      {hasData && prompt && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <p className="text-[15px] text-foreground leading-snug">{prompt.message}</p>
            </div>
            <Button onClick={() => navigate("/upload")} className="w-full sm:w-auto h-11">
              {prompt.action}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Óflokkað bíður */}
      {uncategorizedCount > 0 && (
        <Card>
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[15px] text-foreground leading-snug">
                Við þurfum aðeins hjálp með{" "}
                <span className="font-semibold tabular-nums">{uncategorizedCount}</span>{" "}
                {uncategorizedCount === 1 ? "hreyfingu" : "hreyfingar"} — smelltu á flokk í listanum.
              </p>
              <p className="text-[13px] text-muted-foreground leading-snug">
                Eftir það er bókhaldið uppfært og skýrslan tilbúin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hreyfingar */}
      {hasData ? (
        <>
          <MonthlyCategoryList associationId={association.id} />
          <TransactionList associationId={association.id} />
        </>
      ) : (
        <Card>
          <CardContent className="py-10 px-6 text-center space-y-5">
            <Wallet className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Engar hreyfingar enn.</h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Hladdu inn bankayfirliti og ég flokka allt sjálfkrafa — þú þarft bara að samþykkja.
              </p>
            </div>
            <Button onClick={() => navigate("/upload")} size="lg" className="w-full sm:w-auto h-12">
              <Upload className="h-4 w-4 mr-2" />
              Hlaða inn bankayfirliti
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Skýrsla + upprunagögn (traust) */}
      {hasData && (
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Button onClick={() => navigate("/skyrsla")} className="w-full sm:w-auto h-12">
              <FileText className="h-4 w-4 mr-2" />
              Búa til drög að skýrslu fyrir fund
            </Button>
            <p className="text-[13px] text-muted-foreground leading-snug max-w-md">
              Tekur saman stöðu, helstu gjöld og opin verkefni svo stjórnin geti yfirfarið.
            </p>
          </div>
          <div className="flex items-start gap-2 text-[13px] text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/60" />
            <p className="leading-snug">
              Gögnin koma úr CSV-skrám sem þú hefur hlaðið inn úr netbanka. Við tökum engar ákvarðanir um fjármál án þíns samþykkis — allar flokkunar tillögur þarf að samþykkja.
            </p>
          </div>
          {!prompt && (
            <button
              onClick={() => navigate("/upload")}
              className="text-[13px] text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Hlaða inn nýju bankayfirliti
            </button>
          )}
        </div>
      )}
    </div>
  );
}
