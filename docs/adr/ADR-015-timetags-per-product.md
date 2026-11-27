# ADR-015: Timetags per product

- **Status:** accepted (owner-akkoord op DoR + mocks in issue #58)
- **Context:** gebruikers willen per product kunnen aangeven dat het niet dagelijks gegeten moet worden:
  er moet een minimaal interval (in dagen) zitten tussen twee keer gebruik in een gerecht. Er is geen
  apart gerecht/regel-object nodig; de tag beschrijft zelf het interval. Bouwt voort op tagRules (#37) en
  per-huishouden-opslag (ADR-009/ADR-010). Mocks: `docs/ux/timetags/` (productformulier versie A,
  weekoverzicht versie B — owner-akkoord).
- **Beslissing:**
  1. Optioneel veld `timetag: { days: 1..365 } | null` op het product; maximaal 1 timetag per product.
  2. Opslag per huishouden in `weekmenu.data.<householdId>` (zelfde mechanisme als `tagRules`, #37).
  3. Ontbrekend/corrupt veld = geen restrictie (`normalizeTimetag` → null): backwards compatible, geen migratie.
  4. Productformulier: numeriek invulveld (enkel cijfers, 0–365) met "dagen"-label erachter, default 0 = geen tag,
     ⓘ-info-popover achter "Timetag (optioneel)" (geen helpertekst onder het veld). Ongeldige invoer wordt
     afgewezen (oude waarde behouden); >365 clampled naar 365 met melding.
  5. Weekmenu-generatie is **zacht**: binnen het interval wordt het product vermeden; conflicteert alles,
     dan wordt het gerecht met de minste conflicten gekozen (`softFallback`) — nooit blokkerend.
  6. Weekoverzicht toont een inline ⏱-markering met resterende dagen (niet-blokkerend).
- **Gevolgen:**
  - Positief: eenvoudige UX, geen extra regel-objecten; planning blijft altijd doorgaan.
  - Negatief/afwegingen: planning is heuristisch (zacht), geen harde garantie; interval check gebruikt
    history + weekplan (nog niet "toekomstige" dagen buiten het huidige weekplan).
  - CACHE_VERSION bump nodig bij deploy (`weekmenu-v2026-02-timetags-58`).
- **Referenties:** issue #58, #37 (tagRules), ADR-009/ADR-010, `docs/ux/timetags/VOORSTEL.md`,
  `docs/SPECS.md`, `src/timetags.js`, `tools/test-timetags.cjs`.
