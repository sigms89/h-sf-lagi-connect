

# Hönnunarkerfi 2.0: Dark Mode + Glassmorphism + Aurora + Bento

Þetta er stór umbreyting. Núverandi kerfi er light-mode Mercury/Linear stíll. Nýja kerfið verður dark-mode-first með glassmorphism spjöldum, aurora bakgrunni og bento grid. Skiptum í 3 fasa til að halda verkefninu stöðugu.

---

## Fasi 1: Grunnkerfi (CSS variables + dark mode sem default)

**`src/index.css`** — Endurskrifa CSS breyturnar:
- Snúa við: dark mode verður `:root`, light mode fer í `.light`
- Nýir bakgrunnslitir: `#0f0f1a` (base), `#1a1a2e` (cards), `#252540` (elevated)
- Glassmorphism breytur: `--glass-bg`, `--glass-border`, `--glass-blur`
- Aurora gradient breytur fyrir bakgrunn
- Uppfæra skugga til að virka á dökku: innri glow í stað drop-shadow

**`index.html`** — Bæta `class="dark"` á `<html>` (eða fjarlægja dark class logic og gera dark sem default)

**`tailwind.config.ts`** — Bæta við:
- `glass` boxShadow og backdrop-blur utilities
- Nýjar keyframes: `aurora-shift` (mjúk bakgrunnshreyfing), `count-up`, `lift`
- Nýjar animations: `hover-lift`, `press`, `stagger-in`

**`src/components/ui/card.tsx`** — Glassmorphism card:
- `bg-white/[0.06]` + `backdrop-blur-xl` + `border border-white/[0.08]`
- `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]`
- Hover: `hover:bg-white/[0.09] hover:border-white/[0.12]` + translateY(-1px)

---

## Fasi 2: Layout + Aurora bakgrunnur

**`src/layouts/AppLayout.tsx`**:
- Bakgrunnur fær aurora mesh gradient: 2-3 `radial-gradient` lög með indigo/violet/teal á mjúkri opacity
- `background-attachment: fixed` svo gradientinn hreyfist ekki við scroll
- Header: `bg-[#0f0f1a]/80 backdrop-blur-md` í stað `bg-card/80`

**`src/components/AppSidebar.tsx`**:
- Sidebar bakgrunnur: `#0d0d18` (dýpri en aðalbakgrunnur)
- Active item: mjúkt glow í stað border-left accent
- Hover: `bg-white/[0.04]`

**`src/pages/Auth.tsx`**:
- Full-screen aurora bakgrunnur
- Innskráningarform á glassmorphism card

---

## Fasi 3: Dashboard Bento Grid + Micro-interactions + Typography

**`src/pages/Dashboard.tsx`** — Bento grid:
```text
┌─────────────────────┬──────────┐
│                     │  Quick   │
│   Hero / KPI        │  Action  │
│   (2 cols)          │  (1 col) │
├────────┬────────┬───┴──────────┤
│ Balance│ Income │   Expense    │
│ card   │ card   │   card       │
├────────┴────────┴──────────────┤
│      Monthly Trend Chart       │
├──────────────────┬─────────────┤
│  Recent Txns     │ Top Cats    │
│  (3 cols)        │ (2 cols)    │
└──────────────────┴─────────────┘
```

**Typography hierarchy**:
- KPI tölur (sjóðsstaða, tekjur, gjöld): `text-4xl font-bold` eða stærra
- Section headings: `text-base font-semibold`
- Card labels: `text-[11px] uppercase tracking-widest text-white/40`
- Body: `text-sm text-white/60`

**Micro-interactions** (bæta við í tailwind.config.ts og beita):
- Cards: `transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover`
- Buttons: `active:scale-[0.97]` press effect
- Page load: stagger fade-in á cards (`animation-delay`)
- `@media (prefers-reduced-motion: reduce)` — slökkva á öllu

**`src/components/dashboard/BalanceCard.tsx`**:
- Stór tala: `text-3xl lg:text-4xl font-bold tabular-nums`
- Label: `text-[11px] uppercase tracking-widest text-white/40`
- Icon fær mjúkt glow í bakgrunni

---

## Skrár sem breytast

| Skrá | Breyting |
|------|---------|
| `index.html` | Bæta `class="dark"` á html |
| `src/index.css` | Ný litakerfi, glass utilities, aurora keyframes |
| `tailwind.config.ts` | Nýjar animations, glass shadows |
| `src/components/ui/card.tsx` | Glassmorphism stíll |
| `src/layouts/AppLayout.tsx` | Aurora bakgrunnur, dark header |
| `src/components/AppSidebar.tsx` | Dark sidebar, glow active state |
| `src/pages/Dashboard.tsx` | Bento grid, bold typography, micro-interactions |
| `src/pages/Auth.tsx` | Aurora bakgrunnur, glass card |
| `src/components/dashboard/BalanceCard.tsx` | Stærri tölur, glass stíll |

---

## Mikilvægt

- **Öll núverandi virkni helst óbreytt** — þetta er eingöngu visuell umbreyting
- Dark mode verður sjálfgefið en light mode variables verða geymdar (hægt að virkja síðar)
- `prefers-reduced-motion` verður virt
- Allar financial semantic litir (teal/rose) virka á dökku og haldast
- Framkvæmd fer í einni lotu (öll 3 fasa saman) til að forðast blandað útlit

