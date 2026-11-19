# ADR-015: Voorraad per locatie, categorieën als supermarkt-volgorde en winkelvoorkeur

## Status
Accepted (2026-11-19)

## Context
De voorraad-tab gebruikte vaste categorieën (`STOCK_CATS` = kast/koel/fruit/kruiden) als
"locatie", met per product have/want en een binaire kruidenla-toggle (ADR-004). Locaties zijn
per huishouden verschillend en moeten toe te voegen/verwijderbaar zijn. Daarnaast wil de
gebruiker dat elk product een **categorie** heeft die zegt waar het in de supermarkt ligt
(bijv. tortilla/kroepoek → "(maaltijd)saus), dat die categorie de **volgorde** op de
boodschappenlijst bepaalt, dat een product optioneel een **winkelvoorkeur** kan hebben
(Lidl/Jumbo/AH — dan heeft prijsvergelijking geen zin), en dat de gewenste hoeveelheid
stabiel is maar per locatie via een edit-icoon aanpasbaar. UX-voorstel met mocks: PR #25
(`docs/ux/voorraad-locaties/VOORSTEL.md`), per scherm goedgekeurd.

## Besluit
- **Locaties** (`stockLocations: [{ id, name }]` in localStorage, per huishouden) vervangen
  `STOCK_CATS` als bron. Default: Voorraadkast, Koelkast, Vriezer, Kruidenla, Fruitschaal.
  Op de voorraad-tab zijn locaties **uitklapbaar en starten ingeklapt**; onderaan een ＋ voegt
  een locatie toe (inline formulier onderaan de lijst); achter elke locatie een 🗑️ die
  **disabled** is zolang er producten aan hangen.
- **Product** = `{ name, loc, cat, market?, want, have }`. Producten worden per locatie
  toegevoegd (inline formulier bovenaan de uitgeklapte locatie: naam, categorie (verplicht),
  supermarkt (optioneel, uit `settings.markets`), gewenste voorraad stapper, standaard 1) en
  zijn **altijd** verwijderbaar. Per product is de **huidige voorraad (have) altijd** met een
  −/+ stapper aanpasbaar; de **gewenste (want)** staat grijs ("gewenst n") erachter en is
  aanpasbaar via het **✏️ edit-icoon** achter de locatie (dan Verschijnt per product een
  want-stapper). Tekort (have < want) → automatisch op de boodschappenlijst met "(n van want)".
  "Alles aangevuld" zet have = want; "Standaardlijst terug" reset locaties + voorraad naar de
  defaults.
- **Categorieën** (`settings.shopCats: string[]`, per huishouden, default in vaste volgorde:
  fruit, groente, vlees/vis, kruiden, conserven, (maaltijd)saus, broodbeleg, zuivel, diepvries,
  lekkers, brood). Een categorie zegt **waar in de supermarkt** een artikel ligt, niet wat het
  is. Beheren (toevoegen/verwijderen/volgorde via ▲▼) gebeurt in een inline paneel op de
  **boodschappenlijst-tab** (⚙️); verwijderen kan pas als er geen product/extra artikel meer
  in zit. De categorie wordt **niet getoond** op de boodschappenlijst; de volgorde bepaalt
  wel de sortering.
- **Boodschappenlijst**: per boodschappenmoment (run) één **platte lijst** (geen
  dag/gerecht-koppen meer), gesorteerd op categorie-volgorde; artikelen zonder categorie (of
  met onbekende categorie) staan achteraan. Recept-ingrediënten en extra artikelen krijgen
  zo een categorie: extra artikelen expliciet bij toevoegen; ingrediënten erven de
  categorie/winkel van een voorraadproduct of extra artikel met dezelfde naam
  (hoofdletterongevoelig, `priceKey`). Afvinken, schaling per eters (inline doorgestreept →
  nieuw, footnote per run met de factor(en)) en "Vinkjes wissen" blijven.
- **Winkelvoorkeur** (`market` = marketKey): op de boodschappenlijst toont het artikel een
  winkel-chip in plaats van een prijs en telt het **niet mee** in `marketTotals`/dekking/
  "goedkoopste"-badge (prijsvergelijking heeft dan geen zin).
- Uitleg staat achter **ℹ️**-knoppen (popover) op de voorraad- en boodschappen-tab.
- Migratie (generiek, ADR-009): oude `stock`-items met `cat` ∈ {kast,koel,fruit,kruiden} →
  locatie `loc-kast/loc-koel/loc-fruit/loc-kruiden` en categorie conserven/zuivel/fruit/
  kruiden; oude `extraItems`-strings → `{ name, cat: "" }`; ontbrekende `stockLocations` →
  defaults. De binaire kruidenla-toggle van ADR-004 vervalt (kruidenla is nu een gewone
  locatie met genummerde producten).

## Gevolgen
+ Locaties en categorieën zijn per huishouden instelbaar en lokaal (ADR-009/010); de repo
  bevat alleen generieke defaults.
+ De boodschappenlijst is één sorteringslijst per run; de dag/gerecht-groepering vervalt.
+ Winkelvoorkeur wint het van prijsvergelijking per artikel.
- Recept-ingrediënten zonder match met een bekend product sorteren achteraan ("geen categorie").
- Oude state migreert automatisch bij het laden; `normalizeStock`/`normalizeExtras`/
  `normalizeLocations` + `normalizeSettings.shopCats` dekken dit af.
