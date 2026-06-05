// ============================================================
// HandoverPackage.tsx
// Afhendingarpakki: Print-ready handover document for incoming
// board members. Generates a multi-page PDF with everything the
// next person needs to take over without friction.
// ============================================================

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Package, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { is } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentAssociation } from "@/hooks/useAssociation";
import { useTransactionStats, useLatestBatch } from "@/hooks/useTransactions";
import { useVendorAnalytics } from "@/hooks/useAnalytics";
import { useTimeRange } from "@/hooks/useTimeRange";

import { formatIskAmount } from "@/lib/categories";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ============================================================
// Sub: Section header (matches report style)
// ============================================================

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 pb-1.5 border-b border-gray-200">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {children}
      </span>
    </div>
  );
}

// ============================================================
// Types
// ============================================================

interface TaskRow {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  category: string | null;
  assignee_name?: string | null;
}

// ============================================================
// Main component
// ============================================================

export default function HandoverPackage() {
  const [isExporting, setIsExporting] = useState(false);
  const packageRef = useRef<HTMLDivElement>(null);

  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;

  const { range } = useTimeRange();
  const { data: stats } = useTransactionStats(associationId, range.from);
  const { data: vendors } = useVendorAnalytics(associationId, range.from);
  const { data: latestBatch } = useLatestBatch(associationId);

  // Active (non-done) tasks for handover
  const { data: openTasks = [] } = useQuery({
    queryKey: ["handover-tasks", associationId],
    queryFn: async (): Promise<TaskRow[]> => {
      if (!associationId) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, due_date, assigned_to, category")
        .eq("association_id", associationId)
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;

      const assignedIds = [
        ...new Set((data ?? []).filter((t) => t.assigned_to).map((t) => t.assigned_to as string)),
      ];
      let profileMap: Record<string, string> = {};
      if (assignedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", assignedIds);
        profileMap = Object.fromEntries(
          (profiles ?? []).map((p) => [p.user_id, p.full_name ?? "Úthlutað"]),
        );
      }

      return (data ?? []).map((t) => ({
        ...t,
        assignee_name: t.assigned_to ? profileMap[t.assigned_to] ?? null : null,
      }));
    },
    enabled: !!associationId,
  });

  // Recurring vendors (≥3 transactions = likely recurring)
  const recurringVendors = (vendors ?? [])
    .filter((v) => v.count >= 3)
    .slice(0, 12);

  // Top categories
  const topCategories = [...(stats?.category_breakdown ?? [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const isLoading = !stats || !vendors;

  // ---- PDF export ----

  async function handleDownloadPDF() {
    if (!packageRef.current || isExporting) return;
    setIsExporting(true);
    const toastId = toast.loading("Bý til afhendingarpakka...");

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(packageRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
      } else {
        const pageContentHeight = pageHeight - margin * 2;
        const totalPages = Math.ceil(imgHeight / pageContentHeight);
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) pdf.addPage();
          const yOffset = margin - i * pageContentHeight;
          pdf.addImage(imgData, "JPEG", margin, yOffset, imgWidth, imgHeight);
        }
      }

      const safeName = (association?.name ?? "husfelag")
        .toLowerCase()
        .replace(/[^a-z0-9\u00e1\u00e9\u00ed\u00f3\u00fa\u00fd\u00fe\u00e6\u00f0\u00f6]+/gi, "-")
        .replace(/^-+|-+$/g, "");
      pdf.save(`afhendingarpakki-${safeName}-${format(new Date(), "yyyy-MM-dd")}.pdf`);

      toast.success("Afhendingarpakki tilbúinn", { id: toastId });
    } catch (err) {
      console.error("Handover PDF failed:", err);
      toast.error("Ekki tókst að búa til pakka", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }

  // ---- Render ----

  return (
    <div className="space-y-4">
      {/* Intro + download */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-[#1e3a5f]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              Afhendingarpakki
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">
              Eitt PDF skjal sem næsti formaður getur prentað út og byrjað strax.
              Inniheldur stöðu, opin verkefni, fastagjöld og hvað þarf að gera fyrst.
            </p>
          </div>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={isLoading || isExporting}
          className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white gap-2 shrink-0"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? "Bý til pakka..." : "Sækja afhendingarpakka"}
        </Button>
      </div>

      {/* Preview card (also captured for PDF) */}
      <Card
        ref={packageRef}
        className="max-w-4xl mx-auto shadow-md border border-gray-200 bg-white"
      >
        <CardContent className="p-8 sm:p-10 space-y-10">
          {/* ===== Cover ===== */}
          <div className="text-center space-y-1.5 pb-4 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1e3a5f] opacity-70">
              Afhending stjórnar
            </p>
            <h2
              className="text-2xl font-bold text-gray-800 tracking-tight"
              style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
            >
              {association?.name ?? "Húsfélag"}
            </h2>
            <p className="text-sm text-gray-500">
              Útgefið {format(new Date(), "d. MMMM yyyy", { locale: is })}
            </p>
            {association?.num_units != null && (
              <p className="text-sm text-gray-400">
                {association.num_units} íbúðir
              </p>
            )}
          </div>

          {/* ===== A: Næstu skref ===== */}
          <div>
            <SectionHeader>Næstu skref fyrir nýjan formann</SectionHeader>
            <ol className="space-y-2.5">
              {[
                "Skráðu þig inn á husfelagid.is með netfanginu þínu.",
                "Yfirfar lykiltölur og sjóðsstöðu hér að neðan.",
                "Skoðaðu opin verkefni og taktu þau að þér eða úthlutaðu.",
                "Hladdu upp nýjustu bankayfirliti um leið og þú færð það.",
                "Hafðu samband við söluaðila á listanum ef eitthvað er óljóst.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <Circle className="h-4 w-4 mt-0.5 text-gray-300 shrink-0" />
                  <span className="text-sm text-gray-700 leading-snug">
                    <span className="font-medium text-gray-500 mr-1">{i + 1}.</span>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* ===== B: Lykiltölur ===== */}
          <div>
            <SectionHeader>Staðan í dag</SectionHeader>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Sjóðsstaða</dt>
                <dd className="font-mono text-sm font-semibold text-gray-800">
                  {stats?.current_balance != null
                    ? formatIskAmount(stats.current_balance)
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Síðasta hreyfing</dt>
                <dd className="text-sm text-gray-700">
                  {stats?.last_transaction_date
                    ? format(new Date(stats.last_transaction_date), "d. MMM yyyy", {
                        locale: is,
                      })
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Tekjur á tímabili</dt>
                <dd className="font-mono text-sm text-teal-700">
                  {formatIskAmount(stats?.total_income ?? 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Gjöld á tímabili</dt>
                <dd className="font-mono text-sm text-rose-600">
                  {formatIskAmount(stats?.total_expenses ?? 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between sm:col-span-2 border-t border-gray-200 pt-2">
                <dt className="text-sm font-medium text-gray-700">Hreinn afgangur</dt>
                <dd
                  className={`font-mono text-sm font-bold ${
                    (stats?.net_balance ?? 0) < 0 ? "text-rose-600" : "text-teal-700"
                  }`}
                >
                  {formatIskAmount(stats?.net_balance ?? 0)}
                </dd>
              </div>
            </dl>
            {latestBatch?.created_at && (
              <p className="mt-3 text-xs text-gray-400">
                Síðasta upphleðsla:{" "}
                {formatDistanceToNow(new Date(latestBatch.created_at), {
                  locale: is,
                  addSuffix: true,
                })}
                {latestBatch.file_name ? ` · ${latestBatch.file_name}` : ""}
              </p>
            )}
          </div>

          {/* ===== C: Opin verkefni ===== */}
          <div>
            <SectionHeader>
              Opin verkefni ({openTasks.length})
            </SectionHeader>
            {openTasks.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <p className="text-sm text-gray-600">
                  Engin opin verkefni. Allt klárt.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {openTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Circle className="h-3.5 w-3.5 mt-1 text-[#0d9488] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 leading-snug">
                          {t.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.assignee_name ?? "Óúthlutað"}
                          {t.due_date
                            ? ` · ${format(new Date(t.due_date + "T00:00:00"), "d. MMM", { locale: is })}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ===== D: Söluaðilar í föstum viðskiptum ===== */}
          {recurringVendors.length > 0 && (
            <div>
              <SectionHeader>Söluaðilar í föstum viðskiptum</SectionHeader>
              <p className="text-xs text-gray-500 mb-3">
                Þeir sem koma reglulega fram á yfirlitinu. Þetta eru aðilar sem þú
                þarft að þekkja.
              </p>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-2 font-medium">Söluaðili</th>
                      <th className="px-4 py-2 font-medium text-right">Færslur</th>
                      <th className="px-4 py-2 font-medium text-right">Samtals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringVendors.map((v, i) => (
                      <tr
                        key={i}
                        className="border-t border-gray-100 hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-2 text-gray-800">
                          {v.vendor || "Óþekktur"}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-600">
                          {v.count}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-800">
                          {formatIskAmount(v.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== E: Helstu útgjaldaflokkar ===== */}
          {topCategories.length > 0 && (
            <div>
              <SectionHeader>Hvert fara peningarnir</SectionHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {topCategories.map((cat, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <p className="text-xs text-gray-500 truncate mb-0.5">
                      {cat.category_name ?? "Óflokkað"}
                    </p>
                    <p className="font-mono text-sm font-bold text-gray-800">
                      {formatIskAmount(cat.total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== Footer ===== */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-400">
            <span>
              Afhendingarpakki útgefinn{" "}
              {format(new Date(), "d. MMMM yyyy", { locale: is })}
            </span>
            <span className="font-mono opacity-60">Húsfélagið.is</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
