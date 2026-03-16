

## Greining: "Taka að mér" hover-effect vandamál

### Vandamálið

Hnappurinn notar `variant="ghost"` sem hefur sjálfgefna hover-stíla: `hover:bg-accent hover:text-accent-foreground`. Á sama tíma er textaliturinn stilltur á `text-accent`.

**Þetta þýðir**: Þegar notandi hoverar yfir hnappinn verður bakgrunnurinn `accent` — **sami litur og textinn** — svo textinn hverfur næstum alveg.

Einnig er `h-[44px]` of hár miðað við samhengi kortsins (jafnvel með `-my-2` offset).

### Lagfæring í `src/components/tasks/TaskCard.tsx`

Breyta className á línu 110:

- Fjarlægja `h-[44px]` og `-my-2` — nota `h-auto py-1` í staðinn til að passa betur
- Bæta við `hover:bg-accent/10` (mjög léttur bakgrunnur) og `hover:text-accent` til að halda texta sjáanlegum við hover
- Nota `variant="ghost"` áfram en yfirskrifa hover-litinn

Endanleg className:
```
"h-auto py-1 px-2 text-xs text-accent hover:bg-accent/10 hover:text-accent font-medium"
```

### Skrár

| Skrá | Breyting |
|------|----------|
| `src/components/tasks/TaskCard.tsx` | Laga hover-stíl og stærð á "Taka að mér" hnappinum |

