# Specificaties

Zie INTENT.md voor doel en principes; ADR-009 t/m ADR-011 voor configuratie, privacy en build/test.

## Tabs
1. Weekmenu
2. Recepten
3. Voorraad
4. Boodschappen
5. Prijzen
6. Instellingen (per huishouden, ADR-009)

## Instellingen per huishouden (ADR-009)
- Opgeslagen in localStorage-sleutel `weekmenu-app-v1`, veld `settings`. Bij ontbreken of onvolledigheid worden `DEFAULT_SETTINGS` aangevuld bij het laden (normaliseren, zoals `normalizeStock`).
- Schema:
  - `householdSize`: getal > 0 — aantal eters waarop recepten/hoeveelheden zijn afgestemd (standaard 4)
  - `weekStartDay`: 0-6, index in `DAYS` (standaard 0 = zaterdag)
  - `shopRuns`: [{ label, days: [0-6] }] (standaard: twee runs die de week in tweeën delen)
  - `fishDays`: array van dag-indices (standaard [0, 4])
  - `vegaTarget`: getal >= 0 — aantal vegetarische dagen op de niet-vis-dagen (standaard 2); vlees = overige niet-vis-dagen minus vegaTarget (afgetopt op >= 0)
  - `markets`: [{ key, label }] (standaard ah / jumbo / lidl)
- Dag-indices zijn relatief t.o.v. `weekStartDay` (index 0 = weekstart).
- Instellingen zijn lokaal: ze worden nooit naar een server of GitHub geschreven en zijn voor andere households niet zichtbaar (ADR-010).

## Weekmenu
- `DAYS` = 7 dagen vanaf `weekStartDay`.
- Per dag een categorie: `fishDays` → vis; overige dagen vega/vlees volgens `vegaTarget`, verdeeld over de overige dagen.
- Per dag een recept uit de categorie (niet herhaald binnen de week waar mogelijk), knop **vergrendelen**, dropdown **override** met alle recepten behalve categorie "extra".
- "Verdeling voor de week" toont de ingestelde mix en vis-dagen.
- Week regenereren: vergrendelde dagen blijven staan.

## Recepten
- Startpool `BASE_RECIPES` in `src/App.jsx` (ids `r1`..`rN`); de actuele pool is app-state in localStorage `weekmenu-app-v1`, veld `recipes` (ADR-006); `BASE_RECIPES` is seed- en reset-waarde.
- Recept: id, naam, categorie (`vega`/`vis`/`vlees`/`extra`), ingredienten[], bereiding, tijd (min), kok.
- Bewerken per recept (incl. verwijderen; een verwijderd recept verdwijnt ook uit een lopend weekmenu), nieuw recept toevoegen, exporteren/importeren als JSON, "Standaardlijst terug".
- Oudere opslag zonder `recipes` wordt geseed uit `BASE_RECIPES`.

## Voorraad
- `STOCK_CATS` = kast, koel, fruit, kruiden. Per item have/want (getallen); kruidenla binair (toggle aanwezig ja/nee).
- Tekort = have < want → automatisch op de boodschappenlijst met "(n van want)"; kruidenla "aan" = tekort.
- Knoppen: "Alles aangevuld" (have = want) en "Standaardlijst terug" (reset naar `STOCK_DEFAULT`).
- `normalizeStock` bij laden.

## Boodschappen
- `shopRuns` splitst de week: ingrediënten van een gerecht vallen in de run van de dag waarop het gerecht staat.
- Per run: ingrediënten gegroepeerd per dag en per gerecht met afvinkboxen; extra vrije artikelen per run; sectie "Standaardvoorraad aanvullen" uit tekorten.
- "Vinkjes wissen" reset alle checkboxen; de tab toont een teller (afgevinkt/totaal).
- Prijsinformatie (ADR-008): per artikelregel rechts de beste bekende prijs (winkel + bedrag); per run-kop per winkel het totaal + dekking "(x/n met prijs)" en, bij volledige dekking, een badge "goedkoopste: <winkel>".

## Prijzen (ADR-008, ADR-010)
- Winkels uit `markets` (instellingen). Prijzen per artikel: handmatig ingevoerd óf optioneel online opgehaald (niet-privé data, ADR-010); lokaal gecached.
- Opslag: localStorage `weekmenu-app-v1`, veld `prices`: `{ "<priceKey>": { ah: 2.5, jumbo: 2.2, lidl: null } }`.
- `priceKey(label)` = getrimd + lowercase ("Melk" = "melk").
- `marketTotals(items)` somt per winkel (onbekende prijzen overgeslagen, dekking apart bijgehouden); `bestPrice(item)` = laagste bekende prijs + bijbehorende winkel.

## State & opslag (ADR-005, ADR-009, ADR-010)
- Alles in localStorage-sleutel `weekmenu-app-v1`: menu, vergrendelingen, overrides, vinkjes, extra artikelen, voorraad, recepten, prijzen en **settings**.
- Nooit iets naar een server of GitHub; online alleen voor niet-privé data (prijzen).

## Build & tests (ADR-011)
- Bron: `src/App.jsx`; build: `npm run build` (→ `src/app.js`, meegecommit; CI controleert synchroniteit).
- Tests: `npm test` draait alle `tools/test-*.cjs` via `tools/run-tests.cjs` tegen de gecompileerde `src/app.js` met `tools/render-harness.cjs`.
- Elke functionaliteit in dit document moet gedekt zijn door een automatische test (zie docs/TESTS.md).
