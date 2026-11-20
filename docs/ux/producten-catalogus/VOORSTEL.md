# UX-voorstel: productcatalogus — uniform producten opvoeren & verrijken (recepten / voorraad / boodschappen / weekmenu)

**Status: ronde 1 — mocks ter goedkeuring per scherm; nog NIET verwerkt in SPECS/ADR/App.jsx.**
Zodra per scherm een versie is goedgekeurd, volgen in deze PR (zelfde branch): `docs/SPECS.md`, nieuw ADR
(volgend nummer na ADR-016), `tools/test-*.cjs`, `src/App.jsx` + `npm run build`/`npm run verify`,
én in dezelfde PR de cache-bump (`CACHE_VERSION` in `sw.js` + `?v=` op alle 4 plekken in `index.html` — les PR #8/#9).

## Aanleiding (wensen)

1. **Één manier van werken** voor het opvoeren/verrijken van een **product** (verzamelnaam voor ingrediënt,
   voorraadproduct en extra boodschap) op de tabs **Recepten, Voorraad, Boodschappen** (en Weekmenu):
   je voert een product in **met aantal**; het product wordt opgeslagen in een **lokaal bewaarde productcatalogus**.
2. **Autocomplete** terwijl je een productnaam intikt: bestaande producten uit de catalogus verschijnen.
3. Na het opvoeren kun je op de **naam van het product klikken** → meer info + wijzigingen (categorie,
   voorkeurssupermarkt koppelen/ontkoppelen).
4. **Migratie**: ingrediënten zijn nu strings in recepten → worden producten. Dubbele producten vermijden
   (let op enkelvoud/meervoud: `1 paprika` en `2 paprika's` = één product). **Aantallen blijven per
   recept/voorraad apart opgeslagen.**
5. Categorie-voorstel: zie onderaan.

Per te wijzigen scherm zijn er **2 versies** (mock-screenshots in deze map, gerenderd in de eigen huisstijl
van de app — `styles.css` inline — op 390×844, datum = vr 20-11-2026, weekstart zaterdag, recepten uit
`BASE_RECIPES`):

## 1. Recepten — ingrediënt opvoeren in het bewerkformulier

- `01-recept-ingredient-toevoegen-versie-A-inline-rijen.png` — **inline rijen** in het recept: per ingrediënt
  een los **aantalveld** + **naamveld met autocomplete** (bestaand product uit de catalogus, gemarkeerde match;
  Enter zonder match = nieuw product) + ✕. Onderaan "＋ Ingrediënt toevoegen".
- `02-recept-ingredient-toevoegen-versie-B-bottomsheet.png` — **bottom sheet** "Ingrediënt toevoegen":
  productveld met autocomplete + aantal-stapper + knop "Toevoegen aan recept"; de lijst erachter blijft
  zichtbaar (gedimd).

## 2. Product-detail — klik op een productnaam (vanuit élke tab hetzelfde)

- `03-product-detail-versie-A-bottomsheet.png` — **bottom sheet "Product"**: naam (bewerkbaar), categorie als
  chips, voorkeurssupermarkt als chips (geen/AH/Jumbo/Lidl), "n× gebruikt" (recepten/voorraad), knoppen
  **Opslaan** + **Uit catalogus verwijderen**.
- `04-product-detail-versie-B-inline-kaart.png` — **inline kaart** die uitklapt onder de rij in de lijst:
  zelfde velden (categorie als select, winkel als chips), kleinere knoppen.

## 3. Voorraad — product toevoegen in een locatie

- `05-voorraad-product-toevoegen-versie-A-uniform.png` — **zelfde invoer als in een recept** (uniform):
  productnaam met autocomplete + gewenste-voorraad-stapper + Toevoegen; hint "categorie & winkel stel je in
  door op de productnaam te klikken". Productrij: naam als klikbare link + categorie/winkel als subtekst +
  have −/+ en "gewenst n".
- `06-voorraad-product-toevoegen-versie-B-inline-formulier.png` — **alle velden direct** in het inline
  formulier (naam + autocomplete, categorie-select, supermarkt-select, gewenst-stapper) — zoals het huidige
  formulier, uitgebreid met autocomplete.

## 4. Boodschappen — extra artikel toevoegen

- `07-boodschappen-extra-versie-A-inline-autocomplete.png` — **bestaande input-rij uitgebreid** met
  autocomplete uit de catalogus (bestaand product = categorie/winkel worden overgenomen; klik in de lijst op
  de naam om te wijzigen); categorie-select ernaast blijft.
- `08-boodschappen-extra-versie-B-bottomsheet.png` — **bottom sheet "Extra boodschap"**: product met
  autocomplete + categorie-chips + winkel-chips + Toevoegen.

## 5. Boodschappenlijst — hoe ziet een product-rij eruit / hoe kom je bij het product?

- `09-boodschappen-lijst-versie-A-naam-klikbaar.png` — de **naam zelf is klikbaar** (groen, onderstreept) →
  opent het product-detail (scherm 2); checkbox, datumchip, winkel-chip en ✕ (alleen extra artikelen) blijven.
- `10-boodschappen-lijst-versie-B-categorie-subtekst.png` — rij toont **categorie als subtekst** onder de naam
  + een ℹ️-knop rechts → opent het product-detail.

## 6. Weekmenu — ingrediënten van een gerecht zien (per dag)

- `11-weekmenu-ingredienten-versie-A-chips.png` — onder de dagregel van een recept staan de ingrediënten als
  **klikbare product-chips** (aantal + productnaam) → klik opent product-detail.
- `12-weekmenu-ingredienten-versie-B-sheet.png` — dagregel blijft compact; extra 🧺-knop per dag opent een
  **sheet "Ingrediënten — <gerecht>"** met rijen (aantal + klikbare productnaam + datumchip bij
  groente/zuivel).

## 7. Productcatalogus beheren (overzicht van alle producten)

- `13-productcatalogus-versie-A-instellingen.png` — sectie **"Productcatalogus" op de Instellingen-tab**:
  zoekveld + lijst (naam klikbaar, categorie-chip, winkel-chip, "n× gebruikt", subtekst met de samengevoegde
  enkelvoud/meervoud-vormen zoals `uit "1 paprika" · "2 paprika's" · "5 paprika's"`).
- `14-productcatalogus-versie-B-boodschappen-paneel.png` — zelfde paneel als **inline paneel op de
  Boodschappen-tab** (naast het bestaande ⚙️-categorieën-paneel).

## Modelwijzigingen (gevolg, na goedkeuring in een nieuw ADR)

- **Productcatalogus** `products: [{ id, name, cat, market? }]` in localStorage-sleutel `weekmenu-app-v1`
  (lokaal per huishouden, ADR-009/010; generieke defaults in de repo, household-data lokaal).
- **Recept-ingrediënt** wordt `{ pid, qty }`: `qty` = het losse aantal ("5", "200 g", "1 blik"), de productnaam
  komt uit de catalogus. Weergave in recept/lijst: `qty + " " + productnaam` (dus "2 paprika").
- **Dedup (`productKey`)**: lowercase, trim, dubbele spaties eruit, leading hoeveelheid/verpakking weg
  (`2 `, `1 blik `, `pak `, `zak `…), trailing `'s` weg, dan trailing `en`/`s` weg als de stam ≥ 4 tekens is
  (niet eindigend op ss/us/is). Dus `1 paprika` en `2 paprika's` → beide product **paprika**;
  `sperziebonen` → `sperzieboon`. Canonieke (weergave)naam = eerste lettercombinatie zoals ingevoerd.
- **Migratie bij het laden** (generiek, zoals ADR-005/015): elke oude ingrediënt-string wordt gesplitst in
  `qty` (leading getal + eenheid) + naam; naam → `productKey` → bestaand product of nieuw product in de
  catalogus (zonder categorie → "overig"). Voorraadproducten en extra artikelen koppelen idem aan
  `pid`; hun `cat`/`market` verhuist naar het product (ADR-015 keeps working: de boodschappenlijst sorteert op
  categorie-volgorde en matcht nu via `productKey` i.p.v. `priceKey`).
- **Aantallen** blijven per recept (`qty`) en per voorraad (`have`/`want`) apart opgeslagen — het product zelf
  heeft geen aantal.
- Product verwijderen uit catalogus: koppelingen in recepten/voorraad/extra's vallen terug op de vrije tekst
  (oude label), het product zelf is weg.

## Categorie-voorstel

Hergebruik de bestaande **`settings.shopCats`** (ADR-015) als categorie van een product — een categorie zegt
**waar het in de supermarkt ligt** en bepaalt de volgorde op de boodschappenlijst:
fruit, groente, vlees/vis, kruiden, conserven, (maaltijd)saus, broodbeleg, zuivel, diepvries, lekkers, brood.
Beheer (toevoegen/verwijderen/volgorde) blijft op de **Boodschappen-tab** (⚙️). Product zonder categorie →
**"overig"**, staat achteraan op de lijst. De categorie van een product is overal hetzelfde (recept,
voorraad, boodschappen, weekmenu) en te wijzigen via het product-detail.

## Open vragen / knopen om door te hakken

- Scherm 1: inline rijen (A) of bottom sheet (B)?
- Scherm 2: product-detail als sheet (A) of inline kaart (B)?
- Scherm 3: uniform (A) of alle velden direct in het formulier (B)?
- Scherm 4: inline met autocomplete (A) of bottom sheet (B)?
- Scherm 5: klikbare naam (A) of categorie-subtekst + ℹ️ (B)?
- Scherm 6: chips onder de dag (A) of sheet via 🧺 (B)?
- Scherm 7: catalogus in Instellingen (A) of als paneel op de Boodschappen-tab (B)?
- Meervouds-dedup: bovenstaande regels dekken `paprika/paprika's`, `boon/bonen`; `ei/eieren` en
  `tomaat/tomaten` matchen niet automatisch — kleine alias-lijst, of accepteren we dat?
- Scherm 2: mag een product ook een **eigen_photo/notitie** krijgen, of alleen naam/categorie/winkel?
