

## Áætlun: Skipta HealthScore donut út fyrir „Ástandsyfirlit"

### Hvað breytist

**1. Nýr component: `src/components/dashboard/StatusSummary.tsx`**

Tekur við `healthData: HealthScoreResult` og `stats` (frá `useTransactionStats`). Birtir 3–5 stöðulínur, hverja með:
- Litaðum hring (emerald/amber/rose) 
- Feitletraðan titil
- 1–2 setningar á íslensku

Reiknar stöðu út frá `healthData.factors` sem þegar eru til:
- **Tekjur vs gjöld** → `income_expense` factor (score ≥ 70 = green, 40–69 = amber, <40 = red)
- **Sjóðsstaða** → `cash_position` factor, notar `stats.current_balance` og `avgMonthlyExpense` til að birta „dugar í X mánuði"
- **Greiðsluhlutfall** → `payment_rate` factor
- **Viðhaldskostnaður** → `maintenance` factor (sýnir aðeins ef score < 70, annars sleppt)

Notar `factor.detail` textann sem þegar er á íslensku í hookinu.

**2. Breytingar á `src/pages/Dashboard.tsx`**
- Fjarlægja `HealthScoreCard` import og notkun (línur 12, 210–214)
- Fjarlægja pill badges (línur 197–207: Tekjur/Gjöld/Nettó spans)
- Setja `StatusSummary` component í stað HealthScoreCard á hægri hlið hero card
- Halda öllu öðru óbreyttu (hero text, action items, chart, bottom row)

**3. Engar breytingar á:**
- `useHealthScore.ts` — öll gögn eru þegar reiknuð þar
- `HealthScoreCard.tsx` — skilið eftir (notað annars staðar ef compact variant er í notkun)

### Skrár
- **Ný:** `src/components/dashboard/StatusSummary.tsx`
- **Breytt:** `src/pages/Dashboard.tsx`

