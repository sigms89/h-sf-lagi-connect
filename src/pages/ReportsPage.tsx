// ============================================================
// ReportsPage.tsx
// Aðalfundarskýrsla — Print-ready annual meeting financial report
// ============================================================

import { useState } from "react";
import { Download, AlertTriangle, TrendingUp, TrendingDown, Minus, Building2 } from "lucide-react";
import { toast } from "sonner";

import { useCurrentAssociation } from "@/hooks/useAssociation";
import { useTransactionStats } from "@/hooks/useTransactions";
import { useHealthScore } from "@/hooks/useHealthScore";
import { useVendorAnalytics } from "@/hooks/useAnalytics";
import { useFinancialAlerts } from "@/hooks/useAlerts";
import { useTimeRange } from "@/hooks/useTimeRange";

import { formatIskAmount } from "@/lib/categories";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// ============================================================
// Types
// ============================================================

interface HealthScoreFactor {
  label: string;
  score: number;
  weight: number;
}

interface HealthScoreResult {
  score: number;
  label: string;
  color: "green" | "yellow" | "red";
  factors: HealthScoreFactor[];
}

interface VendorStat {
  vendor: string;
  count: number;
  total: number;
  avgPerTx: number;
  trend: "up" | "down" | "flat";
}

interface FinancialAlert {
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  type: string;
}

// ============================================================
// Helper: Health score color utilities
// ============================================================

function getHealthScoreColorClass(color: "green" | "yellow" | "red"): string {
  if (color === "green") return "text-teal-600";
  if (color === "yellow") return "text-amber-500";
  return "text-red-600";
}

function getHealthScoreBgClass(color: "green" | "yellow" | "red"): string {
  if (color === "green") return "bg-teal-50 border-teal-200";
  if (color === "yellow") return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function getHealthScoreRingClass(color: "green" | "yellow" | "red"): string {
  if (color === "green") return "#0d9488";
  if (color === "yellow") return "#f59e0b";
  return "#dc2626";
}

// ============================================================
// Helper: Trend icon
// ============================================================

function TrendIcon({ trend }: { trend: VendorStat["trend"] }) {
  if (trend === "up")
    return <TrendingUp className="inline h-3.5 w-3.5 text-red-500 ml-1" />;
  if (trend === "down")
    return <TrendingDown className="inline h-3.5 w-3.5 text-teal-600 ml-1" />;
  return <Minus className="inline h-3.5 w-3.5 text-gray-400 ml-1" />;
}

// ============================================================
// Sub-component: Section Header
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
// Sub-component: Health Score Ring (SVG)
// ============================================================

function HealthScoreRing({
  score,
  color,
}: {
  score: number;
  color: "green" | "yellow" | "red";
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const ringColor = getHealthScoreRingClass(color);

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="block">
      {/* Track */}
      <circle
        cx="48"
        cy="48"
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="8"
      />
      {/* Progress */}
      <circle
        cx="48"
        cy="48"
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      {/* Score text */}
      <text
        x="48"
        y="44"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
        fontWeight="700"
        fill={ringColor}
        fontFamily="ui-monospace, monospace"
      >
        {score}
      </text>
      <text
        x="48"
        y="60"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fill="#9ca3af"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        / 100
      </text>
    </svg>
  );
}

// ============================================================
// Sub-component: Skeleton loader for report card
// ============================================================

function ReportSkeleton() {
  return (
    <Card className="max-w-4xl mx-auto shadow-md border border-gray-200">
      <CardContent className="p-8 space-y-8">
        {/* Header skeleton */}
        <div className="text-center space-y-2">
          <Skeleton className="h-7 w-80 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        {/* Two col skeleton */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          </div>
        </div>
        {/* Category cards skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main component: ReportsPage
// ============================================================

export default function ReportsPage() {
  const [showIndividualNotes, setShowIndividualNotes] = useState(false);

  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;

  const { range } = useTimeRange();
  const { data: stats } = useTransactionStats(associationId, range.from);
  const { data: healthScore } = useHealthScore(associationId) as {
    data: HealthScoreResult | null | undefined;
  };
  const { data: vendors } = useVendorAnalytics(associationId) as {
    data: VendorStat[] | null | undefined;
  };
  const { data: alerts } = useFinancialAlerts(associationId) as {
    data: FinancialAlert[] | null | undefined;
  };
  const { label: timeRangeLabel } = useTimeRange();

  // ---- Derived values ----

  const totalIncome = stats?.total_income ?? 0;
  const totalExpenses = stats?.total_expenses ?? 0;
  const netBalance = stats?.net_balance ?? 0;
  const avgMonthly = netBalance / 12;

  // Top categories (sorted descending, max 6)
  const topCategories = [...(stats?.category_breakdown ?? [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Top vendors (max 5)
  const topVendors = (vendors ?? []).slice(0, 5);

  // Relevant alerts: warning or critical, max 5
  const relevantAlerts = (alerts ?? [])
    .filter((a) => a.severity === "warning" || a.severity === "critical")
    .slice(0, 5);

  const isLoading = !stats || !healthScore || !vendors || !alerts;

  // ---- Handlers ----

  function handleDownloadPDF() {
    toast("PDF útflutningur kemur fljótlega");
  }

  // ---- Render ----

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* ---- Page Header ---- */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-2xl font-bold text-[#1e3a5f] tracking-tight"
            style={{ fontFamily: "ui-serif, Georgia, serif" }}
          >
            Aðalfundarskýrsla
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tilbúin skýrsla til útprentunar fyrir aðalfund eða stjórnarfund.
          </p>
        </div>
      </div>

      <div className="px-6 max-w-4xl mx-auto space-y-6">
        {/* ---- Controls Row ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <Checkbox
              id="individual-notes"
              checked={showIndividualNotes}
              onCheckedChange={(checked) =>
                setShowIndividualNotes(Boolean(checked))
              }
              className="border-gray-300 data-[state=checked]:bg-[#1e3a5f] data-[state=checked]:border-[#1e3a5f]"
            />
            <span className="text-sm text-gray-700 leading-snug">
              Sýna athugasemdir vegna einstaklinga (útlagður kostnaður)
            </span>
          </label>

          <Button
            onClick={handleDownloadPDF}
            className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white gap-2 shrink-0"
          >
            <Download className="h-4 w-4" />
            Sækja PDF skýrslu
          </Button>
        </div>

        {/* ---- Report Card ---- */}
        {isLoading ? (
          <ReportSkeleton />
        ) : (
          <Card className="max-w-4xl mx-auto shadow-md border border-gray-200 bg-white">
            <CardContent className="p-8 sm:p-10 space-y-10">
              {/* ===== SECTION A: Report Header ===== */}
              <div className="text-center space-y-1.5 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-[#1e3a5f] opacity-60" />
                </div>
                <h2
                  className="text-2xl font-bold text-gray-800 tracking-tight"
                  style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
                >
                  Fjárhagsyfirlit Húsfélags
                </h2>
                {association?.name && (
                  <p
                    className="text-base text-gray-600"
                    style={{ fontFamily: "ui-serif, Georgia, serif" }}
                  >
                    {association.name}
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-1">
                  Tímabil: {timeRangeLabel ?? "—"}
                </p>
              </div>

              {/* ===== SECTION B: Key Figures + Health Score ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Left: Key Figures */}
                <div>
                  <SectionHeader>Lykiltölur</SectionHeader>
                  <dl className="space-y-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Heildartekjur</dt>
                      <dd className="font-mono text-sm font-semibold text-gray-800">
                        {formatIskAmount(totalIncome)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-dashed border-gray-100 pt-2">
                      <dt className="text-sm text-gray-600">Heildargjöld</dt>
                      <dd className="font-mono text-sm font-semibold text-gray-800">
                        {formatIskAmount(totalExpenses)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                      <dt className="text-sm font-medium text-gray-700">
                        Hreinn afgangur
                      </dt>
                      <dd
                        className={`font-mono text-sm font-bold ${
                          netBalance < 0 ? "text-red-600" : "text-teal-700"
                        }`}
                      >
                        {formatIskAmount(netBalance)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-dashed border-gray-100 pt-2">
                      <dt className="text-sm text-gray-500">
                        Meðalsöfnun pr. mánuð
                      </dt>
                      <dd
                        className={`font-mono text-sm ${
                          avgMonthly < 0 ? "text-red-500" : "text-gray-700"
                        }`}
                      >
                        {formatIskAmount(Math.round(avgMonthly))}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Right: Health Score */}
                <div>
                  <SectionHeader>Heilsa rekstrar</SectionHeader>
                  {healthScore ? (
                    <div
                      className={`rounded-xl border p-4 flex items-center gap-5 ${getHealthScoreBgClass(
                        healthScore.color
                      )}`}
                    >
                      <HealthScoreRing
                        score={healthScore.score}
                        color={healthScore.color}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold leading-snug ${getHealthScoreColorClass(
                            healthScore.color
                          )}`}
                        >
                          {healthScore.label}
                        </p>
                        {healthScore.factors?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {healthScore.factors.slice(0, 3).map((f, i) => (
                              <li
                                key={i}
                                className="text-xs text-gray-500 flex items-center justify-between"
                              >
                                <span className="truncate mr-2">{f.label}</span>
                                <span className="font-mono shrink-0">
                                  {f.score}p
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Engar upplýsingar.</p>
                  )}
                </div>
              </div>

              {/* ===== SECTION C: Top Expense Categories ===== */}
              {topCategories.length > 0 && (
                <div>
                  <SectionHeader>Stærstu útgjaldaliðir</SectionHeader>
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
                        {cat.transaction_count != null && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {cat.transaction_count} færslur
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== SECTION D: Top Vendors ===== */}
              {topVendors.length > 0 && (
                <div>
                  <SectionHeader>
                    Stærstu þjónustuaðilar og kostnaðarþróun
                  </SectionHeader>
                  <div className="space-y-2.5">
                    {topVendors.map((vendor, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank badge */}
                          <span className="shrink-0 w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {vendor.vendor || "Óþekktur þjónustuaðili"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {vendor.count} færslur · meðaltal{" "}
                              <span className="font-mono">
                                {formatIskAmount(Math.round(vendor.avgPerTx))}
                              </span>
                              {vendor.trend != null && (
                                <>
                                  <TrendIcon trend={vendor.trend} />
                                  <span className="ml-0.5">
                                    {vendor.trend === "up"
                                      ? "vaxandi"
                                      : vendor.trend === "down"
                                      ? "minnkandi"
                                      : "stöðugt"}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">
                            Heildarkostnaður
                          </p>
                          <p className="font-mono text-sm font-bold text-gray-800">
                            {formatIskAmount(vendor.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== SECTION E: Financial Alerts ===== */}
              {relevantAlerts.length > 0 && (
                <div>
                  <SectionHeader>Athugasemdir eftirlitsvélar</SectionHeader>
                  <div className="space-y-2.5">
                    {relevantAlerts.map((alert, i) => {
                      const isCritical = alert.severity === "critical";
                      return (
                        <div
                          key={i}
                          className={`flex gap-3 rounded-lg border px-4 py-3 ${
                            isCritical
                              ? "bg-red-50 border-red-200"
                              : "bg-amber-50 border-amber-200"
                          }`}
                        >
                          <AlertTriangle
                            className={`h-4 w-4 mt-0.5 shrink-0 ${
                              isCritical ? "text-red-500" : "text-amber-500"
                            }`}
                          />
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isCritical ? "text-red-800" : "text-amber-800"
                              }`}
                            >
                              {alert.title}
                            </p>
                            <p
                              className={`text-xs mt-0.5 ${
                                isCritical ? "text-red-600" : "text-amber-700"
                              }`}
                            >
                              {alert.description}
                            </p>
                          </div>
                          <Badge
                            className={`ml-auto shrink-0 self-start text-xs ${
                              isCritical
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            }`}
                            variant="outline"
                          >
                            {isCritical ? "Mikilvægt" : "Viðvörun"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===== Individual Notes (conditional) ===== */}
              {showIndividualNotes && (
                <div>
                  <SectionHeader>
                    Athugasemdir vegna einstaklinga — útlagður kostnaður
                  </SectionHeader>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
                    <p className="text-sm text-gray-500 italic">
                      Engar athugasemdir um útlagðan kostnað einstaklinga fundust
                      á völdu tímabili.
                    </p>
                  </div>
                </div>
              )}

              {/* ===== Report Footer ===== */}
              <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-400">
                <span>
                  Skýrsla mynduð:{" "}
                  {new Date().toLocaleDateString("is-IS", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {association?.num_units && (
                  <span>Fjöldi íbúða: {association.num_units}</span>
                )}
                <span className="font-mono opacity-60">Húsfélagið.is</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
