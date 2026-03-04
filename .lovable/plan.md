
Greining (rót vandans)
- Þú ert að ýta á **„Greina færslur“ í „Líma inn bankafærslur“ flipanum**, en textinn er í JSON-sniði.
- Sá flipi keyrir `parseTransactionText(...)` (tab/semicolon parser), ekki JSON parser.
- Þegar parsing skilar 0 færslum + mörgum villum, er notandi haldinn á input-skjá — en villurnar sjást ekki í þessum flipa. Útkoman lítur út eins og „ekkert gerist“.
- Með mjög stórt inntak (t.d. 60k+ línur) getur villulisti orðið mjög stór og gert UI tregt.
- Do I know what the issue is? **Já.**

Innleiðingaráætlun
1) Sameina „analyze“ flæði og greina inntakstegund sjálfkrafa
- Í `src/components/transactions/UploadTransactions.tsx` bæta við sameiginlegri `analyzeInput(text, source)` leið.
- Bæta við „likely JSON“ greiningu fyrir paste texta (t.d. byrjar á `{`/`[` eða inniheldur endurtekið `"date"`/`"amount"` mynstur).
- Ef paste lítur út eins og JSON:
  - keyra JSON parser beint (án þess að notandi þurfi að skipta flipa),
  - sýna skýrt info/warning: „Textinn var greindur sem JSON og lesinn þannig“.

2) Sýna villur/viðvaranir í öllum inntaksflipum (ekki bara JSON)
- Setja sameiginlegt feedback-box undir textarea/dropzone fyrir:
  - parse villur,
  - parse viðvaranir,
  - „x línur sleppt“ samantekt.
- Þannig fær notandi strax skýr skilaboð í paste/csv/json.

3) Gera „Greina færslur“ með skýra viðbragðshegðun
- Bæta við `isAnalyzing` state sem fer í `true` strax við click (áður en parse/enrich klárast).
- Sýna spinner/texta á hnappi og hindra tvísmelli.
- Þetta leysir „hnappurinn virðist dauður“ upplifun.

4) Takmarka villumagn fyrir stór gögn
- Í `src/lib/parseTransactions.ts` bæta við öryggisþaki á villusöfnun (t.d. max 100–300 villur + teljari á slepptar villur).
- Í UI sýna:
  - fyrstu N villur,
  - heildarfjölda slepptra lína.
- Þetta kemur í veg fyrir að risastór villulisti hægi á appinu.

5) Herða JSON fallback fyrir stórt input
- Forðast þunga regex-fallback keyrslu á mjög löngum texta; nota línulega/öruggari extraction leið eða „size guard“ áður en fallback keyrir.
- Markmið: engin löng frysting þegar JSON er brotið og mjög stórt.

6) Prófanir
- Uppfæra `src/test/parseTransactions.test.ts` með tilfellum fyrir:
  - stórt brotið JSON,
  - mörg villuatriði með capped error list,
  - unicode mínus (`−`) og íslenskt talnasnið.
- Bæta við component-level prófi (ef test setup leyfir) eða lágmarks logic-prófi fyrir inntaksgreiningu (JSON vs banka-texti).

Skrár sem verða uppfærðar
- `src/components/transactions/UploadTransactions.tsx` (aðal UX + parsing orchestration + feedback)
- `src/lib/parseTransactions.ts` (error capping + fallback guard/performance)
- `src/test/parseTransactions.test.ts` (ný regression test tilfelli)

Tæknileg atriði
- Engar breytingar á gagnagrunni eða backend.
- Þetta er UI + parser robustness/performance lagfæring.
- Niðurstaða: „Greina færslur“ verður áreiðanlegt, skýrt og svarandi jafnvel með mjög stórt JSON inntak.
