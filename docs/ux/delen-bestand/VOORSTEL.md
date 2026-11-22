# Voorstel: Delen via bestand — exporteren + samenvoegen (ronde 1)

## Doel
Huishoudenleden met de app op hun eigen toestel willen dezelfde data zien en kunnen bijwerken (recepten, voorraad, weekmenu). Zonder server of cloud: exporteer de huishouddata naar één JSON-bestand, deel het via een bestaand kanaal (WhatsApp, e-mail, AirDrop, Quick Share — keuze van de gebruiker, buiten de app om), en voeg het op het andere toestel samen met de lokale data volgens heldere merge-regels. Voldoet aan ADR-007/ADR-010: geen server, geen data buiten de deur tenzij de gebruiker zelf het bestand deelt.

## Mocks
Technische noot: deze ronde zijn de mocks SVG i.p.v. PNG (de mock-omgeving kon deze sessie geen headless Chromium renderen). Zelfde afmetingen (390×844), huisstijl uit styles.css; GitHub toont ze inline.

## Scherm 1 — Waar start je het delen? (`01-...A.svg` / `02-...B.svg`)
- **Versie A — kaart op de Instellingen-tab**: nieuwe kaart "Delen & overnemen" tussen de bestaande kaarten, met uitleg, primaire knop "📤 Deelbestand maken" en secundaire knop "📥 Bestand overnemen"; daaronder "Laatst gedeeld: …". Alles bij elkaar, instellingen blijft de "beheer"-tab.
- **Versie B — delen-knop in de header**: geen extra kaart; een 📤-icoon rechtsboven (naast "N eters") opent het delesheet. Minder schermoppervlak, altijd en overal bereikbaar (later ook vanaf andere tabs).

## Scherm 2 — Het delesheet bij exporteren (`03-...A.svg` / `04-...B.svg`)
- **Versie A — keuze per onderdeel**: checkbox-lijst met aantallen (weekmenu's, receptenpool, voorraad & locaties, productcatalogus, boodschappen-extra's, optioneel instellingen), dan "Maak deelbestand (.json)". Maximale beheersbaarheid over wat je deelt.
- **Versie B — one-tap**: alles in één bestand met samenvattingschips, één toggle "Instellingen opnemen", geen keuzelijst. Snel en simpel, maar deelt minder flexibel.

Voor beide: na het maken opent het systeemdeelscherm (Web Share / download). De app stuurt nooit iets automatisch weg.

## Scherm 3 — Bestand overnemen en samenvoegen (`05-...A.svg` / `06-...B.svg`)
- **Versie A — automatisch samenvoegen met rapport**: na het kiezen van het bestand toont de app direct wat er gaat gebeuren (toegevoegd/bijgewerkt/ongewijzigd/conflicten); conflicten lost hij automatisch op ("nieuwste wint") en toont hij in een blok vermeld. Eén knop "Samenvoegen".
- **Versie B — keuze per conflict**: eerst keuze "Samenvoegen | Alles vervangen" (segmented); bij conflicten kies je per stuk tussen "Uit bestand" (default, nieuwste wint) en "Houd hier". Meer regie, iets meer stappen.

## Merge-regels (concept, ADR-019 volgt na goedkeuring)
- Bestandsformaat: `weekmenu-delen-<dd-mmm>.json` met versieveld `bundle: "weekmenu-share-v1"` en `exportedAt`.
- Per record (recept op id, product op id met fallback productKey, voorraaditem op locatie+naam, menudag op datum, locatie op id, instellingen als geheel) houdt de app voortaan een `updatedAt` bij.
- Samenvoegen: nieuwste `updatedAt` wint per record; records die alleen in het bestand staan worden toegevoegd; **verwijderingen synchroniseren niet** (veilig: per ongeluk weggeklikte recepten komen niet automatisch bij de ander terug).
- Afvinkjes van de boodschappenlijst zijn per toestel (winkelstatus is wie-dan-ook aan het winkelen); niet in het deelbestand (open vraag, zie hieronder).
- Import normalizeert altijd eerst via de bestaande normalizers (`normalizeRecipe`, `normalizeStock`, …) — een deelbestand is nooit destructief vóór de knop "Samenvoegen".

## Open vragen
1. Instellingen (eters, weekstart, winkels, categorie-volgorde) delen? (in beide mock-versies default uit)
2. Afvinkjes van de boodschappenlijst delen of per toestel houden?
3. Verwijderingen alsnog meenemen (markering "verwijderd op") of voorstel volgen (niet syncen)?
4. Bestandsnaam/bundel-versie akkoord? (nodig om later formaatwijzigingen te herkennen)

## Status ronde 1
- Scherm 1: A/B voorgelegd — nog geen keuze.
- Scherm 2: A/B voorgelegd — nog geen keuze.
- Scherm 3: A/B voorgelegd — nog geen keuze.