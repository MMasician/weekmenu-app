# UX-voorstel: verschillende styling-mogelijkheden / thema's (issue #40)

**Status: ronde 1 gereviewd — scherm 1 versie B akkoord, scherm 2 versies A (donker) en B (roze) akkoord; feestthema's in rework (ronde 2: nieuwe achtergrond-opties, schermen 3–4 hieronder). Nog niet geïmplementeerd.**

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
- `04-weekmenu-versie-A-donker.svg` — **A**: donker thema (volledige dark palette) — **akkoord ronde 1**
- `05-weekmenu-versie-B-roze.svg` — **B**: roze thema (roze achtergrond + accent) — **akkoord ronde 1**
- `06-weekmenu-versie-C-kerst-icoontjes.svg` — **C**: kerstthema — rode/gouden achtergrond én andere tabicoontjes (🎄 📖 📦 🎁 ⚙️, #41) — effen kleur, zie ronde 2 voor achtergrond-opties

### 3. Kerstachtergrond (ronde 2 — "typisch kerstplaatje" i.p.v. effen kleur)
- `07-kerst-achtergrond-versie-A-gradient-sneeuw.svg` — **A**: verticale gradient rood→donkergroen met sneeuwvlokken
- `08-kerst-achtergrond-versie-B-kerstboom-sterren.svg` — **B**: effen donkerrood + kerstboom-illustratie (boom + ster + ballen) en sterren
- `09-kerst-achtergrond-versie-C-patroon-sterren-ballen.svg` — **C**: subtiel patroon van sterren en kerstballen op rood

### 4. Sinterklaasachtergrond (ronde 2)
- `10-sinterklaas-achtergrond-versie-A-maan-sterren.svg` — **A**: nachtelijke paarse gradient met maan (sikkel) en sterren
- `11-sinterklaas-achtergrond-versie-B-cadeautjes-patroon.svg` — **B**: cadeautjes-patroon (vierkant met goud lint) op paars
- `12-sinterklaas-achtergrond-versie-C-gradient-pepernoten.svg` — **C**: paars→goud gradient met pepernoten onderaan

## Na goedkeuring (implementatie, zelfde branch/PR)

- `docs/SPECS.md` (Instellingen-schema: `settings.theme` + default) en evt. nieuw ADR (volgend nummer) bijwerken; ADR-009 uitbreiden met `theme`.
- Tests in `tools/test-instellingen.cjs`: thema-wijziging wordt opgeslagen en bij herladen toegepast;
  ontbrekende/ongeldige waarde → `standaard`; tabbalk-iconen per thema (#41).
- Implementatie: `styles.css` (per-thema `:root`-variabelen onder `[data-theme="..."]`), `src/App.jsx`
  (`settings.theme` + attribuut zetten, thema-keuze in Instellingen, tabicoontjes per thema),
  `index.html` (`theme-color` evt. mee), `npm run build` (`src/app.js` synchroon), `npm run verify` groen,
  CI groen (ADR-014), cache-bump (`CACHE_VERSION` + `?v=`).
- Gekoppeld: #41 (tabicoontjes), #36 (voorraad) — branch `vibe/issues-36-41-40-26a2f9`.

## Ronde 2 (feedback eigenaar, 2026-11-25 — label `needs-rework`)

- **Scherm 1 (Instellingen): versie B (radio-lijst met kleurpreview) akkoord.**
- **Scherm 2 (weekmenu in thema): versie A (donker) én versie B (roze) akkoord.**
- **Feestthema's**: van Sinterklaas én Kerstmis meer mocks gewenst; de achtergrond is nu 1 effen kleur — graag een typisch kerstplaatje/achtergrond met verschillende opties → schermen 3 (kerst × 3) en 4 (sinterklaas × 3) hierboven toegevoegd.

## Open vragen / knopen om door te hakken

- Thema-keuze in Instellingen: **beslist — versie B** (radio-lijst met kleurpreview).
- Welke feestachtergrond per thema? Kerst: gradient+sneeuw (A), kerstboom+sterren (B) of patroon (C)? Sinterklaas: maan+sterren (A), cadeautjes-patroon (B) of gradient+pepernoten (C)?
- Welke thema's exact? (minimaal donker + roze — beide akkoord; sinterklaas/kerstmis gewenst incl. eigen achtergrond + icoontjes)
- Moet `prefers-color-scheme: dark` automatisch het donkere thema starten? (voorstel: nee)
- Moet de PWA-statusbalk (`theme-color` in `index.html`) meebewegen met het thema? (voorstel: ja, donker/licht)
- Sinterklaas en kerstmis als twee aparte thema's, of één "feestdagen"-thema dat wisselt op datum?
- Achtergronden als inline SVG in `styles.css` (offline, ADR-007) — geen externe afbeeldingen.
