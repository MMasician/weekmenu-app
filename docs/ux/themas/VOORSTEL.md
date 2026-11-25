# UX-voorstel: verschillende styling-mogelijkheden / thema's (issue #40)

**Status: ronde 1 — ter review door de eigenaar (label `needs-review`). Nog niet geïmplementeerd.**

## Aanleiding (wens uit issue #40)

De huidige kleurstelling, icoontjes en plaatsing van tekst/knoppen is de **default**. Wens:
minstens een **dark-mode** en een **roze** versie; daarnaast (gewenst) een **sinterklaas-** en
**kerstmis-versie** — daarbij niet alleen andere kleurtjes, maar ook een andere achtergrond
en andere icoontjes (tabicoontjes, zie #41).

Technisch Vorteil: alle kleuren zitten al in `:root` CSS-variabelen in `styles.css` —
thema's zijn dus een kwestie van een `data-theme`-attribuut op `<body>`/root met per-thema
variabelen, plus een `settings.theme` veld (per huishouden, ADR-009/010).

## Gedeelde regels (ter vastlegging bij goedkeuring)

- Thema-keuze staat op de **Instellingen-tab** (kaart "Weergave"); keuze = `settings.theme`
  (`"standaard" | "donker" | "roze" | "sinterklaas" | "kerstmis"`), lokaal in localStorage (ADR-009/ADR-010).
- Ontbrekende/ongeldige `theme` → `standaard` bij het laden (normaliseren, zoals overige settings).
- Alle 5 tabs volgen het thema via CSS-variabelen; geen per-tab handmatige overrides.
- Feestthema's wisselen óók de **tabbalk-iconen** (#41) en de achtergrond.
- Alles blijft inline in de meegeleverde `styles.css` — geen externe assets/fonts, werkt offline (ADR-007/ADR-010).
- `prefers-color-scheme` wordt **niet** automatisch gevolgd (voorstel: expliciete keuze per huishouden).

## Schermen (2 schermen × 3 versies)

### 1. Instellingen-tab: thema-keuze (kaart "Weergave")
- `01-instellingen-thema-versie-A-chips.svg` — **A**: chips single-select (Standaard · Donker · Roze · 🎁 Sinterklaas · 🎄 Kerstmis)
- `02-instellingen-thema-versie-B-radio-lijst.svg` — **B**: radio-lijst met 3 kleur-dots preview per thema
- `03-instellingen-thema-versie-C-segmented-feestdagen.svg` — **C**: segmented Standaard/Donker/Roze + aparte sectie "Feestdagen" (🎁 / 🎄)

### 2. Voorbeeld weekmenu-tab in een thema
- `04-weekmenu-versie-A-donker.svg` — **A**: donker thema (volledige dark palette)
- `05-weekmenu-versie-B-roze.svg` — **B**: roze thema (roze achtergrond + accent)
- `06-weekmenu-versie-C-kerst-icoontjes.svg` — **C**: kerstthema — rode/gouden achtergrond én andere tabicoontjes (🎄 📖 📦 🎁 ⚙️, #41)

## Na goedkeuring (implementatie, zelfde branch/PR)

- `docs/SPECS.md` (Instellingen-schema: `settings.theme` + default) en evt. nieuw ADR (volgend nummer) bijwerken; ADR-009 uitbreiden met `theme`.
- Tests in `tools/test-instellingen.cjs`: thema-wijziging wordt opgeslagen en bij herladen toegepast;
  ontbrekende/ongeldige waarde → `standaard`; tabbalk-iconen per thema (#41).
- Implementatie: `styles.css` (per-thema `:root`-variabelen onder `[data-theme="..."]`), `src/App.jsx`
  (`settings.theme` + attribuut zetten, thema-keuze in Instellingen, tabicoontjes per thema),
  `index.html` (`theme-color` evt. mee), `npm run build` (`src/app.js` synchroon), `npm run verify` groen,
  CI groen (ADR-014), cache-bump (`CACHE_VERSION` + `?v=`).
- Gekoppeld: #41 (tabicoontjes), #36 (voorraad) — branch `vibe/issues-36-41-40-26a2f9`.

## Open vragen / knopen om door te hakken

- Welke thema's exact? (minimaal donker + roze; sinterklaas/kerstmis gewenst incl. eigen achtergrond + icoontjes)
- Thema-keuze: chips (A), radio-lijst met preview (B) of segmented + feestsectie (C)?
- Moet `prefers-color-scheme: dark` automatisch het donkere thema starten? (voorstel: nee)
- Moet de PWA-statusbalk (`theme-color` in `index.html`) meebewegen met het thema? (voorstel: ja, donk/licht)
- Sinterklaas en kerstmis als twee aparte thema's, of één "feestdagen"-thema dat wisselt op datum?
