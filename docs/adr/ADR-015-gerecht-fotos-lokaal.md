# ADR-015: Beelden van gerechten lokaal per apparaat

Status: geaccepteerd
Datum: 2026-11-25
Gerelateerd: issue #60, #48, ADR-009, ADR-010

## Context
Gebruikers willen een foto bij een gerecht zien en zelf een foto kunnen koppelen. Foto's moeten behouden blijven als het fotoalbum van de telefoon geleegd wordt en offline beschikbaar zijn.

## Besluit
Maximaal 1 foto per gerecht wordt na resize (max 1024px, JPEG q=0,8, ≤2MB) opgeslagen in een eigen lokale IndexedDB image-store (DB `weekmenu-app`, store `dish-images`, key `dishId`). Er is geen cloudsync of cross-device synchronisatie; opslag is lokaal per apparaat, conform ADR-009/ADR-010. CACHE_VERSION wordt gebumpt naar 7; migratie verwijdert ongeldige/corrupte records en behoudt geldige foto's. Dezelfde image-store wordt door #48 hergebruikt, daarom staat #60 vóór #48.

## Gevolgen
- Weekmenu toont thumbnails; receptentab toont readonly compact zonder vervangknop en edit-mode compact met vervang-actie in de foto.
- Camera/galerij-koppeling werkt offline na initiële load; rechten/quota-fouten worden expliciet afgehandeld.
- Geen export/backup, geen meerdere foto's, geen hoge resolutie.
