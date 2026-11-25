# UX-voorstel: tabicoontjes in plaats van tabtitels (issue #41)

**Status: ronde 1 — ter review door de eigenaar (label `needs-review`). Nog niet geïmplementeerd.**

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

## Open vragen / knopen om door te hakken

- Emoji-iconen (A) of eigen SVG-lijniconen (B)? (SVG = consistenter over toestellen, emoji = gratis kleur)
- Actieve tab met klein tekstlabel (C) of puur iconen?
- Bij versie C-zonder-pill: is de actieve tab dan nog duidelijk genoeg gemarkeerd?
- Welke icoonset exact per tab? (huidig voorstel: 📅 weekmenu, 📖 recepten, 📦 voorraad, 🛒 boodschappen, ⚙️ instellingen)
