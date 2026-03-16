

## Greining: Samanburðarkerfi — Rétta útfærslan

### Vandamálið í dag

Hookinn `useBenchmarking.ts` reynir að sækja færslur **annarra** húsfélaga beint frá client — en RLS lokar réttilega á þann aðgang. Þess vegna kemur ekkert fram.

### Hvað ætti að birta?

**Meðaltal og svið (percentile bands) — ekki hæstu/lægstu.**

Ástæður:
- Hæsta/lægsta gildi getur bent beint á eitt tiltekið húsfélag (t.d. ef aðeins 5 sambærileg eru skráð). Það brýtur nafnleynd.
- **Miðgildi** (median) er betri mælikvarði en meðaltal þar sem eitt dýrt húsfélag skekkir meðaltalið.
- **25. og 75. hundraðshluti** (percentile) sýnir „svæðið" þar sem flest húsfélög eru, án þess að afhjúpa einstök gögn.

**Notandinn sér fyrir hvern flokk:**
| Dálkur | Lýsing |
|--------|---------|
| Þitt húsfélag | Kr/íbúð/mán |
| Miðgildi | Median kr/íbúð/mán sambærilegra |
| Svið | 25.–75. percentile (lágmark 5 húsfélög til að birta) |
| Munur % | Þitt vs miðgildi |
| Staða | Undir / nálægt / yfir miðgildi |
| Fjöldi | Hversu mörg húsfélög eru í samanburðinum |

**Öryggisregla**: Ef færri en 5 sambærileg húsfélög eru í flokki → birta „Ekki nóg gögn" í stað talna.

### Tæknilausn

**1. Ný Edge Function: `supabase/functions/benchmark/index.ts`**

- Tekur á móti POST með `associationId`, `numUnits`, `filters`
- Auðkennir notanda með JWT (staðfestir aðild að húsfélaginu)
- Notar `SUPABASE_SERVICE_ROLE_KEY` til að lesa allar færslur og húsfélög
- Reiknar per flokk: miðgildi, 25./75. percentile, fjölda
- Skilar **aðeins samantekt** — aldrei hrágögnum annarra
- Lágmark 5 sambærileg húsfélög til að birta tölur

**2. Uppfæra `src/hooks/useBenchmarking.ts`**

- `useBenchmarkData` kallar á edge function í stað beinna Supabase-spurninga
- Bæta `median`, `p25`, `p75`, `comparableInCategory` við `BenchmarkRow` type
- `useComparableCount` heldur áfram að nota client-side query (RLS leyfir count á eigin húsfélög)

**3. Uppfæra UI**

- `BenchmarkChart.tsx`: Bæta við „sviði" (p25–p75) sem ljósu bandi á bak við súlurnar
- `BenchmarkTable.tsx`: Bæta við „Svið" dálki, nota miðgildi í stað meðaltals, sýna „Ekki nóg gögn" ef `comparableInCategory < 5`
- `BenchmarkWidget.tsx` á dashboard: Sýna fjölda sambærilegra húsfélaga

**4. Laga demo gögn í `dev-seed`**

- Gjaldaupphæðir verða neikvæðar (línan `amount` í seed)
- Þannig virkar samanburður strax með demo pakkanum

### Skrár

| Skrá | Aðgerð |
|------|--------|
| `supabase/functions/benchmark/index.ts` | **Ný** — server-side samanburður |
| `supabase/config.toml` | Skrá benchmark function |
| `src/hooks/useBenchmarking.ts` | Kalla á edge function, uppfæra types |
| `src/components/benchmarking/BenchmarkChart.tsx` | Bæta við percentile-bandi |
| `src/components/benchmarking/BenchmarkTable.tsx` | Miðgildi, svið, lágmarksfjöldi |
| `supabase/functions/dev-seed/index.ts` | Neikvæðar gjaldaupphæðir |

