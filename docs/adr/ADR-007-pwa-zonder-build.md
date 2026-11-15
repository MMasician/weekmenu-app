# ADR-007: PWA zonder build-step, volledig lokaal

## Status
Geaccepteerd

## Context
De app moet op een telefoon te installeren zijn als zelfstandige app en
volledig offline werken. Gebruikersdata (recepten, voorraad, menu) mag nooit
naar een server of GitHub worden geschreven en moet tussen sessies bewaard
blijven. De repo heeft geen build-pipeline en dat willen we zo houden.

## Besluit
1. **Hosting als statische site** (GitHub Pages): alleen bestanden, geen backend.
2. **Geen build-step**: `src/App.jsx` wordt eenmalig vooraf gecompileerd naar
   `src/app.js` (Babel, preset react). React en ReactDOM (UMD, productie) liggen
   vast in `vendor/`. Geen CDN-afhankelijkheden, geen npm-installatie nodig.
3. **Tailwind-vervanging**: `styles.css` bevat statisch precies de utility-
   classes die de app gebruikt (compact, cacheerbaar, offline beschikbaar).
4. **PWA**: `manifest.webmanifest` + `sw.js` (service worker, cache-first app
   shell) + PNG-iconen (192/512 + maskable). Hiermee installeert de app op
   Android/iOS als standalone app.
5. **Data blijft lokaal**: alle gebruikersdata blijft in `localStorage`
   (sleutel `weekmenu-app-v1`, zie ADR-005). De app schrijft niks naar GitHub;
   de service worker leest alleen de app-bestanden.

## Workflow bij app-wijzigingen
1. Pas `src/App.jsx` aan (bron van waarheid, blijft JSX).
2. Compileer opnieuw naar `src/app.js` en verhoog `CACHE_VERSION` in `sw.js`.
3. Commit beide. GitHub Pages serveert de nieuwe versie na publicatie.

## Gevolgen
+ Installeerbaar, offline, geen account, geen kosten, privacy-vriendelijk.
- `src/app.js` is gegenereerd en staat naast de JSX-bron in de repo.
- Browserondersteuning: moderne browsers (service worker vereist).
