

## Áætlun: Umsagnakerfi og myndagallerí — uppfært

### Umsagnir: Hver má skrifa og hvað birtist

**Aðeins stjórnandi (admin/board) húsfélagsins** getur skrifað umsögn — ekki allir meðlimir. RLS policy á INSERT athugar `is_association_admin(association_id)`.

**Nafnleysi með samhengi:** Í stað nafns húsfélagsins birtist lýsandi texti sem dreginn er sjálfkrafa úr `associations` töflunni:
> „82 íbúða húsfélag í póstnúmeri 104"

Þetta gefur þjónustuaðilanum og lesendum mikilvægar upplýsingar (stærð og staðsetning) án þess að gefa upp nafn húsfélagsins.

### Umsagnir sem breytast yfir tíma

Þetta er raunverulegt vandamál — þjónusta getur versnað eftir að umsögn er skrifuð. Tvær þekktar aðferðir:

**Aðferð A: Breytanleg umsögn (valin aðferð)**
- Stjórnandi getur **uppfært sína umsögn hvenær sem er** — breytt einkunn og texta
- Sýna `updated_at` dagsetningu ef hún er frábrugðin `created_at`: „Uppfært í mars 2026"
- Þetta endurspeglar núverandi upplifun, ekki sögulega
- Einfalt og heiðarlegt — húsfélagið á alltaf rétt á að breyta sinni umsögn

**Aðferð B (ekki valin):** Leyfa margar umsagnir yfir tíma — flóknara og opnar fyrir spam

### Gagnagrunnur

**Ný tafla: `provider_reviews`**
| Dálkur | Tegund | Athugasemd |
|--------|--------|------------|
| id | uuid PK | |
| provider_id | uuid FK → service_providers | |
| association_id | uuid FK → associations | Til að sækja num_units + postal_code |
| bid_request_id | uuid FK → bid_requests | Sönnun um viðskipti |
| created_by | uuid | auth.uid() stjórnandans |
| rating | integer 1-5 | |
| comment | text | |
| provider_response | text NULL | Svar þjónustuaðila |
| response_at | timestamptz NULL | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| UNIQUE(provider_id, association_id) | | Ein umsögn per húsfélag |

**RLS:**
- SELECT: allir innskráðir (opinbert)
- INSERT: `is_association_admin(association_id)` + EXISTS accepted bid
- UPDATE eigin umsögn: `is_association_admin(association_id)` + `association_id` matchar
- UPDATE provider_response: eigandi þjónustuaðilans

**Ný tafla: `provider_portfolio_images`**
| Dálkur | Tegund |
|--------|--------|
| id | uuid PK |
| provider_id | uuid FK |
| image_url | text |
| caption | text NULL |
| sort_order | integer default 0 |
| created_at | timestamptz |

**RLS:** SELECT opinbert, INSERT/UPDATE/DELETE aðeins eigandi provider

**Storage bucket:** `provider-media` (public) fyrir myndir

### UI breytingar

1. **ProviderPublicProfile.tsx** (nýtt) — heilsíðuprófíll:
   - Hero: lógó, nafn, lýsing, þjónustuflokkur, svæði
   - Myndagallerí (grid)
   - Umsagnir: stjörnur, texti, „82 íbúða húsfélag í póstnúmeri 104", dagsetning/uppfært
   - Svar þjónustuaðila (ef til)
   - „Skrifa umsögn" hnappur (sýnilegur aðeins ef admin með accepted bid og engin fyrri umsögn)

2. **ProviderCard.tsx** — bæta við meðaleinkunn (stjörnur) og fjölda umsagna

3. **ProviderProfile.tsx** (eigandi) — nýr flipi:
   - Myndaupphleðsla (drag & drop / velja skrá)
   - Sýna umsagnir og svara þeim

4. **Hooks:**
   - `useProviderReviews.ts` — CRUD umsagna + meðaleinkunn
   - `useProviderPortfolio.ts` — CRUD mynda í storage

### Skrár

| Skrá | Aðgerð |
|------|--------|
| DB migration | `provider_reviews`, `provider_portfolio_images`, storage bucket, RLS |
| `src/hooks/useProviderReviews.ts` | Nýr |
| `src/hooks/useProviderPortfolio.ts` | Nýr |
| `src/components/marketplace/ProviderPublicProfile.tsx` | Nýr |
| `src/components/marketplace/ProviderGallery.tsx` | Nýr |
| `src/components/marketplace/WriteReviewDialog.tsx` | Nýr |
| `src/components/marketplace/ProviderCard.tsx` | Uppfæra með stjörnum |
| `src/components/provider/ProviderProfile.tsx` | Bæta við portfolio og umsagnasýn |
| `src/pages/Marketplace.tsx` | Routing til prófíls |
| `src/App.tsx` | Bæta við route `/marketplace/provider/:id` |

