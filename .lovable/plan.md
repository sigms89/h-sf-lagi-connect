
Orsökin er ekki gagnagrunnurinn sjálfur heldur frammistöðuflæði í upload-skjánum:

1) JSON + flokkun keyrir samstillt á UI þræði.
2) Eftir parse er renderuð heil tafla með öllum færslum (`enriched.map(...)`) og `Select` í hverri línu.
3) Fyrir mjög stór gagnasett (þúsundir/tugþúsundir lína) verður DOM risastórt og UI frýs/crashar.
4) Session replay sýnir þetta skýrt (mjög stórar DOM breytingar og gríðarhá scroll-hæð), sem passar við „alveg löturhægt“.

Lausnaráætlun (almennileg og varanleg):

1. Endurhanna preview fyrir stór gagnasett
- Breyta `src/components/transactions/UploadTransactions.tsx`.
- Hætta að rendera allar línur í einu.
- Bæta við client-side paging fyrir preview (t.d. 100 línur/síðu).
- Sýna aðeins virka síðu í töflu.
- Birta samt heildarsummu (fjöldi, innkoma, útgjöld, óflokkað) fyrir allt dataset.

2. „Large dataset mode“ með varnargildum
- Skilgreina mörk (t.d. `LARGE_DATASET_THRESHOLD = 1000`).
- Ef yfir mörkum:
  - Einfalda línu-UI (engin þung `Select` á öllum línum í einu).
  - Nota léttari birtingu eða „breyta flokki“ aðeins fyrir valda línu.
  - Sýna skýra tilkynningu: „stórt gagnasett – forskoðun er pagineruð til að halda appi hröðu“.

3. Chunked processing (til að forðast freeze í parse/auðgun)
- Gera parse+enrich skrefið ósamstillt í lotum (t.d. 300–500 færslur í lotu).
- Yield milli lota (microtask/timeout) svo UI helst svarandi.
- Sýna framvindu (`Progress`) meðan unnið er.

4. Prófunarhamur án vistunar í gagnagrunn
- Bæta við toggle/ham í `UploadTransactions`:
  - „Prófa aðeins (ekki vista)“ (sjálfgefið í onboarding).
  - „Vista í gagnagrunn“ (valfrjálst).
- Í prófunarham:
  - Engin `uploadMutation.mutateAsync`.
  - Engar POST beiðnir á transactions.
  - Nota eingöngu local state fyrir parse/preview/greiningu.

5. Minni og endurútreikningar
- Reikna stats í einni umferð með `useMemo` (ekki margar `filter/reduce` yfir allt array á hverju renderi).
- Hreinsa stór raw text state eftir parse þegar ekki þarf lengur (sérstaklega fyrir risastór JSON).
- Halda villulista capped (nú þegar sýndar 5 línur; halda þeirri hegðun).

6. Tenging við síður
- `src/pages/Onboarding.tsx`: virkja prófunarham sjálfgefið í skrefi 3.
- `src/pages/Upload.tsx`: hafa toggle svo notandi geti valið test vs save.

7. Staðfesting (E2E)
- Prófa með stórri JSON skrá (nokkur þúsund+ færslur):
  - Parse klárast án crash.
  - UI helst svarandi meðan unnið er.
  - Preview sýnir pagineraðar línur, ekki allt í einu.
- Prófa „Prófa aðeins“:
  - Engar gagnagrunns-POST beiðnir.
- Prófa „Vista í gagnagrunn“:
  - Uppsending virkar áfram rétt.
- Endurprófa onboarding-skref 3 með stóru gagni til að staðfesta að flæðið festist ekki.

Tæknileg atriði (stutt):
- Engar breytingar á gagnagrunnsskýma eða RLS þarf fyrir þessa lagfæringu.
- Kjarni lagfæringar er UI/compute performance + non-persistent test mode.
- Þetta leysir bæði „crash“ og „löturhægt“ með stórum færslusöfnum.
