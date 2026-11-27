# Mock — Weekmenu met gerecht-foto's (issue #60)

Aanbevolen versie A (zie VOORSTEL.md): thumbnail 56×56, rijhoogte ongewijzigd.

```
 WEEKMENU  week 47                     [+]
 ─────────────────────────────────────────
 [🍽]  Boerenkool stamppot           ›
 [🍽]  Kip tandoori                   ›
 [ ]   Nasi goreng      (lege state: placeholder, geen foto)
 [🍽]  Hutspot                        ›
 ─────────────────────────────────────────
 [Weekmenu] [Recepten] [Boodschappen]
```

- Thumbnail: 56×56, border-radius 8px, object-fit: cover
- Lege state: grijs placeholder-icoon (bord+lepel); in de receptentab additionally de tekst 'Nog geen foto — tik om toe te voegen'
- Tik op thumbnail → fullscreen foto (versie C van scherm 2 als detailweergave)
