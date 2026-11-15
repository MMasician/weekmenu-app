# Weekmenu & Boodschappenlijst

Installeerbare web-app (PWA) voor het plannen van een weekmenu en het automatisch
genereren van een boodschappenlijst, inclusief voorraadbeheer. Werkt volledig
lokaal en offline; alle gegevens blijven op je eigen apparaat.

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
- `docs/` - intent, specs, tests en ADR's:
  - `docs/INTENT.md` - doel en gebruikerswensen achter de app
  - `docs/SPECS.md` - functionele specificatie (gedrag, regels, datastructuren)
  - `docs/TESTS.md` - handmatige testscenario's
  - `docs/adr/` - Architecture Decision Records (genomen ontwerpbeslissingen)

De app is ontwikkeld in en gegenereerd uit een Vibe Canvas (Mistral AI).
Toekomstige wijzigingen worden aangevraagd in Vibe, dat de specs en code uit
deze repo leest, aanpast en hier weer naartoe pusht.
