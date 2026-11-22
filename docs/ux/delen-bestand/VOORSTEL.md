

## Ronde 4 — geïmplementeerd (2026-11-22)

De goedkeuringen uit ronde 3 zijn uitgewerkt in deze PR:

- Instellingen-tab: kaart met alleen iconen 📤 (deelbestand maken), 📥 (bestand overnemen) en ℹ️ (uitleg op te roepen).
- Export-sheet met togglebare chips: Recepten, Producten, Voorraad, Weekmenu-dagen en "Instellingen · vinkjes · verwijderingen" (default aan); bestandsnaam `weekmenu-delen-v1-<dd-mm>-<HHuMM>.json`.
- Import als automerge met rapport vóór het samenvoegen (per record wint de nieuwste versie op updatedAt; verwijderingen delen via markeringen; vinkjes/instellingen als één geheel); conflicten zichtbaar als "hier → uit bestand".
- Onderlegers: ADR-019, SPECS.md-sectie "Delen via bestand", `tools/test-delen-bestand.cjs`, CACHE_VERSION v12 en index `?v=11`.

Status mock-voorstellen: afgerond; de definitieve werking staat in de app.
