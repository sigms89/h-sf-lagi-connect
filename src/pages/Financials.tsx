// ============================================================
// Húsfélagið.is: Financials (Combined page)
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
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!association) {
    return (
      <div className="text-center py-16 text-zinc-500">
        Ekkert húsfélag tengt.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Fjármál</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {association.name}
          </p>
        </div>
        {activeTab === 'faerslur' && (
          <Button onClick={() => navigate("/upload")} size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" />
            Hlaða upp
          </Button>
        )}
      </div>

      {/* Tabs - bottom-border underline style */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="border-b border-border">
          <TabsList className="bg-transparent p-0 h-auto gap-5">
            {TAB_KEYS.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-none border-b-2 border-transparent px-0 pb-2.5 pt-0.5 text-[13px] text-muted-foreground hover:text-foreground data-[state=active]:border-b-foreground data-[state=active]:text-foreground data-[state=active]:font-medium data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors duration-150"
              >
                {TAB_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="faerslur" className="mt-5">
          <TransactionList associationId={association.id} />
        </TabsContent>

        <TabsContent value="flokkun" className="mt-5">
          <VendorOverview associationId={association.id} />
        </TabsContent>

        <TabsContent value="greining" className="mt-5">
          <AnalyticsPage />
        </TabsContent>

        <TabsContent value="skyrsla" className="mt-5">
          <ReportsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
