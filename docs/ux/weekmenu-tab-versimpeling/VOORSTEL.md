# UX-voorstel: weekmenu-tab versimpelen

**Status: goedgekeurd en verwerkt.** Ronde 1: schermen **1A, 2A, 3A, 4B** (`01`, `03`, `05`, `08`). Ronde 2 (eters per dag): dagregel = **versie 10 (badge) met inline aanpassen zoals versie 11**, boodschappen = **versie 12**; absoluut aantal eters (ook lager), afronden bij schalen prima. Verwerkt in `docs/SPECS.md`, `docs/adr/ADR-012-*.md`, `tools/test-weekmenu-ux.cjs` en `src/App.jsx` (+ build `src/app.js`).

## Aanleiding (wensen)

1. De kalender toont alleen de datum van vandaag; pas na een knopdruk verschijnen meer datum-opties.
2. De regels waarmee het weekmenu wordt gegenereerd zijn niet zichtbaar op het weekmenu; een knop onderaan het scherm opent het scherm waar je die regels kunt zien/aanpassen.
3. Geen pulldown-menu's met gerechten, maar gerechtnamen typen. Na 2 of meer letters een pulldown met passende gerechten waaruit je kunt kiezen. Het moet ook mogelijk blijven om iets te typen dat geen bestaand gerecht is (bijv. "Eten bij oma in Breda") — die dag staat dan wel in het menu, maar genereert geen boodschappen.

Per te wijzigen scherm zijn er **2 versies** (mock-screenshots in deze map, 390px telefoonbreedte, in de eigen huisstijl van de app):

## 1. Weekmenu-tab, standaardweergave

- `01-weekmenu-tab-versie-A.png` — compacte datum linksboven ("VANDAAG · di 17 nov") met rechts de knop "📅 Kies een datum ▾"; daaronder de weekregel en de primaire knop "Genereer weekmenu". Dagrijen horizontaal: dag+datum links, invoerveld in het midden, vergrendelknop rechts. Onderaan over de volle breedte: "⚙️ Regels voor het weekmenu".
- `02-weekmenu-tab-versie-B.png` — grote gecentreerde datumkop ("dinsdag 17 november" + weekregel) met daaronder een full-width knop "📅 Andere dag of week kiezen ▾" en "Genereer weekmenu". Dagrijen gestapeld: dag+datum+slot op de bovenste regel, invoerveld over de volle breedte eronder. Onderaan idem de regels-knop.

In beide versies: de kaart "Verdeling voor de week" is verdwenen; "vandaag" blijft gemarkeerd in de daglijst; vergrendelen (🔒) per dag blijft.

## 2. Datumkiezer (state ná knopdruk)

- `03-datumkiezer-versie-A-bottomsheet.png` — bottom sheet over een gedimde achtergrond: weekstrip van de getoonde week (7 dagen, vandaag in het groen), knoppen "◀ Vorige week" / "Volgende week ▶" met weeklabel ertussen, daaronder het maandrooster (kolommen starten op de ingestelde weekstart, za), met hinttekst. Klik op een dag → spring naar de week van die dag (🔒 = vergrendeld, per datum bewaard).
- `04-datumkiezer-versie-B-inlinepaneel.png` — zelfde inhoud, maar als inline paneel dat uitklapt ónder de datumknop in het weekmenu zelf (compactere kalender), ipv een overlay.

## 3. Gerecht per dag invoeren (typen + autocomplete + vrije tekst)

- `05-gerecht-typen-versie-A-suggestielijst.png` — na ≥2 letters verschijnt onder het veld een suggestielijst met recepten die overeenkomen (gematchte letters gemarkeerd, categorie-badge erachter, eerste suggestie actief). Onderaan de lijst: "↵ Enter — 'zal' als eigen tekst opslaan (geen boodschappen)". Een vrije tekst zoals "Eten bij oma in Breda" wordt opgeslagen met een tag "📍 geen boodschappen".
- `06-gerecht-typen-versie-B-suggestiechips.png` — suggesties verschijnen als chips bóven het veld (met categorie-kleur); verder gelijk aan A.

In beide versies vervalt de huidige `<select>`-dropdown met alle gerechten. Vrije tekst (niet-bestaand gerecht) is nadrukkelijk toegestaan: die dag verschijnt in het weekmenu en in de kalender, maar niet op de boodschappenlijst.

## 4. Regels bekijken/aanpassen (via knop onderaan het weekmenu)

- `07-regels-versie-A-eigen-scherm.png` — eigen scherm binnen de tab, met terug-knop "← Weekmenu": **Weekstart** (dagchips), **Visdagen** (dagchips), **Vega/vlees op de overige dagen** (stepper, bijv. 2 vega · 3 vlees), plus een kaart met verwijzing: boodschappenmomenten, aantal eters en winkels stel je in bij Instellingen →. Wijzigingen worden automatisch lokaal opgeslagen.
- `08-regels-versie-B-bottomsheet.png` — bottom sheet over het weekmenu met alléén de generatie-regels (weekstart, visdagen, vega-doel), een link "Boodschappenmomenten, eters & winkels → Instellingen" en een knop "Klaar".

## Open vragen / knopen om door te hakken

- Drempel voor de suggestielijst: 2 letters (huidig voorstel) of 3?
- Vrije tekst: tag "📍 geen boodschappen" (huidig voorstel) of liever "🍽️ buiten de deur"?
- Blijft "Genereer weekmenu" bovenaan (huidig voorstel) of liever onder de daglijst?
- Na kiezen van een andere week: daglijst wisselt mee (zoals nu) — en moet de knop "Naar deze week" terug KOMEN zodra je niet in de huidige week zit?
- Regels: volledig eigen scherm (A) of compacte sheet met alleen generatie-regels (B)?
- Datumkiezer: bottom sheet (A) of inline paneel (B)?

## 5. Nieuw verzoek (ronde 2): afwijkend aantal eters per dag

Wens: naast het slot een extra icoontje per dag om een afwijkend aantal eters te tonen/instellen (bezoekers mee-eten); dit heeft gevolgen voor de hoeveelheid boodschappen voor die dag.

Let op: in de huidige app schaalt `householdSize` niets — het aantal eters staat alleen in de kop en in Instellingen; ingrediënten zijn al voor dat aantal geschreven. Schalen per dag is dus een **nieuwe** functionaliteit (slagorde: `aantal eters die dag / householdSize`).

### 5a. Dagregel in het weekmenu (op basis van goedgekeurd scherm 1A)

- `09-dagregel-eters-versie-A-popover.png` — icoon `👥 4` altijd zichtbaar (grijs = standaard); bij afwijking amber `👥 6`. Tik → popover boven de regel met stapper (− 6 +), "standaard: 4 eters" en "Standaard herstellen".
- `10-dagregel-eters-versie-B-badge.png` — zelfde popover, maar het aantal staat alléén als badge op het icoon bij afwijking; standaard alleen `👥` (stiller).
- `11-dagregel-eters-versie-C-inline.png` — geen popover: de regel klapt inline open met stapper + "Standaard herstellen" + hint "boodschappenlijst ×1,5 voor deze dag".

In alle versies: bij vrije tekst (geen boodschappen, bijv. "Eten bij oma in Breda") is het eters-icoon gedimd/uit.

### 5b. Weergave op de Boodschappen-tab (gevolg)

- `12-boodschappen-eters-versie-A-expliciet.png` — dagkop krijgt chip "👥 6 eters"; geschaalde regels tonen origineel doorgestreept → geschaald (bijv. "3 tomaten → 5 tomaten"); regels zonder getal blijven gelijk; footnote legt ×1,5 uit.
- `13-boodschappen-eters-versie-B-tag.png` — dagkop chip "👥 6 ×1,5"; geschaalde regel toont alléén de nieuwe hoeveelheid met tag "×1,5"; footnote: alleen regels met een getal ervóór worden geschaald.

### Open vragen bij 5
- Absoluut aantal eters per dag (👥 6, huidig voorstel) of aantal extra bezoekers (+2)?
- Afstemming: afronden hoe? (voorstel: naar boven afronden op hele stuks, bijv. 3 tomaten ×1,5 → 5)
- Welke eenheden schalen mee? (voorstel: getal + g/kg/ml/l/stuks; "1 blik …" niet)
- Vrije-tekst dagen: eters-icoon tonen maar uitgeschakeld (huidig voorstel)?

## Wat er ná goedkeuring per scherm gebeurt (nog niet uitgevoerd)

- `SPECS.md` (sectie Weekmenu) herschrijven: kalender toont alleen vandaag + knop voor datumkiezer; "Verdeling voor de week" achter knop onderaan; daginvoer = tekstveld met autocomplete (drempel instelbaar, standaard 2) + vrije tekst.
- Nieuw ADR (volgend nummer, bijv. ADR-012): vrije-tekst dagentries in `menuByDate` (bijv. `{ custom: "Eten bij oma in Breda" }`), uitgesloten van boodschappenlijst-generatie; UI-versimpeling weekmenu-tab.
- Tests uitbreiden in `tools/test-*.cjs`: autocomplete-drempel, vrije tekst → geen boodschappen, datumkiezer-gedrag, regels-knop.
- Implementatie in `src/App.jsx` + `npm run build` (app.js synchroon) + `npm test`.
