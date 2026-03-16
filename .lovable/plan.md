

## Áætlun: Villuleiðréttingar og sjónræn fágun

### Yfirlit á vandamálum

9 lagfæringar í tveimur hlutum. Engum viðskiptalogík breytt.

---

### A1: Tvítekningar í flokkum (3 pör fundust)

**Gögn úr gagnagrunni:**
- **Tryggingar**: `cbf1ef01` (253 tx, eldri) + `98863323` (13 tx, nýrri) → halda eldri
- **Annað**: `15f67921` (0 tx, eldri) + `80e15952` (8310 tx, nýrri) → halda nýrri (hefur gögnin)
- **Vatnsveita**: `00364b69` (0 tx, eldri) + `ea40cf92` (0 tx, nýrri) → halda eldri

**Aðgerð:** 3 SQL skipanir í röð via insert tool:
1. `UPDATE transactions SET category_id = 'cbf1ef01...' WHERE category_id = '98863323...'` (13 færslur)
2. `DELETE FROM categories WHERE id IN ('98863323...', '80e15952...nú wait` — nei, Annað: halda `80e15952` sem hefur 8310 tx, eyða `15f67921`
3. Vatnsveita: eyða nýrri `ea40cf92`

Skref:
- UPDATE transactions frá nýrri → eldri (Tryggingar)
- DELETE categories duplicates (3 raðir)
- Engar vendor_rules vísa á duplicates (staðfest)

### A2: Hlaða upp hnappurinn — aðeins á Færslur

Í `Financials.tsx` lína 67: setja `{activeTab === 'faerslur' && (...)}` utan um Button.

### A3: Flokkabadge litir — neutral tones

Í `src/lib/categories.ts`: skipta út öllum `badge:` gildum í COLOR_MAP yfir í `'bg-zinc-100 text-zinc-700'`. Undantekning: `yellow` heldur `'bg-amber-50 text-amber-700'`. Einnig bæta við rose/fuchsia entries.

### A4: Skýrsla dagsetning

Dagsetningin er nú þegar með `is-IS` locale (lína 587). Þetta ætti að virka — en `toLocaleDateString('is-IS')` skilar réttu. **Engin breyting nauðsynleg** — ég staðfesti kóðann.

### A5: Fjarlægja "Beta" badge af Greining

Í `Analytics.tsx` lína 276: eyða `<Badge variant="secondary">Beta</Badge>`.

### A6: Skipta pie chart út fyrir full-width bar list

Í `Analytics.tsx` línur 325-369: eyða tveggja dálka grid + CategoryPieChart. Gera "Stærstu kostnaðarflokkar" lista full-width (eins og hann er nú, bara utan um grid).

### A7: Chart litir — þegar rétt

MonthlyChart notar nú þegar `#0d9488` (teal) og `#e11d48` (rose). Legend notar sjálfgefna Recharts stíl sem sýnir litadisk + texta. **Engin breyting nauðsynleg.**

### A8: Sidebar — þegar rétt

Active state notar `border-l-2 border-l-teal-600`, `font-semibold text-zinc-900`, engin bg highlight. **Engin breyting nauðsynleg.**

### A9: Card border — þegar rétt

`card.tsx` notar `border-0`. **Engin breyting nauðsynleg.** Skanna að engin explicit `border` klasi sé á cards annars staðar.

---

### Samantekt breytinga

| Skrá | Breyting |
|------|----------|
| Gagnagrunnur (insert tool) | Sameina 3 tvítekin flokkapör |
| `src/pages/Financials.tsx` | Fela upload hnapp nema á Færslur |
| `src/lib/categories.ts` | Badge litir → zinc-100/zinc-700 |
| `src/pages/Analytics.tsx` | Eyða Beta badge, eyða pie chart, full-width flokkalist |

4 skrár + 3 SQL skipanir. Allar breytingar eru sjónrænar/skipulagslegar.

