# UX-voorstel: productcatalogus — uniform producten opvoeren & verrijken (recepten / voorraad / boodschappen / weekmenu)

**Status: ronde 1 goedgekeurd per scherm (zie "Ronde 1 — goedgekeurd"). Ronde 2-mocks voor de schermen 3, 4 en 6 staan in deze map (15–19) — daarop wacht ik nog een keuze. Daarna worden in deze PR verwerkt: `docs/SPECS.md`, nieuw ADR (volgend nummer na ADR-016), `tools/test-*.cjs`, `src/App.jsx` + `npm run build`/`npm run verify`, én in dezelfde PR de cache-bump (`CACHE_VERSION` in `sw.js` + `?v=` op alle 4 plekken in `index.html` — les PR #8/#9).**

## Aanleiding (wensen)

1. **Één manier van werken** voor het opvoeren/verrijken van een **product** (verzamelnaam voor ingrediënt, voorraadproduct en extra boodschap) op de tabs **Recepten, Voorraad, Boodschappen** (en Weekmenu): je voert een product in **met aantal**; het product wordt opgeslagen in een **lokaal bewaarde productcatalogus**.
2. **Autocomplete** terwijl je een productnaam intikt: bestaande producten uit de catalogus verschijnen.
3. Na het opvoeren kun je op de **naam van het product klikken** → meer info + wijzigingen (categorie, voorkeurssupermarkt koppelen/ontkoppelen).
4. Ingrediënten zijn nu strings in recepten → worden producten. Dubbele producten vermijden (enkelvoud/meervoud: `1 paprika` en `2 paprika's` = één product). **Aantallen blijven per recept/voorraad apart opgeslagen.**
5. Producten uit de catalogus moeten **verwijderbaar** zijn (typefouten bij het opvoeren herstellen).
6. **Weekmenu (ronde 2, los van de catalogus)**: klik op een **gelockt gerecht** → ingrediënten en bereidingswijze in beeld; **ingrediënten bovenaan** (verzamelen), daarna de bereiding lezen om te gaan koken.

Alle mocks zijn gerenderd in de eigen huisstijl van de app (`styles.css` inline) op 390×844; datum vr 20-11-2026, weekstart zaterdag, recepten uit `BASE_RECIPES`.

## Ronde 1 — goedgekeurd (2026-11-20)

1. **Recepten — ingrediënt toevoegen: versie A** (inline rijen: los aantalveld + naamveld met autocomplete + ✕), maar **zonder** de beschrijvende tekst ("klik op een naam…", "aantal staat los") en **zonder** de Enter-foot in de autocomplete → mock `01-…-versie-A-inline-rijen.png` aangepast.
2. **Product-detail: versie B** — inline kaart die uitklapt onder de rij (`04-product-detail-versie-B-inline-kaart.png`): naam, categorie, winkelvoorkeur, "n× gebruikt", Opslaan/Verwijderen.
3. **Voorraad — product toevoegen: volledig inline zoals 1A** → ronde 2, mocks 15/16 (keuze bovenaan/onderaan).
4. **Boodschappen — extra artikel: idem als 1A** (inline rij: naam + aantal; **géén categorie bij het opvoeren** — die stel je later in via het product; **aantal is wel altijd nodig**) → ronde 2, mock 17.
5. **Boodschappenlijst: versie A** — productnaam zelf klikbaar (groen, onderstreept) → product-detail (`09-…-versie-A-naam-klikbaar.png`). Meervoudsvorm: ja, zonder AI — zie "Meervoud" onder Modelwijzigingen.
6. **Weekmenu**: de ronde-1 mocks (chips/sheet per dag) waren **geen** verbetering — geschrapt. Nieuwe wens (punt 6 boven) → ronde 2, mocks 18/19.
7. **Productcatalogus: versie A** — sectie in **Instellingen** (`13-…-versie-A-instellingen.png`), nu met **✕ per product** (verwijderen altijd mogelijk; koppelingen vallen terug op vrije tekst).

Ronde-1 mocks (ter referentie): `01`–`14` (scherm 2 = product-detail, scherm 5 = lijstrij, scherm 7 = catalogus; versies A/B per scherm zoals hierboven).

## Ronde 2 — nieuwe mocks (keuze gevraagd)

- `15-voorraad-product-toevoegen-versie-C-inline-bovenaan.png` — in de uitgeklapte locatie staat de add-rij **bovenaan** de productlijst: naamveld met autocomplete + "gewenst"-stapper + ✓/✕ (zelfde stijl als ingrediënt-rijen in een recept).
- `16-voorraad-product-toevoegen-versie-D-inline-onderaan.png` — zelfde inline rij, maar **onderaan** (op de plek van "＋ Product toevoegen").
- `17-boodschappen-extra-versie-C-inline-rij.png` — extra artikel als **inline rij bovenaan de lijst**: naam met autocomplete + aantal + Toevoegen; géén categorie-veld (categorie/winkel later via klik op de naam).
- `18-weekmenu-gelockt-gerecht-versie-A-bottomsheet.png` — klik op gelockt gerecht → **bottom sheet**: bovenaan "Ingrediënten" (aantal + klikbare productnaam + datumchip), dááonder "Bereiding", knop Klaar.
- `19-weekmenu-gelockt-gerecht-versie-B-inline.png` — klik op gelockt gerecht → klapt **inline** onder de dagregel open: eerst ingrediënt-chips, dan de bereiding.

## Modelwijzigingen (gevolg, na goedkeuring in een nieuw ADR)

- **Productcatalogus** `products: [{ id, name, cat, market? }]` in localStorage-sleutel `weekmenu-app-v1` (lokaal per huishouden, ADR-009/010; generieke data in de repo).
- **Recept-ingrediënt** wordt `{ pid, qty }`: `qty` = los aantal ("5", "200 g", "1 blik"); de productnaam komt uit de catalogus. Weergave: `qty + " " + productnaam` (met juiste meervoud, zie onder).
- **Dedup (`productKey`)**: lowercase, trim, dubbele spaties eruit, leading hoeveelheid/verpakking weg (`2 `, `1 blik `, `pak `, `zak `…), trailing `'s` weg, dan trailing `en`/`s` weg als de stam ≥ 4 tekens is (niet eindigend op ss/us/is). Dus `1 paprika` en `2 paprika's` → beide product **paprika**; `sperziebonen` → `sperzieboon`. Bij het intypen matcht autocomplete op `productKey`, dus het juiste product staat meteen in beeld. Geen alias-lijst nodig.
- **Geen automatische migratie van bestaande lokale data** — dat is de verantwoordelijkheid van de gebruiker. Wel wordt de catalogus bij eerste load gevuld/ontdubbeld uit de nu al bekende ingrediënten (`BASE_RECIPES`, generiek in de repo). Oude string-ingrediënten in lokaal opgeslagen recepten blijven als **vrije tekst** zichtbaar (vallen niet automatisch aan een product); opnieuw intypen koppelt via autocomplete.
- **Product verwijderen uit de catalogus** kan altijd (ook bij gebruik): koppelingen in recepten/voorraad/extra's vallen terug op de vrije tekst. Handig bij typefouten.
- **Meervoud zonder AI**: de productnaam is het enkelvoud (canoniek); weergave = `qty == 1` → enkelvoud, anders meervoud via een ingebouwde regel (eindigt op klinker/a → `+'s`; anders `+en`; kleine uitzonderingenlijst alléén voor de weergave: ei→eieren, ui→uien, tomaat→tomaten, aardappel→aardappelen…). Dus "5 paprika's" bij product "paprika" — puur regels, geen AI.
- **Categorie-voorstel**: hergebruik `settings.shopCats` (ADR-015) als productcategorie — "waar in de supermarkt", volgorde = boodschappenlijst-volgorde, beheer op de Boodschappen-tab (⚙️); product zonder categorie → "overig" achteraan. Categorie/winkel van een product is overal hetzelfde en te wijzigen via het product-detail.

## Open vragen ronde 2

- Scherm 3 (voorraad): inline add-rij **bovenaan** (15) of **onderaan** (16)?
- Scherm 4 (boodschappen extra): inline rij bovenaan de lijst (17) ok?
- Scherm 6 (weekmenu, gelockt gerecht): **bottom sheet** (18) of **inline uitklappen** (19)? En klik je op het gerecht zelf (dag/titel) of op het 🔒-icoon?
