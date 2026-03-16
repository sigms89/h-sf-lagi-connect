

## Áætlun: Staðsetningarsíur og skyldureitir í nýskráningu

### Vandamálið

Núverandi staðsetningarsía notar einfaldan „postal prefix" (1xx, 2xx...) sem er ekki nógu þýðingarmikið. Byggingarár og póstnúmer eru valkvæð í nýskráningu, sem þýðir að gögn vantar fyrir samanburð.

### Staðsetningarlógík — þrjú þrep

Íslensk póstnúmer skipta sér náttúrulega í svæði. Skynsamlegast er að bjóða þrjú samanburðarþrep sem eru sjálfkrafa valin út frá póstnúmeri húsfélagsins:

```text
Þrep 1: „Mitt svæði"     → Nákvæmt póstnúmerasvæði (t.d. 600-699 = Akureyri og nágrenni)
Þrep 2: „Svæðisflokkur"  → Höfuðborgarsvæðið (100-299) eða Landsbyggðin (300-999)
Þrep 3: „Allt landið"    → Enginn staðsetningarfilter
```

**Svæðaskipting:**

| Kóði | Svæði | Flokkur |
|------|-------|---------|
| 100-199 | Reykjavík | Höfuðborgarsvæðið |
| 200-299 | Kópavogur / Garðabær / Hafnarfjörður | Höfuðborgarsvæðið |
| 300-399 | Akranes / Borgarnes | Landsbyggðin |
| 400-499 | Vestfirðir | Landsbyggðin |
| 500-599 | Skagafjörður / Húnaþing | Landsbyggðin |
| 600-699 | Akureyri / Eyjafjörður | Landsbyggðin |
| 700-799 | Austurland | Landsbyggðin |
| 800-899 | Suðurland | Landsbyggðin |
| 900 | Vestmannaeyjar | Landsbyggðin |

### Breytingar

**1. Nýskráning (`Onboarding.tsx`)**
- Gera `postal_code` og `building_year` að skyldu-svæðum (required) með skýrum skilaboðum um hvers vegna þau skipta máli fyrir samanburð
- Uppfæra zod schema: `postal_code` verður `.min(3)` required, `building_year` verður `.int().min(1800).max(2030)` required

**2. BenchmarkFilters type og UI (`useBenchmarking.ts` + `BenchmarkFilters.tsx`)**
- Skipta `postalPrefix: string` út fyrir `region: 'local' | 'capital_vs_rural' | 'all'`
- UI sýnir þrjá valkosti: „Mitt svæði (600-699)", „Landsbyggðin" / „Höfuðborgarsvæðið", „Allt landið" — textinn á fyrsta valkostinum er dynamic eftir póstnúmeri húsfélagsins
- Bæta við byggingarárabili (±10 ár frá eigin húsi sem default, stillanlegt)

**3. Edge function (`benchmark/index.ts`)**
- Taka á móti `region` í stað `postalPrefix`
- Reikna svæðissíu server-side: ef `region = 'local'` → matcha póstnúmeraforskeyti (fyrsti stafur), ef `region = 'capital_vs_rural'` → 100-299 eða 300-999 eftir hópi notandans
- Nota `buildingYearFrom/To` sem áður

**4. Demo gögn (`dev-seed/index.ts`)**
- Dreifa demo húsfélögum á raunhæf póstnúmer (101, 107, 200, 210, 600, 602) í stað `'DEMO'`
- Nota raunhæf byggingarár (1965, 1982, 2003, osfrv.)
- Merkja demo gögn með öðrum hætti (t.d. `uploaded_batch_id` sem þegar er til)

### Skrár

| Skrá | Aðgerð |
|------|--------|
| `src/pages/Onboarding.tsx` | Gera postal_code og building_year required |
| `src/hooks/useBenchmarking.ts` | Skipta `postalPrefix` út fyrir `region`, uppfæra default |
| `src/components/benchmarking/BenchmarkFilters.tsx` | Nýtt þriggja-þrepa svæðisval, byggingarárabil |
| `supabase/functions/benchmark/index.ts` | Nýr `region` filter logic |
| `supabase/functions/dev-seed/index.ts` | Raunhæf póstnúmer og byggingarár |
| `src/pages/Benchmarking.tsx` | Senda `postal_code` úr association til BenchmarkFilters |

