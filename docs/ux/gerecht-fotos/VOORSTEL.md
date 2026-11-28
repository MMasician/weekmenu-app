# VOORSTEL gerecht-fotos (issue #60)

Status: akkoord van owner; geïmplementeerd in deze PR.

Aanbeveling per scherm:
- Weekmenu: versie A (akkoord) — thumbnail per gerecht, placeholder + Foto toevoegen bij lege state.
- Gerechtdetail/receptentab readonly: versie A (akkoord) — compacte 96px foto, data readonly, geen vervangknop onder de foto; bij missende foto wel Foto toevoegen.
- Gerechtdetail/receptentab edit-mode: versie B voor de foto (akkoord) — compacte foto met overlay-knop in de foto: Foto vervangen; overige layout van edit-mode blijft gelijk (categorie, bereidingstijd, tags; geen dag/aantal eters vanuit receptentab).
- Camera-flow: versie A (akkoord) — camera/galerij met resize max 1024px JPEG q=0,8 ≤2MB naar lokale image-store.

Implementatie: 1 foto per gerecht in IndexedDB store dish-images, CACHE_VERSION=7, gedeelde store met #48.

## v2 — mocks in de bestaande app (ter review, issue #60 heropend)

Owner-feedback: de v1-mocks hielden geen rekening met de huidige app (andere huisstijl/tabbalk en de huidige presentatie van recepten). Daarom nu per **goedgekeurd scherm 1 mock** die laat zien hoe het eruitziet **in de bestaande app** (huidige header/tabbalk, huidige dagkaarten en recept-rijen, huidige product-kaart):

- `v2-01-weekmenu-akkoord-in-bestaande-app.svg` — weekmenu versie A (akkoord): 44px thumbnail per gerecht op de dagkaart; zonder foto een placeholder met 📷. Foto wordt pas groot getoond bij het openen van een gelockte dag (zoals nu).
- `v2-02-gerecht-detail-readonly-akkoord-in-bestaande-app.svg` — gerechtdetail readonly versie A (akkoord): compacte 96px foto, data readonly, **geen** vervangknop; zonder foto alléén de chip "📷 Foto toevoegen".
- `v2-03-gerecht-detail-edit-akkoord-in-bestaande-app.svg` — gerechtdetail edit versie B (akkoord, foto-wijziging): compacte foto met overlay-knop ín de foto ("📷 Vervangen"); de overige edit-layout (naam, categorie, bereidingstijd, tags, ingrediënten, bereiding) blijft ongewijzigd; edit-mode alleen vanuit de receptentab.
- `v2-04-camera-akkoord-in-bestaande-app.svg` — camera versie A (akkoord): foto maken/kiezen, resize max 1024px JPEG q0,8 ≤2MB naar de lokale IndexedDB image-store.

Na owner-akkoord op deze v2-mocks volgt implementatie (aanpassen van de huidige gerecht-foto-weergave hierop) in een aparte PR.
