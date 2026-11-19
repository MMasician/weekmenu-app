# UX-voorstel: voorraad-tab — locaties, producten, categorieën en winkelvoorkeur

**Status: ronde 1 goedgekeurd (per scherm, met aanpassingen) en verwerkt in ADR-015, `docs/SPECS.md`, `tools/test-voorraad-locaties.cjs` en `src/App.jsx` (+ build/`src/app.js`, `npm run verify` groen, CACHE_VERSION v8 + `?v=7`).** Goedgekeurde keuzes per scherm:

1. Locaties ingeklapt: **versie A** (eigen kaart per locatie), maar de teller toont een **kaal getal** zonder "producten" (zoals in B).
2. Uitgeklapte locatie: **versie B** (categorie als subtekst onder de productnaam), **plus** de huidige voorraad (have) altijd aanpasbaar via een −/+ stapper per product (zodat have < want de boodschappenlijst vult).
3. Locatie toevoegen: **inline zoals versie B, maar onderaan de lijst** (waar ook de ＋-knop staat).
4. Product toevoegen: **versie B ongewijzigd** (inline kaart bovenaan de productlijst, dropdowns, stapper voor gewenst, default 1).
5. Gewenste voorraad bewerken: **versie A** (stapper per product in edit-modus; gebruiksgemak wint).
6. Boodschappenlijst: **lijstvorm zoals versie B** — platte lijst, categorie bepaalt de volgorde maar wordt **niet** getoond; geen lege secties (categorieën zijn sowieso niet zichtbaar).
7. Categorieën beheren: **versie B** (inline paneel) met ▲▼-volgorde; **geen aantal producten** tonen.
8. Uitleg: **versie A** (popover bij ℹ️).

Overige beslissingen: extra artikelen én receptingrediënten krijgen een categorie (ingrediënten via naam-match met een bekend product); default gewenste voorraad = 1; generieke default-locaties = Voorraadkast, Koelkast, Vriezer, Kruidenla, Fruitschaal (migratie van oude data is generiek, zie ADR-015).

## Aanleiding (wensen)

1. **Locaties zijn per huishouden** (voorraadkast, koelkast, …) en moeten toe te voegen/verwijderbaar zijn. Locaties zijn **uitklapbaar** en starten **ingeklapt**. Onderaan de locaties een **＋** om een locatie toe te voegen; achter elke locatie een knop om te **verwijderen** — zolang er producten aan hangen is die **grijs en niet klikbaar**.
2. Bij uitklappen toont een locatie de bijbehorende **producten**. Onderaan de productlijst een **＋** om een product toe te voegen. Producten zijn **altijd** verwijderbaar.
3. Elk product toont zijn **categorie**. Categorieën zijn aanpasbaar bij de **boodschappenlijst**-tab; initiële categorieën (en initiële volgorde op de boodschappenlijst): fruit, groente, vlees/vis, kruiden, conserven, (maaltijd)saus, broodbeleg, zuivel, diepvries, lekkers, brood. Een categorie zegt waar het product in de supermarkt ligt — tortilla/kroepoek horen daarom bij **(maaltijd)saus**.
4. Per product optioneel een **supermarkt-tag** (initieel Lidl, Jumbo, AH — de `markets` uit Instellingen). Dan geldt een sterke voorkeur om het daar te halen; **prijsvergelijking heeft dan geen zin**.
5. De **gewenste hoeveelheid** (`want`) is stabiel: bij opvoeren van een product geef je de gewenste voorraad aan; daarna **grijs** achter het product getoond. Achter elke locatie een **✏️ edit-icoon**; getoggled → de gewenste hoeveelheden binnen die locatie zijn aanpasbaar.
6. Scherm zo simpel mogelijk; uitleg via **ℹ️-informatieknopjes** die pas tonen bij kik.

Per te wijzigen scherm zijn er **2 versies** (mock-screenshots in deze map, gerenderd in de eigen huisstijl op 390×844):

## 1. Voorraad-tab: locatielijst, ingeklapt

- `01-voorraad-locaties-ingeklapt-versie-A-kaarten.png` — elke locatie een **eigen kaart**: ▸ chevron, naam, "n producten", ✏️, 🗑️ (grijs/disabled bij bezet, actief bij leeg). Onderaan een **dashed ＋ Locatie toevoegen**-kaart. Daaronder de bestaande knoppen "✓ Alles aangevuld" + "Standaardlijst terug". Bovenaan kop "Locaties" + ℹ️.
- `02-voorraad-locaties-ingeklapt-versie-B-lijst.png` — **één gedeelde kaart** met divide-y rijen (compacter), chevron rechts, ＋ als rij onderaan in de kaart.

## 2. Locatie uitgeklapt: productlijst

- `03-locatie-uitgeklapt-versie-A-chips.png` — productrij: naam links; rechts **categorie-chip**, supermarkt-chip (alleen bij tag: Jumbo/Lidl/AH), grijs "gewenst n", ✕. Onderaan de lijst "＋ Product toevoegen".
- `04-locatie-uitgeklapt-versie-B-cat-onder-naam.png` — zelfde, maar categorie als kleine grijze subtekst **onder de productnaam** (tweeregelige rij, minder kleurrijk).

## 3. Locatie toevoegen

- `05-locatie-toevoegen-versie-A-bottomsheet.png` — bottom sheet "Nieuwe locatie": naamveld + hint (per huishouden, bijv. voorraadkast/koelkast/vriezer) + primaire knop "Toevoegen"; lijst erachter gedimd.
- `06-locatie-toevoegen-versie-B-inline.png` — na ＋ verschijnt **inline een rij bovenaan de lijst** met naamveld + ✓/✕.

## 4. Product toevoegen (binnen uitgeklapte locatie)

- `07-product-toevoegen-versie-A-bottomsheet.png` — bottom sheet "Nieuw product in <locatie>": naam; **categorie als chips** (alle categorieën, bijv. broodbeleg geselecteerd); **supermarkt optioneel als chips** (geen voorkeur / Lidl / Jumbo / AH) met hint dat prijsvergelijking dan geen zin heeft; **gewenste voorraad als stapper (− 1 +)**; knop "Toevoegen".
- `08-product-toevoegen-versie-B-inline.png` — zelfde velden als **inline kaart bóven de productlijst** (categorie/supermarkt als dropdowns ipv chips, stapper, Toevoegen + ✕).

## 5. Gewenste hoeveelheden bewerken (✏️ achter locatie getoggled)

- `09-bewerk-hoeveelheden-versie-A-stapper.png` — locatiekop toont ✏️ **actief** (donker) + "gewenst aanpassen"; per product een **stapper (− n +)** op de plek van het grijze getal; categorie-chip blijft; product blijft verwijderbaar.
- `10-bewerk-hoeveelheden-versie-B-input.png` — zelfde, maar gewenst aantal als **number-input** per product.

## 6. Boodschappenlijst: voorraadtekorten gegroepeerd per categorie

- `11-boodschappen-per-categorie-versie-A-secties.png` — sectie "Standaardvoorraad aanvullen" gegroepeerd per categorie in de categorievolgorde (vlees/vis → conserven → (maaltijd)saus → zuivel), met sectiekoppen. Product met winkelvoorkeur toont een **winkel-chip (AH/Jumbo/Lidl) in plaats van een prijs** (telt niet mee in prijsvergelijking/run-totalen). Bovenaan de tab: ℹ️ + **⚙️** (categorieën beheren).
- `12-boodschappen-per-categorie-versie-B-chips.png` — **platte lijst** (zelfde categorievolgorde), elke rij een categorie-chip rechts; "⚙ Categorieën beheren" als stille link onderaan.

## 7. Categorieën beheren (bij de boodschappenlijst-tab)

- `13-categorieën-beheren-versie-A-bottomsheet.png` — bottom sheet "Categorieën": rijen met **▲▼ volgorde**, naam, "n producten", ✕ (grijs/disabled zolang er producten in zitten); onderaan veld "Nieuwe categorie…" + ＋; knop "Klaar". Hint: categorie = waar in de supermarkt (tortilla/kroepoek → (maaltijd)saus); volgorde = volgorde op de boodschappenlijst.
- `14-categorieën-beheren-versie-B-inline.png` — zelfde inhoud als **inline paneel** direct op de boodschappen-tab.

## 8. Uitleg via ℹ️-informatieknop

- `15-info-versie-A-popover.png` — ℹ️ in de kop opent een **popover** (kaartje onder de knop) met korte uitleg: locaties per huishouden, uitklappen, ＋/🗑️, categorie, winkelvoorkeur, "gewenst" via ✏️.
- `16-info-versie-B-toast.png` — ℹ️ toont de uitleg als **toast onderaan** het scherm.

## Modelwijzigingen (gevolg, na goedkeuring in een nieuw ADR)

- `STOCK_CATS` (kast/koel/fruit/kruiden) wordt vervangen door **per-huishouden `stockLocations`: [{ id, name }]** (instelbaar, default bijv. voorraadkast/koelkast/vriezer/kruidenla). Product: `{ name, locationId, catKey, marketKey? , want, have }`. Migratie: bestaande `cat` → matching locatie (kast→voorraadkast, koel→koelkast, fruit→fruitschaal?, kruiden→kruidenla) — zie open vraag; `normalizeStock` idem.
- **Categorieën** verhuizen naar `settings.shopCats: string[]` (initiële lijst + volgorde bovenstaande). Categorie is géén producttype maar "waar in de supermarkt".
- **Winkelvoorkeur** per product = `marketKey` uit `settings.markets`; op de boodschappenlijst tonen als chip en **uitsluiten van `bestPrice`/`marketTotals`** (prijsvergelijking zinloos).
- Boodschappenlijst: sectie "Standaardvoorraad aanvullen" gegroepeerd per categorie in `shopCats`-volgorde; categorieën beheren (toevoegen/verwijderen/volgorde) via de boodschappen-tab.
- Voorraad-tab: locaties uitklapbaar (start ingeklapt); verwijder-locatie disabled zolang producten eraan hangen; product altijd verwijderbaar; `want` grijs, bewerkbaar via ✏️ per locatie; ℹ️-uitleg.
- "Alles aangevuld" (have = want) en "Standaardlijst terug" (reset naar default locaties + producten) blijven bestaan.

## Open vragen / knopen om door te hakken

- Scherm 1: aparte kaarten per locatie (A) of één gedeelde lijst (B)?
- Scherm 2: categorie als chip rechts (A) of als subtekst onder de naam (B)?
- Scherm 3: locatie toevoegen via bottom sheet (A) of inline rij (B)?
- Scherm 4: product toevoegen via bottom sheet met chips+stapper (A) of inline kaart met dropdowns (B)? Welke defaultcategorie bij leeg? Welke default "gewenste voorraad" (huidig voorstel: 1)?
- Scherm 5: gewenst bewerken met stapper (A) of number-input (B)? Edit-icoon togglet per locatie — moet het hele scherm in edit-modus of alleen die locatie? (voorstel: alleen die locatie)
- Scherm 6: tekorten als secties per categorie (A) of platte lijst met chips (B)? Moeten ook **extra vrije artikelen** en/of **recept-ingrediënten** een categorie krijgen, of alleen voorraadproducten? (huidig voorstel: alleen voorraadproducten; ingrediënten blijven per dag/gerecht)
- Scherm 7: categorieën beheren in bottom sheet met ▲▼ (A) of inline paneel (B)? Ook slepen (drag) als alternatief voor ▲▼?
- Scherm 8: uitleg via popover (A) of toast (B)? (huidige app gebruikt elders bottom sheets; popover/toast is compacter)
- Migratie: oude `cat`-waarden (kast/koel/fruit/kruiden) mappen naar welke default-locaties? En: wat is de default-locatie-naam voor "fruit" (fruitschaal/fruitmand)?
- Moet een lege categorie (0 producten) automatisch uit de boodschappenlijst-secties verdwijnen? (huidig voorstel: ja, lege categorieën tonen geen lege sectie)

## Wat er ná goedkeuring per scherm gebeurt (nog niet uitgevoerd)

- `docs/SPECS.md` (secties Voorraad + Boodschappen + Instellingen) + `docs/INTENT.md` bijwerken; nieuw ADR (volgend nummer, bijv. ADR-015: locaties/categorieën/winkelvoorkeur + migratie).
- Tests in `tools/test-voorraad-locaties.cjs` (nieuw, via `tools/render-harness.cjs`): locaties toevoegen/verwijderen (disabled bij producten), uitklappen, product toevoegen/verwijderen, categorie-indicatie, winkelvoorkeur-chip zonder prijsvergelijking, gewenst via edit-icoon, boodschappenlijst gegroepeerd in categorievolgorde, categorieën beheren, migratie van oude `stock`.
- Implementatie in `src/App.jsx` (+ `npm run build` → `src/app.js` synchroon, `npm run verify` groen) en in dezelfde PR: `CACHE_VERSION` in `sw.js` ophogen + `?v=N` in `index.html` (4 plekken) bumpen.
- Dit `VOORSTEL.md` wordt na goedkeuring aangevuld met de gekozen versies per scherm (status per ronde).
