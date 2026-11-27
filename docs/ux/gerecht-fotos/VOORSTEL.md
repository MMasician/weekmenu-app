# VOORSTEL gerecht-fotos (issue #60)

Status: akkoord van owner; geïmplementeerd in deze PR.

Aanbeveling per scherm:
- Weekmenu: versie A (akkoord) — thumbnail per gerecht, placeholder + Foto toevoegen bij lege state.
- Gerechtdetail/receptentab readonly: versie A (akkoord) — compacte 96px foto, data readonly, geen vervangknop onder de foto; bij missende foto wel Foto toevoegen.
- Gerechtdetail/receptentab edit-mode: versie B voor de foto (akkoord) — compacte foto met overlay-knop in de foto: Foto vervangen; overige layout van edit-mode blijft gelijk (categorie, bereidingstijd, tags; geen dag/aantal eters vanuit receptentab).
- Camera-flow: versie A (akkoord) — camera/galerij met resize max 1024px JPEG q=0,8 ≤2MB naar lokale image-store.

Implementatie: 1 foto per gerecht in IndexedDB store dish-images, CACHE_VERSION=7, gedeelde store met #48.
