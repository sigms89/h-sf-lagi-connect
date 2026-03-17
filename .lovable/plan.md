

## Forðast fallbeygingarvandamál í íslensku

### Vandamálið

Þegar nöfn eru sett inn í setningar þarf íslenskan beygð form (t.d. "til **Jóns**", "úthlutað **Önnu**"). Kerfið notar nú nefnifall ("Jón", "Anna") í öllum tilvikum, sem er rangt málfræðilega.

### Lausn: Endurskrifa setningar svo fallbeyging þurfi ekki

Í stað þess að reyna flókna fallbeygingarvél (sem myndi aldrei ná yfir öll nöfn rétt), breytum við setningabyggingunni svo nafnið standi alltaf í nefnifalli eða sé aðskilið frá setningunni.

### Breytingar

**1. `src/hooks/useTask.ts`**

| Núverandi | Nýtt |
|-----------|------|
| `${currentName} úthlutar verkefni til ${targetName}` | `${currentName} úthlutaði verkefnið. Nýr ábyrgðaraðili: ${targetName}` |
| `Verkefni úthlutað ${result?.targetName}` | `Verkefni úthlutað. Ábyrgðaraðili: ${result?.targetName}` |

**2. `src/hooks/useAutoTasks.ts`**

| Núverandi | Nýtt |
|-----------|------|
| `Senda áminningu til ${name} vegna húsgjalds ${month}` | `Áminning: ${name}, húsgjald ${month}` |

**3. `src/pages/MinVerkefni.tsx`**

| Núverandi | Nýtt |
|-----------|------|
| `Engin verkefni eru úthlutað til þín núna.` | `Engin verkefni á þínum borði núna.` |

### Áhrif

Engin virknibreyting. Texti verður málfræðilega réttur óháð nafni notandans. Einfalt og viðhaldsvænt.

