# Handmatige testscenario's

## Weekmenu
1. Week regenereren: zaterdag en woensdag tonen visgerechten; overige dagen
   alleen vega/vlees volgens de ingestelde mix (som <= 5).
2. Mix aanpassen naar bijv. 4 vega / 1 vlees: na regeneren 4 vega-dagen.
3. Dag vergrendelen en regenereren: gerecht blijft ongewijzigd.
4. Override via dropdown: kiest een specifiek gerecht (Speelklei/"extra"
   komt niet in de lijst voor); blijft na regenereren staan.
5. Tijd (min) en kooktekst van een recept bewerken: waarde blijft bewaard na
   regenereren en na herladen.

## Boodschappen
6. Ingredienten verschijnen onder de juiste run: dagen 0-3 bij "zaterdag",
   dagen 4-6 bij "woensdag".
7. Extra artikel toevoegen en afvinken: teller in de tab daalt met 1.
8. "Vinkjes wissen": alle checkboxen worden gereset, artikelen blijven.

## Voorraad
9. Item have < want zetten: verschijnt onder "Standaardvoorraad aanvullen"
   met "(n van want)".
10. Kruidenla toggle: tekort(true) verschijnt als binair item.
11. "Alles aangevuld": alle tekorten verdwijnen (have = want).
12. "Standaardlijst terug": voorraad = STOCK_DEFAULT.
13. Herladen pagina: alle state (menu, vinkjes, voorraad) bewaard via
    localStorage-sleutel "weekmenu-app-v1".

## Data
14. Receptenpool telt 52 recepten: 20 vega, 11 vis, 20 vlees, 1 extra
    (na eerste start / na "Standaardlijst terug").

## Recepten bewerken (ADR-006)
15. Nieuw recept toevoegen (naam, categorie, ingredienten per regel,
    bereiding): verschijnt direct in de juiste categorie in de tab Recepten en
    is kiesbaar in het weekmenu-dropdown; na herladen nog aanwezig (localStorage
    veld "recipes").
16. Bestaand recept bewerken (naam, categorie, tijd, kok, ingredienten,
    bereiding): wijzigingen direct zichtbaar in weekmenu en op de
    boodschappenlijst, en bewaard na herladen.
17. Recept verwijderen dat in het weekmenu staat: die dag wordt leeg
    ("Nog niets gekozen"), het recept is weg uit dropdown en tab Recepten.
18. Recept met alleen lege ingredientregels: wordt niet automatisch ingepland
    en telt als "geen ingredienten bekend".
19. Exporteren: downloadt recepten.json met de volledige (bewerkte) pool.
20. Importeren van een eerder geëxporteerde recepten.json: pool wordt
    vervangen; weekmenu-verwijzingen naar bestaande ids blijven werken.
21. Oude opslag (zonder "recipes", met "edits" voor tijd/kooktekst): pool wordt
    geseed uit BASE_RECIPES en oude tijd/kooktekst-edits blijven behouden.
22. "Standaardlijst terug" in Recepten (na bevestigen): pool terug op de 52
    basisrecepten; menu- en voorraad-state blijven onaangetast.

## Prijzen (ADR-008)
23. Prijzentab toont ingredienten van het huidige weekmenu, voorraadtekorten
    en extra-artikelen onder "Op de lijst deze week"; eerder geprijsde
    artikelen die niet op de lijst staan onder "Overige artikelen".
24. Prijs invullen per winkel (bijv. zalm ah 8,50): artikelregel in de tab
    Boodschappen toont rechts "Albert € 8,50" zodra het artikel op de lijst
    staat; de run-kop toont totalen per winkel met dekking "(x/n)".
25. Alle artikelen van een run bij alle drie de winkels prijzen: kop toont
    badge "goedkoopste: <winkel>" met de laagste run-totaal.
26. Deels gevulde run (niet elk artikel geprijsd): totalen blijven zichtbaar,
    maar de "goedkoopste"-badge verschijnt niet.
27. Hoofdletterongevoelig matchen: prijs voor "melk" (ingetypt) geldt ook
    voor ingredient "Melk" en vice versa; spaties rondom worden genegeerd.
28. Alle drie de prijsvelden leegmaken of artikel verwijderen (✕): rij en
    prijzen verdwijnen (ook na herladen).
29. Prijzen bewaard na herladen: localStorage-veld "prices" onder de bestaande
    sleutel "weekmenu-app-v1"; oude opslag zonder "prices" werkt gewoon door.
30. Automatische regressietest: `node tools/test-prijzen.cjs` (alle 12 checks)
    en `node tools/jsx-transform.cjs src/App.jsx src/app.js` gevolgd door een
    rendervergelijking tegen de vorige app.js (tools/render-harness.cjs).
