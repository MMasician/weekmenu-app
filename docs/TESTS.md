# Tests

## Werkwijze (ADR-011)
- Elke in SPECS.md beschreven functionaliteit moet een automatische test hebben in een bestand `tools/test-*.cjs`.
- Specifiek: `tools/test-i18n.cjs` dekt ADR-023 (NL default, en/fr/de, schakelen via Instellingen, dictionary-pariteit, t()-fallbacks).
- Draai alles met `npm test` (runner `tools/run-tests.cjs`); elke test draait in een eigen proces tegen de gebundelde `src/app.js` via `tools/render-harness.cjs` (de bundler zet `globalThis.App`; pure domain-functies zijn bereikbaar via `globalThis.__weekmenuModules`, zie ADR-022).
- Coverage: `npm run test:coverage` (c8) genereert `coverage/lcov.info` + samenvatting in de log; in CI gedraaid in `test.yml` en `sonarcloud.yml` (ADR-020).
- Build van bron naar app: `npm run build`. Alles in één keer: `npm run verify`.
- CI: zie de workflow in ADR-011 (te plaatsen als `.github/workflows/test.yml`; vereist een token met `workflow`-scope). De CI draait: build + controle dat `src/app.js` synchroon is met `src/App.jsx` + `npm test`.
- Agents mogen NOOIT ad-hoc scripts aanmaken om te builden of te testen. Breid een bestaand `tools/test-*.cjs` uit of voeg een bestand toe, met relatieve paden (`path.join(__dirname, "..")`). Legacy absolute paden (`/home/user/weekmenu-app/...`) worden door `tools/legacy-path-shim.cjs` automatisch naar de repo-root gemapt.

## Te testen functionaliteit (per SPECS-sectie)

### Tabbalk (#41, `tools/test-tabicoontjes.cjs`)
- 5 tabknoppen met icoon (📅📖📦🛒⚙️) + `aria-label`/`title` = tabnaam; klein tekstlabel alleen onder de actieve tab; tabwissel rendert de juiste tab.
- Boodschappen-teller als badge (`n/m`) op het 🛒-icoon, alleen bij teller > 0; geen badge bij lege lijst.

### Thema's (#40, ADR-021; `tools/test-instellingen.cjs` + `tools/test-tabicoontjes.cjs`)
- `settings.theme` default `"standaard"`; ongeldige waarde in opslag → `"standaard"`; geldige theme uit seed wordt geladen.
- Instellingen-tab: kaart "Weergave" met 5 radio's (`name="theme"`); aanklikken wijzigt `settings.theme`; root-element draagt `data-theme`.
- Feestthema's wisselen de tabicoontjes (kerstmis 🎄📖📦🎁⚙️, sinterklaas 🎁📖📦🛒🎅); donker/roze/standaard de standaardset.

### Weekmenu
- Week regenereren: vis-dagen tonen visgerechten; overige dagen alleen vega/vlees volgens de ingestelde mix (som = aantal overige dagen).
- Instellingen wijzigen (weekstart, vis-dagen, vega-aantal, aantal eters, supermarkten incl. standaard-selectie) → weekmenu en boodschappenlijst volgen de nieuwe instellingen (ADR-009, ADR-016).
- Vergrendelde dag blijft staan bij regenereren; override per dag kiesbaar uit alle recepten behalve "extra"; een recept komt niet dubbel in één week waar mogelijk.
- Kalender: bij openen start de app in de huidige week met vandaag gehighlight (daglijst); de tab toont alleen VANDAAG + knop "Kies een datum" (kalender zit in de bottom sheet); in de sheet: ◀/▶ navigeren 1 of meer weken terug/vooruit, klik op een kalenderdag springt naar de week van die dag, "Naar deze week" zet terug naar offset 0, backdrop/✕ sluit de sheet.
- Regels-sheet (knop onderaan het weekmenu): weekstart/visdagen/vega-doel wijzigen → direct doorgevoerd in `settings`; "Klaar" sluit.
- Gerecht typen (ADR-012): < 2 letters geen suggesties; ≥ 2 letters suggestielijst (categorie "extra" uitgesloten, gematchte letters gemarkeerd); Enter/klik selecteert; exacte match → recept; vrije tekst → `{ custom }` met tag "geen boodschappen" en géén regel op de boodschappenlijst; leeg veld wist de dag; vergrendeling blijft behouden.
- Eters per dag (ADR-012): 👥-icoon met badge bij afwijking, inline stapper, `{ eaters }` in `menuByDate` (absoluut, ook lager), "Standaard herstellen" wist de override; bij vrije tekst is het icoon uit; boodschappenlijst schaalt mee (factor = eaters/householdSize, Math.round min 1, vaste verpakkingen uitgezonderd) met chip in de dagkop en footnote.
- Vergrendelde gerechten worden per datum opgeslagen (`menuByDate`) en zijn op die datum later terug te vinden (ook in een nieuwe app-instance); de kalendercel toont 🔒; de boodschappenlijst volgt vandaag + het ingestelde aantal dagen, niet de getoonde week (ADR-016).
- Migratie: een oude `menu`-array wordt bij het laden gemigreerd naar `menuByDate` op de datums van de huidige week, incl. vinkjes-sleutels (ADR-005).

### Boodschappen (ADR-016, `tools/test-boodschappen-lijst.cjs`; ADR-015 voor categorieën/winkelvoorkeur in `tools/test-voorraad-locaties.cjs`)
- Scope = vandaag + aantal dagen (0..max aaneengesloten gelockte dagen, default min(4,max)); stapper in de kop ("+" disabled op max); gerecht van een niet-gelockte dag staat niet op de lijst; 0 dagen = alleen extra/voorraad. Keuze is vluchtig (niet in settings).
- Supermarkt-chips: default-selectie uit `defaultShop`; artikel met winkelvoorkeur buiten de selectie is verborgen (met winkel-chip als zichtbaar); lege lijst door filter → "Niets te halen bij …" + "Toon alle supermarkten"-reset.
- Eén platte lijst (ingrediënten in scope + extra + tekorten), gesorteerd op categorie-volgorde, zonder sectiekoppen; teller (afgevinkt/totaal) in de tab; afvinken per artikel; "Vinkjes wissen" reset.
- Datumchip bij groente/zuivel-ingrediënt-rijen met de datum van het gerecht.
- "Klaar met winkelen" (groen): inline melding ✅ n compleet · ❗ m mist nog (live; lijst blijft afvinkbaar); gerechtstatus ✅/❗/niets in het weekmenu per dag in scope.
- Extra artikel toevoegen (optioneel met categorie); sortering op categorie (fruit vóór lekkers).
- Voorraadtekorten met "(n van want)" in dezelfde platte lijst.
- Categorieën beheren via ⚙️ (inline paneel): toevoegen, ▲▼-volgorde, verwijderen disabled bij gebruik.
- Schaling per eters (ADR-012): inline "origineel → nieuw" per regel + footnote met de factor.
- Prijzen-tab en boodschappenmomenten (runs) zijn weg; `shopRuns`/`prices` worden niet meer opgeslagen; `markets` heeft per winkel `defaultShop` (standaard-checkbox in Instellingen).

### Voorraad (ADR-015, `tools/test-voorraad-locaties.cjs`)
- Default-locaties geseed; locaties starten ingeklapt; teller is een kaal getal.
- Locatie toevoegen via inline formulier onderaan; 🗑️ disabled zolang er producten aan hangen, leeg wel verwijderbaar.
- Uitklappen toont producten (kale categorie als subtekst zonder "categorie:", #36; have-stapper, grijs "gewenst n", winkel-chip, ✕); product toevoegen via inline formulier (naam + categorie verplicht + supermarkt optioneel + want-stapper, default 1; have = want); product altijd verwijderbaar.
- ✏️ edit-modus per locatie: want-stapper ipv grijs getal; have < want → tekort ("op lijst") → op de boodschappenlijst.
- "Alles aangevuld" zet have = want; "Standaardlijst terug" reset naar defaults (17 producten, 5 locaties).
- ℹ️-popover met uitleg op voorraad- en boodschappen-tab.
- Migratie: oude `stock` (cat = kast/koel/fruit/kruiden) → locatie + categorie; oude `extraItems`-strings → `{ name, cat: "" }`; `shopCats` default in settings.
- Herladen: alle state (menu, vinkjes, voorraad, locaties, settings) bewaard via localStorage-sleutel `weekmenu-app-v1`.

### Recepten / data
- Pool start met `BASE_RECIPES`; recept bewerken en verwijderen (verdwijnt ook uit een lopend menu); import/export als JSON; reset naar startpool.
- Oudere state zonder `recipes` / `settings` wordt genormaliseerd/geseed bij laden; oude `shopRuns`/`prices` worden genegeerd (ADR-016).
- Recepten-tab (ADR-013, `tools/test-recepten-ux.cjs`): seed `timeCat` (lang: r2/r24/r36/r37/r42/r45/r51, kort: r17/r41, rest normaal) en geen `time`/`cook` in het model; migratie van oude `time` (≤ 25 min → kort, ≥ 45 min → lang, anders normaal) met `cook` gewist en `tags`/`timeCat` aangevuld; zoekbalk op naam met teller "n van N recepten" en actieve filterchips + "Alles wissen"; filter op tijd (chips + segmented in het filter-sheet); ingrediënt-filter "bevat"; tag-filters AND; maximaal 5 tagchips direct zichtbaar + "meer"; zonder filters gegroepeerd per categorie, mét filters platte lijst; info-tekst pas na ℹ️; toevoegen pas na ＋-icoon (bottom sheet) met `timeCat` + `tags`; bewerken met segmented tijd en tags toevoegen/verwijderen, zonder "kok"-veld; weekmenu-dagregel toont de tijd-badge (geen "X min" meer).
- Recepten-tab sorteren/readonly/edit (ADR-018, `tools/test-recepten-sorteren-readonly.cjs`): sorteerknop "⇅ Sorteer ▾" met dropdown Naam (A–Z) / Laatst gegeten; bij "laatst" platte lijst, Onbekend (nooit vergrendeld) bovenaan dan op datum oplopend, alleen vergrendelde dagen t/m vandaag tellen (toekomst/niet-vergrendeld niet), badges "🕒 …" alleen bij die sortering; rij-klik opent readonly-detail met prodchips (klik → inline product-kaart) + bereiding, zonder bewerkvelden; ✏️ opent bewerkformulier inline met categorie als chips; "Nieuw recept" heeft inline ingrediënt-rijen met autocomplete (Enter koppelt bestaand product), geen textarea meer.
- Weekmenu-koppeling vanuit de receptenlijst (ADR-013 ronde 2): elke rij heeft een 📅-knop → dagkiezer "Kies een dag deze week" (7 dagen, 🔒 vergrendeld = disabled, vandaag gemarkeerd); kiezen wijst het recept toe aan die dag in `menuByDate` (onvergrendeld gerecht wordt overschreven, `eaters` blijft, vergrendeld NOOIT), sheet sluit + toast "✅ … toegevoegd aan …".

### Prijzen — vervallen (ADR-016 deprecate ADR-008)
- Geen Prijzen-tab, geen prijsvelden, geen totalen/"goedkoopste"-badge; `prices` staat niet meer in de opslag. Gedekt in `tools/test-boodschappen-lijst.cjs` en `tools/test-instellingen.cjs`.

### Delen via bestand (ADR-019, `tools/test-delen-bestand.cjs`)
- Instellingen-tab: 📤/📥/ℹ️-iconen aanwezig (vindbaar op title-attributen, géén beschrijvende tekst in beeld).
- Export-sheet: titel "Delen via bestand", chips Recepten/Producten/Voorraad/Weekmenu/Instellingen·vinkjes·verwijderingen met aantallen, chip-toggle werkt, "Maak deelbestand"-knop.
- Info-sheet ("Delen: hoe werkt het?") legt het nieuwste-wint-principe uit.
- Pure samenvoegregels (`mergeShareBundle` uit `src/app.js`): nieuwer uit bestand wint (+conflict met hier/daar), gelijke ts blijft, nieuwe records toegevoegd, bron-verwijdering verwijdert lokaal en bewaart de markering, lokaal verwijderde blijft weg tenzij nieuwer uit bron, chips-gates (chip uit = soort blijft lokaal), weekmenu per dag, instellingen/vinkjes als geheel, puur/deterministisch.
