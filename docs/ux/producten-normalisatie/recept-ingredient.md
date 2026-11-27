# Mock — Receptdetail: ingrediëntregel

Voorbeeld: recept "Pasta rossa", ingrediënt "Tomaten" (product default: blikje)

## v1 — Losse velden

```
+ Ingrediëntregel ------------------------------------------+
| [Tomaten ▾]   [2] [dl ▾]     Tag: [____________] [＋]    |
+----------------------------------------------------------+
```
Nadeel: tag-veld is vrij tekst en niet visueel gekoppeld aan "dit recept".

## v2 — Stepper met auto-conversie

```
+ Ingrediëntregel ------------------------------------------+
| [Tomaten ▾]   [➖] [2] [➕] [dl ▾ -> cl: 20]            |
+----------------------------------------------------------+
```
Nadeel: stepper suggereert alleen +1/-1; conversie verborgen; geen tags.

## v3 — ✅ AANBEVOLEN — Eenheid-dropdown met auto-conversie + tag-chips

```
+ Ingrediëntregel ------------------------------------------------+
| [Tomaten ▾]  [ 2 ] [ dl ▾ ]                                     |
|   └ bij wisselen dl -> cl: hoeveelheid wordt 20 (1 dl = 10 cl)  |
|      en andersom; handmatig te overschrijven in het getalveld   |
|                                                                 |
|   Tags voor dit recept만:  [rood ✕] [optioneel ✕] [+ tag...]   |
|   (tooltip: "Deze tags gelden alleen in dit recept,             |
|      niet voor het product in het algemeen")                    |
+-----------------------------------------------------------------+
```
- Conversietabel: dl↔cl (×10), l↔ml (×1000), kg↔g (×1000), stuks↔stuks.
  Onbekende eenheden ("blikje", "zakje"): geen auto-conversie, melding
  "handmatig invullen".
- Tags worden opgeslagen als `product.recipeTags[thisRecipeId]` en tonen
  in weekmenu/boodschappenlijst bij dit ingrediënt in dit recept.
- Lege state: geen tags -> alleen "+ tag..." chip.
