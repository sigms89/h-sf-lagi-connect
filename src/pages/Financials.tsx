// ============================================================
// Húsfélagið.is — Financials (Combined page)
// Tabs: Færslur | Flokkun | Greining | Skýrslur
// ============================================================

import { useSearchParams } from "react-router-dom";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionList } from "@/components/transactions/TransactionList";
import { VendorOverview } from "@/components/classification/VendorOverview";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Lazy-style inline imports for Analytics and Reports content
import AnalyticsPage from "@/pages/Analytics";
import ReportsPage from "@/pages/ReportsPage";

const TAB_KEYS = ["faerslur", "flokkun", "greining", "skyrsla"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  faerslur: "Færslur",
  flokkun: "Flokkun",
  greining: "Greining",
  skyrsla: "Skýrslur",
};

export default function Financials() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: association, isLoading } = useCurrentAssociation();

  const rawTab = searchParams.get("tab") ?? "faerslur";
  const activeTab: TabKey = TAB_KEYS.includes(rawTab as TabKey) ? (rawTab as TabKey) : "faerslur";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!association) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Ekkert húsfélag tengt.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Fjármál</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {association.name}
          </p>
        </div>
        <Button onClick={() => navigate("/upload")} size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" />
          Hlaða upp
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 h-auto">
          {TAB_KEYS.map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="text-[13px] px-4 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-foreground rounded-lg transition-all duration-200"
            >
              {TAB_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="faerslur" className="mt-0">
          <TransactionList associationId={association.id} />
        </TabsContent>

        <TabsContent value="flokkun" className="mt-0">
          <VendorOverview associationId={association.id} />
        </TabsContent>

        <TabsContent value="greining" className="mt-0">
          <AnalyticsPage />
        </TabsContent>

        <TabsContent value="skyrsla" className="mt-0">
          <ReportsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
