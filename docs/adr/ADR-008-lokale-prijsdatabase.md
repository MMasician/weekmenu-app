# ADR-008: Lokale prijzendatabase voor supermarktvergelijking

## Status
Geaccepteerd

## Context
De gebruiker wilde inzicht in supermarktprijzen (Albert Heijn, Jumbo, Lidl),
in eerste instantie op basis van de eigen boodschappenlijst. Een live koppeling
is niet haalbaar: de supermarkten bieden geen officiële consumenten-API voor
prijzen of aankoopgeschiedenis, scraping van hun sites/apps staat op gespannen
voet met de gebruiksvoorwaarden, en de app is een volledig offline PWA zonder
backend (ADR-007). Wat de gebruiker wél heeft: de prijzen gewoon in zicht in de
supermarkt-apps en folders.

## Besluit
1. **Handmatige, lokale prijzendatabase**: per artikel (ingredient,
   voorraaditem of extra-artikel) kunnen prijzen per winkel worden ingevuld
   in de nieuwe tab "Prijzen". Opslag in het bestaande localStorage-object
   `weekmenu-app-v1` onder veld `prices` (geen nieuwe sleutel, geen migratie
   nodig: oudere opslag zonder `prices` start met een lege database).
2. **Winkelset**: vast `MARKETS = [ah, jumbo, lidl]`; uitbreiden is een
   eenregelige aanpassing.
3. **Matching op genormaliseerde naam**: sleutel is de artikelnaam getrimd en
   in kleine letters ("Melk" = "melk"), zodat receptingredienten automatisch
   koppelen zonder dat de gebruiker een aparte productenlijst hoeft bij te
   houden.
4. **Rekenwerk in de app**: `marketTotals` somt per run per winkel (met
   dekkingstelling "(x/n)") en `bestPrice` zoekt de laagste bekende prijs per
   artikel. De boodschappen-tab toont per artikel de beste prijs en per run
   de winkeltotalen plus een "goedkoopste"-tip zodra de dekking volledig is.
5. **Geen automatische synchronisatie**: prijzen worden niet uit de
   supermarkten opgehaald; er is bewust geen scraping/koppeling ingebouwd.
   Mocht er later een betrouwbare bron komen, dan kan het veld `prices`
   gevuld worden zonder de UI te veranderen.

## Gevolgen
+ Werkt volledig offline, geen account of externe service, privacy-neutraal.
+ Richtprijzen en winkelkeuze worden direct uit de eigen boodschappenlijst
  afgeleid (de wens "op basis van mijn eigen lijst").
- Prijzen kunnen verouderen; actualiseren is handwerk in de tab Prijzen.
- Totalen zijn richtprijzen: receptingredienten zijn vrij tekst ("800 g
  wokgroente met peulen") en koppelen op naam, niet op EAN/verpakking.
