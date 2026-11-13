# ADR-006: Bewerkbare receptenpool in localStorage

## Status
Geaccepteerd

## Context
De recepten stonden hard-gecodeerd in `BASE_RECIPES` in App.jsx. Elke
wijziging kostte een code-aanpassing en deploy, en de randvoorwaarden uit
INTENT.md (geen account, geen server, geen dependencies, één component)
sluiten een backend uit. De wens: een receptenopslag die direct vanuit de
app bereikbaar en bij te werken is.

## Besluit
De receptenpool wordt app-state, bewaard in localStorage onder de bestaande
sleutel `weekmenu-app-v1` (nieuw veld `recipes`):

1. **Seed/migratie**: bij eerste start (of oude opslag zonder `recipes`)
   wordt de pool geinitialiseerd vanuit `BASE_RECIPES`; eerder bewaarde
   `edits` (tijd, kooktekst) worden daarin gemerged. `BASE_RECIPES` blijft
   alleen als seed- en reset-waarde in de code.
2. **Bewerken in de app**: de tab Recepten krijgt een formulier voor nieuwe
   recepten en per recept bewerkbare velden (naam, categorie, ingredienten
   één per regel, bereiding, tijd, kok) plus een verwijderknop. Een verwijderd
   recept verdwijnt ook uit een lopend weekmenu.
3. **Import/export**: de pool is als JSON te exporteren (download) en te
   importeren (file input), zodat de lijst te back-uppen en tussen apparaten
   te delen is zonder server.
4. **Reset**: knop "Standaardlijst terug" zet de pool terug op
   `BASE_RECIPES` (met bevestiging).

Overwogen alternatieven:
- Backend/database (bijv. Supabase): breekt "lokaal, geen account, geen
  server" uit INTENT.md.
- IndexedDB: geen meerwaarde bij ~52 kleine objecten, wel complexere migratie.
- Aparte localStorage-sleutel: afgewezen; hergebruik van `weekmenu-app-v1`
  met een additief veld houdt de migratie simpel en oude state geldig.

## Gevolgen
+ Recepten aanpassen zonder code-wijziging of deploy, direct in de app.
+ JSON-export/import maakt back-up en delen tussen apparaten mogelijk.
+ Oudere opslag werkt gewoon door (additieve migratie).
- Geen automatische sync tussen apparaten; oplossing is export/import (een
  eventueel toekomstig sync-mechanisme krijgt een eigen ADR).
- Bij een nieuwe hard-gecodeerde lijst moet de pool bewust gereset worden;
  verwijderde recepten verdwijnen ook uit een lopend weekmenu.
