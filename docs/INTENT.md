# Intentie

## Doel
Een simpele, installeerbare web-app (PWA) waarmee een huishouden automatisch een weekmenu samenstelt uit een eigen receptenpool en daraus, plus de voorraadstatus, met één klik een boodschappenlijst genereert — gesplitst per boodschappenmoment.

De app is niet aan één huishouden gebonden: elk huishouden kan zelf instellen hoe het wil eten en boodschappen doen (weekstart, boodschappenmomenten, dagcategorieën zoals vis/vegetarisch/vlees, en het aantal eters waarop de recepten zijn afgestemd). Die gegevens zijn per huishouden en blijven lokaal op het eigen apparaat.

## Principes
1. **Per huishouden instelbaar en lokaal bewaard** — instellingen, recepten, voorraad, weekmenu en afvinkstatus staan in localStorage op het eigen apparaat. Geen account, geen server; het ene huishouden ziet niets van het andere (ADR-009).
2. **Privé-context staat niet in GitHub** — household-specifieke context (gezinssamenstelling, routines, voorkeuren) hoort niet in deze repo. In de repo staat alleen de algemene, deelbare app. Privé-context leeft buiten de repo: in een privé-skill en in de lokale app-instellingen (ADR-010).
3. **Offline-first; geen server** — de app werkt volledig offline en slaat niets op buiten het eigen apparaat (ADR-007, ADR-010).
4. **Zo min mogelijk handwerk** — weekmenu en boodschappenlijst worden automatisch gegenereerd; per dag kan handmatig worden afgeweken (vergrendelen / override).
5. **Modulaire bron, één gecompileerd bestand** — de app-bron staat in ES-modules onder `src/` (domain/state/ui/i18n, zie ADR-022) en wordt met een vastgelegde build-stap gebundeld naar `src/app.js` (`npm run build`; ADR-011). GUI-taal via `src/i18n` (ADR-023).
6. **Alle functionaliteit automatisch getest** — alles wat in SPECS.md staat, heeft een automatische test in `tools/test-*.cjs`, te draaien met `npm test` (docs/TESTS.md, ADR-011). Agents maken hiervoor geen losse scripts.

## Functionele wensen (algemeen; per huishouden instelbaar via Instellingen)
1. Weekstart instelbaar (standaard: zaterdag).
2. Boodschappenlijst van vandaag: bovenaan de boodschappen-tab kies je voor hoeveel dagen (0–7, begrensd door het aantal aaneengesloten gelockte dagen vanaf vandaag; default 4 of het maximum) en bij welke supermarkt(en) je winkelt. Deze keuze wordt niet in de app opgeslagen (ADR-016).
3. Dagcategorieën instelbaar: vaste vis-dagen (standaard: weekstart en middel van de week) en voor de overige dagen een instelbare vega/vlees-verhouding.
4. Eigen receptenpool: recepten toevoegen, bewerken (naam, categorie, ingredienten, bereiding, bereidingstijd kort/normaal/lang, tags), verwijderen, exporteren/importeren als JSON en resetten naar de startpool. In de recepten-tab zoek je op receptnaam en filter je op bereidingstijd, ingrediënten en/of tags.
5. Weekmenu automatisch genereren: per dag een recept uit de dagcategorie (niet herhaald binnen de week waar mogelijk), met knop vergrendelen en per dag een tekstveld met autocomplete (vrije tekst toegestaan, bijv. "Eten bij oma in Breda" — die dag staat in het menu maar genereert geen boodschappen).
6. Boodschappenlijst als één platte lijst van vandaag + het gekozen aantal dagen: ingrediënten van die gerechten, vrije extra artikelen (met categorie) en voorraadtekorten uit de voorraad, alle tesamen gesorteerd op categorie-volgorde (de categorie zelf zie je niet). Artikelen met een winkelvoorkeur voor een niet-geselecteerde supermarkt zijn verborgen. Met afvinkboxen, teller in de tab, datum bij groente/zuivel-ingrediënten (nodig op), knop "Klaar met winkelen" (groene melding met gerechtstatus) en per gerecht in het weekmenu ✅ (alles in huis) of ❗ (mist nog). Categorieën (incl. volgorde) beheer je op deze tab (ADR-015, ADR-016).
7. Voorraadbeheer per locatie (per huishouden instelbaar: toevoegen/verwijderen, uitklapbaar), per product have/want met categorie en optionele winkelvoorkeur; de huidige voorraad is altijd aanpasbaar, de gewenste via een edit-icoon per locatie; knoppen "Alles aangevuld" en "Standaardlijst terug" (ADR-015).
8. Prijzen worden niet in de app bijgehouden; de prijzen-tab is vervallen (ADR-016 deprecate ADR-008). Supermarkten stel je in als lijst met standaard-selectie voor de boodschappenlijst.
9. Kalender bij het weekmenu: de tab toont alleen de datum van vandaag; via een knop (datumkiezer) kun je 1 of meer weken terug- of vooruitkijken. Bij het openen start de app automatisch in de huidige week, met vandaag gehighlight. Vergrendelde gerechten worden per datum bewaard en zijn op die datum later terug te vinden.
10. Per dag een afwijkend aantal eters instelbaar (bezoekers mee-eten, of juist minder); de boodschappenlijst voor die dag wordt mee geschaald (factor = aantal eters die dag / aantal eters uit de instellingen). Regels voor het genereren (visdagen, vega/vlees-mix, weekstart) zijn zichtbaar en aanpasbaar via een knop onderaan het weekmenu.
