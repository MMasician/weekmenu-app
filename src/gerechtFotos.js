/*
 * Foto's per gerecht — lokale IndexedDB image-store (issue #60, ADR-015).
 * Browser: geladen via index.html (zet globalThis.GerechtFotos).
 * Node (tests): via require() — de IndexedDB-functies zijn dan niet aanroepbaar,
 * alleen de export/constantes zijn testbaar.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.GerechtFotos = api;
})(typeof globalThis !== 'undefined' ? globalThis : self, function () {
  'use strict';

  const DB_NAME = 'weekmenu-app';
  const DB_VERSION = 1;
  const IMAGE_STORE = 'dish-images'; // keyPath 'dishId' (recept-id)
  const MAX_IMAGE_DIM = 1024; // max breedte/hoogte in px
  const JPEG_QUALITY = 0.8;
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

  function openImageDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IMAGE_STORE)) db.createObjectStore(IMAGE_STORE, { keyPath: 'dishId' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function saveDishImage(dishId, blob, width, height) {
    const db = await openImageDb();
    try {
      const tx = db.transaction(IMAGE_STORE, 'readwrite');
      tx.objectStore(IMAGE_STORE).put({ dishId, blob, mime: 'image/jpeg', width, height, updatedAt: Date.now() });
      await txDone(tx);
    } finally {
      db.close();
    }
  }

  async function getDishImage(dishId) {
    const db = await openImageDb();
    try {
      const tx = db.transaction(IMAGE_STORE, 'readonly');
      return await new Promise((resolve, reject) => {
        const r = tx.objectStore(IMAGE_STORE).get(dishId);
        r.onsuccess = () => resolve(r.result || null);
        r.onerror = () => reject(r.error);
      });
    } finally {
      db.close();
    }
  }

  async function deleteDishImage(dishId) {
    const db = await openImageDb();
    try {
      const tx = db.transaction(IMAGE_STORE, 'readwrite');
      tx.objectStore(IMAGE_STORE).delete(dishId);
      await txDone(tx);
    } finally {
      db.close();
    }
  }

  // Verklein een foto naar max 1024px, JPEG q=0.8, en verlaag kwaliteit tot <= 2MB.
  async function resizeImageBlob(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (bitmap.close) bitmap.close();
    let quality = JPEG_QUALITY;
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    while (blob && blob.size > MAX_IMAGE_BYTES && quality > 0.35) {
      quality = Math.max(0.35, quality - 0.1);
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    }
    return { blob, width, height };
  }

  return {
    DB_NAME, DB_VERSION, IMAGE_STORE, MAX_IMAGE_DIM, JPEG_QUALITY, MAX_IMAGE_BYTES,
    openImageDb, saveDishImage, getDishImage, deleteDishImage, resizeImageBlob,
  };
});
