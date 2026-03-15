

## Yfirferð: Checklist úr síðustu stóru beiðni (Part A + B + C)

Ég fór yfir kóðann og ber saman við allar kröfur. Hér er staðan:

---

### PART A: Bug fixes + Visual polish

| # | Beiðni | Staða | Athugasemd |
|---|--------|-------|------------|
| A1 | Health Score — heiltölur | ✅ Leyst | Allir 5 factor functions nota `Math.round()`. `FactorRow` sýnir `Math.round(score)`. |
| A2 | Sidebar active state — left border, no bg | ✅ Leyst | `border-l-2 border-l-teal-600`, engin rounded bg. Icon litir `text-zinc-400` / `text-teal-600`. |
| A3 | Card styling — borderless + shadow | ✅ Leyst | `card.tsx` notar `border-0 shadow-[0_1px_3px...]`. |
| A4 | Color palette — teal/rose | ⚠️ **Hlutaleyst** | Dashboard, MonthlyChart, BalanceCard eru lagfærð. **EN** ~123 `text-green-` og ~161 `text-red-` tilvik enn til staðar í öðrum skrám — sérstaklega: `VendorOverview.tsx`, `BenchmarkTable.tsx`, `AlertsPanel.tsx`, `BulkReclassifyDialog.tsx`, `AlertsWidgetNew.tsx`, `ReportsPage.tsx` (notar enn `text-red-600`/`text-red-500` fyrir fjármálagögn). |
| A5 | Main content bg-zinc-50 | ✅ Leyst | `AppLayout.tsx` lína 20: `bg-zinc-50`. |
| A6 | Typography text-xl font-semibold | ⚠️ **Hlutaleyst** | Dashboard og Financials nota `text-xl font-semibold`. **EN** ~95 tilvik af `text-2xl font-bold` enn í: `Upload.tsx`, `Marketplace.tsx`, `Auth.tsx`, `CategoryDetail.tsx`, `ProviderDashboard.tsx`, `VendorView.tsx`, `Admin.tsx`, `Transactions.tsx`, `ReportsPage.tsx`, `BalanceCard.tsx`, `UploadTransactions.tsx`. |
| A7 | Greining tab — fjarlægja KPI cards | ✅ Leyst | Analytics.tsx byrjar á alerts + health score, engin KPI kort. |
| A8 | Fjármál tab styling — underline | ✅ Leyst | Bottom-border underline stíll í Financials.tsx. |

---

### PART B: Dashboard redesign

| # | Beiðni | Staða | Athugasemd |
|---|--------|-------|------------|
| B1 | Hero Card (Stöðumat) | ✅ Leyst | Full-width kort með left-border litað eftir health score, summary text + metric pills. |
| B2 | Action Items | ✅ Leyst | Clickable raðir með icon/color/chevron, tengist alerts og uncategorized. |
| B3 | Trend Chart | ✅ Leyst | MonthlyChart með TimeRangeSelector inni í kortinu, spike insight annotation. |
| B4 | Bottom Row | ✅ Leyst | 5-col grid, nýlegar færslur + stærstu gjaldaliðir. |
| B5 | Fjarlægt úr Dashboard | ✅ Leyst | Engin BalanceCard KPI, engin CategoryPieChart, engin BenchmarkWidget, engin AlertsWidget. |
| B6 | Page header hreint | ✅ Leyst | Aðeins titill og association nafn. |
| B7 | Empty state | ✅ Leyst | Upload prompt þegar engin gögn. |

---

### PART C: Self-review checklist

| # | Atriði | Staða |
|---|--------|-------|
| 1 | Health score heiltölur | ✅ |
| 2 | Sidebar left teal border | ✅ |
| 3 | Card engin border | ✅ |
| 4 | Financial colors teal/rose | ⚠️ **Ekki alls staðar** |
| 5 | bg-zinc-50 bakgrunnur | ✅ |
| 6 | Dashboard hero card | ✅ |
| 7 | Dashboard action items | ✅ |
| 8 | Engar duplicate KPIs | ✅ |
| 9 | Chart colors teal/rose | ✅ (MonthlyChart) |
| 10 | Fjármál tab underline | ✅ |
| 11 | Page titles text-xl | ⚠️ **Ekki alls staðar** |
| 12 | Allt á íslensku | ✅ |

---

### Vandamál sem þarf enn að laga

**Vandamál 1: `text-green-` / `text-red-` enn í notkun fyrir fjármálagögn** (~12 skrár)

Skrár sem þarf að uppfæra:
- `VendorOverview.tsx` — `text-red-600` / `text-green-600` á upphæðum
- `BulkReclassifyDialog.tsx` — `text-red-600` / `text-green-600`
- `BenchmarkTable.tsx` — `text-green-700` / `text-red-700` á diff%
- `AlertsPanel.tsx` — `text-red-600` / `text-green-600` á trend icons
- `AlertsWidgetNew.tsx` — `text-red-600`/`bg-red-100` á severity (þetta er raunverulegt warning/critical, ekki fjármálalit — **halda sem er**)
- `ReportsPage.tsx` — `text-red-600`/`text-red-500` á fjármálatölum

**Aðgerð:** Skipta `text-green-600` → `text-teal-600` og `text-red-600` → `text-rose-600` **aðeins** þar sem um fjármálaupphæðir/trend er að ræða. Halda `text-red-` fyrir raunverulegar viðvaranir/villur (AlertsWidget, severity badges, reject buttons).

**Vandamál 2: `text-2xl font-bold` enn í notkun á page titles** (~8 síður)

Skrár sem þarf að uppfæra (aðeins h1 page titles, ekki data numbers):
- `Upload.tsx` — h1
- `Marketplace.tsx` — h1
- `CategoryDetail.tsx` — h1
- `ProviderDashboard.tsx` — h1
- `VendorView.tsx` — h1
- `Admin.tsx` — h1
- `Transactions.tsx` — h1

**Aðgerð:** Breyta öllum h1 page titles í `text-xl font-semibold tracking-tight`. Halda `text-2xl font-bold` á data tölum (BalanceCard, AdminStatsGrid, UploadTransactions stats) — þær eru KPI-tölur, ekki titlar.

**Vandamál 3: Console warning — duplicate React key**

YoYTable í Analytics.tsx hefur tvö börn með sama key ("Tryggingar"). Lítilvægt en auðvelt að laga.

---

### Áætlun

1. **Laga fjármálaliti** í ~6 skrám (green→teal, red→rose á upphæðum/trends)
2. **Laga h1 titla** í ~7 skrám (text-2xl font-bold → text-xl font-semibold)
3. **Laga duplicate key** í Analytics.tsx YoYTable
4. Keyra sjálfvirka yfirferð á öllum 12 atriðum aftur

