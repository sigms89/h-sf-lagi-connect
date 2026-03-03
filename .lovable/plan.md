

# Húsfélagið – Grunnuppsetning

## Hvað verður byggt
Einfalt, hreint grunnútlit með innskráningu og grunn-dashboard sem er tilbúið til að byggja ofan á – bæði hér í Lovable og með öðrum AI tólum í gegnum GitHub.

## 1. Lovable Cloud uppsetning
- Virkja Lovable Cloud (Supabase) með notendaauðkenningu (email/lykilorð)
- Búa til `profiles` töflu fyrir notendaupplýsingar (nafn, húsfélag)

## 2. Innskráningarsíða
- Einföld og hrein login/signup síða
- Email + lykilorð innskráning
- Redirect á dashboard eftir innskráningu

## 3. Grunn-layout með sidebar
- Sidebar navigation (tilbúið til að bæta við hlekki síðar)
- Header með notendanafni og útskráningarhnappi
- Aðalsvæði (content area) sem sýnir „Velkomin/n í Húsfélagið" á dashboard

## 4. Skipulag kóðans
- Skýr möppuskipan (`pages/`, `components/`, `layouts/`) sem auðveldar öðrum AI tólum og forriturum að vinna í verkefninu
- Auth context/hook til að stjórna innskráningu
- Protected routes – aðeins innskráðir notendur komast á dashboard

Þetta gefur ykkur sterkan grunn sem er auðvelt að tengja við GitHub og halda áfram að byggja ofan á – hvort sem er hér eða með öðrum tólum.

