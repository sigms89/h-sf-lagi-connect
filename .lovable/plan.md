

## Áætlun: Developer Seed Data pakki

### Hugmynd

Búa til edge function (`dev-seed`) sem sér um að setja inn og fjarlægja demo gögn. Gögnin verða merkt með sérstöku `uploaded_batch_id` / kennitölum svo auðvelt sé að þurrka þau út í einu.

### Hvað verður búið til

**1. Edge function: `supabase/functions/dev-seed/index.ts`**

Tekur á móti POST með `action: 'seed' | 'teardown'`.

**Seed** setur inn:
- 3 húsfélög (Birkigrund 5, Laugavegur 22, Skógarhlíð 10) með mismunandi stærðum og eiginleikum
- 1 association_member per húsfélag (tengd innskráðum notanda sem admin)
- ~30-50 færslur (transactions) dreifðar yfir 12 mánuði, blönduðum flokkum (tekjur/gjöld)
- 2 þjónustuaðila (service_providers) með prófílum og flokkum
- 2 tilboðsferla (bid_requests) + 3 tilboð (bids)
- 5-8 verkefni (tasks) í mismunandi stöðu (open/waiting/done)
- Notar sérstakt `uploaded_batch_id` UUID fast (`'00000000-dead-beef-0000-000000000001'`) á allar færslur til auðkenningar

**Teardown** eyðir öllu sem er merkt með demo-merkjunum (cascade á tasks, bids, osfrv.)

**2. UI hnappur í `DevRoleSwitcher.tsx`**

Bætir við tveimur hnöppum neðst í dev dropdown:
- 🌱 **Setja inn demo gögn** — kallar edge function með `action: 'seed'`
- 🧹 **Fjarlægja demo gögn** — kallar edge function með `action: 'teardown'`

### Tæknilegar ákvarðanir

- Edge function notar `SUPABASE_SERVICE_ROLE_KEY` til að komast framhjá RLS (þarf ekki breyta RLS reglum)
- Demo húsfélög merkt með `postal_code = 'DEMO'` til auðkenningar við teardown
- Demo þjónustuaðilar merktir með `kennitala = 'DEMO000000'`
- Allt hreinsað í réttri röð (foreign key order): bid_messages → bids → bid_requests → tasks → transactions → association_members → associations, service_provider_categories → service_providers

### Skrár

| Skrá | Aðgerð |
|------|--------|
| `supabase/functions/dev-seed/index.ts` | Ný — seed/teardown logic |
| `src/components/DevRoleSwitcher.tsx` | Bæta við seed/teardown hnöppum |

Engar gagnagrunnsskemabreytingar þörf.

