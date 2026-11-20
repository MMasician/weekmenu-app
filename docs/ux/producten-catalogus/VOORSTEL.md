# UX-voorstel: productcatalogus — uniform producten opvoeren & verrijken (recepten / voorraad / boodschappen / weekmenu)

**Status: ronde 1 en 2 goedgekeurd per scherm (zie onder). Ronde 3 (eenheden + automatische migratie) staat ter bespreking — mocks 20–23 in deze map. Daarna worden álles in deze PR verwerkt: `docs/SPECS.md`, nieuw ADR (na ADR-016), `tools/test-*.cjs`, `src/App.jsx` + `npm run build`/`npm run verify`, én in dezelfde PR de cache-bump (`CACHE_VERSION` in `sw.js` + `?v=` op alle 4 plekken in `index.html` — les PR #8/#9).**

## Aanleiding (wensen)

1. **Één manier van werken** voor het opvoeren/verrijken van een **product** (verzamelnaam voor ingrediënt, voorraadproduct en extra boodschap) op de tabs **Recepten, Voorraad, Boodschappen** (en Weekmenu): product invoeren **met aantal**; product in een **lokaal bewaarde productcatalogus**.
2. **Autocomplete** bij het intikken van een productnaam (bestaande producten uit de catalogus).
3. Klik op de **productnaam** → product-detail: categorie (waar in de supermarkt), voorkeurssupermarkt koppelen/ontkoppelen, eenheid, verwijderen.
4. Ingrediënt-strings → producten, met dedup (enkelvoud/meervoud: `1 paprika` / `2 paprika's` = één product); **aantallen per recept/voorraad apart**.
5. **Automatische migratie van alle lokaal opgeslagen data** (inclusief de huidige ingrediënt-strings) naar producten — wished (ronde 3).
6. **Eenheden** (ronde 3): "1 blik" — blik is geen getal maar een eenheid (net als g/l). Eenheid als optie bij productwijzigingen; conversie g↔kg (en ml↔l) handig. Niet te moeilijk maken.
7. **Weekmenu**: klik op een **gelockt gerecht** → ingrediënten bovenaan in beeld (verzamelen), daarna de bereiding lezen. Klik op het slot = ontgrendelen (ongewijzigd).

Mocks gerenderd in de eigen huisstijl (`styles.css` inline) op 390×844; datum vr 20-11-2026, weekstart zaterdag, recepten uit `BASE_RECIPES`.

## Ronde 1 — goedgekeurd (2026-11-20)

1. **Recepten — ingrediënt toevoegen: versie A** (inline rijen: los aantalveld + naamveld met autocomplete + ✕), zonder beschrijvende hintteksten en zonder Enter-foot in de autocomplete → mock `01` (aangepast).
2. **Product-detail: versie B** — inline kaart onder de rij (`04`).
3. **Boodschappenlijst: versie A** — productnaam zelf klikbaar (`09`). Meervoud zonder AI: zie Model.
4. **Productcatalogus: versie A** — sectie in **Instellingen** (`13`), met **✕ per product** (verwijderen altijd mogelijk, bijv. typefouten; koppelingen vallen terug op vrije tekst).

## Ronde 2 — goedgekeurd (2026-11-20)

3. **Voorraad — product toevoegen: mock 16** — inline add-rij **onderaan** de productlijst (op de plek van "＋ Product toevoegen"): naam met autocomplete + "gewenst"-stapper + ✓/✕.
4. **Boodschappen — extra artikel: mock 17** — inline rij bovenaan de lijst: naam met autocomplete + **aantal** + Toevoegen; **geen categorie bij het opvoeren** (later via klik op de naam).
6. **Weekmenu — gelockt gerecht: mock 19** — klik op het **gerecht zelf** klapt inline onder de dagregel open: eerst ingrediënt-chips, dan de bereiding. Klik op 🔒 = ontgrendelen (ongewijzigd).

## Ronde 3 — eenheden & migratie (suggesties, mocks 20–23)

- `20-product-detail-eenheid-versie-A-select.png` — in het product-detail (inline kaart, scherm 2B) een veld **"Eenheid (standaard bij dit product)"** als **select**: geen eenheid / stuks / g / kg / ml / l / cl / blik / blikje / pak / pakje / zak / doos / fles / pot / el / tl / teen.
- `21-product-detail-eenheid-versie-B-chips.png` — zelfde veld, maar als **chips** (+ "＋ eigen…" voor een vrije eenheid, max. 8 tekens).
- `22-ingredient-rij-eenheid-versie-A-apart.png` — ingrediënt-rij in een recept als **apart aantalveld + eenheid-select + naamveld met autocomplete** (bijv. `1` + `blik` + `kokosmelk`).
- `23-ingredient-rij-eenheid-versie-B-gecombineerd.png` — rij als **gecombineerd "aantal+eenheid"-veld** (`1 blik`, `200 g`, `5`) + naamveld.

### Suggesties (nog niet uitgevoerd)

- **Model**: product = `{ id, name, cat, market?, unit? }` (unit = standaardeenheid, optioneel). Ingrediënt = `{ pid, amount, unit? }` — `unit` overschrijft de standaardeenheid van het product; `amount` = getal (incl. ½/¼/¾ → 0,5/0,25/0,75). Weergave: `amount unit productnaam` met meervoud als amount ≠ 1: "1 blik kokosmelk", "200 g sperziebonen", "5 paprika's", "kokosmelk" (zonder amount).
- **Kies apart (22) boven gecombineerd (23)**: dan kan de app de eenheid herkennen en converteren. Gecombineerd ("1 blik" als vrije tekst) kan niet betrouwbaar gesplitst/converteerd worden.
- **Conversie (simpel)**: bij het afronden van een ingrediënt-rij: `g` ≥ 1000 → `kg` (1000 g → 1 kg), `kg` < 1 → `g` (0,5 kg → 500 g); idem `ml` ↔ `l`. Alleen op de twee massa/volume-eenheden; alles else blijft zoals getypt.
- **Migratie (nu wél automatisch, generiek)**: bij het laden worden oude ingrediënt-strings gesplitst via `parseIngredientLabel`: leading getal (incl. ½/¼/¾) → `amount`; als het volgende woord een bekende eenheid is (zelfde lijst als hierboven) → `unit`, rest → productnaam; anders hele rest → productnaam, `unit` leeg. Voorbeelden: `2 paprika's` → amount 2, product `paprika` (dedup via `productKey`); `1 blik kokosmelk` → 1 blik + product `kokosmelk`; `200 g sperziebonen` → 200 g + product; `½ tl komijn` → 0,5 tl + product; `Kikkererwten` → geen amount, product `kikkererwten`. Product aanmaken indien nieuw (cat "overig", unit indien geparsed). Voorraadproducten en extra artikelen koppelen idem via `productKey` (hun cat/market verhuist naar het product). De catalogus wordt zo bij eerste load gevuld en ontdubbeld uit alle bestaande lokale data + `BASE_RECIPES`.
- **Meervoud zonder AI**: productnaam = enkelvoud (canoniek); weergave = amount == 1 → enkelvoud, anders meervoud via ingebouwde regel (klinker/a → `+'s`; anders `+en`; kleine uitzonderingenlijst alléén voor weergave: ei→eieren, ui→uien, tomaat→tomaten, aardappel→aardappelen…).

## Model (samenvatting na goedkeuring)

- **Productcatalogus** `products: [{ id, name, cat, market?, unit? }]` in localStorage `weekmenu-app-v1` (lokaal, ADR-009/010). Beheer: sectie in Instellingen (zoekveld + lijst + ✕ per product).
- **Dedup (`productKey`)**: lowercase, trim, dubbele spaties eruit, leading hoeveelheid/verpakking weg, trailing `'s` weg, dan trailing `en`/`s` weg als stam ≥ 4 tekens (niet ss/us/is). Autocomplete matcht op `productKey`.
- **Recept-ingrediënt** `{ pid, amount, unit? }`; vrije tekst (zonder product) blijft mogelijk als fallback (oude data / verwijderd product).
- **Voorraad** koppelt per product (`pid`) + locatie + have/want; **extra artikelen** = product + aantal.
- **Boodschappenlijst**: platte lijst op categorie-volgorde (`settings.shopCats`, ADR-015; "overig" achteraan); artikel = product → categorie/winkel/unit uit het product; klik op de naam → product-detail (inline kaart).
- **Weekmenu**: klik op gelockt gerecht → inline blok: ingrediënten (chips, klikbaar) bovenaan, bereiding eronder.
- **Categorie-voorstel**: hergebruik `settings.shopCats` (ADR-015), beheer op de Boodschappen-tab (⚙️).

## Open vragen ronde 3

- Scherm 8 (eenheid in product-detail): **select** (20) of **chips** (21)?
- Scherm 9 (ingrediënt-rij): **apart aantal + eenheid** (22, aanbevolen i.v.m. conversie) of **gecombineerd** (23)?
- Conversie g↔kg en ml↔l automatisch bij invoeren: **ja** (bovenstaand voorstel) of **nee** (alleen als je het zelf typt)?
- Migratie volautomatisch bij het laden (bovenstaand): akkoord?
