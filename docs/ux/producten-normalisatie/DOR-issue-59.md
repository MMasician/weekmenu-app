# Definition of Ready — issue #59: Normalisatie producten

Status: mocks/elaboratie-fase (docs-only). Implementatie start na owner-approval (label needs-approval → ready), als eerste van de reeks #59 → #58 → #60 → #48.

## Doel / probleem
In de productenlijst komen dubbelingen voor doordat beschrijvingen bij recepten toevoegingen bevatten (rood, zakje, optioneel) of andere eenheden gebruiken (dl, blikje). Er moeten mogelijkheden komen om dubbelingen op te lossen en te voorkomen.

## Acceptatiecriteria (Given/When/Then)
- Given de productenlijst met dubbele producten (zelfde product, andere beschrijving/eenheid, bijv. 'ui' vs 'ui, rood' of 'melk' vs 'volle melk'), When de gebruiker de lijst opent, Then worden duplicaten gegroepeerd/herkend en visueel gemarkeerd (badge) zodat de gebruiker ze kan samenvoegen.
- Given twee of meer productvarianten die hetzelfde product vertegenwoordigen, When de gebruiker 'Samenvoegen' kiest, Then wordt als hoofdproduct standaard de kortste benaming met de minste woorden voorgesteld; bij gelijke lengte het meest in recepten gebruikte product; anders het alfabetisch eerste. Weergave is subtiel ('voorgesteld als hoofdproduct'), zonder nadrukkelijke kanjer-badge.
- Given een samenvoeg-actie, When de gebruiker bevestigt, Then worden alle recept-koppelingen overgezet naar het hoofdproduct, worden de duplicaten uit de lijst verwijderd en kunnen per recept optioneel tags worden toegevoegd die alleen voor dat recept gelden.
- Given samen te voegen varianten met een benamingsverschil, When de merge-dialog per-recept tags voorstelt, Then zijn deze tags logisch afgeleid uit het benamingsverschil (bijv. 'melk' vs 'volle melk' → tag 'vol'/'volle'), niet willekeurige woorden zoals 'rood'/'zakje'/'optioneel'. Elke tag kan worden toegepast, uitgeschakeld ('geen tag') of handmatig aangepast.
- Given een ingrediënt in een recept met een andere eenheid dan het product (bijv. recept 'dl', product 'cl'), When de eenheid in het recept wordt aangepast, Then wordt de hoeveelheid automatisch omgerekend (1 dl = 10 cl) en kan de gebruiker het getal handmatig corrigeren.
- Given een handmatig aangepast getal bij een eenheidsomrekening, When de gebruiker opslaat, Then wordt de nieuwe hoeveelheid (eenheid + getal) opgeslagen bij het recept-ingrediënt.
- Given een nieuw product met een genormaliseerde naam die al bestaat, When de gebruiker het probeert toe te voegen, Then wordt de bestaande productkeuze voorgesteld (hergebruik in plaats van duplicaat).
- Given samengevoegde producten met per-recept tags, When de gebruiker een recept OF de weekmenu-weergave (#60) opent, Then zijn de per-recept tags zichtbaar bij het ingrediënt en niet in de algemene productlijst.
- Given een zojuist uitgevoerde samenvoeging, When de gebruiker binnen dezelfde sessie 'Ongedaan maken' kiest, Then wordt de merge teruggedraaid (originele varianten en recept-koppelingen hersteld); na het afsluiten van de sessie is de samenvoeging permanent.
- Given een leeg huishouden zonder producten, When de productenlijst wordt geopend, Then toont deze een lege state met CTA 'Product toevoegen'.
- Given alle bovenstaande flows, When data wordt opgeslagen, Then gebeurt dit lokaal per huishouden (ADR-009/ADR-010) en blijft de app volledig bruikbaar offline.

## Scope
- Productenlijst-tab: overzicht, groepering van duplicaten met badge, samenvoegen-dialog (hoofdproduct-voorschlag + logische, aanpasbare tag-voorstellen, undo-hint).
- Productmodel + normalisatie: naam-vergelijking, merge-logica, hoofdproduct-heuristiek (kortste benaming → meest gebruikt → alfabetisch), sessie-undo — in src/App.jsx + src/app.js (sync-check).
- Recept-ingrediënt: eenheidsomrekening met automatische hoeveelheidsaanpassing + handmatige correctie; per-recept ingrediënt-tags; weergave in recept én weekmenu-weergave (#60).
- Lokale opslag per huishouden; mocks in docs/ux/producten-normalisatie/ (3 schermen × 3 versies, 390x844, inline huisstijl) + VOORSTEL.md.
- Buiten scope: EAN-codes/voedingswaarden (#48), timetags per product (#58), weekmenu-planning zelf (#60 — alleen weergave per-recept tags), backend/sync-server, meertaligheid, AI/afbeeldingen, bulk-import, permanent history-scherm (undo alleen binnen sessie).

## Randgevallen
- Lege state zonder producten → CTA 'Product toevoegen'; lijst zonder duplicaten → geen merge-UI; dialog zonder kandidaten → wordt niet getoond.
- Merge geweigerd bij conflicterende per-recept tags → waarschuwing met keuze; ongeldige hoeveelheid → validatiefout, geen opslag; genormaliseerde naam leeg na opschonen → fallback op originele naam; falende opslag → foutmelding + rollback; undo na einde sessie niet beschikbaar (merge permanent).
- Offline: alle flows werken volledig offline, data strikt per huishouden (ADR-009/ADR-010).

## Owner-besluiten (verwerkt)
1. Hoofdproduct bij samenvoegen = kortste benaming met minste woorden → bij gelijke lengte meest gebruikt in recepten → anders alfabetisch; subtielSCrewergegeven als 'voorgesteld als hoofdproduct'.
2. Per-recept tags ook zichtbaar in de weekmenu-weergave (#60), niet alleen in het recept; niet in de algemene productlijst.
3. Samenvoeging kan binnen dezelfde sessie ongedaan worden gemaakt; daarna permanent.
4. Tag-voorstellen logisch afgeleid uit het benamingsverschil (bijv. 'volle melk' vs 'melk' → 'vol'); per tag.toepassen / uitschakelen / handmatig aanpassen.

## Verificatie
- Tests in tools/test-*.cjs: normalisatie/merge-logica, hoofdproduct-heuristiek, eenheidsomrekening (1 dl = 10 cl) incl. handmatige correctie, per-recept tags incl. weekmenu-weergave, undo binnen sessie, lege state, validatie-fouten.
- npm run verify (build + sync-check src/app.js + tests + lint + typecheck); CI groen (ADR-014).

## Afhankelijkheden
Geen blocking dependency — dit issue is de basis. #58, #60 en #48 bouwen op hetzelfde productmodel. Aanbevolen volgorde: #59 → #58 → #60 → #48 (geserialiseerd; single-file app + src/app.js sync-check). Mocks-elaboratie mag parallel met #58/#60/#48.

## Mocks
- 01-productenlijst-versie-{A,B,C}.svg — **A** (badge gegroepeerde duplicaten)
- 02-samenvoegen-producten-versie-{A,B,C}.svg — **A herzien** (logische tag 'vol', aanpasbaar/uitschakelbaar, subtiel hoofdproduct, undo-hint, weekmenu-notitie)
- 03-recept-ingredient-versie-{A,B,C}.svg — **B** (inline eenheidsomrekening + per-recept tags)
- VOORSTEL.md met rationale.
