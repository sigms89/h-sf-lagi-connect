

## Áætlun: Hlutverkaaðlagað viðmót (Role-based UI)

### Vandamálið

Eins og er sér **þjónustuaðili** alla húsfélagsvalmyndina (Yfirlit, Fjármál, Samanburður) sem tengist honum ekki. Hann þarf að fara á `/provider` handvirkt. Á sama hátt sér **kerfisstjóri** allt í einum haug.

### Tillaga: Þrír aðskildir sidebar-modes

Sidebar og layout aðlagast hlutverki notandans sjálfkrafa:

```text
┌─────────────────┬──────────────────────┬──────────────────────┐
│  Húsfélagsmaður │  Þjónustuaðili       │  Kerfisstjóri        │
├─────────────────┼──────────────────────┼──────────────────────┤
│  Yfirlit        │  Yfirlit (provider)  │  Yfirlit (admin)     │
│  Mín verkefni   │  Tilboðsbeiðnir      │  Húsfélög            │
│  Öll verkefni   │  Mín tilboð          │  Notendur            │
│  Fjármál        │  Prófíll             │  Þjónustuaðilar      │
│  Samanburður    │  Markaðstorg (skoða) │  Flokkar             │
│  Markaðstorg    │                      │  Tilboðsferlar       │
│  ──────────     │  ──────────          │  Markaðstorg         │
│  Stillingar     │  Stillingar          │  ──────────          │
│                 │                      │  Aðgerðaskrá         │
│                 │                      │  Stillingar          │
└─────────────────┴──────────────────────┴──────────────────────┘
```

### Breytingar

**1. `AppSidebar.tsx` — hlutverkaaðlagaðar valmyndir**
- Í stað eins `primaryItems` lista, skipta í 3 lista eftir hlutverki
- Þjónustuaðili: sér aðeins provider-tengda hlekki, ekki húsfélagssíður
- Kerfisstjóri: sér admin-flipana sem beina valmyndaratriði (ekki falið neðst)
- Húsfélagsmaður (member/admin): óbreytt frá því sem er

**2. `AppLayout.tsx` — engar breytingar** (layout er hlutlaust)

**3. `ProviderDashboard.tsx` — splitta í sidebar-stýrt**
- Færa flipana (Yfirlit, Tilboðsbeiðnir, Mín tilboð, Prófíll) úr tabs yfir í aðskildar sidebar-síður
- Nýjar routes: `/provider/requests`, `/provider/bids`, `/provider/profile`
- `/provider` verður provider yfirlit (ProviderDashboardOverview)

**4. `Admin.tsx` — splitta í sidebar-stýrt (síðar, ef óskað)**
- Hægt að gera sama og provider: admin-fliparnir verða sidebar-hlekki
- Þetta er valfrjálst í fyrstu útfærslu

**5. `Settings.tsx` — sýna mismunandi stillingar eftir hlutverki**
- Þjónustuaðili sér ekki húsfélagsstillingar (meðlimir, byggingarupplýsingar)
- Heldur sér aðeins eigin reikningsstillingar

### Röð útfærslu

1. **Sidebar aðlögun** — 3 valmyndalista eftir hlutverki í `AppSidebar.tsx`
2. **Provider routes** — splitta ProviderDashboard í 4 síður með eigin routes
3. **Settings aðlögun** — fela húsfélagsspjöld ef notandi er þjónustuaðili
4. **Home redirect** — `/` vísar á rétta yfirlitssíðu eftir hlutverki

### Skrár sem breytast

| Skrá | Aðgerð |
|------|--------|
| `src/components/AppSidebar.tsx` | 3 valmyndalista eftir hlutverki |
| `src/App.tsx` | Nýjar provider routes |
| `src/pages/ProviderDashboard.tsx` | Einfalda — aðeins overview |
| `src/pages/ProviderRequests.tsx` | Nýtt — tilboðsbeiðnir |
| `src/pages/ProviderBidsPage.tsx` | Nýtt — mín tilboð |
| `src/pages/ProviderProfilePage.tsx` | Nýtt — prófíll |
| `src/pages/Settings.tsx` | Fela húsfélagsspjöld fyrir providers |
| `src/pages/Dashboard.tsx` | Redirect provider → `/provider` |

