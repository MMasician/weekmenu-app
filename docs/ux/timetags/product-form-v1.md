# Mock V1 — Productformulier: los numeriek veld (issue #58)

```
[ Product bewerken ]
--------------------------------------
Naam:        [ Kipfilet              ]
Categorie:   [ Vlees ▼               ]
Timetag:     [ 3 ] dagen
  hint: leeg = geen timetag (min. interval
         tussen twee gebruiken in een gerecht)
[ Opslaan ]   [ Annuleren ]
--------------------------------------
```

Gedrag:
- Leeg veld → `timetag = null` (geen restrictie)
- Invoer moet integer 1..365 zijn; anders inline validatiefout bij het veld, geen opslag
- Nadeel: veld is makkelijk te missen; geen presets
