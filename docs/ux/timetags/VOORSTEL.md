# VOORSTEL — Timetags per product (issue #58)

Status: owner-akkoord op mocks ontvangen (productformulier versie A, weekoverzicht versie B).

## Aanbeveling

- **Productformulier: versie A** (`01-product-form-versie-A.svg`) — Goedgekeurd door owner.
  - Sectie 'Timetag (optioneel)' met **info-icoon** erachter; bij tap verschijnt de uitleg (interval in dagen, 0 = geen tag, max 365).
  - **Numeriek invulveld** dat enkel cijfers accepteert (0–365), met het label **'dagen'** achter de waarde.
  - Standaardwaarde **0** = geen timetag. Geen helpertekst/labels onder het invulveld (deze worden niet getoond).
  - Versie B (stepper) en versie C (vrije tekstinvoer) blijven als alternatieven; C laat foutieve data toe en valt af.

- **Weekoverzicht: versie B** (`02-weekoverzicht-versie-B.svg`) — Goedgekeurd door owner ('goed genoeg, daarmee is het gehele voorstel akkoord').
  - **Inline ⏱-markering** op de dagkaart met het aantal resterende dagen (visueel, niet-blokkerend).
  - Alternatieven blijven kiesbaar (bijv. Kip tikka masala op woensdag); er is **nooit een blokkerende dag** — je moet altijd kunnen eten/kiezen.
  - Versie A (geblokkeerde dag met slot) valt af om die reden. Versie C (banner bovenaan het overzicht) als alternatief.

## Datamodel

- Per product optioneel: `timetag: { days: 1..365 } | null` (maximaal 1 timetag per product).
- Opslag **per huishouden**, zelfde mechanisme als `tagRules` (#37, ADR-009/ADR-010); bij wisselen van huishouden gelden de eigen timetags.
- **Backwards compatible**: ontbrekend/corrupt `timetag`-veld = geen restrictie (0/null), geen migratie, geen dataverlies.
- Ongeldige invoer (niet-numeriek, leeg, negatief, >365) wordt afgewezen of geclamped naar 0..365 met foutmelding; oude opgeslagen waarde blijft behouden.

## Implementatie (volgende fase, NIET in deze docs-only PR)

- Productmodel + per-huishouden-opslag naast tagRules; productformulier met numeriek veld (versie A); weekmenu-generatie met interval-check (zacht/alternatief bij conflict, nooit blokkerend); weekoverzicht met inline ⏱-markering (versie B).
- Tests in tools/test-*.cjs, npm run build/verify, SPECS/ADR-update, CACHE_VERSION bump.
- Volgorde: implementeer NA #59 (#59 → #58 → #60 → #48, geserialiseerd i.v.m. single-file src/App.jsx).
