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
14. Receptenpool telt 52 recepten: 20 vega, 11 vis, 20 vlees, 1 extra.
