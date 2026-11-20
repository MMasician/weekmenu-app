# UX-voorstel: boodschappenlijst van vandaag — dagenbereik, supermarktkeuze, houdbaarheidsdatum, gerechtstatus; prijzen-tab vervalt

**Status: ronde 2 — feedback op ronde 1 verwerkt; nieuwe mocks `r2-*` ter goedkeuring per scherm (zelfde draft PR). Nog niet geïmplementeerd in `src/App.jsx`.**

## Aanleiding (wensen)

1. De boodschappen-tab toont **alleen de lijst van vandaag**; bovenaan kies je voor hoeveel dagen (gerechten) je boodschappen doet. Bereik **0 t/m 7**, begrensd door het aantal **aaneengesloten gelockte dagen vanaf vandaag** (voorbeeld: als vanaf vandaag 3 dagen gelocked zijn en de 4e dag niet, is het maximum 3). **Default = 4**, of het maximum als dat lager is.
2. Bovenaan kies je bij welke **supermarkt(en)** je boodschappen gaat doen. Artikelen met een winkelvoorkeur voor een **niet-geselecteerde** supermarkt worden **verborgen**.
3. De lijst is **één platte lijst**, gesorteerd op categorie-volgorde — ongeacht of het een ingrediënt van een gerecht, een voorraadaanvulling of een extra artikel is.
4. Tijdens het winkelen per product afvinken; als je klaar bent bij de supermarkt(en) kun je de lijst afvinken. daarbij hoeven **niet alle vinkjes gezet** te zijn (bijv. uitverkocht).
5. Per gerecht **binnen de scope van de lijst** verschijnt bij het weekmenu: **✓** als alle ingrediënten gehaald zijn, **❗** als er nog ingrediënten missen, en **niets** als er niets voor dat gerecht is gehaald (huidig gedrag).
6. Ingrediënten van een gerecht in categorie **groente** of **zuivel** tonen in de boodschappenlijst de **datum waarop ze nodig zijn** (beperkt houdbaar).
7. De **prijzen-tab vervalt** helemaam: prijzen worden niet lokaal opgeslagen en niet los (zonder boodschappenlijst-context) getoond.
8. Het vaste aantal boodschappenmomenten per week wordt **niet meer in de app opgeslagen** — de sectie "Boodschappenmomenten" in Instellingen vervalt.

## Gedeelde regels (ter vastlegging bij goedkeuring)

- **Scope**: `vandaag t/m vandaag+(n-1)`; n ∈ [0, min(7, # aaneengesloten gelockte dagen vanaf vandaag)]. Dagen tellen door over de weekgrens heen (`menuByDate` is per datum). Default n = min(4, maximum). Vrije-tekst dagen (`custom`) genereren sowieso geen artikelen.
- **Winkelkeuze**: multi-select chips uit `settings.markets` bovenaan de tab; default alle supermarkten aan; artikel met `market`-tag buiten de selectie → verborgen, met melding "x artikelen verborgen door winkelkeuze". Keuze is **vluchtig** (geen localStorage).
- n (dagen) en de winkelkeuze zijn likewise vluchtige state — worden niet opgeslagen.
- **Lijst**: platte lijst van (ingrediënten van gerechten in scope) + (voorraadtekorten, "(n van want)") + (extra artikelen), alles tesamen gesorteerd op `shopCats`-volgorde; de categorie zelf zie je niet. Afvinkboxen per artikel + teller in de tab.
- **Houdbaarheidsdatum**: alleen bij ingrediënt-rijen (dus van een gerecht) met categorie groente of zuivel → datum van de dag van dat gerecht achter de productnaam.
- **Gerechtstatus (weekmenu-tab)**: per dag in scope, over de zichtbare (na winkel-filter) ingrediënten van dat gerecht: alles gecheckt → **✓**; minstens één gecheckt maar niet alles → **❗** (met title welke/hoeveel); niets gecheckt → geen indicator. Dagen buiten de scope tonen niets.
- **Prijzen-tab vervalt**: tab, prijsvelden, per-run totalen + "goedkoopste"-badge en de `prices`-state er helemaal uit; ADR-008 wordt door een nieuw ADR deprecated. `settings.markets` blijft bestaan, nu als **"Supermarkten"** (voor de winkelkeuze op de boodschappen-tab). De link in het regels-sheet ("Boodschappenmomenten, eters & winkels → Instellingen") wordt ingekort.
- Mock-data is generiek (recepten uit `BASE_RECIPES`, fictieve locks); er staat geen household-specifieke context in deze map (ADR-010).

## Schermen (per scherm 2 versies; mocks in deze map, gerenderd in de eigen huisstijl op 390×844)

### 1. Boodschappen-tab: kop met dagenbereik + supermarktkeuze
- `01-boodschappen-kop-versie-A-kaart.png` — aparte kaart: "Voor hoeveel dagen?" + stapper (0..max) + range/max-hint ("vr 20-11 t/m zo 22-11 · max 3 dagen (daarna geen gelockte gerechten)"); daaronder "Bij welke supermarkt?" als chips + "x artikelen verborgen door winkelkeuze".
- `02-boodschappen-kop-versie-B-compact.png` — compacte kaart: "Boodschappen voor [− 3 +] dagen" + teller (n/m) op één rij, range-hint eronder, supermarkt-chips horizontaal scrollbaar.

### 2. Boodschappen-tab: platte lijst met houdbaarheidsdatum
- `03-boodschappen-lijst-versie-A-datum-tekst.png` — datum als grijze tekst achter de productnaam ("Melk · za 21-11"), alleen bij groente/zuivel-ingrediënten van een gerecht; winkel-chip rechts bij een winkelvoorkeur; afgevinkte rijen doorgestreept.
- `04-boodschappen-lijst-versie-B-datum-chip.png` — datum als kleine grijze chip/badge achter de productnaam.

### 3. Boodschappen-tab: actie "klaar bij de supermarkt(en)"
- `05-boodschappen-klaar-versie-A-alles-afvinken.png` — knop **"✅ Lijst afvinken"** zet in één keer alle getoonde vinkjes.
- `06-boodschappen-klaar-versie-B-klaar-melding.png` — knop **"Klaar met winkelen"** forceert niets; niet-gezette vinkjes (uitverkocht) blijven open; toast "✅ 2 gerechten compleet · ❗ 1 gerecht mist nog iets (zie weekmenu)". "Vinkjes wissen" blijft in beide versies.

### 4. Weekmenu-tab: gerechtstatus per dag
- `07-weekmenu-status-versie-A-chip.png` — status als chip rechts in de dagregel: "✓ alles in huis" (groen) / "❗ mist n" (amber).
- `08-weekmenu-status-versie-B-icoon.png` — status als klein icoon (✓ / ❗) met title-tooltip.
- (Mock toont de week van 21-11 t/m 27-11: za 21-11 = ❗ mist 1, zo 22-11 = ✓ alles in huis, ma t/m vr leeg → niets.)

### 5. Instellingen: boodschappenmomenten eruit, supermarkten hernoemd
- `09-instellingen-versie-A-zonder-runs.png` — sectie "Boodschappenmomenten" verwijderd; "Winkels (voor prijzen)" → "Supermarkten" (met hint: kies per keer bovenaan de boodschappenlijst).
- `10-instellingen-versie-B-met-info.png` — idem, plus info-tekst bovenaan: "Hoeveel dagen je boodschappen doet en bij welke supermarkt(en), kies je bovenaan de boodschappenlijst. Dat wordt niet in de app opgeslagen."

### 6. Lege lijst (alles verborgen door de winkelfilter)
- `11-leeg-door-winkelfilter-versie-A-reset.png` — lege-state "Niets te halen bij Albert Heijn" + chip-knop **"Toon alle supermarkten"** (reset van de selectie).
- `12-leeg-door-winkelfilter-versie-B-link.png` — idem, maar met link **"Winkels bovenaan aanpassen ↑"** in plaats van een reset-knop.

## Ronde 2 — feedback na ronde 1 (mocks `r2-*`)

**Goedgekeurd uit ronde 1:** scherm 2 = **versie B** (`04-…-datum-chip.png`); scherm 6 = **versie A** (`11-…-reset.png` — lege-state noemt de geselecteerde supermarkt, reset is een expliciete chip, de selectie zelf verandert niet automatisch).

**Aanpassingen met nieuwe versies:**

- **Scherm 1 (boodschappenkop): géén A/B uit ronde 1.** Eis: titel `Boodschappenlijst · <datum vandaag>` (bv. "Boodschappenlijst · vr 20-11") met alleen ℹ️/⚙️ ernaast; daaronder **één regel**: stapper aantal dagen (`− 3 +` + "dagen") gevolgd door de supermarkt-chips. Géén dagenrange, géén max-indicatie, géén "x verborgen"-telling, geen dubbele "boodschappen"-tekst.
  - `r2-01-kop-1regel-versie-A-kaart.png` — de ene regel in een witte kaart.
  - `r2-02-kop-1regel-versie-B-los.png` — de ene regel los (zonder kaart) direct onder de titel.
- **Scherm 3 (klaar bij supermarkt): versie B uit ronde 1, knop wordt groen** (posit iever), melding hoeveel gerechten compleet/mist blijft (zinvolle feedback; afterwards afvinken moet blijven kunnen — de lijst blijft gewoon bewerkbaar). Toast vs inline:
  - `r2-03-klaar-groen-versie-A-toast.png` — groene "Klaar met winkelen" + toast onderin.
  - `r2-04-klaar-groen-versie-B-inline.png` — groene knop + inline regel eronder (blijft staan).
- **Scherm 4 (gerechtstatus): versie B (klein icoon), maar met echt vinkje** in plaats van een groen vakje:
  - `r2-05-status-vinkje-versie-A-emoji.png` — ✅ / ❗ emoji-icoontjes (renderen betrouwbaar).
  - `r2-06-status-vinkje-versie-B-checkmark.png` — ✓ / ! als tekst (let op: het ✓-teken rendert in de headless mock niet betrouwbaar — in de praktijk op de telefoon vast wel, maar emoji is zekerder).
- **Scherm 5 (instellingen): versie A** (geen extra info-tekst), plus per supermarkt een **"standaard"-indicatie** (wordt default geselecteerd op de boodschappenlijst; per huishouden lokaal in `settings.markets`, bv. veld `defaultShop`). De keuze tijdens het winkelen zelf blijft vluchtig. Een dag-afhankelijke keuze blijft handmatig (vluchtige selectie).
  - `r2-07-instellingen-default-versie-A-checkbox.png` — per winkel een checkbox "standaard".
  - `r2-08-instellingen-default-versie-B-chip.png` — per winkel een chip "standaard" (aan = donker).

## Na goedkeuring per scherm (implementatie, zelfde PR)

`docs/SPECS.md` + `docs/INTENT.md` bijwerken, nieuw ADR (volgend nummer; deprecate ADR-003/ADR-008), tests in `tools/test-boodschappen-lijst.cjs` (de huidige `tools/test-prijzen.cjs` vervalt), implementatie in `src/App.jsx` + `npm run build` (`src/app.js` synchroon), `npm run verify` groen, en in dezelfde PR de cache-bump: `CACHE_VERSION` in `sw.js` verhogen + `?v=` in `index.html` (alle 4 plekken).
