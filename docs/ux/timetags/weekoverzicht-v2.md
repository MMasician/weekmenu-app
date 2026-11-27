# Mock V2 — Weekoverzicht: plaatsing geblokkeerd met modale uitleg (issue #58)

```
[ Week 42 ]  ...dagkaarten...

  Bij drag/drop van Kipfilet op wo:
  +--------------------------------------------------+
  |  Plaatsing geblokkeerd                           |
  |  Kipfilet heeft timetag = 3 dagen en is al       |
  |  gebruikt op ma. Volgende fabricants: do.       |
  |                        [ Sluiten ]  [ Naar do ] |
  +--------------------------------------------------+
```

Gedrag:
- Product kan niet op een dag binnen het interval worden geplaatst; modal toont eerstvolgende Toegestane dag
- Nadeel: blokkeert de week; frictie bij handmatig plannen; geen override
