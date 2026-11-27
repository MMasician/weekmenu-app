# Mock V3 — Weekoverzicht: inline markering + waarschuwing, override toegestaan (AANBEVOLEN, issue #58)

```
[ Week 42 ]
  ma: [ Diner: Kipfilet .......... ]   ← gebruik dag
  di: [ .......................... ]
  wo: [ .......................... ]  ⚠ gemarkeerd
  do: [ .......................... ]

  Productpicker bij dagkaart wo:
    Kipfilet   ⚠ timetag 3 dagen — al gebruikt op ma
               (plaatsbaar, maar dagkaart wo krijgt rode rand + badge)
```

Gedrag:
- Bij plaatsen binnen het interval: dagkaart krijgt rode rand + badge 'binnen timetag-interval', product in picker toont ⚠-icoon met tooltip
- Plaatsen blijft toegestaan (override), week blijft bewerkbaar
- Dag van gebruik telt als dag 1; bij `days = 3` is do de eerste dag zonder markering
- Voordeel: zichtbaar op de juiste plek, geen blokkade, consistent met waarschuwingsstijl van tagRules (#37)
