# Tests

## Werkwijze (ADR-011)
- Elke in SPECS.md beschreven functionaliteit moet een automatische test hebben in een bestand `tools/test-*.cjs`.
- Draai alles met `npm test` (runner `tools/run-tests.cjs`); elke test draait in een eigen proces tegen de gecompileerde `src/app.js` via `tools/render-harness.cjs`.
- Build van bron naar app: `npm run build`. Alles in één keer: `npm run verify`.
- CI: zie de workflow in ADR-011 (te plaatsen als `.github/workflows/test.yml`; vereist een token met `workflow`-scope). De CI draait: build + controle dat `src/app.js` synchroon is met `src/App.jsx` + `npm test`.
- Agents mogen NOOIT ad-hoc scripts aanmaken om te builden of te testen. Breid een bestaand `tools/test-*.cjs` uit of voeg een bestand toe, met relatieve paden (`path.join(__dirname, "..")`). Legacy absolute paden (`/home/user/weekmenu-app/...`) worden door `tools/legacy-path-shim.cjs` automatisch naar de repo-root gemapt.

## Te testen functionaliteit (per SPECS-sectie)

### Weekmenu
- Week regenereren: vis-dagen tonen visgerechten; overige dagen alleen vega/vlees volgens de ingestelde mix (som = aantal overige dagen).
- Instellingen wijzigen (weekstart, vis-dagen, vega-aantal, shop-runs, aantal eters) → weekmenu en boodschappenlijst volgen de nieuwe instellingen (ADR-009).
- Vergrendelde dag blijft staan bij regenereren; override per dag kiesbaar uit alle recepten behalve "extra"; een recept komt niet dubbel in één week waar mogelijk.
- Kalender: bij openen start de app in de huidige week met vandaag gehighlight (daglijst); de tab toont alleen VANDAAG + knop "Kies een datum" (kalender zit in de bottom sheet); in de sheet: ◀/▶ navigeren 1 of meer weken terug/vooruit, klik op een kalenderdag springt naar de week van die dag, "Naar deze week" zet terug naar offset 0, backdrop/✕ sluit de sheet.
- Regels-sheet (knop onderaan het weekmenu): weekstart/visdagen/vega-doel wijzigen → direct doorgevoerd in `settings`; "Klaar" sluit.
- Gerecht typen (ADR-012): < 2 letters geen suggesties; ≥ 2 letters suggestielijst (categorie "extra" uitgesloten, gematchte letters gemarkeerd); Enter/klik selecteert; exacte match → recept; vrije tekst → `{ custom }` met tag "geen boodschappen" en géén regel op de boodschappenlijst; leeg veld wist de dag; vergrendeling blijft behouden.
- Eters per dag (ADR-012): 👥-icoon met badge bij afwijking, inline stapper, `{ eaters }` in `menuByDate` (absoluut, ook lager), "Standaard herstellen" wist de override; bij vrije tekst is het icoon uit; boodschappenlijst schaalt mee (factor = eaters/householdSize, Math.round min 1, vaste verpakkingen uitgezonderd) met chip in de dagkop en footnote.
- Vergrendelde gerechten worden per datum opgeslagen (`menuByDate`) en zijn op die datum later terug te vinden (ook in een nieuwe app-instance); de kalendercel toont 🔒; de boodschappenlijst volgt de getoonde week.
- Migratie: een oude `menu`-array wordt bij het laden gemigreerd naar `menuByDate` op de datums van de huidige week, incl. vinkjes-sleutels (ADR-005).

### Boodschappen (ADR-015, `tools/test-voorraad-locaties.cjs`)
- Ingrediënten vallen onder de juiste run (volgens `shopRuns`); per run één platte lijst gesorteerd op categorie-volgorde (`settings.shopCats`), zonder categorietekst; artikelen zonder categorie achteraan.
- Extra artikel toevoegen (optioneel met categorie) en afvinken → teller in de tab daalt; sortering op categorie (fruit vóór lekkers); "Vinkjes wissen" reset alle checkboxen, artikelen blijven.
- Voorraadtekorten verschijnen onder "Standaardvoorraad aanvullen" met "(n van want)".
- Categorieën beheren via ⚙️ (inline paneel): toevoegen, ▲▼-volgorde, verwijderen disabled bij gebruik.
- Artikel met winkelvoorkeur toont een winkel-chip ipv een prijs en telt niet mee in run-totalen/dekking/"goedkoopste".
- Schaling per eters (ADR-012): inline "origineel → nieuw" per regel + footnote per run met de factor.

### Voorraad (ADR-015, `tools/test-voorraad-locaties.cjs`)
- Default-locaties geseed; locaties starten ingeklapt; teller is een kaal getal.
- Locatie toevoegen via inline formulier onderaan; 🗑️ disabled zolang er producten aan hangen, leeg wel verwijderbaar.
- Uitklappen toont producten (categorie als subtekst, have-stapper, grijs "gewenst n", winkel-chip, ✕); product toevoegen via inline formulier (naam + categorie verplicht + supermarkt optioneel + want-stapper, default 1; have = want); product altijd verwijderbaar.
- ✏️ edit-modus per locatie: want-stapper ipv grijs getal; have < want → tekort ("op lijst") → op de boodschappenlijst.
- "Alles aangevuld" zet have = want; "Standaardlijst terug" reset naar defaults (17 producten, 5 locaties).
- ℹ️-popover met uitleg op voorraad- en boodschappen-tab.
- Migratie: oude `stock` (cat = kast/koel/fruit/kruiden) → locatie + categorie; oude `extraItems`-strings → `{ name, cat: "" }`; `shopCats` default in settings.
- Herladen: alle state (menu, vinkjes, voorraad, locaties, settings) bewaard via localStorage-sleutel `weekmenu-app-v1`.

### Recepten / data
- Pool start met `BASE_RECIPES`; recept bewerken en verwijderen (verdwijnt ook uit een lopend menu); import/export als JSON; reset naar startpool.
- Oudere state zonder `recipes` / `settings` / `prices` wordt genormaliseerd/geseed bij laden.
- Recepten-tab (ADR-013, `tools/test-recepten-ux.cjs`): seed `timeCat` (lang: r2/r24/r36/r37/r42/r45/r51, kort: r17/r41, rest normaal) en geen `time`/`cook` in het model; migratie van oude `time` (≤ 25 min → kort, ≥ 45 min → lang, anders normaal) met `cook` gewist en `tags`/`timeCat` aangevuld; zoekbalk op naam met teller "n van N recepten" en actieve filterchips + "Alles wissen"; filter op tijd (chips + segmented in het filter-sheet); ingrediënt-filter "bevat"; tag-filters AND; maximaal 5 tagchips direct zichtbaar + "meer"; zonder filters gegroepeerd per categorie, mét filters platte lijst; info-tekst pas na ℹ️; toevoegen pas na ＋-icoon (bottom sheet) met `timeCat` + `tags`; bewerken met segmented tijd en tags toevoegen/verwijderen, zonder "kok"-veld; weekmenu-dagregel toont de tijd-badge (geen "X min" meer).
- Weekmenu-koppeling vanuit de receptenlijst (ADR-013 ronde 2): elke rij heeft een 📅-knop → dagkiezer "Kies een dag deze week" (7 dagen, 🔒 vergrendeld = disabled, vandaag gemarkeerd); kiezen wijst het recept toe aan die dag in `menuByDate` (onvergrendeld gerecht wordt overschreven, `eaters` blijft, vergrendeld NOOIT), sheet sluit + toast "✅ … toegevoegd aan …".

### Prijzen
- Zonder prijzen: geen totalen en geen "goedkoopste"-badge, wel de lijst.
- Prijs invullen per winkel → artikelregel toont de beste prijs; run-kop toont per winkel totaal + dekking "(x/n)".
- Volledige dekking van een run → badge "goedkoopste: <winkel>"; deels gevuld → geen badge.
- Hoofdletterongevoelig matchen ("melk" = "Melk"); spaties rond een label worden genegeerd.
- Prijs verwijderen (✕) → rij en totalen verdwijnen.
