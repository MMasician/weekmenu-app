const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadApp(file, seed, now, extra) {
  const store = seed ? { "weekmenu-app-v1": JSON.stringify(seed) } : {};
  // Optioneel: vaste klok injecteren zodat date-boundary-tests (weekstart za, "vandaag",
  // weekgrens) op elke dag van de week deterministisch zijn. Zonder `now` = echte Date.
  const sandbox = {};
  if (now) {
    const RealDate = Date;
    const t0 = now.getTime();
    // geen class-extends (tsc TS2556 op de spread); plain wrapper-functie is afdoende
    // (nergens in app/tests wordt `instanceof Date` gebruikt)
    sandbox.Date = function (...args) {
      return args.length ? Reflect.construct(RealDate, args) : new RealDate(t0);
    };
    sandbox.Date.prototype = RealDate.prototype;
    sandbox.Date.now = () => t0;
    sandbox.Date.parse = RealDate.parse;
    sandbox.Date.UTC = RealDate.UTC;
  }
  const hooks = { state: [], cursor: 0 };
  const useState = (init) => {
    const i = hooks.cursor++;
    if (!(i in hooks.state)) hooks.state[i] = typeof init === "function" ? init() : init;
    const set = (v) => { hooks.state[i] = typeof v === "function" ? v(hooks.state[i]) : v; };
    return [hooks.state[i], set];
  };
  const useMemo = (fn, _deps) => fn();
  const useEffect = () => {};
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    Fragment: "Fragment",
    useState, useMemo, useEffect,
  };
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const document = { createElement: () => ({ click() {}, style: {} }) };
  const URL = { createObjectURL: () => "", revokeObjectURL: () => {} };
  const Blob = function () {};
  const FileReader = function () {};
  const window = { confirm: () => true };
  // extra globals (bijv. fake indexedDB/canvas voor src/gerechtFotos.js) gaan de sandbox in
  // én overschrijven de wrapper-parameters (document/URL/...) als ze daar deel van uitmaken
  if (extra) Object.assign(sandbox, extra);
  // een vm-context heeft geen URL-global (Node-specifiek): module-scripts (src/openFoodFacts.js)
  // parsen URL's mee via `new URL(...)` — geef ze de echte URL-klasse. De app-wrapper krijgt
  // env.URL (evt. een fake met createObjectURL) als losse parameter binnen.
  sandbox.URL = globalThis.URL;
  // net als in de browser (script-tags in index.html): laad de src-modules in dezelfde
  // vm-context, zodat ze globalThis.<Module> zetten (ProductNormalisatie / Timetags / GerechtFotos)
  const dir = path.dirname(file);
  for (const mod of ["productNormalisatie.js", "timetags.js", "gerechtFotos.js", "openFoodFacts.js"]) {
    const p = path.join(dir, mod);
    if (fs.existsSync(p)) vm.runInNewContext(fs.readFileSync(p, "utf8"), sandbox, { filename: p });
  }
  const code = fs.readFileSync(file, "utf8");
  // vm (met filename) i.p.v. new Function, zodat V8-coverage (c8/NODE_V8_COVERAGE)
  // de code aan dit bestand koppelt in plaats van aan een anoniem script
  const wrapped = "(function (React, localStorage, document, URL, Blob, FileReader, window) {\n" +
    code + "\n;return { App };\n})";
  const fn = vm.runInNewContext(wrapped, sandbox, { filename: file });
  // sandbox meegeven zodat tests extra globals (bijv. een fake indexedDB) kunnen injecteren;
  // extra-globals zijn ook als wrapper-args beschikbaar (document/URL/... overschreven indien opgegeven)
  const env = Object.assign({ React, localStorage, document, URL, Blob, FileReader, window }, extra || {});
  return Object.assign(fn(env.React, env.localStorage, env.document, env.URL, env.Blob, env.FileReader, env.window), { hooks, store, sandbox });
}

function serialize(node) {
  if (typeof node === "function") return "[fn]";
  if (node === null || node === undefined) return node === null ? "null" : "undef";
  if (Array.isArray(node)) return node.map(serialize);
  if (typeof node === "object" && "type" in node) {
    return { t: node.type, p: serializeProps(node.props), c: (node.children || []).map(serialize) };
  }
  return typeof node === "object" ? "obj" : node;
}
function serializeProps(p) {
  const o = {};
  for (const k of Object.keys(p)) o[k] = typeof p[k] === "function" ? "[fn]" : p[k];
  return o;
}

module.exports = { loadApp, serialize };
// render-helper: reset hook-cursor en render opnieuw
if (require.main === module) {
  const seed = {
    menu: [{ id: "r25", locked: true }, null, null, null, { id: "r21" }, null, null],
    extraItems: ["Chips"],
    prices: {},
  };
  const m = loadApp(process.argv[2], seed);
  const render = () => { m.hooks.cursor = 0; return m.App(); };
  const walk = (n, f) => {
    if (Array.isArray(n)) { n.forEach((x) => walk(x, f)); return; }
    if (n && n.children) n.children.forEach((x) => walk(x, f));
    f(n);
  };
  const findTab = (label, tree) => {
    let found = null;
    walk(tree, (n) => { if (n && n.type === "button" && n.children && n.children[0] === label) found = n; });
    return found;
  };
  const raw = render();
  const pricesTab = findTab("Prijzen", raw);
  pricesTab.props.onClick();
  const pt = JSON.stringify(serialize(render()));
  console.log("prices tab heeft sectie lijst:", pt.includes("Op de lijst deze week"));
  console.log("prices tab heeft markten:", pt.includes("Albert Heijn") || pt.includes("AH"), pt.includes("Jumbo"), pt.includes("Lidl"));
}
