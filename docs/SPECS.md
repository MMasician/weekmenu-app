# Functionele specificatie

## Tabs
1. Weekmenu
2. Recepten
3. Voorraad
4. Boodschappen
5. Prijzen

## Weekmenu
- Week start **zaterdag**. `DAYS` index 0-6 = za, zo, ma, di, wo, do, vr.
- Categorieregels per dag:
  - `FISH_DAYS = [0, 4]` -> vis op zaterdag en woensdag (automatisch).
  - `OTHER_DAYS = [1, 2, 3, 5, 6]` -> vega/vlees volgens instelbare mix.
- Mix-instelling: aantal vega-dagen (standaard 2) en vlees-dagen (standaard 3),
  som afgekapt op 5 niet-vis-dagen. Verdeeld over `OTHER_DAYS`.
- Elke dag: recept uit de bijbehorende categorie (niet herhaald binnen de week
  waar mogelijk), knop **vergrendelen**, en dropdown **override** met alle
  recepten behalve categorie "extra".
- Regeneratie respecteert vergrendelde dagen en overrides.
- Per recept getoond: naam, categorie, bewerkbare tijd in minuten en bewerkbare
  vrije tekst "koken". Tijd en kooktekst worden, net als alle overige
  receptvelden, in de receptenpool zelf opgeslagen (zie ADR-006).

## Recepten
- Startpool `BASE_RECIPES` in App.jsx: 52 recepten, ids `r1`-`r52`, uit
  "Recepten 2 per blad.docx" (vega: 20, vis: 11, vlees: 20, extra: 1).
- De actuele receptenpool is app-state en wordt bewaard in localStorage onder
  de bestaande sleutel `weekmenu-app-v1` (nieuw veld `recipes`);
  `BASE_RECIPES` is alleen de seed- en reset-waarde (ADR-006).
- Elk recept: id, naam, categorie, ingredienten[], bereiding, tijd (min),
  kooktekst.
- In de tab "Recepten" bewerkbaar: recept toevoegen (naam, categorie,
  ingredienten per regel, bereiding) en per recept naam, categorie, ingredienten,
  bereiding, tijd en kooktekst wijzigen, verwijderen, exporteren/importeren als
  JSON en terugzetten naar de startpool.
- Oudere opslag zonder `recipes` wordt geseed uit `BASE_RECIPES`; eerder
  bewaarde `edits` (tijd, kooktekst) worden daarbij in de recepten gemerged.
- Verwijderde recepten verdwijnen ook uit een lopend weekmenu (dag wordt leeg).

## Boodschappen
- `SHOP_RUNS` splitst de week in run **"zaterdag"** (dagen 0-3) en run
  **"woensdag"** (dagen 4-6).
- Per run: ingredienten gegroepeerd per dag en per gerecht, met afvinkboxen.
- Extra vrije artikelen toevoegbaar per run.
- Sectie "Standaardvoorraad aanvullen": automatisch gegenereerd uit voorraadtekorten.
- Knop om alle vinkjes te wissen; teller van openstaande artikelen in de tab.
- **Prijsinformatie (ADR-008)**: per artikelregel staat rechts de beste bekende
  prijs (winkel + bedrag) indien het artikel prijzen heeft.
- Per run toont de kop een rijtje met per winkel het totaal en dekking
  "(x/n met prijs)", en, als alle artikelen van de run een prijs hebben bij
  minstens n winkel, een badge "goedkoopste: <winkel>".

## Prijzen (ADR-008)
- `MARKETS = [ah (Albert Heijn), jumbo, lidl]`; prijzen per artikel, handmatig
  ingevoerd (supermarkt-apps/folders), bedrag in euro's (decimaal punt of komma,
  `type=number step=0.01`).
- Opslag: localStorage-sleutel `weekmenu-app-v1`, veld `prices`:
  `{ "<sleutel>": { ah: 2.5, jumbo: 2.2, lidl: null } }`.
- Sleutel: `priceKey(label)` = getrimd en lowercase ("Melk" = "melk"), zodat
  ingredienten uit recepten automatisch matchen, ongeaccentueerde invoer
  daarentegen niet (exacte match na normalisatie).
- Prijstab toont twee secties: "Op de lijst deze week" (ingredienten van het
  huidige menu + voorraadtekorten + extra-artikelen) en "Overige artikelen"
  (alles waar ooit prijzen voor zijn ingevuld, alfabetisch).
- Artikel toevoegen (vrij veld) levert direct een rij met drie prijsvelden;
  zijn alle drie prijzen leeg, dan vervalt de hele rij weer.
- Verwijderen (✕) haalt alle prijzen van dat artikel weg.
- `marketTotals(items)` somt per winkel de bekende prijzen (onbekende prijzen
  worden overgeslagen, dekking wordt apart bijgehouden);
  `bestPrice(item)` geeft de laagste bekende prijs + bijbehorende winkel.
- Bedragen worden genoteerd-geformatteerd met Nederlandse notatie:
  `€ 12,30` (`fmtEuro`).

## Voorraad
- `STOCK_CATS = [kast, koel, fruit, kruiden]`.
- Item: `{ name, cat, have, want }`. Tekort als `have < want` -> automatisch op
  de boodschappenlijst met vermelding "(n van want)".
- Kruidenla: binaire toggle (present ja/nee) i.p.v. have/want-nummers.
- Knoppen: "Alles aangevuld" (have = want), "Standaardlijst terug"
  (reset naar `STOCK_DEFAULT`).
- Opslag: localStorage-sleutel **`weekmenu-app-v1`**, met `normalizeStock`-migratie
  voor oudere opslagformaten.

## Bekende beperking
- Foto-herkenning van voorraad is in de app niet mogelijk. Workaround: foto in
  de chat sturen; Vibe leest de foto en zet voorraadstatussen in de app-code.
- Prijzen worden niet automatisch uit de supermarkten opgehaald (geen officiële
  API's, offline PWA); het is een handmatige prijzendatabase (ADR-008).
