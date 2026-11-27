# VOORSTEL — Voedingswaarden per product via Open Food Facts (issue #48)

Onderwerp: `docs/ux/voedingswaarden-off/`
Bestanden: 9 SVG-mocks (3 schermen × 3 versies A/B/C), 390×844, inline styling in de huisstijl van `styles.css`. SVG (tekst/XML) — expres geen PNG i.v.m. de text-only file-pipeline.

## Schermen
| Scherm | Bestand | Inhoud |
|---|---|---|
| 1. Productkaart (catalogus) | `01-product-kaart-versie-{A,B,C}.svg` | kaart met product zonder ean/voedingswaarden + actie 'EAN koppelen / zoeken'; merkloos product (bloemkool) met NEVO-fallback-actie |
| 2. Koppelen / zoeken | `02-koppelen-zoeken-versie-{A,B,C}.svg` | EAN scannen/invoeren óf zoeken op productnaam; resultatenlijst Open Food Facts; versie C: EAN-8 (20–29) multi-match-waarschuwing + bronvermelding |
| 3. Productdetail gekoppeld | `03-product-detail-gekoppeld-versie-{A,B,C}.svg` | fullName + EAN-chip + productfoto + voedingswaarden per 100 g en per portie + bronvermelding + (C) offline cache-badge |

## Versies
- A — kaal: geen foto, geen bronvermelding, geen cache-indicatie
- B — + productfoto (alleen via `<img src>` met allowlist `https://images.openfoodfacts.org/images/products/`) + bronvermelding 'Gegevens & foto's: Open Food Facts (CC BY-SA 3.0)'
- C — + foto lokaal gecachet in de image-store (#60) met offline cache-badge + bronvermelding + cache-status in de voedingswaardenkaart

## Aanbeveling: versie C — approved door de eigenaar
Owner: 'Voor alle schermen is versie C akkoord'.

Rationale:
- OFF-productfoto's vallen onder CC BY-SA 3.0 → bronvermelding 'Open Food Facts' is verplicht in de UI; versie C toont deze expliciet.
- De app is offline-first (localStorage/PWA): foto's worden na het eerste ophalen lokaal gecachet (#60) en werken dan offline; versie C maakt dat zichtbaar met een cache-badge.
- Security-richtlijnen uit de owner-comments zijn in alle versies als randgevallen verwerkt: HTTPS host-allowlist (world.openfoodfacts.org / images.openfoodfacts.org), JSON.parse-only (nooit eval/new Function), escaped rendering (nooit innerHTML/dangerouslySetInnerHTML), img-URL-allowlist, numerieke validatie (parseFloat, NaN/negatief/extreem) vóór opslag, beschrijvende User-Agent, EAN-8 restricted circulation (20–29) multi-match, lege/fout/offline states.

## Implementatienotities (voor het latere implementatie-PR ná #59/#60)
- Productmodel (ADR-017) uitbreiden met `fullName`, `ean`, `nutrition100`, `nutritionPerServing`, optioneel `imageUrl`; cache per huishouden in localStorage `weekmenu-app-v1`; CACHE_VERSION bump bij migratie.
- OFF lookup: `GET https://world.openfoodfacts.org/api/v2/product/{ean}.json` en search via `…/api/v2/search`; numerieke waarden valideren vóór opslag in localStorage.
- Prijzen blijven buiten scope (ADR-008/ADR-010 aanpassen: geen betrouwbare publieke prijs-API; publieke data zoals voedingswaarden/foto's mogen wel opgehaald worden).

Zie issue #48 voor de volledige DoR (acceptatiecriteria, scope, randgevallen, open vragen, verificatie, afhankelijkheden).
