

# Aðlögun: "Arctic Editorial" Design System

Nýja design system-ið ("The Distilled Ledger") er light-mode kerfi sem leggur áherslu á:
- **Engar línur/borðar** – aðgreining með bakgrunnslitaskiptum
- **Tonal layering** – staflað yfirborð í stað skugga
- **Manrope** fyrir fyrirsagnir, Inter fyrir meginmál
- **Djúpir teal/arctic grey** litir í stað indigo
- **Glassmorphism** aðeins fyrir floating overlays, ekki öll spjöld
- **Gradient CTA hnappar**

## Breytingar

### 1. `index.html`
- Fjarlægja `class="dark"`, bæta við Manrope fonti í Google Fonts linkinn

### 2. `src/index.css` — Endurskrifa `.light` / `:root`

**Nýir litir (Arctic Editorial palette):**

| Variable | Núverandi | Nýtt (HSL) | Hex |
|----------|-----------|-------------|-----|
| `--background` | `240 20% 6%` (dark) | `210 17% 98%` | `#f8f9fa` |
| `--card` | `240 15% 11%` | `0 0% 100%` | `#ffffff` |
| `--foreground` | `220 13% 95%` | `195 10% 11%` | `#191c1d` |
| `--muted` | `240 10% 16%` | `210 11% 96%` | `#f3f4f5` |
| `--muted-foreground` | `240 5% 55%` | `200 7% 35%` | `#40484c` (on-surface-variant) |
| `--primary` | `239 84% 67%` (indigo) | `195 100% 14%` | `#003345` (deep teal) |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` | (óbreytt) |
| `--accent` | `175 70% 42%` | `193 100% 19%` | `#004b63` (primary-container) |
| `--destructive` | `347 77% 50%` | `0 75% 42%` | `#93000a` area |
| `--border` | `240 10% 18%` | `200 10% 90%` | `#e7e8e9` |
| `--ring` | `239 84% 67%` | `195 100% 14%` | (match primary) |
| `--sidebar-background` | `240 22% 5%` | `195 100% 14%` | `#003345` (deep teal sidebar) |

**Glass tokens** aðlagaðar:
- `--glass-bg`: verður `rgba(255,255,255,0.7)` (aðeins fyrir overlays)
- `--glass-border`: verður `rgba(192,199,205, 0.15)` (outline-variant at 15%)
- `--shadow-card`: fjarlægja glow, nota `0 12px 32px -4px rgba(25,28,29,0.04)` (ambient)

**"No-Line" regla:**
- `.glass-card` missir `border: 1px solid` — aðgreining verður eingöngu gegnum bakgrunnslitamun
- Hover effect: engin `translateY`, aðeins mjúk bakgrunnsbreyting

**Aurora bakgrunnur:**
- Fjarlægja aurora gradient, skipta út fyrir hreint `hsl(var(--background))`

**Typography:**
- Headings: `'Manrope'` í stað `'Plus Jakarta Sans'`
- Body: `'Inter'` helst óbreytt

### 3. `tailwind.config.ts`
- Breyta `fontFamily.heading` í `['Manrope', 'Inter', ...]`
- Bæta við nýjum surface tokens ef þörf (t.d. `surface-low`, `surface-high`)

### 4. `src/components/ui/card.tsx`
- Fjarlægja `glass-card` class, nota `bg-card rounded-xl` (surface-container-lowest)
- Engin border, aðeins tonal lift gegnum bakgrunnslit

### 5. `src/layouts/AppLayout.tsx`
- Fjarlægja `aurora-bg` class
- Header: nota `bg-background/80 backdrop-blur-xl` með mjúkari border
- Main content: `bg-muted` bakgrunnur svo hvít spjöld "lyfta sér" tónískt

### 6. `src/components/ui/button.tsx`
- Primary variant: gradient frá `primary` til `accent` (135°) í stað flatrar litar
- Secondary: `bg-muted` með `text-primary`, engin border

### 7. `src/components/AppSidebar.tsx`
- Sidebar fær deep teal bakgrunn (`--sidebar-background: #003345`)
- Active item: `rgba(255,255,255,0.1)` overlay
- Texti og ikon í hvítu/ljósu

### 8. Dark mode varðveitt
- Núverandi dark mode litir færðir undir `.dark` class og varðveittir sem valkostur

---

## Skrár sem breytast

| Skrá | Breyting |
|------|---------|
| `index.html` | Fjarlægja `dark` class, bæta við Manrope font |
| `src/index.css` | Nýr Arctic Editorial litapaletta, fjarlægja aurora, uppfæra glass tokens |
| `tailwind.config.ts` | Manrope font, hugsanlega surface tokens |
| `src/components/ui/card.tsx` | Fjarlægja glass-card, nota tonal layering |
| `src/components/ui/button.tsx` | Gradient primary CTA |
| `src/layouts/AppLayout.tsx` | Fjarlægja aurora-bg, tonal background |
| `src/components/AppSidebar.tsx` | Deep teal sidebar |

