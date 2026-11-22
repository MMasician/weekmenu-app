# Voorstel: Delen via bestand — exporteren + samenvoegen

## Doel
Huishoudenleden met de app op hun eigen toestel willen dezelfde data zien en kunnen bijwerken (recepten, voorraad, weekmenu). Zonder server of cloud: exporteer de huishouddata naar één JSON-bestand, deel het via een bestaand kanaal (WhatsApp, e-mail, AirDrop, Quick Share — keuze van de gebruiker, buiten de app om), en voeg het op het andere toestel samen met de lokale data volgens heldere merge-regels. Voldoet aan ADR-007/ADR-010: geen server, geen data buiten de deur tenzij de gebruiker zelf het bestand deelt.

## Mocks
Technische noot: de mocks zijn SVG i.p.v. PNG (de mock-omgeving kon deze sessie geen headless Chromium renderen). Zelfde afmetingen (390×844), huisstijl uit styles.css; GitHub toont ze inline.

## Scherm 1 — Waar start je het delen? (ronde 1: `01-...A.svg` / `02-...B.svg`)
- **Versie A — kaart op de Instellingen-tab**: nieuwe kaart "Delen & overnemen" tussen de bestaande kaarten, met uitleg, knoppen en een "laatst gedeeld"-regel.
- **Versie B — delen-knop in de header**: geen extra kaart; 📤-icoon rechtsboven opent het delesheet.

## Scherm 2 — Het delesheet bij exporteren (ronde 1: `03-...A.svg` / `04-...B.svg`)
- **Versie A — keuze per onderdeel**: checkbox-lijst met aantallen, dan "Maak deelbestand (.json)".
- **Versie B — one-tap**: alles in één bestand met samenvattingschips en één toggle "Instellingen opnemen".

Voor beide: na het maken opent het systeemdeelscherm (Web Share / download). De app stuurt nooit iets automatisch weg.

## Scherm 3 — Bestand overnemen en samenvoegen (ronde 1: `05-...A.svg` / `06-...B.svg`)
- **Versie A — automatisch samenvoegen met rapport**: direct wat er gaat gebeuren (toegevoegd/bijgewerkt/ongewijzigd/conflicten); conflicten automatisch opgelost ("nieuwste wint") en in beeld. Eén knop "Samenvoegen".
- **Versie B — keuze per conflict**: eerst "Samenvoegen | Alles vervangen", per conflict "Uit bestand" vs "Houd hier".

## Merge-regels (concept, ADR-019 volgt na goedkeuring)
- Per record (recept op id, product op id met fallback productKey, voorraaditem op locatie+naam, menudag op datum, locatie op id, instellingen als geheel) houdt de app voortaan een `updatedAt` bij.
- Samenvoegen: nieuwste `updatedAt` wint per record; alleen-in-bestand wordt toegevoegd.
- Import normalizeert altijd eerst via de bestaande normalizers (`normalizeRecipe`, `normalizeStock`, …) — een deelbestand is nooit destructief vóór de knop "Samenvoegen".

## Ronde 2 — keuzes en aangepaste mocks (2026-11-22)

Goedgekeurd/afgesproken:
- **Startpunt (scherm 1, aangepast)**: op de Instellingen-tab, géén header-knop en géén beschrijvende tekst. Alleen iconknoppen naast elkaar: 📤 exporteren en 📥 overnemen, met een klein ⓘ-informatieknopje ernaast dat de uitleg opent. Zie `r2-01-instellingen-icoonen.svg`.
- **Exporteren (scherm 2, one-tap goedgekeurd, aangepast)**: één aanraak-knop met twee standen: **Voor het huishouden** (default; alles inclusief instellingen, afvinkjes en verwijderingsmarkeringen) en **Alleen recepten** (voor buiten het huishouden; uitsluitend de receptenpool, zonder huishoudgegevens). Zie `r2-02-export-huishouden-extern.svg`.
- **Importeren (scherm 3, versie A goedgekeurd)**: automatisch samenvoegen met rapport; conflicten automatisch opgelost (nieuwste wint) en in beeld, zodat ze bij uitzondering achteraf gecorrigeerd kunnen worden.
- **Merge-regels aangevuld i.v.m. ronde 1**: afvinkjes en verwijderingen vallen onder de noemer "instellingen" en gaan mee in de huishouden-stand (verwijderingen als markering "verwijderd op"; afvinkjes als boodschappenlijst-status). In de stand "Alleen recepten" wordt niets daarvan gedeeld.
- **Bestandsnaam**: akkoord met versie + tijdstempel, bijv. `weekmenu-delen-v1-22-11-20u15.json`.

Status ronde 2: r2-mocks voorgelegd ter bevestiging; na goedkeuring volgen ADR-019, SPECS.md-aanvulling, tests en implementatie (+ CACHE_VERSION/?v=-bump in dezelfde PR als de app-wijziging).