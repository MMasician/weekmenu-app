# UX-voorstel: tabicoontjes in plaats van tabtitels (issue #41)

**Status: ronde 1 goedgekeurd in issue #41 ("Bij beide schermen is versie C akkoord", 2026-11-25) — **geïmplementeerd in PR #64** (`src/App.jsx` tabbalk + `styles.css` `.tabbtn/.tabicon/.tablabel/.tabbadge`, tests in `tools/test-tabicoontjes.cjs`, `npm run verify` groen, cache-bump v19/`?v=18`). Gekozen: versie C op beide schermen — icoon per tab + klein tekstlabel onder de actieve tab, badge (`n/m`) op het boodschappen-icoon, tabnaam in `title`/`aria-label`.

## Aanleiding (wens uit issue #41)

De 5 tabtitels bovenaan lijnen nu niet goed uit op het scherm. Wens: per tab een **icoontje**
dat de lading dekt in plaats van een titel; de 5 icoontjes moeten goed uitgelijnd zijn en binnen
het telefoonscherm passen zonder horizontaal scrollen.

Huidige staat: `tabs`-array + `<nav>` in `src/App.jsx` (5 knoppen, `flex-1`, tekstlabels
Weekmenu / Recepten / Voorraad / Boodschappen (n/m) / Instellingen), styling in `styles.css`.

## Gedeelde regels (ter vastlegging bij goedkeuring)

- 5 knoppen blijven `flex-1` in de bestaande pill-nav; de **actieve tab** houdt de donkere pill.
- De boodschappen-teller (`done/total`) wordt een **badge** op het boodschappen-icoon (alleen bij teller > 0).
- Toegankelijkheid: elke knop houdt `title`/`aria-label` met de tabnaam — de titel is visueel weg, maar wel beschikbaar.
- Iconen zijn **inline** (emoji of inline SVG), geen externe assets → werkt offline (ADR-007/ADR-010).
- Thema-afhankelijke iconen (Sinterklaas/Kerstmis) horen bij #40 (`docs/ux/themas/`), niet bij de standaardset hier.

## Schermen (2 schermen × 3 versies)

### 1. Tabbalk op 390px (met weekmenu-content eronder)
- `01-tabbalk-versie-A-emoji.svg` — **A**: emoji-iconen (📅 📖 📦 🛒 ⚙️) in de bestaande pill-nav
- `02-tabbalk-versie-B-svg-iconen.svg` — **B**: eigen SVG-lijniconen (kalender/boek/doos/winkelwagen/tandwiel)
- `03-tabbalk-versie-C-actief-label.svg` — **C**: icoon + klein tekstlabel onder de **actieve** tab

### 2. Smal scherm 360px, incl. boodschappen-teller als badge ("2/5")
- `04-smal-versie-A-emoji-badge.svg` — **A** op 360px
- `05-smal-versie-B-svg-iconen-badge.svg` — **B** op 360px
- `06-smal-versie-C-minimaal-badge.svg` — **C**: zonder pill-achtergrond, actief icoon gekleurd (minimaler)

## Na goedkeuring (implementatie, zelfde branch/PR)

- `docs/SPECS.md` (sectie Tabs) bijwerken: tabbalk toont iconen + aria-labels; badge bij teller.
- Tests in `tools/test-weekmenu-ux.cjs` (of nieuw `tools/test-tabicoontjes.cjs` via `tools/render-harness.cjs`):
  nav = 5 knoppen met icoon + `aria-label`, geen zichtbare teksttitel; badge "n/m" bij teller > 0;
  icoonset wisselt per thema (#40).
- Implementatie in `src/App.jsx` (`tabs` + `<nav>`) + CSS in `styles.css` (icoon-grootte, badge);
  `npm run build`, `npm run verify` groen, CI groen (ADR-014), cache-bump.
- Gekoppeld: #40 (thema-iconen), #36 (voorraad) — branch `vibe/issues-36-41-40-26a2f9`.

## Beslissingen ronde 1 (akkoord eigenaar, 2026-11-25)

- **Versie C bij beide schermen**: emoji-iconen (📅 📖 📦 🛒 ⚙️) in de pill-nav + klein tekstlabel onder de actieve tab; de 5 knoppen `flex-1` passen binnen 360px zonder horizontaal scrollen.
- Boodschappen-teller als **badge** (`n/m`) op het 🛒-icoon, alleen bij teller > 0.
- Tabnaam in `title`/`aria-label` (toegankelijkheid); geen zichtbare titeltekst bij inactieve tabs.
- Thema-afhankelijke iconen (Sinterklaas/Kerstmis) volgen uit #40 (`docs/ux/themas/`).
