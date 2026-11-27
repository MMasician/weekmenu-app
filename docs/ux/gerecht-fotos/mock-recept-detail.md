# Mock — Receptentab / gerechtdetail (issue #60)

Aanbevolen versie A: hero-foto bovenaan + knop 'Foto maken / wijzigen'.

```
 ┌──────────────────────────────────────┐
 │  ┌──────────────────────────────┐    │
 │  │      HERO-FOTO               │    │  100% breedte × 200px, object-fit: cover
 │  │      (of placeholder)        │    │
 │  └──────────────────────────────┘    │
 ├──────────────────────────────────────┤
 │  Kip tandoori              [ 📷 Foto ]│  knop: maken/wijzigen
 │  ─────────────────────────────────── │
 │  Ingredienten: kip, yoghurt, ...     │
 │  Bereiding: ...                      │
 └──────────────────────────────────────┘
```

- Bij geen foto: placeholder met hint 'Foto toevoegen'
- Na maken/wijzigen van een foto verversen hero én weekmenu-thumbnail direct (lokale image-store)
