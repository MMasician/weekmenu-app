# ADR-012: Weekmenu-tab versimpelen + afwijkend aantal eters per dag

## Status
Geaccepteerd

## Context
De weekmenu-tab toonde de hele maandkalender, de kaart "Verdeling voor de week"
en per dag een dropdown met alle gerechten. Het huishouden wil: alleen de datum
van vandaag zien (andere data pas na een knop), de generatieregels pas na een
knop onderaan het scherm, en gerechten typen in plaats van een pulldown —
inclusief vrije tekst voor dagen dat er ergens anders gegeten wordt (bijv.
"Eten bij oma in Breda"; dan geen boodschappen). Daarnaast eten af en toe
bezoekers mee (of juist minder mensen), wat de hoeveelheid boodschappen voor
die dag beïnvloedt. UX-voorstel met mocks per scherm: zie
`docs/ux/weekmenu-tab-versimpeling/` (PR #7); goedgekeurd: 1A, 2A, 3A, 4B en
voor eters de badge-variant met inline stapper plus boodschappen-weergave 12.

## Besluit
- **Weekmenu-tab**: bovenaan alleen "VANDAAG" + datum van vandaag + weekregel +
  knop **📅 Kies een datum ▾** (bottom sheet: weekstrip, ◀/▶ week, "Naar deze
  week" bij offset ≠ 0, maandrooster; klik op dag → week van die dag) en de
  knop **Genereer weekmenu**. Onderaan de knop **⚙️ Regels voor het weekmenu**
  → bottom sheet met weekstart, visdagen en vega-doel (direct in `settings`),
  plus link naar Instellingen en "Klaar".
- **Gerecht typen**: per dag een tekstveld. Na ≥ 2 letters een suggestielijst
  (categorie ≠ "extra", max 6, match gemarkeerd, Enter/klik selecteert).
  Enter/blur zonder suggestie: exacte match → recept, anders vrije tekst als
  `{ custom }` in `menuByDate` — tag "📍 geen boodschappen", niet op de
  boodschappenlijst, eters-icoon uit. Leeg veld wist de dag.
- **Eters per dag**: 👥-icoon naast het slot, badge met het absolute aantal
  alleen bij afwijking van `householdSize`; klik klapt de regel inline open met
  stapper + "Standaard herstellen". Wordt bewaard als `eaters` in de
  menuByDate-entry (alleen bij afwijking).
- **Schaling boodschappenlijst**: factor = `eaters / householdSize`; alleen
  regels met leidend getal + eenheid schalen mee (Math.round, min 1;
  blik/pak/pakje/zak/doos/fles uitgezonderd), weergave "oud → nieuw" met
  footnote; prijzen/totalen blijven op het originele label.

## Gevolgen
+ De tab is rustig: datum- en regelopties verschijnen pas na een expliciete knop.
+ Vrije tekst staat in het menu zonder boodschappenlijst.
+ Boodschappen per dag schalen mee met het werkelijke aantal eters.
- `menuByDate`-entry shape: `{ id, locked, eaters? }` of `{ custom, locked? }`.
  Oude entries (`{ id, locked }`) blijven geldig; geen migratie nodig.
- Nieuwe UI-componenten (sheets, suggestielijst, chips, stapper, badge) als
  statische klassen in `styles.css`.
- Tests: `tools/test-weekmenu-ux.cjs` dekt sheet, regels-sheet, autocomplete,
  vrije tekst, eters-override en schaling; `tools/test-kalender.cjs` is
  aangepast aan de datum-sheet.
