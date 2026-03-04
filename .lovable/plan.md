

## Vandamálið

`upload_batches` taflan hefur check constraint sem leyfir aðeins `'csv'`, `'xlsx'`, `'paste'` — en kóðinn sendir `'json'` þegar JSON er greint. Þetta veldur 400 villu við vistun.

## Lausn

Tvær breytingar:

### 1. Gagnagrunnur: Bæta `'json'` við leyfileg gildi
Migration til að droppa gamla constraint og bæta við nýjum sem leyfir `'csv'`, `'xlsx'`, `'paste'`, `'json'`.

```sql
ALTER TABLE public.upload_batches DROP CONSTRAINT upload_batches_file_type_check;
ALTER TABLE public.upload_batches ADD CONSTRAINT upload_batches_file_type_check 
  CHECK (file_type = ANY (ARRAY['csv','xlsx','paste','json']));
```

### 2. Kóði: Tryggja að JSON-greint paste noti `'json'` type
Þetta virðist nú þegar rétt í `UploadTransactions.tsx` (lína 240 og 167). Ekkert þarf að breyta í kóðanum — aðeins gagnagrunninn.

