

# Lendingarsíða (Landing Page) — Fagleg útfærsla

Búa til nýja public lendingarsíðu sem sýnir Húsfélagið.is vöruna áður en notandi skráir sig inn. Hönnunin byggir á Google-kóðanum sem var sendur, aðlöguð að Arctic Editorial design system-inu okkar.

---

## Uppbygging

### 1. Ný síða: `src/pages/LandingPage.tsx`

Sjálfstæð síða (ekki wrapt í AppLayout/ProtectedRoute). Inniheldur:

- **Navbar**: Lógó + leiðsögnartenglar (Heim, Lausnir, Verðskrá, Um okkur) + "Innskráning" / "Prófa frítt" hnappar
- **Hero section**: Fyrirsögn ("Einfaldari rekstur húsfélagsins"), undirtexti, tveir CTA hnappar, "Yfir 200 húsfélög" social proof lína, mock dashboard spjald
- **Features section**: 3 eiginleikaspjöld (Sjálfvirk færsluflokkun, Skýr fjárhagsyfirlit, Einföld verkefnastýring) með Lucide íkonum
- **Social proof / trust section**: "Traustið er undirstaðan" með húsfélagsspjöldum
- **CTA section**: "Tilbúin að einfalda lífið?" — tveir hnappar
- **Footer**: Lógó, lýsing, tenglar (Vara, Fyrirtækið, Hafðu samband), samfélagsmiðlaíkon, höfundarréttarlína

Allt responsive: single column á mobile, grid á desktop.

### 2. Routing breyting: `src/App.tsx`

- Bæta við `/landing` route sem public (engin ProtectedRoute)
- Breyta `/` route: ef notandi er EKKI innskráður → redirect á `/landing`, annars Dashboard
- Eða: búa til `/` sem LandingPage og Dashboard verður `/dashboard` — velur einfaldari leið

### 3. Stílhögun (Arctic Editorial)

- Notar sömu CSS variables og kerfið: `--primary`, `--background`, `--muted`, etc.
- Hvít spjöld á `bg-muted` bakgrunni (tonal layering, engar línur)
- Gradient CTA hnappar (`from-primary to-accent`)
- Manrope fyrir fyrirsagnir, Inter fyrir meginmál
- Lucide íkon í stað Material Symbols
- Sidebar-litur (#003345) notaður í navbar og footer bakgrunn

### 4. Engar nýjar dependencies

Allt byggt á Tailwind + Lucide + React Router sem eru þegar í verkefninu.

---

## Skrár

| Skrá | Breyting |
|------|---------|
| `src/pages/LandingPage.tsx` | **Ný** — full landing page |
| `src/App.tsx` | Bæta við `/landing` route, aðlaga `/` logic |

