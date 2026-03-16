

## Yfirferð: Glufur og vandamál í Húsfélagið.is

### 1. Tvítekin uppfleðsla — engin vörn gegn tvíteknum færslum (AÐALVANDAMÁL)

**Vandamálið:** Þegar sama gagnasafn er hlaðið upp tvisvar fer allt beint í gagnagrunn án nokkurrar viðvörunar. Engin greining á hvort færslur séu þegar til staðar.

**Lausn:** Bæta við tvítekningagreiningu í `useUploadTransactions` / `UploadTransactions.tsx`:
- Áður en vistað er, sækja nýlegar færslur frá gagnagrunninum (síðustu 90 daga) fyrir húsfélagið
- Bera saman (dagsetning + lýsing + upphæð) við nýju færslurnar
- Ef >50% samsvörun → sýna viðvörunarglugga: „X af Y færslum líta út fyrir að vera þegar í kerfinu. Viltu halda áfram?"
- Merkja hverja línu sem „möguleg tvítekning" með appelsínugulu badge í forskoðunartöflunni
- Bjóða upp á „Sleppa tvíteknum" hnapp

### 2. ProtectedRoute — röng fyrirspurn á profiles

**Vandamálið:** Í `ProtectedRoute.tsx` lína 38 er `.eq('id', user.id)` — en `profiles` taflan notar `user_id` dálk, ekki `id`. Þetta þýðir að hlutverkavörn (requiredRole) virkar ekki rétt og skilar alltaf `'member'` sem fallback.

**Lausn:** Breyta í `.eq('user_id', user.id)`.

### 3. Engin staðfesting á eyðingu eða afturkræf aðgerð

**Vandamálið:** Engin leið til að eyða upload batch eða afturkalla upphleðslu. Ef notandi hleður upp vitlausum gögnum er eina leiðin að eyða hverri færslu handvirkt.

**Lausn:** Bæta við „Afturkalla síðustu upphleðslu" aðgerð á Transactions síðunni sem eyðir öllum færslum með sama `uploaded_batch_id`. Þarf DELETE RLS á `upload_batches` (vantar núna) og cascade delete eða handvirka eyðingu.

### 4. Console viðvörun — Badge ref í Settings

**Vandamálið:** `Function components cannot be given refs` villa vegna `<Badge>` notað sem `SelectValue` barn í Settings. Skaðlaust en ljótt í console.

**Lausn:** Setja `<span>` utan um `<Badge>` í Settings member role Select, eða nota `React.forwardRef` á Badge.

### 5. TimeRange hefur ekki áhrif á gagnasótt

**Vandamálið:** `TimeRangeSelector` er sýndur á Dashboard og Analytics en `useTransactionStats` sækir alltaf síðustu 12 mánuði (`subMonths(new Date(), 12)`). Tímabilsvalið hefur engin áhrif á gögnin.

**Lausn:** Láta `useTransactionStats` og aðra hooks (`useAlerts`, `useAnalytics`) taka á móti `months` frá `useTimeRange` og nota það til að reikna `dateFrom`.

### 6. Supabase 1000 línu takmörkun

**Vandamálið:** `useAlerts`, `useAnalytics`, `useTransactionStats` sækja færslur án `.limit()` eða síðuskiptingar. Ef húsfélag hefur >1000 færslur á 12 mánuðum birtast ekki allar og útreikningar verða rangir — án nokkurrar viðvörunar.

**Lausn:** Bæta við paging eða `.limit(10000)` á þessar fyrirspurnir og sýna viðvörun ef count > skilað gögnum.

### 7. Upload Batches — vantar UPDATE/DELETE RLS

**Vandamálið:** `upload_batches` tafla leyfir ekki UPDATE eða DELETE. Þetta kemur í veg fyrir „afturkalla upphleðslu" virkni og gerir ómögulegt að hreinsa rangan import.

**Lausn:** Bæta við DELETE policy fyrir admin notendur á `upload_batches` og `transactions` (þar sem transactions DELETE er þegar til).

---

### Forgangsröðun

| # | Vandamál | Alvarleiki | Staða |
|---|----------|-----------|-------|
| 1 | Tvítekningagreining á uppfleðslu | Hátt | ✅ Leyst |
| 2 | ProtectedRoute `.eq('id')` bug | Hátt | ✅ Leyst |
| 3 | Afturkalla síðustu upphleðslu | Meðal | ✅ Leyst |
| 4 | TimeRange hefur ekki áhrif | Meðal | ✅ Leyst |
| 5 | 1000 línu takmörkun | Meðal | ✅ Leyst |
| 6 | Badge ref viðvörun | Lágt | ✅ Leyst |

### Tillaga

Byrja á #2 (einnar línu fix), síðan #1 (tvítekningagreining), og #4 (1000 línu vörn). Hinar eru mikilvægar en hafa minni áhrif á réttmæti gagna.

