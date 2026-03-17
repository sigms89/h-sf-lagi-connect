

## Fjarlægja em-dash (—) úr verkefninu

### Umfang

950 tilfelli í 95 skrám. Þrjár tegundir:

**1. Skráarhausar (90%+ tilfella)**
```
// Húsfélagið.is — ComponentName
```
Breyta í tvípunkt:
```
// Húsfélagið.is: ComponentName
```

**2. UI-textar og toast-skilaboð (~10 tilfelli)**
- `'Skráning móttekin — bíður samþykktar'` → `'Skráning móttekin, bíður samþykktar'`
- `Skilaboð — ${label}` → `Skilaboð: ${label}`
- `'aðeins fyrsta blaðið ... er lesið.'` → komma eða endurskrifa

**3. Fallback-gildi fyrir tóm gögn (~5 tilfelli)**
- `'—'` sem placeholder fyrir null dagsetningar/nöfn → breyta í `'-'` (stubbt strik) eða `'–'` (en-dash, minna áberandi)

### Aðferð

- Bulk skipta á `— ` (em-dash með bili) í skráarhausum yfir í `: `
- Fara handvirkt yfir UI-strengi og velja viðeigandi íslenskt orðalag (kommu, tvípunkt, eða endurorða)
- Skipta `'—'` fallback yfir í `'-'`

### Áhrif

Engin virknibreyting. Aðeins textalegar breytingar á athugasemdum og UI-strengjum.

