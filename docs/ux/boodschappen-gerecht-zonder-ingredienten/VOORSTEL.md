# UX-voorstel: gerecht zonder ingrediënten → 1 regel op de boodschappenlijst (issue #43)

**Status: ronde 1 — mocks ter review (label `needs-review` op issue #43).** Nog geen app-code in deze PR.

## Aanleiding (wens uit issue #43)

Als ik boodschappen doe, wil ik dat voor alle gerechten binnen de aangegeven dagen. Als een gerecht
gepland is waarvan geen ingrediënten bekend zijn, zie ik daar nu niets van terug in de boodschappenlijst.
Er moet 1 regel "ingrediënten voor x" komen, waarbij x de naam van het gerecht is.

## Gedeelde regels (ter vastlegging bij goedkeuring)

- Een gelockt gerecht in scope (vandaag + ingestelde aantal dagen) met lege `ingredients` → **1 regel "Ingrediënten voor <gerechtnaam>"** in categorie overig (onderaan). Vrije-tekst dagen (`custom`) genereren geen regel. Meerdere vanzulke gerechten → 1 regel per gerecht.
- De regel is afvinkbaar (1 vinkje) en wordt nooit samengevoegd met product-rijen (#33); bij #34 is de regel gewoon afvinkbaar/verbergbaar.
- Weekmenu-dagregel: status van zo'n dag — ✅ bij afgevinkte regel (A), ❗ zolang niet afgevinkt (B), of 🛒 "zelf regelen" (C). Te kiezen via scherm 2.
- Mock-data generiek (Boboti/Hutspot/Pasta pesto, fictieve week za 22-11 t/m vr 28-11); geen household-specifieke context (ADR-010). SVG-mocks 390×844 in eigen huisstijl.

## Schermen (2 schermen × 3 versies)

### 1. Boodschappen-tab: regel voor gerecht zonder ingrediënten (ma 24-11 · Pasta pesto)
- `01-lijst-versie-A-regel-met-vinkje.svg` — **versie A**: afvinkbare regel "Ingrediënten voor Pasta pesto" met datumchip, onderaan (overig).
- `02-lijst-versie-B-klikbare-gerechtnaam.svg` — **versie B**: 🛒-icoon + gerechtnaam klikbaar (opent het gerecht in het weekmenu).
- `03-lijst-versie-C-info-zonder-vinkje.svg` — **versie C**: grijze info-regel zonder vinkje ("— zelf regelen").

### 2. Weekmenu-tab: dagregel van het gerecht zonder ingrediënten (ma 24-11)
- `04-weekmenu-versie-A-status-groen.svg` — **versie A**: dag toont ✅ zodra de regel op de boodschappenlijst is afgevinkt.
- `05-weekmenu-versie-B-status-warn.svg` — **versie B**: dag toont ❗ zolang de regel niet is afgevinkt.
- `06-weekmenu-versie-C-geen-status.svg` — **versie C**: dag toont 🛒 "zelf regelen"; geen ✅/❗.

## Na goedkeuring (implementatie, zelfde PR)

`docs/SPECS.md` (secties Boodschappen + Weekmenu) bijwerken, tests in `tools/test-boodschappen-lijst.cjs`
(regel in scope, 1 per gerecht, nooit mergen, afvinken) en `tools/test-weekmenu-ux.cjs` (dagstatus),
implementatie in `src/App.jsx` (`listRows` + `mealStatus`), `npm run build` (`src/app.js` synchroon),
`npm run verify` groen, CI groen (ADR-014), cache-bump (`CACHE_VERSION` in `sw.js` + `?v=` in `index.html`).
