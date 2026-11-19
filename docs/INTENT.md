# Intentie

## Doel
Een simpele, installeerbare web-app (PWA) waarmee een huishouden automatisch een weekmenu samenstelt uit een eigen receptenpool en daraus, plus de voorraadstatus, met één klik een boodschappenlijst genereert — gesplitst per boodschappenmoment.

De app is niet aan één huishouden gebonden: elk huishouden kan zelf instellen hoe het wil eten en boodschappen doen (weekstart, boodschappenmomenten, dagcategorieën zoals vis/vegetarisch/vlees, en het aantal eters waarop de recepten zijn afgestemd). Die gegevens zijn per huishouden en blijven lokaal op het eigen apparaat.

## Principes
1. **Per huishouden instelbaar en lokaal bewaard** — instellingen, recepten, voorraad, weekmenu, afvinkstatus en prijzen staan in localStorage op het eigen apparaat. Geen account, geen server; het ene huishouden ziet niets van het andere (ADR-009).
2. **Privé-context staat niet in GitHub** — household-specifieke context (gezinssamenstelling, routines, voorkeuren) hoort niet in deze repo. In de repo staat alleen de algemene, deelbare app. Privé-context leeft buiten de repo: in een privé-skill en in de lokale app-instellingen (ADR-010).
3. **Offline-first; online alleen voor niet-privé data** — de app werkt volledig offline. Netwerk mag alleen worden gebruikt voor gegevens die niet privé zijn, zoals het optioneel ophalen van actuele supermarktprijzen (ADR-008, ADR-010).
4. **Zo min mogelijk handwerk** — weekmenu en boodschappenlijst worden automatisch gegenereerd; per dag kan handmatig worden afgeweken (vergrendelen / override).
5. **Eén bronbestand** — de app-logica staat in `src/App.jsx` en wordt met een vastgelegde build-stap gecompileerd naar `src/app.js` (`npm run build`). Zo lang dat beheerbaar is, blijft het één bestand (ADR-001, ADR-011).
6. **Alle functionaliteit automatisch getest** — alles wat in SPECS.md staat, heeft een automatische test in `tools/test-*.cjs`, te draaien met `npm test` (docs/TESTS.md, ADR-011). Agents maken hiervoor geen losse scripts.

## Functionele wensen (algemeen; per huishouden instelbaar via Instellingen)
1. Weekstart instelbaar (standaard: zaterdag).
2. Boodschappenmomenten instelbaar: standaard twee runs (start van de week en halverwege), elk met eigen label en dagen.
3. Dagcategorieën instelbaar: vaste vis-dagen (standaard: weekstart en middel van de week) en voor de overige dagen een instelbare vega/vlees-verhouding.
4. Eigen receptenpool: recepten toevoegen, bewerken (naam, categorie, ingredienten, bereiding, bereidingstijd kort/normaal/lang, tags), verwijderen, exporteren/importeren als JSON en resetten naar de startpool. In de recepten-tab zoek je op receptnaam en filter je op bereidingstijd, ingrediënten en/of tags.
5. Weekmenu automatisch genereren: per dag een recept uit de dagcategorie (niet herhaald binnen de week waar mogelijk), met knop vergrendelen en per dag een tekstveld met autocomplete (vrije tekst toegestaan, bijv. "Eten bij oma in Breda" — die dag staat in het menu maar genereert geen boodschappen).
6. Boodschappenlijst per run als één platte lijst, gesorteerd op categorie (de categorie zelf zie je niet), plus vrije extra artikelen (met categorie) en een automatische sectie "Standaardvoorraad aanvullen" uit de voorraadtekorten; met afvinkboxen en een teller in de tab. Categorieën (incl. volgorde) beheer je op deze tab; een artikel met winkelvoorkeur wordt daar gehaald en telt niet mee in de prijsvergelijking (ADR-015).
7. Voorraadbeheer per locatie (per huishouden instelbaar: toevoegen/verwijderen, uitklapbaar), per product have/want met categorie en optionele winkelvoorkeur; de huidige voorraad is altijd aanpasbaar, de gewenste via een edit-icoon per locatie; knoppen "Alles aangevuld" en "Standaardlijst terug" (ADR-015).
8. Prijzen per artikel per winkel: richtprijs per run per winkel met dekking "(x/n)" en een "goedkoopste"-tip; lokaal bewaard, optioneel online opgehaald (niet-privé data).
9. Kalender bij het weekmenu: de tab toont alleen de datum van vandaag; via een knop (datumkiezer) kun je 1 of meer weken terug- of vooruitkijken. Bij het openen start de app automatisch in de huidige week, met vandaag gehighlight. Vergrendelde gerechten worden per datum bewaard en zijn op die datum later terug te vinden.
10. Per dag een afwijkend aantal eters instelbaar (bezoekers mee-eten, of juist minder); de boodschappenlijst voor die dag wordt mee geschaald (factor = aantal eters die dag / aantal eters uit de instellingen). Regels voor het genereren (visdagen, vega/vlees-mix, weekstart) zijn zichtbaar en aanpasbaar via een knop onderaan het weekmenu.
