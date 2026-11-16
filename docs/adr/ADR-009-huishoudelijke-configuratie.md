# ADR-009: Per-huishouden configuratie, lokaal opgeslagen

## Status
Accepted (2026-11-16)

## Context
De app is niet alleen voor het eigen huishouden bedoeld, maar moet ook door andere households te gebruiken zijn. Regels die per huishouden verschillen — weekstart, boodschappenmomenten, vis-dagen, vega/vlees-verhouding, aantal eters, winkels — mogen niet als household-specifieke waarden hardcoded in de repo staan, en het ene huishouden mag niets van het andere zien. Household-specifieke gegevens moeten bovendien privé blijven (ADR-010).

## Besluit
- Alle per-huishouden instellingen staan in een `settings`-object in localStorage-sleutel `weekmenu-app-v1` (schema in SPECS.md: `householdSize`, `weekStartDay`, `shopRuns`, `fishDays`, `vegaTarget`, `markets`).
- Bij ontbreken of onvolledigheid worden `DEFAULT_SETTINGS` aangevuld bij het laden (normaliseren, zoals `normalizeStock`).
- De huidige constanten (`FISH_DAYS`, `SHOP_RUNS`, de vega/vlees-mix, `MARKETS`) worden de standaardwaarden van `settings`; de app leest verder alleen nog uit `settings`. Dit vervangt de vaste persoonlijke regels uit ADR-002 en ADR-003 als bron van waarheid (die blijven als default bestaan).
- Nieuwe tab "Instellingen" om settings te wijzigen; wijzigingen gelden onmiddelijk voor weekmenu en boodschappenlijst.

## Gevolgen
+ Meerdere households op één app-versie, elk met eigen regels, zonder elkaars data te zien.
+ Geen household-specifieke waarden in de repo/GitHub (ADR-010).
- Migratie: bestaande state zonder `settings` krijgt de defaults; bestaand menu en voorraad blijven geldig.
