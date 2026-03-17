

# Hero Card: Skipta út border-l-4 fyrir óhefðbundna hönnun

## Vandamálið
`border-l-4` mynstrið er orðið klisja í "vibe coded" verkefnum. Allir nota það. Við viljum eitthvað sem er í anda Mercury/Linear en ferskt.

## Tillaga: Radial gradient glow + status dot

Í stað þess að nota border-left, notum við:

1. **Faint radial gradient** sem bakgrunn á spjaldinu -- mjúkt ljóma-svæði sem litar efra-vinstra horn kortsins í mjúkum lit (emerald/amber/rose) sem blandast inn í hvítan bakgrunn. Þetta gefur "aura" tilfinningu sem er lúmsk en skýr.

2. **Lítill litaður punktur** (6px dot) við hliðina á fyrirsögninni í stað border. Þetta er meira í anda Linear.app og gefur status-merki án þess að nota heilt border.

3. **Fjarlægja `border-l-4`** alveg.

### Tæknilegt:
- `Card` fær `relative overflow-hidden` og `::before` pseudo-element (eða nested div) með `radial-gradient` sem er `absolute` í efra-vinstra horni
- Gradient opacity er 0.15-0.25 svo það er nánast subliminal
- Punkturinn (dot) verður `w-1.5 h-1.5 rounded-full` við hlið headline textans
- Litakerfi helst: emerald (góð), amber (meðal), rose (slæm)

```text
┌──────────────────────────────────────────┐
│ ░░░░                                     │
│ ░░  ● Nokkur atriði þarfnast athygli    │  ÁSTANDSYFIRLIT
│ ░                                        │  ● Sjóðsstaða...
│    Sjóðsstaða er 221.571 kr...           │  ● Viðhaldskostnaður...
│                                          │  ● Tekjur og gjöld...
└──────────────────────────────────────────┘
  ░ = faint amber radial glow
  ● = small colored dot
```

### Skrár sem breytast:
- `src/pages/Dashboard.tsx` -- fjarlægja `border-l-4 ${heroBorderColor}`, bæta við gradient overlay div og dot við headline

