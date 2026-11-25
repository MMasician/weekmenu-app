# ADR-021: Thema's (weergave) per huishouden

Status: geaccepteerd — issue #40, akkoord ronde 2 (2026-11-25: "Zowel bij kerst als sinterklaas
is versie A het leukst. Daarmee zijn alle voorstellen voor dit issue akkoord"); geïmplementeerd
in PR #64. Mocks: `docs/ux/themas/` (VOORSTEL.md).

## Beslissing

- `settings.theme`: `"standaard" | "donker" | "roze" | "sinterklaas" | "kerstmis"`, default
  `"standaard"`; ongeldige/ontbrekende waarde → `"standaard"` bij `normalizeSettings`.
  Per huishouden, lokaal in localStorage (ADR-009/ADR-010).
- Thema's zijn puur CSS: per-thema overrides van de bestaande `:root`-variabelen onder
  `[data-theme="…"]` in `styles.css`. De app-root én `<body>` dragen het attribuut (JS zet het
  op `body`), dus de achtergrond schaalt mee; de PWA-`theme-color` meta volgt het thema.
  Componenten gebruiken `var(--white)` i.p.v. letterlijke `#fff`, zodat kaarten/inputs mee
  kleuren.
- **Donker** en **roze**: eigen palette (geen achtergrondafbeelding).
- **Sinterklaas** en **Kerstmis**: daarnaast een eigen inline-SVG-achtergrond als data-uri in
  `styles.css` (volledig offline, ADR-007/ADR-010) — sinterklaas: nachtelijke paarse gradient
  met maan en sterren; kerstmis: rood→groen gradient met sneeuwvlokken (beide versie A uit de
  mocks) — én eigen tabicoontjes (#41): 🎁 📖 📦 🛒 🎅 resp. 🎄 📖 📦 🎁 ⚙️.
- Thema-keuze op de Instellingen-tab: kaart "Weergave" met radio-lijst + kleurpreview per thema
  (versie B uit de mocks).
- `prefers-color-scheme` wordt bewust **niet** gevolgd: het thema is een expliciete keuze per
  huishouden (geen verassing).

## Gevolgen

- `docs/SPECS.md`: Instellingen-schema (`theme`) + Tabs (tabicoontjes per thema).
- Tests: `tools/test-instellingen.cjs` (default/normaliseren/keuze/data-theme) en
  `tools/test-tabicoontjes.cjs` (icoontjes per thema).
- Cache-bump bij release (`CACHE_VERSION` + `?v=`).
