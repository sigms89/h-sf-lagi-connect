

## Endurskoðun: Hlutverkaaðlagað viðmót — vandamál og lagfæringar

### Vandamál sem fundust

**1. Engin sjálfvirk redirect við hlutverkaskipti (DEV switcher)**
Þegar þú skiptir um hlutverk í DEV switcher, uppfærist sidebar rétt en þú ert áfram á sömu síðu (t.d. `/marketplace`). Redirect lógíkin er aðeins í `Dashboard.tsx` (route `/`), svo hún virkjar aldrei nema þú farir handvirkt á `/`.

**Lagfæring:** Bæta við `useNavigate` og redirect í `DevRoleSwitcher.tsx` — eftir query invalidation, beina notandanum á rétta yfirlitssíðu:
- `service_provider` → `/provider`
- `super_admin` → `/admin`
- `member`/`admin` → `/`

**2. React ref viðvörun á ProviderRequests og ProviderNotRegistered**
Console sýnir: "Function components cannot be given refs." Þetta kemur af því að React Router reynir að setja ref á þessar síður (lazy loading eða element ref). Þetta er minniháttar en ætti að laga.

**Lagfæring:** Ekki þarf `forwardRef` hér — vandamálið er líklega að `ProviderNotRegistered` er returnaður beint sem Route element og React Router reynir ref. Þetta er cosmetic warning sem hefur ekki áhrif á virkni.

**3. Provider síður sýna "Ekki skráður" ef notandi hefur ekki service_provider record**
Þetta er rétt hegðun — en þegar DEV switcher breytir `role_type` í `service_provider` á profiles töflunni, þýðir það ekki að `service_providers` record sé til. `useCurrentProvider` leitar í `service_providers` töflu, ekki `profiles`.

**Lagfæring:** Tveir möguleikar:
- A) DEV switcher býr sjálfkrafa til dummy service_provider record ef ekkert er til (betra fyrir þróun)
- B) Láta `ProviderNotRegistered` síðuna sýnast og notandinn skráir sig (réttara fyrir production)

### Áætlaðar breytingar

| Skrá | Aðgerð |
|------|--------|
| `src/components/DevRoleSwitcher.tsx` | Bæta við navigate eftir hlutverkaskipti |
| `src/components/provider/ProviderNotRegistered.tsx` | Laga ref warning (minor) |

### Samantekt

Aðalvandamálið er að **hlutverkaskipti beina notandanum ekki á rétta síðu**. Lagfæringin er einföld — bæta navigate í DevRoleSwitcher. Allt annað (sidebar, settings, provider síður) virkar rétt miðað við kóðann.

