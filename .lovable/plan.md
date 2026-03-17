

# Yfirferðarskýrsla: Húsfélagið.is

Eftir ítarlega yfirferð á öllu verkefninu, skila ég hér niðurstöðum, flokkaðar eftir alvarleika.

---

## A. Villur og brotið virkni

### A1. Em-dash enn í 40 skrám (303 tilfelli)
Fyrri hreinsun náði ekki yfir allt. Enn eru 303 tilfelli af `—` í 40 skrám, þar á meðal:
- `src/layouts/AppLayout.tsx` (skráarhaus)
- `src/lib/categorize.ts` (athugasemdir og kóðalýsingar)
- `src/components/classification/AutoClassifyBar.tsx`
- `src/components/transactions/UploadTransactions.tsx`
- `src/types/database.ts`
- `src/components/ProtectedRoute.tsx`
- Dashboard.tsx lína 150: `{association?.name ?? 'Húsfélagið þitt'} — {label}` (notanda-sýnilegur texti)

### A2. useAutoTasks leitar enn eftir `'in_progress'` stöðunni
Í `useAutoTasks.ts` lína 62: `.in('status', ['open', 'in_progress'])` en kerfið notar `'waiting'` í stað `'in_progress'`. Þetta þýðir að verkefni í stöðunni `'waiting'` eru ekki talin með í tvítekningargreiningu og geta skapað óþarfa endurtekningar.

### A3. Boðskerfi (Invite) er sýndarkerfi
`useInviteMember` í `useMembers.ts` býr til meðlimafærslu með tilbúnu `crypto.randomUUID()` sem `user_id`. Þetta tengist engum raunverulegum notanda og mun aldrei virka. Boðsþjónustan í Onboarding (skref 3) er alveg dummy (sleep 600ms + toast).

### A4. useHealthScore sækir án `.limit()`
`fetchHealthScore` í `useHealthScore.ts` lína 315 sækir allar færslur án neinna takmarkana. Ef húsfélag hefur >1000 færslur skilar Supabase aðeins 1000 og heilsustigið verður rangt.

### A5. useVendorSummary og useRunAutoClassify sækja án `.limit()`
Báðar aðgerðir í `useClassification.ts` sækja allar færslur fyrir húsfélagið án `.limit()`. Sama 1000-línu vandamálið.

---

## B. Rökfræðivandamál

### B1. Mánaðarleg þróun er alltaf 12 mánuðir
`useTransactionStats` línur 154-158 búa alltaf til 12 mánaða grid óháð `dateFrom`. Ef notandi velur 6 mánaða tímabil birtast 6 tómir mánuðir.

### B2. Meðaltal miðast alltaf við 12
Lína 95 í Dashboard: `avgMonthlyExpense = (stats?.total_expenses ?? 0) / 12` er fast á 12, jafnvel þótt valið tímabil sé styttra.

### B3. Task dedup notar `'in_progress'` sem er ekki í notkun
Sjá A2 hér að ofan. Ætti að vera `['open', 'waiting']`.

### B4. Notification polling á 30 sek intervalli
`useNotifications.ts` notar `refetchInterval: 30_000`. Þetta er of tíð fyrirspurn sem skapar óþarfa álag. Mælt með Supabase Realtime í staðinn.

---

## C. Öryggisatriði

### C1. Admin síðan notar client-side vörn eingöngu
`Admin.tsx` athugar `role_type === 'super_admin'` frá `profiles` töflu. Þetta er lesið client-side og profiles taflan hefur engar RLS reglur sem hindra breytingar á `role_type`. Notandi gæti breytt eigin `role_type` í `'super_admin'` í gegnum Supabase client.

### C2. Profiles RLS leyfir notendum að uppfæra eigin `role_type`
`Users can update their own profile` policy: `auth.uid() = user_id` fyrir UPDATE. Ekkert hindrar notanda frá að setja `role_type = 'super_admin'`.

### C3. Admin flokkar/vendor_rules ekki varðar
`categories` tafla leyfir öllum auðkenndum notendum að DELETE, INSERT, UPDATE. Hvaða notandi sem er getur eytt flokki eða bætt við.

---

## D. Viðmótsvandamál

### D1. Admin flipar nota ekki URL query params
Ólíkt Financials síðunni halda Admin flipar ekki stöðu í URL. Þegar síða er endurhlaðin fer notandinn aftur á "Yfirlit" flipann.

### D2. Ekkert error boundary
Ef einhver síða krassar sýnist hvítur skjár. Vantar React Error Boundary á App stigi.

### D3. Tómur sidebar á mobile
`AppSidebar` inniheldur ekkert responsive collapse pattern fyrir smá skjái.

---

## E. Kóðahreinleiki

### E1. Tvöföld `db as any` cast í useHealthScore
Línur 315, 324 nota `(db as any)` í stað venjulegs `db` cast.

### E2. Ónotuð innflutningur (imports)
`useTransactions.ts` flytur inn `is` frá `date-fns/locale` en notar hana.

---

## Verkefnalisti eftir forgangi

| # | Verkefni | Alvarleiki |
|---|---------|-----------|
| 1 | Loka profiles UPDATE RLS gegn role_type breytingum | Hátt (öryggi) |
| 2 | Bæta við RLS takmörkunum á categories töfluna | Hátt (öryggi) |
| 3 | Klára em-dash hreinsun í 40 skrám sem eftir standa | Meðal |
| 4 | Laga `in_progress` → `waiting` í useAutoTasks dedup | Meðal |
| 5 | Bæta `.limit(10000)` á useHealthScore og useClassification fyrirspurnir | Meðal |
| 6 | Laga mánaðarleg þróun til að virða tímabilsval | Meðal |
| 7 | Innleiða raunverulegt boðskerfi (invite flow) eða fjarlægja dummy kóða | Meðal |
| 8 | Admin flipar í URL query params | Lágt |
| 9 | Bæta við Error Boundary | Lágt |
| 10 | Skipta notification polling yfir í Realtime | Lágt |

---

## Tillaga

Byrja á öryggisatriðum (#1 og #2). Þá em-dash hreinsun (#3) og rökfræðileiðréttingar (#4-6). Boðskerfið (#7) og viðmótsbætur (#8-10) koma síðar.

