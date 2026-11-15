# Weekmenu & Boodschappen

Installeerbare web-app (PWA) voor het plannen van een weekmenu en het automatisch
genereren van een boodschappenlijst, inclusief voorraadbeheer en een lokale
prijzendatabase voor supermarktvergelijking (Albert Heijn, Jumbo, Lidl). Werkt
volledig lokaal en offline; alle gegevens blijven op je eigen apparaat.

## Gebruiken op je telefoon
De app wordt gehost via GitHub Pages (zie hieronder inschakelen). Open de site op
je telefoon en kies "Toevoegen aan beginscherm" / "Installeer" om hem als app te
installeren. Na eerste gebruik werkt hij ook zonder internet.

## Inschakelen GitHub Pages (eenmalig)
GitHub → repo → **Settings → Pages**: *Source = Deploy from a branch*,
*Branch = main*, *Folder = / (root)* → Save. De app staat daarna op:
`https://mmasician.github.io/weekmenu-app/`

## Structuur
- `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js` - PWA-shell
- `src/App.jsx` - broncode van de app (JSX, bron van waarheid)
- `src/app.js` - gecompileerde versie die de browser laadt (gegenereerd)
- `vendor/` - React en ReactDOM (UMD, productie)
- `icons/` - app-iconen
- `tools/` - ontwikkelhulpmiddelen:
  - `jsx-transform.cjs` - compileert `src/App.jsx` naar `src/app.js`
  - `render-harness.cjs` - React-stub om de app zonder browser te renderen
  - `test-prijzen.cjs` - automatische tests voor de prijzenmodule
- `docs/` - intent, specs, tests en ADR's:
  - `docs/INTENT.md` - doel en gebruikerswensen achter de app
  - `docs/SPECS.md` - functionele specificatie (gedrag, regels, datastructuren)
  - `docs/TESTS.md` - handmatige testscenario's
  - `docs/adr/` - Architecture Decision Records (genomen ontwerpbeslissingen)

## App-wijzigingen (workflow)
1. Pas `src/App.jsx` aan (bron van waarheid, blijft JSX).
2. Compileer: `node tools/jsx-transform.cjs src/App.jsx src/app.js` en verhoog
   `CACHE_VERSION` in `sw.js`.
3. Optioneel: `node tools/test-prijzen.cjs` voor de automatische checks.
4. Commit alles; GitHub Pages serveert de nieuwe versie na publicatie.

De app is ontwikkeld in en gegenereerd uit een Vibe Canvas (Mistral AI).
Toekomstige wijzigingen worden aangevraagd in Vibe, dat de specs en code uit
deze repo leest, aanpast en hier weer naartoe pusht.
