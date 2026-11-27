# Mock — Camera/capture flow (issue #60)

Aanbevolen versie A: native capture via accept='image/*' + capture='environment', daarna preview + automatische compressie.

```
 Stap 1 — capture
 ┌────────────────────────────┐
 │   [ native camera UI ]     │  environment (achtercamera)
 │           ◉                │
 └────────────────────────────┘

 Stap 2 — preview + automatisch verkleinen (max 1024px, JPEG q≈0,8)
 ┌────────────────────────────┐
 │  ┌────────────────────┐    │
 │  │   preview foto     │    │
 │  └────────────────────┘    │
 │   [ Opslaan ]              │
 │   [ Opnieuw maken ]        │
 │   [ Annuleren ]            │
 └────────────────────────────┘

 Stap 3 — terug op gerechtdetail: hero-foto bijgewerkt
```

- Fout: rechten geweigerd → melding 'Geen cameratoegang' + knop 'Kies uit galerij'
- Fout: compressie/opslag faalt → melding, gerecht blijft zonder foto
- Offline: alle stappen werken zonder netwerk (opslag in lokale image-store)
