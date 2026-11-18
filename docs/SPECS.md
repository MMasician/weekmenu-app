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

## Weekmenu (ADR-012)
- `DAYS` = 7 dagen vanaf `weekStartDay`.
- De getoonde week is de week rond de huidige datum plus een in-memory `weekOffset` (in weken). Bij het openen van de app is `weekOffset` altijd 0: de app start automatisch in de huidige week en highlight **vandaag** in de daglijst.
- De tab toont bovenaan **alleen de datum van vandaag** ("VANDAAG · di 17 nov") + de weekregel van de getoonde week + de knop **📅 Kies een datum ▾** en de primaire knop **Genereer weekmenu**. Er staat geen kalender/maandrooster op de tab zelf.
- **Datum-sheet** (bottom sheet na "Kies een datum"; sluiten via ✕ of de backdrop): weekstrip van de getoonde week (vandaag gemarkeerd), knoppen **◀ Vorige week** / **Volgende week ▶** met het weeklabel ertussen en, bij offset ≠ 0, **Naar deze week**; daaronder het maandrooster van de maand rond het midden van de getoonde week (kolommen starten op `weekStartDay`). Klik op een kalenderdag → spring naar de week van die dag. Dagen met een vergrendeld gerecht tonen een 🔒 (receptnaam als title).
- Onderaan de tab: knop **⚙️ Regels voor het weekmenu** → **regels-sheet** (bottom sheet) met alléén de generatie-regels: **weekstart** (dagchips), **visdagen** (dagchips) en **vega-doel** (stapper, 0 t/m aantal overige dagen, met "n vega · m vlees"). Wijzigingen gaan direct naar `settings` (lokaal bewaard). Link "Boodschappenmomenten, eters & winkels → Instellingen" en knop **Klaar** sluiten het sheet.
- Menu-state is per datum: `menuByDate` = `{ "<YYYY-MM-DD>": { id, locked, eaters? } | { custom, locked? } }` in localStorage-sleutel `weekmenu-app-v1` (ADR-012). Vergrendelde gerechten worden zo per datum bewaard en zijn later — als je terugkijkt naar de week van die datum — op die datum weer zichtbaar (nog steeds vergrendeld).
- Per dag een categorie: `fishDays` → vis; overige dagen vega/vlees volgens `vegaTarget`, verdeeld over de overige dagen.
- Per dag een recept uit de categorie (niet herhaald binnen de week waar mogelijk) + knop **vergrendelen**. Handmatig per dag via **tekstveld** (geen dropdown), zie "Gerecht typen".
- **Gerecht typen**: per dag een tekstveld ("Typ een gerecht…"). Na ≥ 2 letters verschijnt een suggestielijst met recepten (categorie ≠ "extra", maximaal 6; beginnend-met eerst; de gematchte letters zijn gemarkeerd; pijltjestoetsen bewegen de actieve suggestie). Enter of klik selecteert de suggestie. Enter zonder suggestie, of blur: een exacte hoofdletterongevoelige match op een receptnaam → dat recept; anders wordt de tekst als **vrije tekst** opgeslagen (`{ custom }`) met tag "📍 geen boodschappen" — die dag staat in het menu maar niet op de boodschappenlijst en het eters-icoon is uit. Een leeg veld wist de dag (bij blur/commit). Vergrendeling en `eaters` blijven behouden bij wisselen tussen recept en vrije tekst.
- **Eters per dag**: naast het slot een 👥-icoon; bij afwijking van `householdSize` een badge met het absolute aantal eters (mag ook láger zijn). Klik op het icoon → de regel klapt inline open met een stapper (−/+), "standaard: N eters" en **Standaard herstellen** (wist de override; een waarde gelijk aan `householdSize` wordt ook als standaard behandeld). Wordt opgeslagen als `eaters` in de menuByDate-entry. Bij vrije tekst is het icoon gedimd en niet actief.
- Week regenereren (geldt voor de getoonde week): vergrendelde dagen blijven staan; de afvinkjes van de getoonde week worden gewist. De boodschappenlijst volgt altijd de getoonde week.
- Migratie (ADR-005): een oude `menu`-array van 7 dagen (index t.o.v. de weekstart, zonder datum) wordt bij het laden afgebeeld op de datums van de huidige week; vinkjes-sleutels "<dagindex>-…" worden mee omgezet naar "<datum>-…".

## Recepten (ADR-006, ADR-013)
- Startpool `BASE_RECIPES` in `src/App.jsx` (ids `r1`..`rN`); de actuele pool is app-state in localStorage `weekmenu-app-v1`, veld `recipes`; `BASE_RECIPES` is seed- en reset-waarde.
- Recept: id, naam, categorie (`vega`/`vis`/`vlees`/`extra`), ingredienten[], bereiding, **`timeCat` (`kort`/`normaal`/`lang`)**, **`tags`: string[]**. De oude velden `time` (minuten) en `cook` zijn vervallen (ADR-013).
- **Zoeken & filteren (bovenaan de tab)**: zoekbalk op receptnaam (🔍, met ✕ om te wissen); direct zichtbare filterrij met tijd-chips (Alle/Kort/Normaal/Lang) + de **maximaal 5 meestvoorkomende tags** als chips (`＋n meer` en `⚙ Filters ▾` openen het filter-sheet). Uitlegtekst staat achter het ℹ️-icoon in de zoekbalk.
- **Filter-sheet** (bottom sheet): bereidingstijd als segmented (Alles/Kort/Normaal/Lang), "Ingrediënt bevat" (vrije tekst, matcht op ingrediënten), alle tags in de pool als multi-select chips. Alle filters combineren met **AND** (meerdere tags = alle tags moeten op het recept staan). Onderaan "Wis filters" + "Toon N recepten" (sluit het sheet).
- Bij actieve filters (zoekterm, tijd, ingrediënt of tag): **platte lijst op naam** + teller "n van N recepten" + actieve filterchips met × en "Alles wissen". Zonder actieve filters: gegroepeerd per categorie.
- Receptrij: naam (+ "deze week" / "geen ingredienten bekend"), categorie-chip, **tijd-badge** (kort = groen, normaal = grijs, lang = amber) en tag-chips; klik opent het bewerkformulier.
- **Toevoegen**: via het ＋-icoon in de zoekbalk → bottom sheet "Nieuw recept" (naam, categorie-chips, bereidingstijd segmented met standaard normaal, tags, ingrediënten één per regel, bereiding, knop "Toevoegen").
- **Bewerken** per recept (incl. verwijderen; een verwijderd recept verdwijnt ook uit een lopend weekmenu): naam, categorie, bereidingstijd (segmented), tags (chips met × + "＋ tag toevoegen"-veld), ingrediënten, bereiding. Er is geen "kok"-veld meer.
- Onderaan de tab: Exporteren / Importeren (JSON) / "Standaardlijst terug".
- **Seed & migratie (ADR-013)**: `BASE_RECIPES` seedt `timeCat`: `lang` = ovengerechten (r2, r24, r37, r45, r51), Kofta (r42) en Borsjt (r36); `kort` = Tortelloni met spinazie (r17) en Kip Siam (r41); alle overige recepten `normaal`; `tags: []`. Oude opslag met `time` (minuten) migreert bij het laden via `normalizeRecipe`: ≤ 25 min → `kort`, ≥ 45 min → `lang`, anders `normaal` (ontbrekend → `normaal`); `cook` wordt gewist; ontbrekende `timeCat`/`tags` worden aangevuld (ook bij import en reset).
- In de weekmenu-dagregel toont een dag nu een tijd-badge (kort/normaal/lang) in plaats van "X min"; het kok-veld is daar ook verdwenen.
- Oudere opslag zonder `recipes` wordt geseed uit `BASE_RECIPES`.

## Voorraad
- `STOCK_CATS` = kast, koel, fruit, kruiden. Per item have/want (getallen); kruidenla binair (toggle aanwezig ja/nee).
- Tekort = have < want → automatisch op de boodschappenlijst met "(n van want)"; kruidenla "aan" = tekort.
- Knoppen: "Alles aangevuld" (have = want) en "Standaardlijst terug" (reset naar `STOCK_DEFAULT`).
- `normalizeStock` bij laden.

## Boodschappen
- `shopRuns` splitst de week: ingrediënten van een gerecht vallen in de run van de dag waarop het gerecht staat.
- Per run: ingrediënten gegroepeerd per dag en per gerecht met afvinkboxen; extra vrije artikelen per run; sectie "Standaardvoorraad aanvullen" uit tekorten. Dagen met een vrije-tekst entry (`custom`) verschijnen hier niet.
- **Schaling per dag (ADR-012)**: bij een dag met `eaters`-afwijking toont de dagkop een chip "👥 N eters" en worden de ingrediënten van die dag geschaald met factor `eaters / householdSize`: alleen regels met een leidend getal + eenheid schalen mee (uitgezonderd vaste verpakkingen blik/pak/pakje/zak/doos/fles), afgerond met `Math.round` (minimaal 1); weergave "origineel (doorgehaald) → nieuw"; onder de groep een footnote met de factor ("Hoeveelheden geschaald voor N eters (×f t.o.v. standaard M); regels zonder getal blijven gelijk."). Regels zonder getal blijven ongewijzigd. Prijzen en run-totalen blijven gebaseerd op het originele label.
- "Vinkjes wissen" reset alle checkboxen; de tab toont een teller (afgevinkt/totaal).
- Prijsinformatie (ADR-008): per artikelregel rechts de beste bekende prijs (winkel + bedrag); per run-kop per winkel het totaal + dekking "(x/n met prijs)" en, bij volledige dekking, een badge "goedkoopste: <winkel>".

## Prijzen (ADR-008, ADR-010)
- Winkels uit `markets` (instellingen). Prijzen per artikel: handmatig ingevoerd óf optioneel online opgehaald (niet-privé data, ADR-010); lokaal gecached.
- Opslag: localStorage `weekmenu-app-v1`, veld `prices`: `{ "<priceKey>": { ah: 2.5, jumbo: 2.2, lidl: null } }`.
- `priceKey(label)` = getrimd + lowercase ("Melk" = "melk").
- `marketTotals(items)` somt per winkel (onbekende prijzen overgeslagen, dekking apart bijgehouden); `bestPrice(item)` = laagste bekende prijs + bijbehorende winkel.

## State & opslag (ADR-005, ADR-009, ADR-010)
- Alles in localStorage-sleutel `weekmenu-app-v1`: menu per datum (`menuByDate`: `{ id, locked, eaters? }` of `{ custom, locked? }`), vinkjes, extra artikelen, voorraad, recepten, prijzen en **settings**.
- Nooit iets naar een server of GitHub; online alleen voor niet-privé data (prijzen).

## Build & tests (ADR-011)
- Bron: `src/App.jsx`; build: `npm run build` (→ `src/app.js`, meegecommit; CI controleert synchroniteit).
- Tests: `npm test` draait alle `tools/test-*.cjs` via `tools/run-tests.cjs` tegen de gecompileerde `src/app.js` met `tools/render-harness.cjs`.
- Elke functionaliteit in dit document moet gedekt zijn door een automatische test (zie docs/TESTS.md).
