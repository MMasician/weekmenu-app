# ADR-019: Delen van data via een exportbestand met samenvoegregels

- **Status**: Geaccepteerd (UX-mocks ronde 1–3 goedgekeurd; zie `docs/ux/delen-bestand/VOORSTEL.md`)
- **Datum**: 2026-11-22

## Context

Het huishouden (5 personen) wil op ieders eigen telefoon dezelfde weekmenu-data zien en kunnen aanpassen: voorraad, weekmenu, recepten, vinkjes en instellingen. De app is een PWA zonder backend; er is bewust geen account, server of clouddienst (ADR-010: alles lokaal in `localStorage`). Overwogen alternatieven:

1. **Server/cloud-synchronisatie** — een extra dienst inrichten, hosten en beveiligen; in strijd met de "geen server, lokale data"-koers van dit huishoudelijke project.
2. **P2P (Bluetooth/Nearby, zelfgebouwd LAN-protocol)** — op iOS/Android in een browser-PWA onbetrouwbaar of onmogelijk; veel complexiteit voor 5 apparaten.
3. **Web Share API / bestand via WhatsApp/e-mail/AirDrop** — werkt overal zonder infrastructuur; de app hoeft alleen maar een goed gevormd bestand te exporteren en te kunnen samenvoegen.

De bewuste gebruikersdeling van een exportbesting is een handeling van de gebruiker zelf en valt buiten de privacy-afweging van ADR-010 (die gaat over wat de app *vanzelf* bewaart/deelt); toch geldt: alles blijft lokaal tot de gebruiker zelf het bestand deelt.

## Besluit

1. **Export en import via JSON-bestand** (`share/merge`, geen netwerkstack in de app):
   - Instellingen-tab krijgt een kaart met alleen iconen: 📤 export, 📥 import, ℹ️ info (uitleg alleen op te roepen via het info-icoon; mock ronde 3).
   - Export toont togglebare chips: Recepten, Producten, Voorraad, Weekmenu-dagen en "Instellingen · vinkjes · verwijderingen" (default allemaal aan). Voor delen buiten het huishouden zet de gebruiker de overige chips uit en deelt alleen (een selectie van) recepten.
   - Bestandsnaam: `weekmenu-delen-v1-<dd-mm>-<HHuMM>.json` met attributen `version` en `timeStamp` in de payload (`bundle: "weekmenu-share-v1"`, `v: 1`, `exportedAt`).
2. **Samenvoegen volgt de automerge-variant (mock ronde 3, versie A)**: per record wint de nieuwste versie op basis van een `updatedAt`-tijdstempel; conflicten worden automatisch opgelost en zichtbaar in een rapportblok ("hier: X → uit bestand: Y"), zodat de gebruiker bij uitzondering achteraf kan corrigeren. Geen handmatig conflictscherm.
3. **Per-record stempels en verwijderingsmarkeringen**:
   - Iedere mutatie door de app krijgt per record een `updatedAt` (wrappers om de bestaande setters; import past de *Raw*-setters toe zodat tijdstempels uit het bestand ongewijzigd overgenomen worden).
   - Verwijderde records worden niet gewist maar gemarkeerd in een `deleted`-map (`"recipe:<id>" → timestamp`), zodat verwijderingen deelbaar zijn en niet bij elke import terugkomen.
   - Vinkjes (`checked`) en instellingen (`settings`) worden als één geheel behandeld met elk één stempel (`checkedAt` respectievelijk `updatedAt` in settings).
4. **Import-rapport vóór toepassen**: na het inlezen toont een sheet wat er verandert (nieuw / nieuwer uit bestand / verwijderd / blijft) plus de automatische conflictoplossingen; pas op "Samenvoegen" wordt de state aangepast.
5. **Bestandsformaat** (bewust versiestempel zodat toekomstige migratie mogelijk is):
   ```json
   { "bundle": "weekmenu-share-v1", "v": 1, "exportedAt": 0, "chips": { … },
     "data": { "recipes": …, "products": …, "stock": …, "stockLocations": …,
               "menuByDate": …, "extraItems": …, "settings": …,
               "checked": …, "checkedAt": 0, "deleted": { … } } }
   ```

## Gevolgen

- `localStorage` krijgt twee extra velden: `deleted` (map met verwijderingsmarkeringen) en `checkedAt` (number); bestaande installaties zonder deze velden werken gewoon door (defaults `{}` en `0`).
- `normalizeStock`, `normalizeExtras`, `normalizeLocations` en `normalizeProducts` bewaren een aanwezige `updatedAt` (eerder gestript).
- De samenvoeglogica (`mergeShareBundle`) is puur (geen `Date.now`) en rechtstreeks gedekt door tests in `tools/test-delen-bestand.cjs`; de UI (iconen, chips, sheets, rapport) zit in dezelfde tests.
- Beperkingen: geen live synchroon overleg over wie gelijk heeft; "nieuwste wint" kan een gelijktijdige wijziging op een ander toestel onbedoeld overschrijven — het rapport maakt dat zichtbaar en herstelbaar. Wie offline wijzigingen maakt op twee toestellen zonder tussentijds uit te wisselen, accepteert dit scenario bewust.
- Toekomstig alternatief (server of CRDT-synchr. zoals Automerge/Yjs) blijft open; dit ontwerp dwingt niets en het bestandsformaat is versiestempeld.
