# UX-voorstel: boodschappenlijst — "Verwerk update" verwerkt afgevinkte artikelen (issue #34)

**Status: ronde 1 goedgekeurd in issue #34 (reactie eigenaar): versie B (afgevinkte rijen verborgen na "Verwerk update" + chip "n afgevinkt · toon ▾", melding inline).** Goedgekeurde werking in deze PR geïmplementeerd (zelfde branch).

## Aanleiding (wens uit issue #34)

Vóór het boodschappen doen vink ik de artikelen af die al in huis zijn, maar die blijven op de lijst
staan, waardoor de lijst heel lang blijft. Onderaan staan nu 2 knoppen ("Klaar met winkelen" + "Vinkjes
wissen") die beperkt nuttig zijn. Er moet 1 knop "Verwerk update" komen die (a) een melding geeft over
de volledigheid van de gerechten, (b) de afgevinkte voorraad aanpast (`have`), en (c) de afgevinkte
producten uit de lijst verwijdert/verbergt — zodat in de winkel snel zichtbaar is wat nog gehaald moet worden.

## Gedeelde regels (ter vastlegging bij goedkeuring)

- Onderaan: 1 primaire knop **"Verwerk update"** (vervangt "Klaar met winkelen"); "Vinkjes wissen" blijft als secundaire knop.
- "Verwerk update" doet in 1 keer: inline melding over gerechtvolledigheid (✅ n compleet · ❗ m mist nog — zie weekmenu; niets afgevinkt → "Nog niets afgevinkt…", geen wijziging); voorraad bijwerken (afgevinkt tekort → `have = want`; afgevinkt ingrediënt met product in voorraad → `have += gekocht aantal`, geconverteerd naar product-eenheid; géén voorraad-entry → alleen verbergen); afgevinkte rijen verbergen uit de zichtbare lijst.
- Niet-afgevinkte rijen blijven staan; lijst blijft afvinkbaar, melding is live. "Vinkjes wissen" wist `checked` → alle rijen weer zichtbaar (have-wijzigingen blijven). Tab-teller "n/m" ongewijzigd. Afgevinkt extra artikel: verborgen maar blijft in `extraItems`.
- Mock-data generiek (zelfde scenario als #33: 2 van 5 rijen afgevinkt); geen household-specifieke context (ADR-010). SVG-mocks 390×844 in eigen huisstijl.

## Schermen (1 scherm × 3 versies)

### 1. Boodschappen-tab: lijst met 2 afgevinkte rijen + knop "Verwerk update" + melding
Scenario: "3 appels" en "Chips" zijn afgevinkt; zichtbare rest: 500 g aardappelen (zo 23-11), 400 g kipgehakt, 1 blik gepelde tomaten.
- `01-lijst-versie-A-inklapbaar-afgevinkt.svg` — **versie A**: afgevinkte rijen in inklapbare sectie onderaan de kaart ("▾ 2 afgevinkt"), melding inline onder de knoppen.
- `02-lijst-versie-B-verborgen-met-chip.svg` — **versie B**: afgevinkte rijen direct verborgen; chip bovenaan "2 afgevinkt · toon ▾" zet ze terug; melding inline.
- `03-lijst-versie-C-doorgehaald-met-toast.svg` — **versie C**: afgevinkte rijen blijven in de lijst staan (doorgehaald, grijze achtergrond); melding als toast onderin.

## Implementatie (deze PR, na goedkeuring ronde 1)

- `src/App.jsx`: `processChecked()` (have=want bij afgevinkt tekort; have += aantal bij afgevinkt ingrediënt met product in voorraad; melding live; afgevinkte rijen verborgen) + chip "n afgevinkt · toon ▾" + "Vinkjes wissen" reset alles.
- `docs/SPECS.md` (sectie Boodschappen), tests in `tools/test-boodschappen-lijst.cjs` (sectie 9), `npm run build` (`src/app.js` synchroon), `npm run verify` groen, cache-bump (`CACHE_VERSION` v14 in `sw.js` + `?v=13` in `index.html`).
