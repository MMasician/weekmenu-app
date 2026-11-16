# Tests

## Werkwijze (ADR-011)
- Elke in SPECS.md beschreven functionaliteit moet een automatische test hebben in een bestand `tools/test-*.cjs`.
- Draai alles met `npm test` (runner `tools/run-tests.cjs`); elke test draait in een eigen proces tegen de gecompileerde `src/app.js` via `tools/render-harness.cjs`.
- Build van bron naar app: `npm run build`. Alles in één keer: `npm run verify`.
- CI: zie de workflow in ADR-011 (te plaatsen als `.github/workflows/test.yml`; vereist een token met `workflow`-scope). De CI draait: build + controle dat `src/app.js` synchroon is met `src/App.jsx` + `npm test`.
- Agents mogen NOOIT ad-hoc scripts aanmaken om te builden of te testen. Breid een bestaand `tools/test-*.cjs` uit of voeg een bestand toe, met relatieve paden (`path.join(__dirname, "..")`). Legacy absolute paden (`/home/user/weekmenu-app/...`) worden door `tools/legacy-path-shim.cjs` automatisch naar de repo-root gemapt.

## Te testen functionaliteit (per SPECS-sectie)

### Weekmenu
- Week regenereren: vis-dagen tonen visgerechten; overige dagen alleen vega/vlees volgens de ingestelde mix (som = aantal overige dagen).
- Instellingen wijzigen (weekstart, vis-dagen, vega-aantal, shop-runs, aantal eters) → weekmenu en boodschappenlijst volgen de nieuwe instellingen (ADR-009).
- Vergrendelde dag blijft staan bij regenereren; override per dag kiesbaar uit alle recepten behalve "extra"; een recept komt niet dubbel in één week waar mogelijk.

### Boodschappen
- Ingrediënten vallen onder de juiste run (volgens `shopRuns`), gegroepeerd per dag en per gerecht.
- Extra artikel toevoegen/afvinken → teller in de tab daalt; "Vinkjes wissen" reset alle checkboxen, artikelen blijven.
- Voorraadtekorten verschijnen onder "Standaardvoorraad aanvullen" met "(n van want)".

### Voorraad
- have < want → tekort; kruidenla-toggle → binair item; "Alles aangevuld" zet have = want; "Standaardlijst terug" = STOCK_DEFAULT.
- Herladen: alle state (menu, vinkjes, voorraad, settings) bewaard via localStorage-sleutel `weekmenu-app-v1`.

### Recepten / data
- Pool start met `BASE_RECIPES`; recept bewerken en verwijderen (verdwijnt ook uit een lopend menu); import/export als JSON; reset naar startpool.
- Oudere state zonder `recipes` / `settings` / `prices` wordt genormaliseerd/geseed bij laden.

### Prijzen
- Zonder prijzen: geen totalen en geen "goedkoopste"-badge, wel de lijst.
- Prijs invullen per winkel → artikelregel toont de beste prijs; run-kop toont per winkel totaal + dekking "(x/n)".
- Volledige dekking van een run → badge "goedkoopste: <winkel>"; deels gevuld → geen badge.
- Hoofdletterongevoelig matchen ("melk" = "Melk"); spaties rond een label worden genegeerd.
- Prijs verwijderen (✕) → rij en totalen verdwijnen.
