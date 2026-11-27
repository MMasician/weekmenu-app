# Mock V1 — Weekoverzicht: banner bij conflict (issue #58)

```
[ Week 42 ]   ma  di  wo  do  vr  za  zo
------------------------------------------------------------
| ⚠ Kipfilet is al gebruikt op ma; timetag = 3 dagen.     |
|   Vandaag (wo) valt binnen het interval → niet toegestaan.|
------------------------------------------------------------
[ ma ] [ di ] [ wo ] [ do ] [ vr ] [ za ] [ zo ]
  ...dagkaarten met gerechten...
```

Gedrag:
- Bij het plaatsen van een product met timetag binnen het interval Verschijnt een banner bovenaan het weekoverzicht
- Nadeel: banner is globaal, niet gekoppeld aan de specifieke dag; makelijk te missen bij scrollen
