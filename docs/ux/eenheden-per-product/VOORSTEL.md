# UX-voorstel: meerdere eenheden per product (recept vs. voorraad/winkel) (issue #35)

**Status: goedgekeurd in issue #35 (label `ready`, 2026-11-24) — geïmplementeerd in PR #62.**

## Aanleiding (wens uit issue #35)

In de voorraad staat **1 pot kwark**, in een gerecht is **1 el (of 4 el) kwark** nodig. Met de huidige
eenheid per product (ADR-017) kan dat niet: de eenheid staat nu óf op het product óf per ingrediënt,
maar er is geen koppeling tussen "kleine eenheid in het recept" (el/tl/g) en "verpakking in de winkel"
(pot/blik/pak, bijv. 1 pot = 500 g). Op de boodschappenlijst mogen **nooit el/tl** of hoeveelheden
**< 100 g** voorkomen — wel 150 g, 500 g of een hele verpakking.

Richting uit het issue: eenheid per **recept/voorraadlocatie** aangeven, met de verpakking van het
product als anker voor voorraad en boodschappenlijst.

## Gedeelde regels (ter vastlegging bij goedkeuring)

- **Verpakking per product** (scherm 1): optioneel `pack: { amount, unit }` op het product
  (bijv. `1 pot = 500 g`), in te stellen in de product-kaart; `normalizeProducts` vult aan /
  valideert; delen via bestand neemt `pack` mee (ADR-019). Product-`unit` blijft de standaardeenheid
  voor **nieuwe** invoer; per ingrediënt (recept) en per voorraad-entry kan de eenheid afwijken.
- **Eenheden-groepen uitgebreid**: `el` = 15 ml, `tl` = 5 ml in de ml-groep (`ml/cl/l/el/tl`),
  dus `convertAmount`/`UNIT_GROUP` werken ervoor; in de ingrediënt-rij een select met alle
  converteerbare eenheden (scherm 2). wel/niet: el/tl worden bij weergave/oplaan omgerekend naar
  g/ml waar zinvol (versie C) — te kiezen.
- **Boodschappenlijst (scherm 3)**: per product (pid) sommeren in de **basiseenheid** (g/ml via
  UNIT_FACTOR); weergave = hele **verpakking** als `pack` er is (ceil: 90 g → 1 pot van 500 g),
  anders g/kg/ml/l met auto-conversie over de 1000-grens én **min. 100 g/ml** (afronden omhoog).
  Nooit `el`/`tl` op de lijst. Bestaande samenvoeg-logica (#33) werkt op de som in basiseenheid
  vóór de weergave-conversie.
- **Voorraad**: `have`/`want` in de product-eenheid (bijv. pot); tekort (have < want) voedt de
  boodschappenlijst als `1 pot` (verpakking), niet als losse el.
- Mock-data generiek (kwark pot 500 g, 4 el in recept); geen household-specifieke context (ADR-010).
  SVG-mocks 390×844 in eigen huisstijl. Overlap met #59 (normalisatie/dedup) en #44 (catalogus):
  product-kaart en catalogus in deze batch op elkaar afgestemd.

## Schermen (3 schermen × 3 versies)

### 1. Product-kaart: verpakking (winkel-eenheid) instellen
- `01-productkaart-versie-A-twee-velden.svg` — **A**: "1 [pot ▾] = [500] [g ▾]"
- `02-productkaart-versie-B-inhoud-select.svg` — **B**: "Inhoud per verpakking: [500] [g ▾]" (per 1 pot)
- `03-productkaart-versie-C-chip.svg` — **C**: chip "📦 1 pot = 500 g ✏️" (+ "＋ verpakking…")

### 2. Ingrediënt-rij in een recept: kleine eenheden (el/tl) + conversie
- `04-ingredient-rij-versie-A-select-met-el-tl.svg` — **A**: eenheid-select bevat el/tl in de ml-groep
- `05-ingredient-rij-versie-B-conversie-zichtbaar.svg` — **B**: conversie zichtbaar onder de rij ("4 el = 60 ml ≈ 60 g")
- `06-ingredient-rij-versie-C-weergave-als-g.svg` — **C**: el/tl bij invoer, opgeslagen/weergegeven als g

### 3. Boodschappenlijst: geaggregeerd in winkel-eenheid (nooit el/tl of < 100 g)
- `07-boodschappen-versie-A-verpakking.svg` — **A**: "1 pot Kwark" met bron-aantallen eronder (4 el + 2 el = 90 g → 1 pot)
- `08-boodschappen-versie-B-gram-kg.svg` — **B**: weergave in g/kg ("500 g Kwark"), verpakking als subtekst
- `09-boodschappen-versie-C-min-100g-regel.svg` — **C**: regel expliciet: "nooit el/tl, min. 100 g, hele verpakking"

## Na goedkeuring (implementatie, zelfde branch/PR)

ADR-017 + `docs/SPECS.md` (Productcatalogus, Boodschappen, Voorraad) bijwerken; tests in
`tools/test-producten-catalogus.cjs` (pack, el/tl-conversie), `tools/test-boodschappen-lijst.cjs`
(som in basiseenheid → verpakking/min-100 g), `tools/test-voorraad-locaties.cjs` (tekort in
verpakking); implementatie in `src/App.jsx` (product-kaart, UNITS/UNIT_FACTOR/UNIT_GROUP,
ingrediënt-rij, boodschappen-aggregatie, normalizeProducts, delen via bestand ADR-019),
`npm run build`, `npm run verify` groen, CI groen (ADR-014), cache-bump.

## Ronde 2 (akkoord eigenaar, 2026-11-24 — verwerkt in deze PR)

- **Scherm 1 (product-kaart): versie B** — "Inhoud per verpakking: [500] [g ▾] per 1 pot" (`02-productkaart-versie-B-inhoud-select.svg`).
- **Scherm 2 (ingrediënt-rij): versie B, zonder beschrijvende omrekentekst** — conversie el/tl (15/5 ml) is impliciet en wordt niet aan de gebruiker getoond (`05-ingredient-rij-versie-B-zonder-omrekentekst.svg`).
- **Scherm 3 (boodschappenlijst): versie A** — de eenheid van de verpakking wordt genoemd ("1 pot Kwark"), zonder de kleinere argumentatietekst (`07-boodschappen-versie-A-zonder-argumentatie.svg`).
- **Regels bevestigd**: alleen hele verpakkingen haalbaar → naar boven afronden (ceil) als recepten kleinere eenheden gebruiken; zonder bekende verpakking (blik/pak/zak) mag gram gebruikt worden, ook als gram afwijkt van de inhoud van de eenheid (sperziebonen 400 g én 600 g); el/tl als 15/5 ml behandeld (dichtheid 1 g/ml), impliciet.
