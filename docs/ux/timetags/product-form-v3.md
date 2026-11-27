# Mock V3 — Productformulier: tag-kiezer met presets (issue #58)

```
[ Product bewerken ]
--------------------------------------
Naam:      [ Kipfilet ]
Categorie: [ Vlees ▼ ]
Timetag:   ( ) geen   ( ) 2 dagen   ( ) 3 dagen
           ( ) 7 dagen   (•) anders: [ 5 ] dagen
--------------------------------------
[ Opslaan ]   [ Annuleren ]
--------------------------------------
```

Gedrag:
- 'geen' → `timetag = null`
- 'anders' vereist integer 1..365 in het vrije veld, anders inline fout
- Nadeel: radio-groep is foutgevoeliger bij 'geen'; minder consistent met stepper-UI elders
