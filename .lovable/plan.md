

## Lagfæringar — Staða og áætlun

### Þegar lagað ✅ (ekki þarf að breyta)
| Atriði | Staða |
|--------|-------|
| Prompt A: Dagsetning á íslensku í Skýrslur | ✅ Notar `date-fns` `is` locale |
| Prompt B: Hlaða upp takki falinn nema á Færslur | ✅ `{activeTab === 'faerslur' && ...}` |
| Prompt D: Badge litir samræmdir í zinc-100 | ✅ COLOR_MAP uppfært |
| Prompt E: Titlar text-xl font-semibold | ✅ Bæði Dashboard og Financials |

### Þarf að laga (2 atriði)

**1. Skref 0: Eyða tvíteknum færslum í gagnagrunni**

Gögn staðfest: 15,132 færslur — á að vera 7,566. Tvær upload batches:
- `2332edd5...` (4. mars) — 7,566 tx — **HALDA**
- `d7251aa0...` (5. mars) — 7,566 tx — **EYÐA**

Aðgerð: Keyra tvo DELETE skipanir:
1. `DELETE FROM transactions WHERE uploaded_batch_id = 'd7251aa0-61dc-46cc-955f-1f7f8377b9b3'`
2. `DELETE FROM upload_batches WHERE id = 'd7251aa0-61dc-46cc-955f-1f7f8377b9b3'`

**2. Prompt C: X-ás mánaðarheiti á íslensku**

Í `src/hooks/useTransactions.ts` línu 156 er `month_label` búið til með `format(d, 'MMM yyyy')` sem gefur enska mánuði ("Apr 2025", "May 2025").

Aðgerð: Breyta í `format(d, 'MMM yyyy', { locale: is })` og bæta við `import { is } from 'date-fns/locale'`. Þetta gefur "apr 2025", "maí 2025", "jún 2025" o.s.frv.

### Skrár sem breytast
- Gagnagrunnur: 2 DELETE skipanir (insert tool)
- `src/hooks/useTransactions.ts`: Bæta við `is` locale import og nota í `format()` kall

