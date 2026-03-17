

# Yfirferðarskýrsla 3: Heildarúttekt á rökfræði, upplifun og virkni

---

## A. Alvarleg rökfræðivandamál

### A1. DevRoleSwitcher stangast á við prevent_role_type_self_update trigger
**Vandamálið:** Trigger `prevent_role_type_self_update` bannar notendum að breyta eigin `role_type`. En DevRoleSwitcher gerir nákvæmlega það (lína 56-59). Þetta þýðir að dev role switching er brotið í production og skilar villu.

**Lausn:** DevRoleSwitcher þarf að nota aðra leið, t.d. kalla á edge function sem notar `service_role` til að breyta role_type, eða fara yfir í `user_roles` kerfi (sjá ráðleggingar). Þar til: bæta við athugasemd í trigger sem leyfir breytingu ef notandinn er `super_admin` samkvæmt núverandi gildi.

### A2. ReportsPage deilir alltaf með 12 mánuðum
**Vandamálið:** `ReportsPage.tsx` lína 247: `const avgMonthly = netBalance / 12` er fast á 12 óháð tímabilsvali. Sama bug og var á Dashboard áður en það var lagað.

**Lausn:** Nota `stats?.monthly_data?.length || 12` eins og Dashboard gerir nú.

### A3. MinVerkefni notar foreign key join sem gæti brostið
**Vandamálið:** `MinVerkefni.tsx` lína 42 notar `profiles!tasks_assigned_to_fkey(full_name)`. Þetta gerir ráð fyrir formlegri FK tengingu milli `tasks.assigned_to` og `profiles`. En `profiles` töflunni er ekki beint tengt við `tasks` í gegnum `assigned_to` með FK. Ef þessi join bregst sýnist allt verkefnalistinn tómur.

**Lausn:** Nota sömu aðferð og `TasksWidget`/`OllVerkefni`: sækja profiles sérstaklega í seinni fyrirspurn.

### A4. Marketplace `isAdmin` er alltaf `true`
**Vandamálið:** `Marketplace.tsx` lína 122: `isAdmin={true}` er fast gildi. Þetta gefur öllum notendum admin réttindi innan BidRequestDetail (samþykkja/hafna tilboð). RLS verndar á bakenda en UX er rangur: almennt meðlimur sér "Samþykkja" hnapp.

**Lausn:** Athuga `memberRole` eða nota `is_association_admin` og senda rétt gildi.

### A5. Admin sidebar links matcha ekki tab values
**Vandamálið:** Sidebar skilgreinir `?tab=husfelag`, `?tab=thjonustuadilar`, etc. en Admin.tsx notar `associations`, `providers`, `overview` sem tab values. Þetta þýðir: ef notandi smellir á "Húsfélög" í sidebar bírtist "Yfirlit" tab af því `husfelag` er ekki gilt tab value og fallback er `overview`.

**Lausn:** Samræma sidebar URL query strings við tab values í Admin.tsx.

---

## B. Upplifunarvandamál (UX)

### B1. Engin "Gleymt lykilorð" virkni
**Vandamálið:** Auth síðan hefur engan "Gleymt lykilorð" hlekk. Ef notandi tapar lykilorði er engin leið til að endurheimta aðgang.

**Lausn:** Bæta við `supabase.auth.resetPasswordForEmail()` og samsvarandi formi.

### B2. Enginn loading state á Marketplace "Ný tilboðsbeiðni" hnapp
**Vandamálið:** Marketplace sýnir "Ný tilboðsbeiðni" hnapp ólíkt því hvort notandinn hefur association (lína 102). En þjónustuaðilar (providers) hafa ekki association. Hnappurinn birtist ekki ef `association` er null, en enginn skýringartexti birtist heldur.

### B3. Sidebar tekur ekki tillit til admin tab states
**Vandamálið:** Admin sidebar linkarnir nota rangar query params (A5 hér að ofan). En jafnvel ef þeir væru réttir, hefur sidebar `isActive` aðferðin bug: ef notandi er á `/admin?tab=overview` þá matchar hún bæði "Yfirlit" (sem er `/admin` utan params) OG "Yfirlit" (`/admin` + `tab=overview`).

### B4. Greiningin sýnir ekki tímabilið
**Vandamálið:** `useVendorAnalytics` og `useYearOverYear` sækja alltaf öll gögn síðustu 12 mánuðina / síðasta ár óháð TimeRange vali notandans. Ef notandi velur "6 mánuðir" á Analytics síðunni breytist aðeins línuritið, ekki vendor taflan né ár-yfir-ár samanburður.

**Lausn:** Senda `dateFrom` frá `useTimeRange` í þessar hooks.

### B5. Onboarding sendir ekki raunverulegt boð
**Vandamálið:** Onboarding InviteForm (skref 3) býr til notification færslu en sendir engan tölvupóst og tengir ekki boðsmóttakanda við húsfélagið. Þetta er skráð sem dummy en notendur sjá "Senda boð" hnapp og búast við raunverulegri aðgerð.

**Lausn:** Breyta UX: nota orðalag eins og "Skrá netföng" í stað "Senda boð" og sýna copy-to-clipboard slóð sem hægt er að deila handvirkt. Eða innleiða raunverulegan invite flow með `supabase.auth.admin.inviteUserByEmail()` í gegnum edge function.

---

## C. Vantar í kerfið

### C1. Engin leið til að eyða húsfélagi
**Vandamálið:** Enginn DELETE policy á `associations` töflu. Ef formaður vill eyða húsfélagi eða loka aðgangi er engin leið.

### C2. Engin leið til að breyta lykilorði
**Vandamálið:** Settings síðan sýnir netfang disabled. Engin aðgerð til að breyta lykilorði eða öðrum reikningsstillingum.

### C3. PDF útflutningur er dummy
**Vandamálið:** `ReportsPage.tsx` lína 266: `handleDownloadPDF` sýnir bara toast "kemur fljótlega". Notandi sér PDF hnapp sem virkar ekki.

### C4. Engin DELETE á notifications
**Vandamálið:** Notifications töflan hefur enga DELETE RLS. Ef notandi vill hreinsa tilkynningalista er það ómögulegt. Tilkynningar safnast upp endalaust.

---

## D. Öryggisatriði

### D1. DevRoleSwitcher á ekki að vera í production
**Vandamálið:** DevRoleSwitcher er alltaf sýnilegur í sidebar. Í production myndi þetta gefa öllum notendum möguleika á að prófa admin/provider hlutverkin (þó trigger komi í veg fyrir raunverulega breytingu, sýnist villuboð).

**Lausn:** Fela DevRoleSwitcher á bak við `import.meta.env.DEV` skilyrði eða `IS_DEV` environment variable.

### D2. `profiles` SELECT RLS leyfir notanda aðeins að sjá eigin profile
**Vandamálið:** Profiles RLS: `auth.uid() = user_id` fyrir SELECT. Þetta þýðir að `useAssociationMembers` (sem sækir profiles fyrir alla meðlimi) virkar aðeins fyrir eigin notanda. Allir aðrir meðlimir sýna `null` nafn.

**Lausn:** Bæta við SELECT policy: `is_association_member(...)` eða búa til SECURITY DEFINER function sem sækir `full_name` fyrir user_ids.

---

## E. Kóðagæði

### E1. 294 em-dashes eftir í 40 skrám
Meirihlutinn er í athugasemdum (skráarhausum) en a.m.k. 2 tilvik eru notanda-sýnileg: `UploadTransactions.tsx` lína 59 (`— only preview/analysis`).

### E2. Tvöfaldur profile query á Dashboard
`Dashboard.tsx` sækir profile bæði í línu 49 (redirect) og AppSidebar sækir í línu 79. Þessar tvær fyrirspurnir hafa mismunandi queryKey (`profile-dash-redirect` vs `profile-sidebar`) og deila ekki gögnum.

**Lausn:** Nota sameiginlegan `useProfile` hook.

### E3. `staleTime: 0` á mörgum stöðum
`profile` fyrirspurnir nota `staleTime: 0` sem þýðir endurhleðsla á hverri render. Þetta er óþarfi og getur valdið flicker.

---

## Verkefnalisti eftir forgangi

| # | Verkefni | Alvarleiki |
|---|---------|-----------|
| 1 | Laga Admin sidebar tab links til að matcha tab values | Hátt (brotið) |
| 2 | Laga DevRoleSwitcher conflict við trigger (edge function eða trigger update) | Hátt (brotið) |
| 3 | Laga `isAdmin={true}` í Marketplace til að vera raunverulegt gildi | Hátt (UX/öryggi) |
| 4 | Laga profiles SELECT RLS svo meðlimir sjái nöfn annarra | Hátt (brotið) |
| 5 | Laga MinVerkefni FK join — nota sömu aðferð og TasksWidget | Meðal |
| 6 | Laga ReportsPage avgMonthly / 12 bug | Meðal |
| 7 | Bæta við "Gleymt lykilorð" flæði á Auth síðu | Meðal |
| 8 | Fela DevRoleSwitcher í production | Meðal (öryggi) |
| 9 | Láta useVendorAnalytics og useYearOverYear virða tímabilsval | Meðal |
| 10 | Bæta við DELETE á notifications (hreinsa tilkynningar) | Lágt |
| 11 | Klára em-dash hreinsun í athugasemdum (294 tilvik) | Lágt |
| 12 | Sameina profile queries í shared hook | Lágt |

---

## Tillaga um framkvæmdaröð

Byrja á #1 og #2 (brotið) og #4 (meðlimanöfn sjást ekki). Þá #3 (isAdmin) og #5-6 (rökfræðibugir). #7 (gleymt lykilorð) og #8 (fela dev switcher) eru þæginleg viðbót. Hitt getur beðið.

