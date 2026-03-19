

# Litaskipti: Dark → Light Mode (Google-hönnun)

Skipta yfir í light mode með dökkri sidebar, byggð á litum úr Google-hönnuninni.

---

## Litakort (Google → CSS variables)

| Element | Google litur | HSL gildi |
|---------|-------------|-----------|
| Bakgrunnur | `#F8F7F4` (hlýtt off-white) | `40 20% 97%` |
| Spjöld | `#FFFFFF` | `0 0% 100%` |
| Sidebar | `#1A1A2E` (dökkur navy) | `240 28% 14%` |
| Primary | `#4A6CF7` (blár) | `228 91% 63%` |
| Success/Income | `#22C55E` (grænn) | `142 71% 45%` |
| Warning | `#F59E0B` (amber) | `38 92% 50%` |
| Destructive/Expense | `#EF4444` (rauður) | `0 84% 60%` |
| Texti (primary) | `#1A1A2E` | `240 28% 14%` |
| Texti (secondary) | `#6B7280` | `220 9% 46%` |
| Border | `#E5E7EB` | `220 13% 91%` |

---

## Breytingar

### 1. `index.html`
- Breyta `class="dark"` → `class="light"` (eða fjarlægja dark class)

### 2. `src/index.css`
- **`:root`** verður light mode (Google litir): bakgrunnur `#F8F7F4`, cards `#FFFFFF`, texti `#1A1A2E`
- **`.dark`** fær núverandi dark mode gildin (varðveitt sem valkostur)
- Sidebar variables halda dökkum lit (`#1A1A2E`) í báðum modes
- Glass tokens aðlagaðar: `--glass-bg: rgba(255,255,255,0.7)`, border `rgba(0,0,0,0.06)` í light
- Skuggar: mjúkir drop-shadows í stað glow
- Aurora bakgrunnur: mjúkari, hlýrri tónar í light mode
- Primary breytist úr indigo `#6366f1` í bláan `#4A6CF7`
- Financial income: úr teal í grænan `#22C55E`
- Financial expense: úr rose í rauðan `#EF4444`

### 3. `src/layouts/AppLayout.tsx`
- Header: `bg-[#F8F7F4]/80 backdrop-blur-xl` og dökkari border
- Aurora-bg aðlöguð eða fjarlægð í light mode (mjúk hlý gradient í staðinn)

### 4. `src/components/AppSidebar.tsx`
- Sidebar helst dökkur (`#1A1A2E`) eins og Google-hönnunin
- Active item: `rgba(255,255,255,0.1)` bakgrunnur, hvítur texti
- Hardcoded rgba litir í sidebar haldast (þeir virka þegar sidebar er dark)

### 5. `src/components/ui/card.tsx`
- `glass-card` class aðlagast sjálfkrafa gegnum CSS variables (engin kóðabreyting nauðsynleg ef CSS er rétt)

### 6. `tailwind.config.ts`
- Engar breytingar nauðsynlegar: allt keyrir gegnum CSS variables

---

## Skrár sem breytast

| Skrá | Breyting |
|------|---------|
| `index.html` | `class="dark"` → fjarlægt eða `class="light"` |
| `src/index.css` | Snúa við: light sem `:root`, dark sem `.dark`. Nýir Google-litir. |
| `src/layouts/AppLayout.tsx` | Header litir aðlagaðir að light mode |
| `src/components/AppSidebar.tsx` | Sidebar helst dökkur, lítilsháttar rgba aðlögun |

