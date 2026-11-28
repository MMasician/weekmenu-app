// Externe UMD-modules (geladen via index.html vóór app.js; in Node-tests via require).
// issue #59: productnormalisatie-module (geladen via index.html vóór app.js; in Node-tests via require)
export const PN = (typeof globalThis !== "undefined" && globalThis.ProductNormalisatie) || null;
// issue #58: timetags-module ( idem )
export const TT = (typeof globalThis !== "undefined" && globalThis.Timetags) || null;
// issue #60: gerecht-foto's (lokale IndexedDB image-store)
export const GF = (typeof globalThis !== "undefined" && globalThis.GerechtFotos) || null;
// issue #48: Open Food Facts productgegevens (EAN/zoek/voedingswaarden/foto's)
export const OFF = (typeof globalThis !== "undefined" && globalThis.OpenFoodFacts) || null;
