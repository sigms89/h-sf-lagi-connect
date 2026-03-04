
Vandinn er skýr: í session replay sést að JSON-ið sem er límt inn endar á kommu og vantar lokun (`]`), þannig að parser skilar `Unexpected end of JSON input`. Núverandi „auto-fix“ lagar aðeins kommur fyrir `]`/`}`, en lagar ekki ófullkominn endi.

Áætlun til að laga þetta varanlega:

1) Gera JSON parser þolnari fyrir ófullkomið input  
- Skrá: `src/lib/parseTransactions.ts`  
- Bæta við fjölþrepa parse-röð:
  - Tilraun A: strict `JSON.parse` á hreinsuðu input.
  - Tilraun B: „repair“ fyrir algeng copy/paste vandamál:
    - fjarlægja trailing kommu í enda texta,
    - loka vöntuðum `]`/`}` (með jafnvægisgreiningu utan strengja),
    - reyna parse aftur.
  - Tilraun C (fallback): ef enn mistekst, ná í alla heila `{ ... }` hluti úr texta og parse-a hvern hlut fyrir sig (sleppa ónýtum hala).
- Niðurstaða: ef einhverjar færslur finnast, þá heldur appið áfram og sýnir viðvörun um slepptar línur í stað þess að stoppa allt.

2) Bæta notendaskilaboð svo þetta sé ekki ruglingslegt  
- Skrá: `src/components/transactions/UploadTransactions.tsx`  
- Ef `transactions.length === 0` og parse klikkar:
  - halda notanda í JSON-inntaki (ekki hoppa beint í „Forskoðun — 0 færslur“),
  - sýna skýrt villuskilaboð beint við JSON reitinn:
    - t.d. „JSON virðist ófullkomið (vantar `]` eða `}` í lok).“
- Ef parser nær að bjarga hluta gagna:
  - fara í forskoðun með þeim færslum,
  - sýna „X línum sleppt“ sem viðvörun (ekki fatal villa).

3) Styrkja skráarflæði fyrir `.json`  
- Sama parser-röð notuð bæði fyrir „Líma inn JSON“ og „Hlaða upp skrá“.  
- Tryggja að notandi geti hlaðið upp skránni sinni beint og fengið sömu þolnu hegðun.

4) Bæta við sjálfvirkum prófum til að koma í veg fyrir endurkomu  
- Nýtt test, t.d. `src/test/parseTransactions.test.ts`:
  - valid JSON array,
  - array sem endar á `},` án lokunar (`]`) -> á að recovera,
  - NDJSON/einstakir hlutir -> á að lesast,
  - raunverulega brotið input -> á að skila gagnlegri villu.

5) Staðfesting eftir innleiðingu  
- Prófa nákvæmlega sama JSON dæmi og þú ert að nota núna.  
- Prófa stórt JSON gagnasett (þúsundir lína) með copy/paste og file upload.  
- Staðfesta að „Prófa aðeins“ virki áfram án vistunar.

Tæknileg atriði (stutt):
- Engar breytingar á gagnagrunni eða backend þarf.
- Þetta er alfarið parser + UI villumeðhöndlun.
- Markmið: „graceful degradation“ — bjarga því sem hægt er, sýna skýra ástæðu fyrir því sem var sleppt.
