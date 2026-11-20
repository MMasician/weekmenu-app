# ADR-016: Boodschappenlijst van vandaag — dagenbereik, supermarktkeuze, houdbaarheidsdatum, gerechtstatus; runs en prijzen-tab vervallen

## Status
Accepted (2026-11-20, PR #26). Deprecate ADR-003 (boodschappenruns) en ADR-008 (lokale prijzendatabase).

## Context
De boodschappenlijst was gesplitst per opgeslagen boodschappenmoment (`shopRuns`, ADR-003) en had een
aparte Prijzen-tab met een lokale prijzendatabase (ADR-008). De gebruiker wil: geen vast aantal
boodschappenmomenten meer in de app opslaan; in de boodschappen-tab alleen de lijst van vandaag zien,
met bovenaan een verkiezing voor hoeveel dagen (gerechten) er boodschappen worden gedaan en bij welke
supermarkt(en). Producten met een winkelvoorkeur voor een niet-geselecteerde supermarkt hoeven niet
getoond te worden. De lijst is één platte lijst op categorie-volgorde (ongeacht ingrediënt/voorraad/extra).
Tijdens het winkelen per product afvinken; bij «klaar» hoeven niet alle vinkjes gezet te zijn (uitverkocht).
Per gerecht binnen de scope van de lijst krijgt het weekmenu een ✅ (alles in huis) of ❗ (mist nog),
bij niets gehaald geen indicator. Ingrediënten van een gerecht in categorie groente of zuivel tonen de
datum waarop ze nodig zijn (beperkt houdbaar). De prijzen-tab is niet zinvol en vervalt helemaam.
UX-voorstel met mocks per scherm (2 ronden, per scherm goedgekeurd): `docs/ux/boodschappen-lijst-vandaag/`
(PR #26).

## Besluit
1. **Scope = vandaag + instelbaar aantal dagen.** `scopeKeys` = de 7 datums vanaf vandaag (door de
   weekgrens heen; `menuByDate` is per datum). Het maximum aantal dagen = het aantal **aaneengesloten
   gelockte dagen met een gerecht** vanaf vandaag (max 7). Default = `min(4, maximum)`. Bereik 0..max.
   De keuze (aantal dagen en supermarktkeuze) is **vluchtig** (useState, wordt niet in localStorage/settings
   opgeslagen). `shopRuns` is uit `settings` verwijderd (oude data wordt genegeerd/verwijderd bij normaliseren).
2. **Supermarktkeuze bovenaan de tab** als multi-select chips uit `settings.markets` (korte label).
   Default-selectie = de winkels met `defaultShop: true` (nieuw per-winkel veld in `settings.markets`,
   default `true`, in Instellingen per supermarkt in/uit te schakelen via een «standaard»-checkbox).
   Een artikel met een winkelvoorkeur (`market`) die niet in de selectie zit, wordt **verborgen**.
   Lege lijst door de filter → melding «Niets te halen bij <geselecteerde supermarkt(en)>» + chip
   «Toon alle supermarkten» (reset). De kop is één regel: stapper aantal dagen + «dagen» + chips;
   de titel toont «Boodschappenlijst · <datum van vandaag>» (geen range/max/telling in de kop).
3. **Eén platte lijst**: ingrediënten van gerechten in scope + extra artikelen + voorraadtekorten,
   alle tesamen gesorteerd op `shopCats`-volgorde (categorie zelf niet zichtbaar); artikelen zonder
   categorie achteraan. Geen sectiekoppen («Extra», «Standaardvoorraad aanvullen») meer. Afvinkboxen per
   artikel + teller (afgevinkt/totaal van de zichtbare lijst) in de tab. Schaling per afwijkende eters
   (ADR-012) blijft: inline «origineel → nieuw» + footnote met de factor.
4. **Houdbaarheidsdatum**: bij een ingrediënt-rij (van een gerecht) met categorie `groente` of `zuivel`
   een datumchip achter de naam: `<dagkort> <DD-MM>` van de dag van dat gerecht.
5. **Afvinken & klaar**: per product afvinken tijdens het winkelen. Knop **«Klaar met winkelen»** (groen)
   forceert niets; toont een inline melding «✅ n gerechten compleet · ❗ m mist nog iets — zie weekmenu
   (lijst blijft afvinkbaar)». Niet-gezette vinkjes (uitverkocht) blijven open en kunnen achteraf alsnog
   worden afgevinkt; de melding en de weekmenu-status zijn live. «Vinkjes wissen» reset alles.
6. **Gerechtstatus in het weekmenu** (per datum, zichtbaar in de weekweergave van die datum): over de
   zichtbare (na winkel-filter) ingrediënten van het gerecht van die dag, binnen de scope van de lijst:
   alles gecheckt → **✅** (title «Alle ingrediënten van dit gerecht zijn in huis»); minstens één gecheckt
   maar niet alles → **❗** (title «n van m ingrediënten mist nog»); niets gecheckt → geen indicator.
   Dagen buiten de scope tonen niets. Emoji-icoontjes tussen eters-knop en slot.
7. **Prijzen-tab vervalt helemaam** (ADR-008 deprecated): tab, prijsvelden, per-run totalen/dekking/
   «goedkoopste»-badge, per-artikel beste prijs en de `prices`-state zijn uit de app; `prices` wordt niet
   meer opgeslagen. `settings.markets` blijft, als «Supermarkten» (voor de winkelkeuze op de
   boodschappenlijst, incl. `defaultShop`). De link in het regels-sheet heet «Eters & supermarkten → Instellingen».
8. Cache-bump bij deze app-wijziging in dezelfde PR: `CACHE_VERSION` v8→v9 (`sw.js`) en `?v=7`→`?v=8`
   (`index.html`, 4 plekken).

## Gevolgen
+ De lijst sluit aan bij het echte winkelmoment (vandaag + zelf gekozen aantal dagen) zonder dat het
  aantal boodschappenmomenten in de app staat.
+ Minder schermruis: geen runs, geen prijzen, geen sectiekoppen; de kop is één regel.
+ Houdbaarheid (groente/zuivel) en «alles in huis»-status zijn direct zichtbaar.
- `shopRuns`/`prices` uit oude localStorage worden bij laden genegeerd (verdwijnen bij de volgende save).
- De dagenkeuze stel je per keer opnieuw in (default min(4, max)); een vaste afwijking is niet opgeslagen.
- Tests: `tools/test-prijzen.cjs` vervalt; nieuwe `tools/test-boodschappen-lijst.cjs` dekt scope,
  winkel-filter, platte lijst, datumchip, afvinken/klaar, gerechtstatus en de Instellingen-wijzigingen.
