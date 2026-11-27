# Mock V2 — Productformulier: sectie 'Timetag' met stepper + presets (AANBEVOLEN, issue #58)

```
[ Product bewerken ]
--------------------------------------
Naam:      [ Kipfilet ]
Categorie: [ Vlees ▼ ]

--- Timetag (optioneel) ----------------
Min. interval tussen twee gebruiken
in een gerecht:
  [ - ]  [ 3 ]  [ + ]  dagen
  Presets: [ 2 ] [ 3 ] [ 7 ] [ 14 ]
  [ ] geen timetag (standaard)
  hint: bij 3 dagen mag dit product
        max. 1x per 3 dagen in een gerecht
--------------------------------------
[ Opslaan ]   [ Annuleren ]
--------------------------------------
```

Gedrag:
- 'geen timetag' aangevinkt of veld leeg → `timetag = null`
- Stepper/presets producing integer 1..365; daarbuiten inline validatiefout
- Sectie is inklapbaar/visueel gegroepeerd, consistent met tagRules-UI (#37)
