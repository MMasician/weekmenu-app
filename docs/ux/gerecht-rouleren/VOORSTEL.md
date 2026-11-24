# UX-voorstel: gerechtregel op basis van datum — rouleren instelbaar (issue #38)

**Status: goedgekeurd in issue #38 — geïmplementeerd in deze PR.**

Goedkeuring (reactie in issue #38): "Versie 3", met de volgorde **altijd, 3 dagen, 7 dagen, 14 dagen, 30 dagen**, default **7 dagen**, en de beschrijvende tekst onder de opties weg. De opgegeven aanpassingen ("volgorde van de opties" + "beschrijvende tekst onder de opties") passen bij de **segmented-chips variant (mock `02-regelsheet-versie-B-segmented-chips.svg`)** — die is geïmplementeerd met de aangepaste volgorde, default 7 en zonder hinttekst (zie ook de notitie in issue #38).

## Aanleiding (wens uit issue #38)

Nu staat er enkel een filter dat een gerecht niet meer dan 1× in de huidige week staat. Vanuit de regelknop
(⚙️) onderaan de weekmenu-tab wil ik het aantal dagen kunnen instellen dat gewacht moet worden voordat een
gerecht weer automatisch gepland mag worden.

## Gedeelde regels (ter vastlegging bij goedkeuring)

- **Instelling**: `settings.dishRepeatDays` (number, 0..30, standaard **7** = huidig gedrag "niet vaker dan 1× per week"), per huishouden (ADR-009).
- **Generatie ("Genereer weekmenu")**: een gerecht dat al in `menuByDate` staat (gelockt of niet) op een datum binnen de afgelopen N dagen wordt niet opnieuw gekozen; ook niet dubbel binnen de gegenereerde week als N < 7. Vergrendelde dagen blijven staan en tellen mee. Handmatig plannen (tekstveld/dagkiezer) wordt niet geblokkeerd.
- In de regels-sheet staat deze sectie náást de tag-regels van #38/#37 (zelfde sheet) — mocks in deze batch op elkaar afgestemd.
- Mock-data generiek; geen household-specifieke context (ADR-010). SVG-mocks 390×844 in eigen huisstijl.

## Schermen (1 scherm × 3 versies)

### 1. Regels-sheet (⚙️ onderaan weekmenu-tab): "Hetzelfde gerecht opnieuw plannen"
- `01-regelsheet-versie-A-stapper-sectie.svg` — **A**: eigen sectie met stapper "− 7 + dagen wachten" + hint (0 = direct, 7 = 1×/week).
- `02-regelsheet-versie-B-segmented-chips.svg` — **B**: segmented chips: 3 / 7 / 14 / 30 dagen / "altijd" (0).
- `03-regelsheet-versie-C-compact-inline.svg` — **C**: compacte inline stapper-regel zonder sectiekader.

## Na goedkeuring (implementatie, zelfde PR)

`docs/SPECS.md` (Weekmenu + Instellingen) bijwerken, settings-normalizer (default 7, clamp 0..30), tests in `tools/test-weekmenu-ux.cjs` (generatie respecteert N dagen incl. over weekgrens, gelockte dagen tellen mee, N=0, handmatig mag altijd), implementatie in `src/App.jsx` (regels-sheet + `generateMenu`), `npm run build` (`src/app.js` synchroon), `npm run verify` groen, CI groen (ADR-014), cache-bump (`CACHE_VERSION` + `?v=`).
