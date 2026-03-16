

## Íslenskuyfirferð — Tillögur að leiðréttingum

Ég yfirfór alla skráa sem innihalda íslensku texta í kerfinu. Hér eru allar villur og lagfæringar sem ég fann, flokkaðar eftir alvarleika.

---

### 1. Málfræðivillur — beygingarvillur og orðalag

| Skrá | Lína | Nú stendur | Ætti að vera | Ástæða |
|------|------|-----------|-------------|--------|
| `Settings.tsx` | 89, 398 | `Stjórnarsmeðlimur` | `Stjórnarmeðlimur` | Rangt samsett orð — „stjórnar" + „meðlimur", ekki „stjórnars" |
| `Onboarding.tsx` | 47 | `Ólöglegt byggingarár` | `Ógilt byggingarár` | „Ólöglegt" þýðir „illegal" — hér er átt við „invalid" |
| `Dashboard.tsx` | 90 | `færslur eru óflokkuð` | `færslur eru óflokkaðar` | „Færslur" er kvk.ft., krefst „óflokkaðar" |
| `ProviderRegister.tsx` | 36 | `Ógild netfang` | `Ógilt netfang` | „Netfang" er hk., krefst „ógilt" |
| `ProviderRegister.tsx` | 37 | `Ógild vefsíðuslóð` | `Ógild vefslóð` | „Vefsíðuslóð" er ekki raunhæft samsett orð — „vefslóð" er rétt |
| `Onboarding.tsx` | 45 | `Hlýtur að vera a.m.k. 1 íbúð` | `Þarf að vera a.m.k. 1 íbúð` | „Hlýtur" er óeðlilegt í villuskilaboðum |
| `ProviderRegister.tsx` | 51 | `Suðurland / Norðausturland (900–999)` | `Vestmannaeyjar / Suðurnesja (900–999)` | 900-svæðið er Vestmannaeyjar, ekki Norðausturland |

### 2. Stafsetningarvillur og samræmisvandamál

| Skrá | Lína | Nú stendur | Ætti að vera | Ástæða |
|------|------|-----------|-------------|--------|
| `VendorOverview.tsx` | 482 | `óflokkað` (lágstafir í badge) | `óflokkaðar` eða `Óflokkaðar` | Samræmi við „færslur" (kvk.ft.) |
| `AutoClassifyBar.tsx` | 138 | `Óflokkað:` + `færslur` | `Óflokkaðar færslur:` | Sama beygingarregla |
| `CreateTaskModal.tsx` | 57 | `Ekki innskráð/ur` | `Ekki innskráð(ur)` | Betra form, eða „Notandi ekki innskráður" |
| `Admin.tsx` | 76 | `Hleður...` | `Hleð...` | Samræmi við annars staðar í kerfinu (t.d. Transactions.tsx notar „Hleð...") |
| `ProviderRegister.tsx` | 43 | `Höfuðborgarsvæði (100–199)` | `Reykjavík (100–199)` | Höfuðborgarsvæðið nær yfir 100-299, ekki bara 100-199. Eins og BenchmarkFilters svæðaskiptingin skilgreinir |
| `ProviderRegister.tsx` | 44 | `Suðurnes (200–299)` | `Kópavogur / Hafnarfjörður / Garðabær (200–299)` | Suðurnes er 230+, en 200-229 er Kópavogur/Garðabær osfrv. |

### 3. Orðalagstillögur (ekki beinar villur en betri íslenska)

| Skrá | Lína | Nú stendur | Tillaga | Ástæða |
|------|------|-----------|---------|--------|
| `Onboarding.tsx` | 100 | `töfrastig` | Fjarlægja/endurskrifa athugasemd | „Töfrastig" er ekki raunhæft íslenskt orð |
| `ReportsPage.tsx` | 377 | `Meðalsöfnun pr. mánuð` | `Meðalsöfnun á mánuði` | „pr." er dönsk skammstöfun, „á mánuði" er íslenskt |
| `Analytics.tsx` | 85 | `Birgi` (table header) | `Birgir` eða `Þjónustuaðili` | „Birgi" er nefnifall eintölu en dálkurinn sýnir marga. Betur: „Þjónustuaðili" til samræmis við restina |
| `NotificationBell.tsx` | 157 | `Merkja allt lesið` | `Merkja allt sem lesið` | Náttúrulegra orðalag |
| `ReportsPage.tsx` | 330 | `Fjárhagsyfirlit Húsfélags` | `Fjárhagsyfirlit húsfélags` | Lágstafur í „húsfélags" nema nafn |
| `Benchmarking.tsx` | 74 | `flokkar undir meðaltali` | `flokkar undir miðgildi` | Samræmi við restina — kerfið notar nú miðgildi, ekki meðaltal |

### 4. Samræmi milli skráa

**„Hleð..." vs „Hleður..."**: Flest skrár nota „Hleð..." (réttara, 1. persóna) en `Admin.tsx` notar „Hleður..." — ætti að samræma í „Hleð..."

**„Parhús" vs „Parhús"**: Vantar accent á „Par" — rétt form er „Parhús" (ekki villa, en athuga hvort ætlunin sé „Parhús" eða „Tvíbýlishús")

### Skrár sem þarf að breyta

| Skrá | Fjöldi leiðréttinga |
|------|---------------------|
| `src/pages/Onboarding.tsx` | 2 |
| `src/pages/Settings.tsx` | 2 |
| `src/pages/Dashboard.tsx` | 1 |
| `src/pages/Admin.tsx` | 1 |
| `src/pages/ReportsPage.tsx` | 2 |
| `src/pages/Analytics.tsx` | 1 |
| `src/pages/Benchmarking.tsx` | 1 |
| `src/pages/ProviderRegister.tsx` | 4 |
| `src/components/classification/VendorOverview.tsx` | 1 |
| `src/components/classification/AutoClassifyBar.tsx` | 1 |
| `src/components/tasks/CreateTaskModal.tsx` | 1 |
| `src/components/notifications/NotificationBell.tsx` | 1 |

