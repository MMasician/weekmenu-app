# UX-voorstel: afwijking van het weekplan (issue #42)

**Status: in review (issue #42, label `needs-review`).**

## Aanleiding (wens uit issue #42)

Soms kan/wil je niet uitgebreid koken: afhaalmaaltijd, of producten uit de voorraad die snel
klaar zijn (tag `instant-maaltijd`, introduced in #37). Nu is daar geen ondersteuning voor in het
weekmenu. **Afhankelijk van #37 (gesloten/geïmplementeerd): product-tags bestaan al.**

Wens: naast het slotje op de dagregel een icoon (lege batterij) → keuze tussen **afhaalmaaltijd**
en **instant-producten uit de voorraad** (meerdere kiesbaar, bijv. 1 soep + 3 noedels uit voorraad
2 soep / 6 noedels / 5 diepvriespizza). Bij de keuze wordt de **voorraad verlaagd** met het gekozen
aantal en schuiven **alle gerechten van vandaag (of de gekozen dag) en verder 1 datum naar achteren**
(waarschijnlijk eten we dan morgen wat voor vandaag gepland stond).

## Gedeelde regels (ter vastlegging bij goedkeuring)

- **Icoon**: op elke dagregel van de getoonde week, tussen gerechtstatus (✅/❗) en het slot:
  versie A 🪫 / B ⚡ / C 🍽️ (scherm 1). Klik → **afwijkings-sheet** voor die datum.
- **Afhaalmaaltijd**: dag wordt vrije tekst `{ custom: "Afhaalmaaltijd 🍔" }` in `menuByDate`
  (net als bestaande vrije tekst: tag 📍 "geen boodschappen", geen regels op de boodschappenlijst,
  eters-icoon gedimd; `locked`/`eaters` blijven behouden).
- **Instant-maaltijd**: productkiezer toont alleen producten met tag `instant-maaltijd` én
  `have > 0` in de voorraad, elk met een stapper `0..have`. Bevestigen → `have -= gekozen` per
  product (min 0); dag wordt `{ custom: "Instant-maaltijd: 1× soep, 3× noedels" }`.
- **Shift**: alle `menuByDate`-entries met datum ≥ gekozen datum schuiven **1 dag naar achteren**
  (cascade, van de laatste datum aflopend, zodat niets wordt overschreven; over weekgrenzen heen).
  `locked` en `eaters` schuiven mee; `checked`-sleutels (`<datum>-<receptId>-<index>`) schuiven mee.
  Lege dagen blijven leeg (schuiven niet mee als cascade, ze zijn leeg).
- **Geen wijziging bij annuleren** (✕/backdrop). Alles lokaal (ADR-010); per huishouden via
  bestaande `menuByDate`/voorraad (ADR-009). Mock-data generiek (soep/noedels/diepvriespizza);
  geen household-specifieke context (ADR-010). SVG-mocks 390×844 in eigen huisstijl.

## Schermen (3 schermen × 3 versies)

### 1. Weekmenu-dagregel: icoon naast het slot
- `01-dagregel-versie-A-batterij-leeg.svg` — **A**: 🪫 lege batterij (title "Afwijking van het weekplan")
- `02-dagregel-versie-B-bliksem.svg` — **B**: ⚡ bliksem ("weinig energie")
- `03-dagregel-versie-C-gedimde-maaltijd.svg` — **C**: 🍽️ gedimd bordje

### 2. Afwijkings-sheet (bottom sheet na klik op het icoon)
- `04-afwijking-sheet-versie-A-twee-knoppen.svg` — **A**: twee grote knoppen (🍔 Afhaalmaaltijd / ⚡ Instant uit voorraad)
- `05-afwijking-sheet-versie-B-segmented.svg` — **B**: segmented Afhaal | Instant + productkiezer + "Bevestig"
- `06-afwijking-sheet-versie-C-radio-lijst.svg` — **C**: radio-lijst (afhaal of instant-combinatie) + "Bevestig"

### 3. Instant-productkiezer (alleen producten met tag `instant-maaltijd`, have > 0)
- `07-instantkiezer-versie-A-lijst-steppers.svg` — **A**: lijst met stapper per product (0..have)
- `08-instantkiezer-versie-B-chips-aantal.svg` — **B**: chips met aantal (tik = +1, max = have)
- `09-instantkiezer-versie-C-zoekveld-lijst.svg` — **C**: zoekveld + lijst met steppers

## Na goedkeuring (implementatie, zelfde branch/PR)

`docs/SPECS.md` (Weekmenu) bijwerken; tests in `tools/test-weekmenu-ux.cjs` (sheet, shift, instant-keuze,
checked-mee-schuiven) en `tools/test-voorraad-locaties.cjs` (have verlagen); implementatie in `src/App.jsx`
(dagregel-icoon, sheet, `shiftMenuFrom(date)`, productkiezer op tag `instant-maaltijd`), `npm run build`
(`src/app.js` synchroon), `npm run verify` groen, CI groen (ADR-014), cache-bump (`CACHE_VERSION` + `?v=`).
