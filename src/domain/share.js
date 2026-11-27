// Delen via bestand (ADR-019): stempels, tombstones en merge-regels (pure helpers).
// ---- Delen via bestand (ADR-019): pure helpers ----
export const SHARE_BUNDLE = "weekmenu-share-v1";
// Vergelijk records zonder tijdstempel, zodat "nieuwste wint" alleen bij echte inhoudelijke wijzigingen aanslaat.
export const shareStrip = (o) => JSON.stringify(o, (k, v) => (k === "updatedAt" ? undefined : v));
export function shareStampArray(prevArr, nextArr, keyOf) {
  const now = Date.now();
  const prevMap = new Map((prevArr || []).map((r) => [keyOf(r), r]));
  return (nextArr || []).map((r) => {
    const p = prevMap.get(keyOf(r));
    return !p || shareStrip(p) !== shareStrip(r) ? { ...r, updatedAt: now } : r;
  });
}
export function shareStampObject(prevObj, nextObj) {
  const now = Date.now();
  const out = {};
  Object.entries(nextObj || {}).forEach(([k, v]) => {
    const p = (prevObj || {})[k];
    out[k] = !p || shareStrip(p) !== shareStrip(v) ? { ...v, updatedAt: now } : v;
  });
  return out;
}
export function shareTombs(prevArr, nextArr, keyOf, prefix) {
  const nextKeys = new Set((nextArr || []).map(keyOf));
  const tombs = {};
  (prevArr || []).forEach((r) => {
    const k = keyOf(r);
    if (!nextKeys.has(k)) tombs[prefix + k] = Date.now();
  });
  return tombs;
}
export function shareTombsObject(prevObj, nextObj, prefix) {
  const tombs = {};
  Object.keys(prevObj || {}).forEach((k) => {
    if (!Object.prototype.hasOwnProperty.call(nextObj || {}, k)) tombs[prefix + k] = Date.now();
  });
  return tombs;
}
export function shareTs(r) {
  return r && typeof r.updatedAt === "number" ? r.updatedAt : 0;
}
// Samenvoegregels (ADR-019): per record wint de nieuwste versie (updatedAt). Zit een record niet
// meer in het deelbestand, dan geldt het daar als verwijderd (tijdstempel uit data.deleted).
// Instellingen en vinkjes gaan als één geheel mee (updatedAt/checkedAt). Puur: geen Date.now,
// zodat de regels deterministisch testbaar zijn.
export function mergeShareBundle(local, bundle) {
  const chips = (bundle && bundle.chips) || {};
  const b = (bundle && bundle.data) || {};
  const bDel = b.deleted || {};
  const out = { deleted: { ...((local && local.deleted) || {}) } };
  const conflicts = [];
  const counts = {};
  const on = (k) => chips[k] !== false;
  const keepC = (kind, extra) => { counts[kind] = Object.assign({ added: 0, updated: 0, kept: 0, removed: 0 }, extra || {}); };
  const locNames = {};
  ((local && local.stockLocations) || []).concat(b.stockLocations || []).forEach((l) => { if (l && l.id) locNames[l.id] = l.name; });
  function mergeArr(kind, chip, prefix, keyOf, label, prevA, incA) {
    const prev = prevA || [];
    const incMap = new Map((incA || []).map((r) => [keyOf(r), r]));
    const res = [];
    const c = { added: 0, updated: 0, kept: 0, removed: 0 };
    prev.forEach((r) => {
      const k = keyOf(r);
      const tomb = prefix + k;
      const inR = incMap.get(k);
      if (inR) incMap.delete(k);
      const tombB = bDel[tomb];
      const tombL = out.deleted[tomb];
      // in de bron teruggekomen én nieuwer dan een verwijderingsmarkering? Dan leeft het weer.
      if (inR && ((tombB != null && shareTs(inR) > tombB) || (tombL != null && shareTs(inR) > tombL))) delete out.deleted[tomb];
      if (tombB != null && tombB >= shareTs(r)) { c.removed++; out.deleted[tomb] = tombB; return; }
      if (tombL != null && tombL >= shareTs(r) && !(inR && shareTs(inR) > tombL)) return;
      if (inR && shareTs(inR) > shareTs(r)) {
        res.push(inR); c.updated++;
        if (shareStrip(r) !== shareStrip(inR)) conflicts.push({ naam: label(r), hier: label(r), daar: label(inR) });
      } else { res.push(r); c.kept++; }
    });
    incMap.forEach((r, k) => {
      const tomb = prefix + k;
      const tombL = out.deleted[tomb];
      if (tombL != null && tombL >= shareTs(r)) return; // hier bewust verwijderd
      if (tombL != null) delete out.deleted[tomb];
      res.push(r); c.added++;
    });
    counts[kind] = c;
    return res;
  }
  const kinds = [
    { key: "recipes", chip: "recipes", prefix: "recipe:", keyOf: (r) => r.id, label: (r) => r.name + " (" + r.timeCat + (Array.isArray(r.tags) && r.tags.length ? ", " + r.tags.join("/") : "") + ")" },
    { key: "products", chip: "products", prefix: "product:", keyOf: (p) => p.id, label: (p) => p.name },
    { key: "stockLocations", chip: "stock", prefix: "location:", keyOf: (l) => l.id, label: (l) => l.name },
    { key: "stock", chip: "stock", prefix: "stock:", keyOf: (s) => s.loc + "|" + (s.pid || s.name), label: (s) => s.name + " (" + (locNames[s.loc] || s.loc) + ", " + s.have + "×)" },
    { key: "extraItems", chip: "menu", prefix: "extra:", keyOf: (x) => x.pid || x.name, label: (x) => x.name },
  ];
  kinds.forEach((m) => {
    out[m.key] = on(m.chip)
      ? mergeArr(m.key, m.chip, m.prefix, m.keyOf, m.label, local[m.key], b[m.key])
      : (keepC(m.key), (local[m.key] || []));
  });
  if (on("menu")) {
    const prev = local.menuByDate || {};
    const inc = b.menuByDate || {};
    const res = {};
    const c = { added: 0, updated: 0, kept: 0, removed: 0 };
    Object.keys(prev).forEach((k) => {
      const tomb = "menu:" + k;
      const inE = inc[k];
      const tombL = out.deleted[tomb];
      if (inE && tombL != null && shareTs(inE) > tombL) delete out.deleted[tomb];
      const tombB = bDel[tomb];
      if (tombB != null && tombB >= shareTs(prev[k])) { c.removed++; out.deleted[tomb] = tombB; return; }
      if (tombL != null && tombL >= shareTs(prev[k]) && !(inE && shareTs(inE) > tombL)) return;
      if (inE && shareTs(inE) > shareTs(prev[k])) { res[k] = inE; c.updated++; }
      else { res[k] = prev[k]; c.kept++; }
    });
    Object.keys(inc).forEach((k) => {
      if (k in prev || k in res) return;
      const tomb = "menu:" + k;
      const tombL = out.deleted[tomb];
      if (tombL != null && tombL >= shareTs(inc[k])) return;
      if (tombL != null) delete out.deleted[tomb];
      res[k] = inc[k]; c.added++;
    });
    out.menuByDate = res;
    counts.menuByDate = c;
  } else { out.menuByDate = local.menuByDate || {}; keepC("menuByDate"); }
  if (on("settings")) {
    const ls = local.settings || {};
    const bs = b.settings;
    if (bs && shareTs(bs) > shareTs(ls)) { out.settings = bs; keepC("settings", { updated: 1 }); }
    else { out.settings = ls; keepC("settings", { kept: 1 }); }
    const lct = local.checkedAt || 0;
    const bct = typeof b.checkedAt === "number" ? b.checkedAt : 0;
    if (b.checked && bct > lct) { out.checked = b.checked; out.checkedAt = bct; }
    else { out.checked = local.checked || {}; out.checkedAt = lct; }
    Object.entries(bDel).forEach(([k, t]) => { if (!(k in out.deleted) || out.deleted[k] < t) out.deleted[k] = t; });
  } else {
    out.settings = local.settings || {};
    out.checked = local.checked || {};
    out.checkedAt = local.checkedAt || 0;
  }
  return { next: out, rapport: { counts, conflicts } };
}


