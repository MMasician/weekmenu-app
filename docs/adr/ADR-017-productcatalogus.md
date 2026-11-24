# ADR-017: Productcatalogus — uniform product + aantal voor ingrediënten, voorraad en extra boodschappen

## Status
Accepted (2026-11-20)

## Context
Ingrediënten waren losse strings per recept (`["2 paprika's", "1 blik kokosmelk", …]`), voorraadproducten
hadden hun eigen `cat`/`market`, en extra boodschappen waren losse artikelen. daardoor was er geen gedeelde
"waar hoort dit in de supermarkt"-informatie en entstanden duplicates (enkelvoud/meervoud: `1 paprika` vs
`2 paprika's`). De gebruiker wil dat opvoeren/verrijken van een **product** (verzamelnaam voor ingrediënt,
voorraadproduct en extra boodschap) op de tabs Recepten, Voorraad en Boodschappen (en Weekmenu) **op één
manier** werkt: productnaam met autocomplete + los aantal; klik op de naam → product-detail (categorie,
voorkeurssupermarkt, eenheid, verwijderen). Eenheden moeten zinnig zijn ("1 blik" is een eenheid, net als g/l)
met conversie g↔kg en ml↔l. UX-voorstel met mocks (3 rondes, per scherm goedgekeurd): PR #28
(`docs/ux/producten-catalogus/VOORSTEL.md`).

## Besluit
- **Productcatalogus** `products: [{ id, name, cat, market?, unit?, pack? }]` in localStorage-sleutel
  `weekmenu-app-v1` (lokaal per huishouden, ADR-009/010). `cat` = categorie uit `settings.shopCats`
  (ADR-015, "waar in de supermarkt"; default `overig`), `market` = optionele winkelvoorkeur,
  `unit` = optionele standaardeenheid (uit `UNITS`: stuks/g/kg/ml/l/cl/blik/pak/… of vrije tekst ≤ 8 tekens).
- **Ingrediënt** in een recept = `{ pid, amount, unit, name }`: `amount` = getal (incl. ½/¼/¾ → 0,5/0,25/0,75),
  `unit` = eenheid van dit ingrediënt (eigen unit wint; product-`unit` is alleen default bij nieuwe invoer),
  `name` = snapshot voor als het product verwijderd wordt (vrije tekst). Weergave via `ingLabel`:
  `"5 Paprika's"`, `"1 blik kokosmelk"`, `"200 g sperziebonen"`, `"Zout"` (zonder amount).
- **Dedup (`productKey`)**: lowercase, trim, dubbele spaties eruit, leading hoeveelheid/verpakking/eenheid
  eraf, trailing `'s` eraf, dan trailing `en`/`s` eraf als de stam ≥ 4 tekens is (niet eindigend op ss/us/is).
  Dus `1 paprika` en `2 paprika's` → één product `paprika`. Bij intypen matcht autocomplete op `productKey`.
  De catalogus preferereert de enkelvoudige vorm als Weergavenaam ("ui" wint van "uien").
- **Meervoud zonder AI**: productnaam is het enkelvoud; `amount != 1` → meervoud via regel
  (eindigt op klinker → `+'s`, anders `+en`) + kleine uitzonderingenlijst alléén voor de weergave
  (ei→eieren, ui→uien, tomaat→tomaten, aardappel→aardappelen, courgette→courgettes).
- **Migratie (volautomatisch bij het laden)**: bij ontbreken van `products` wordt de catalogus opgebouwd uit
  `BASE_RECIPES` + opgeslagen recepten + voorraad + extra artikelen (`buildCatalog`, dedup via `productKey`).
  Oude string-ingrediënten worden gesplitst via `parseIngredientLabel` (leading getal incl. ½/¼/¾ → `amount`;
  volgende woord = bekende eenheid → `unit`; rest → productnaam) en gekoppeld aan het product
  (`migrateRecipesIngredients`). Voorraad en extra artikelen krijgen idem een `pid`. Oude `checked`-sleutels
  keyden op `<datum>-<recept>-<index>` (index i.p.v. label).
- **Eenheden & conversie (#35-aangevuld)**: in een ingrediënt-rij staat de eenheid tussen aantal en naam: bij g/kg/ml/cl/l/**el/tl** een
  select met alléén de converteerbare eenheden uit de groep (g↔kg; ml/cl/l/el/tl met **el = 15 ml, tl = 5 ml**, dichtheid 1 g/ml — impliciet, geen omrekentekst aan de gebruiker), bij andere eenheden (blik, pak…)
  platte tekst (niet wijzigbaar), bij géén eenheid niets. Bij afronden van het aantal auto-conversie over de
  1000-grens (1000 g → 1 kg, 0,5 kg → 500 g, idem ml↔l); bij wijzigen van de eenheid wordt het aantal mee
  gerekend (`convertAmount`). In het product-detail (scherm 2B) is de standaardeenheid te wijzigen via een
  select (mock 20).
- **Opvoeren is uniform** (mocks-eerst, goedgekeurd per scherm): in een recept inline rijen
  `[aantal][eenheid][naam + autocomplete][✕]` + "＋ Ingrediënt toevoegen" (mock 01); in een voorraad-locatie
  een inline add-rij **onderaan** `[naam + autocomplete][gewenst-stapper][✓][✕]` (mock 16); op de
  boodschappen-tab een inline rij bovenaan `[naam + autocomplete][aantal][Toevoegen]` — **zonder categorie**
  (die stel je later in via het product; aantal is wel altijd verplicht) (mock 17). Enter/blur zonder
  autocomplete-match maakt een nieuw product in de catalogus.
- **Product-detail**: klik op een productnaam (prodlink, overal: recepten/voorraad/boodschappen/weekmenu/
  catalogus) klapt een **inline kaart** open onder de rij (mock 04 + eenheid-select mock 20): naam, categorie
  (select uit shopCats + overig), eenheid (select), voorkeurssupermarkt (chips), "n× gebruikt",
  **Opslaan** + **Verwijderen**. Verwijderen kan altijd (typefouten herstellen): koppelingen in
  recepten/voorraad/extra's vallen terug op vrije tekst (`pid: null`, `name` blijft).
- **Boodschappenlijst**: platte lijst op categorie-volgorde (ADR-015/016); artikel = product →
  categorie/winkel/eenheid uit het product; klik op de naam opent de product-kaart (mock 09).
  Schaling per dag (ADR-012) schaalt alleen `amount` mee (vaste verpakkingen blik/pak/zak/… blijven).
- **Verpakking per product (#35)**: optioneel `pack: { amount, unit }` = inhoud per 1 product-eenheid (bijv. 1 pot = 500 g),
  in te stellen in het product-detail ("Inhoud per verpakking": getal + eenheid-select). Op de lijst wordt per product de som
  in basiseenheid (g/ml) naar **hele verpakkingen** afgerond (ceil; 90 g → "1 pot Kwark", eenheid van de verpakking in de
  regel genoemd, zonder argumentatie-subtekst). Zonder `pack`: g/kg/ml/l met auto-conversie over de 1000-grens én
  **min. 100 g/ml** (omhoog afgerond). Nooit `el`/`tl` op de lijst.
- **Weekmenu**: klik op een **gelockt gerecht** (veld is readOnly) klapt inline onder de dag open:
  eerst de ingrediënten als klikbare product-chips, dááonder de bereiding (mock 19). Klik op 🔒 =
  ontgrendelen (ongewijzigd).
- **Catalogus beheren**: sectie "Productcatalogus" op de **Instellingen**-tab (mock 13): zoekveld + lijst
  (prodlink-naam, categorie-chip, eenheid-chip, winkel-chip, "n× gebruikt", ✕ per product) + teller
  "n van N producten".
- Cache-bump in dezelfde PR (les PR #8/#9): `CACHE_VERSION` v9→v10 in `sw.js`, `?v=8`→`?v=9` op alle
  4 plekken in `index.html`.

## Gevolgen
+ Eén bron voor categorie/winkel/eenheid per product; de boodschappenlijst erft die automatisch
  (sortering en winkel-filter werken via het product in plaats van via `priceKey`-string-match).
+ Dubbele producten (enkelvoud/meervoud, met/zonder hoeveelheid/verpakking) worden automatisch
  samengevoegd, ook bij migratie van bestaande lokale data.
+ Aantallen blijven per recept (`amount`/`unit`) en per voorraad (`have`/`want`) apart opgeslagen.
+ Producten zijn verwijderbaar uit de catalogus; koppelingen degraderen naar vrije tekst.
- `ei/eieren` en `tomaat/tomaten` matchen qua dedup niet automatisch (geen alias-lijst, zie VOORSTEL);
  autocomplete toont bij het intypen wel meteen het juiste product.
- Geteste dekking: `tools/test-producten-catalogus.cjs` (migratie/dedup, autocomplete, eenheden+conversie,
  product-detail/verwijderen, catalogus in Instellingen, weekmenu-detail).
