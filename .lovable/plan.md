

## Staða miðað við Knowledge skjal

Ég fór yfir `.lovable/plan.md` og bar saman við kóðann. **5 af 6 vandamálum eru þegar leyst.** Eitt vandamál er eftir:

### Þegar leyst ✅

| # | Vandamál | Staða |
|---|----------|-------|
| 1 | Tvítekningagreining á upphleðslu | ✅ Útfært — fingerprint + viðvörunargluggi + „Sleppa tvíteknum" |
| 2 | ProtectedRoute `.eq('id')` bug | ✅ Lagað — notar `.eq('user_id')` |
| 4 | Badge ref viðvörun í Settings | ✅ Lagað — `<span>` utan um Badge |
| 5 | TimeRange hefur ekki áhrif | ✅ Lagað — `dateFrom` sent frá `useTimeRange` |
| 6 | 1000 línu takmörkun | ✅ Lagað — `.limit(10000)` á `useTransactionStats` og `useAlerts` |
| 7 | Upload batches DELETE RLS | ✅ Policy til staðar |

### Vantar ❌

| # | Vandamál | Lýsing |
|---|----------|--------|
| 3 | Afturkalla síðustu upphleðslu | Engin leið til að eyða upload batch og öllum tengdum færslum |

---

### Áætlun: Útfæra „Afturkalla síðustu upphleðslu"

**1. Nýr hook: `useDeleteUploadBatch`** í `src/hooks/useTransactions.ts`
- Mutation sem:
  - Eyðir öllum transactions með `uploaded_batch_id = batchId`
  - Eyðir upload_batches röðinni sjálfri
  - Invalidatar transaction queries
- Staðfestingargluggi áður en eytt er

**2. UI á Færslur flipa** í `src/components/transactions/TransactionList.tsx`
- Sækja síðustu `upload_batches` röð fyrir húsfélagið (nýjasta)
- Sýna litla „Afturkalla síðustu upphleðslu" hnapp (með Trash2 icon) ef batch er til
- Sýnir batch info: skráarnafn, fjölda færslna, dagsetningu
- Staðfestingargluggi (AlertDialog): „Viltu eyða X færslum úr [skráarnafn]? Þetta er óafturkræft."
- Eftir eyðingu: toast + invalidate queries

**3. Skrár sem breytast:**
- `src/hooks/useTransactions.ts` — bæta við `useLatestBatch` query + `useDeleteBatch` mutation
- `src/components/transactions/TransactionList.tsx` — bæta við undo-hnapp í header

