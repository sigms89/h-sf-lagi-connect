
Greining (af hverju þetta er enn að bila):
- RLS reglurnar á `associations` virðast nú réttar fyrir INSERT.
- Raun-vandinn er í kóðaflæðinu: `useCreateAssociation()` gerir `insert(...).select().single()`.
- Þegar `select=*` er beðið um strax eftir INSERT, þarf notandinn líka að standast SELECT policy á nýju línunni.
- SELECT policy á `associations` leyfir bara meðlimum (`is_association_member(id)`), en membership er ekki búið til fyrr en í næsta skrefi.
- Niðurstaða: INSERT + RETURNING fellur með `new row violates row-level security policy`.

Áætlun um lagfæringu:
1) Laga `src/hooks/useAssociation.ts` (kjarnafix)
- Búa til `associationId` client-side (`crypto.randomUUID()`).
- INSERT í `associations` án `.select().single()`.
- INSERT strax í `association_members` með sama `associationId`, `user_id = auth user`, `role='admin'`.
- Skila tilbúnu association objecti (með id) fyrir onboarding skref 3.

2) Laga cache/redirect hegðun
- Eftir success: `invalidateQueries` fyrir bæði:
  - `ASSOCIATION_KEYS.all`
  - `ASSOCIATION_KEYS.current()`
- Einnig `setQueryData(ASSOCIATION_KEYS.current(), association)` svo ProtectedRoute sjái association strax og notandi festist ekki aftur á `/onboarding`.

3) Halda RLS óbreyttu
- Engin ný migration þarf fyrir þessa bilun.
- Þetta er kóðaflæðisvandi, ekki policy-vandi núna.

4) Sannprófun (end-to-end)
- Nýskráður notandi → `/onboarding`.
- Fylla út skref 2 → “Stofna húsfélag”.
- Athuga network:
  - `POST /associations` án `select=*` og 201/204.
  - `POST /association_members` og 201.
- Halda áfram í skref 3 og fara á `/` án redirect-loop.
- Endurhlaða síðu og staðfesta að notandi sé enn með aðgang (association finnst).

Tæknileg atriði (stutt):
- Vandinn kom vegna `RETURNING`/`select()` gegn SELECT policy sem krefst membership.
- Rétta röðin er: create association → create membership → then read association.
- Þetta er öruggasta leiðin án þess að víkka út SELECT policy fyrir ótengdar raðir.
