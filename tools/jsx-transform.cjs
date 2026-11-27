// Minimale JSX -> React.createElement transformer, geverifieerd tegen de
// bestaande gecompileerde src/app.js (esbuild-uitvoer) in deze repo.
"use strict";

// Slaat een string (', ", `) over, inclusief geneste ${} in templates.
function skipString(s, i) {
  const q = s[i];
  i++;
  while (i < s.length) {
    const c = s[i];
    if (c === "\\") { i += 2; continue; }
    if (q === "`" && c === "$" && s[i + 1] === "{") {
      i = skipBraces(s, i + 1);
      continue;
    }
    if (c === q) return i + 1;
    i++;
  }
  throw new Error("unterminated string");
}

// i wijst naar '{'; geeft index na bijbehorende '}' terug.
// Handhaaft strings, comments en geneste JSX (woordelijk gekopieerd).
function skipBraces(s, i) {
  i++; // {
  let depth = 1;
  while (i < s.length) {
    const c = s[i];
    if (c === "'" || c === "`" || c === '"') { i = skipString(s, i); continue; }
    if (c === "/" && s[i + 1] === "/") { i = s.indexOf("\n", i); if (i < 0) i = s.length; continue; }
    if (c === "/" && s[i + 1] === "*") { i = s.indexOf("*/", i) + 2; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return i + 1; }
    i++;
  }
  throw new Error("unterminated braces");
}

// kopieert expressie (beginnend na '{', tot bijbehorende '}'), transformeert geneste JSX
function transformExpr(s, start, end) {
  return transform(s.slice(start, end));
}

function parseName(s, i) {
  const m = /^[A-Za-z_$][\w$-]*/.exec(s.slice(i));
  if (!m) throw new Error("expected name at " + i + ": " + s.slice(i, i + 40));
  return [m[0], i + m[0].length];
}

function parseElement(s, i) {
  // s[i] === '<'
  let tag = "";
  i++;
  if (s[i] !== ">") {
    const [name, ni] = parseName(s, i);
    tag = name;
    i = ni;
  } else {
    i++; // fragment
  }
  const props = [];
  let selfClosing = false;
  while (i < s.length) {
    while (/\s/.test(s[i])) i++;
    const c = s[i];
    if (c === "/" && s[i + 1] === ">") { selfClosing = true; i += 2; break; }
    if (c === ">") { i++; break; }
    if (c === "{") {
      // spread {...expr}
      const end = skipBraces(s, i);
      props.push("..." + transformExpr(s, i + 1, end - 1));
      i = end;
      continue;
    }
    const [aname, ai] = parseName(s, i);
    i = ai;
    while (/\s/.test(s[i])) i++;
    if (s[i] === "=") {
      i++;
      while (/\s/.test(s[i])) i++;
      if (s[i] === '"' || s[i] === "'") {
        const end = skipString(s, i);
        const val = s.slice(i + 1, end - 1);
        props.push(TEXT_ATTRS.has(aname) ? wrapT(val) : JSON.stringify(val));
        i = end;
      } else if (s[i] === "{") {
        const end = skipBraces(s, i);
        props.push(transformExpr(s, i + 1, end - 1));
        i = end;
      } else throw new Error("unexpected attr value at " + i);
      props[props.length - 1] = JSON.stringify(aname) + ": " + props[props.length - 1];
    } else {
      props.push(JSON.stringify(aname) + ": true");
    }
  }
  let children = [];
  if (!selfClosing) {
    for (;;) {
      const c = s[i];
      if (c === "<" && s[i + 1] === "/") {
        const close = /^<\/\s*[A-Za-z_$][\w$-]*\s*>/.exec(s.slice(i));
        if (!close) throw new Error("bad close at " + i);
        i += close[0].length;
        break;
      }
      if (c === "{") {
        const end = skipBraces(s, i);
        const inner = s.slice(i + 1, end - 1);
        if (!/^\/\*[\s\S]*\*\/$/.test(inner.trim()) || inner.trim() === "") {
          children.push(transformExpr(s, i + 1, end - 1));
        }
        i = end;
        continue;
      }
      if (c === "<") {
        const [child, ni] = parseElement(s, i);
        children.push(child.code);
        i = ni;
        continue;
      }
      // tekst t/m volgende < of {
      let j = i;
      while (j < s.length && s[j] !== "<" && s[j] !== "{") j++;
      const raw = s.slice(i, j);
      const txt = jsxText(raw);
      if (txt !== null) children.push(wrapT(txt));
      i = j;
    }
  }
  const tagArg = tag === "" ? "React.Fragment" : JSON.stringify(tag);
  const propsArg = props.length ? "{ " + props.join(", ") + " }" : "null";
  const code =
    "/*#__PURE__*/React.createElement(" +
    tagArg + ", " + propsArg +
    (children.length ? ", " + children.join(", ") : "") +
    ")";
  return [{ code }, i];
}

// Tekst-attributen die vertaalbaar zijn (de rest, bijv. className, blijft literal).
const TEXT_ATTRS = new Set(["title", "placeholder", "aria-label", "alt"]);
// Vertaalbare GUI-tekst (bevat letters) -> __t("..."); pictogrammen/getallen blijven literal.
function wrapT(txt) {
  return /[A-Za-z\u00c0-\u024f]/.test(txt) ? "__t(" + JSON.stringify(txt) + ")" : JSON.stringify(txt);
}

// JSX-tekst volgens de JSX/Babel-regels:
// - witruimte op dezelfde regel blijft exact staan (ook spaties naast expressies)
// - witruimte naast een newline wordt weggehaald; lege regels vervallen
// - HTML-entities worden gedecodeerd
function jsxText(raw) {
  // &amp; laatst decoderen, anders wordt bv. '&amp;lt;' dubbel gedeodeerd tot '<'
  const decode = (s) =>
    s.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
     .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, "\u00a0")
     .replace(/&amp;/g, "&");
  if (raw.indexOf("\n") === -1) return raw === "" ? null : decode(raw);
  const lines = raw.split("\n");
  let lastNonEmpty = 0;
  lines.forEach((l, i) => { if (/[^ \t]/.test(l)) lastNonEmpty = i; });
  let out = "";
  lines.forEach((l, i) => {
    let t = l.replace(/\t/g, " ");
    if (i > 0) t = t.replace(/^ +/, "");
    if (i < lines.length - 1 || i === lastNonEmpty) t = t.replace(/ +$/, "");
    if (t !== "" && out !== "") throw new Error("tekst over meerdere regels: handmatig controleren: " + JSON.stringify(raw));
    out += t;
  });
  if (out.trim() === "") return null;
  return decode(out);
}

function transform(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"' || c === "`") { const e = skipString(src, i); out += src.slice(i, e); i = e; continue; }
    if (c === "/" && src[i + 1] === "/") { const e = src.indexOf("\n", i); const end = e < 0 ? src.length : e; out += src.slice(i, end); i = end; continue; }
    if (c === "/" && src[i + 1] === "*") { const e = src.indexOf("*/", i) + 2; out += src.slice(i, e); i = e; continue; }
    if (c === "<" && (/[A-Za-z]/.test(src[i + 1] || "") || src[i + 1] === ">")) {
      const [child, ni] = parseElement(src, i);
      out += child.code;
      i = ni;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

// ---- mini-bundler: ESM-bronnen (met JSX in .jsx) -> één classic script (src/app.js) ----
// De app laadt React als globale (vendor/react.min.js); deze bundler verpakt de bronmodules
// in een kleine module-registry zodat index.html en de test-harness ongewijzigd blijven.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// import/export-regels herschrijven (regel-gebaseerd; imports staan per regel bovenaan)
function rewriteModule(src) {
  const out = [];
  const namedExports = [];
  let imp = 0;
  for (const line of src.split("\n")) {
    let m;
    if ((m = /^import\s+([^'"]+?)\s+from\s+["']([^"']+)["'];?\s*$/.exec(line))) {
      const clause = m[1].trim();
      const spec = m[2];
      if (spec === "react") {
        const brace = /\{([^}]*)\}/.exec(clause);
        if (brace) out.push("const { " + brace[1].trim() + " } = React; // React global (vendor/react.min.js)");
        continue;
      }
      const tmp = "__imp" + imp++;
      out.push("const " + tmp + " = require(" + JSON.stringify(spec) + ");");
      const rest = clause.replace(/^[A-Za-z_$][\w$]*\s*,?\s*/, "");
      const def = /^([A-Za-z_$][\w$]*)/.exec(clause);
      if (def && rest.charAt(0) !== "{" && rest.charAt(0) !== "*") out.push("const " + def[1] + " = " + tmp + ".default;");
      const ns = /^\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(rest);
      if (ns) out.push("const " + ns[1] + " = " + tmp + ";");
      const brace2 = /\{([^}]*)\}/.exec(rest);
      if (brace2) {
        const names = brace2[1].split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
          const am = /^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/.exec(s);
          return am ? am[1] + ": " + am[2] : s;
        });
        out.push("const { " + names.join(", ") + " } = " + tmp + ";");
      }
      continue;
    }
    if ((m = /^import\s+["']([^"']+)["'];?\s*$/.exec(line))) {
      out.push("require(" + JSON.stringify(m[1]) + ");");
      continue;
    }
    if (/^export\s+default\s+/.test(line)) {
      out.push(line.replace(/^export\s+default\s+/, "module.exports.default = "));
      continue;
    }
    if ((m = /^export\s+(?:async\s+function|function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line))) {
      namedExports.push([m[1], m[1]]);
      out.push(line.replace(/^export\s+/, ""));
      continue;
    }
    if ((m = /^export\s*\{([^}]*)\};?\s*$/.exec(line))) {
      for (const part of m[1].split(",")) {
        const p = part.trim();
        if (!p) continue;
        const am = /^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/.exec(p);
        if (am) namedExports.push([am[1], am[2]]);
        else namedExports.push([p, p]);
      }
      continue;
    }
    out.push(line);
  }
  for (const pair of namedExports) out.push("exports." + pair[1] + " = " + pair[0] + ";");
  return out.join("\n");
}

function resolveSpec(fromId, spec) {
  if (spec.charAt(0) !== ".") return null; // extern (bijv. react) -> globale
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromId), spec));
  for (const c of [base, base + ".js", base + ".jsx", base + ".mjs"]) {
    const p = path.join(ROOT, c);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return { id: c, file: p };
  }
  throw new Error("Kan module niet vinden: " + spec + " (van " + fromId + ")");
}

function crawl(entryFile) {
  const modules = new Map();
  const visit = (file) => {
    const id = path.posix.relative(ROOT, file).split(path.sep).join("/");
    if (modules.has(id)) return;
    modules.set(id, null);
    const src = fs.readFileSync(file, "utf8");
    const specs = [];
    for (const line of src.split("\n")) {
      const m = /^import\s+[^'"]+?\s+from\s+["']([^"']+)["']/.exec(line) || /^import\s+["']([^"']+)["']/.exec(line);
      if (m) specs.push(m[1]);
    }
    const rewritten = rewriteModule(src);
    modules.set(id, id.endsWith(".jsx") ? transform(rewritten) : rewritten);
    for (const spec of specs) {
      const r = resolveSpec(id, spec);
      if (r) visit(r.file);
    }
  };
  visit(entryFile);
  return modules;
}

function emit(modules, entryId) {
  const parts = [];
  parts.push("/* Gegenereerd door `npm run build` (tools/jsx-transform.cjs) - niet handmatig bewerken. Bron: src/ */");
  parts.push("(function () {");
  parts.push("var __modules = {");
  for (const entry of modules) {
    parts.push(JSON.stringify(entry[0]) + ": function (module, exports, require) {");
    parts.push(entry[1]);
    parts.push("},");
  }
  parts.push("};");
  parts.push([
    "var __cache = {};",
    "function __resolve(fromId, spec) {",
    "  if (spec.charAt(0) !== '.') throw new Error('externe module in bundle: ' + spec);",
    "  var parts = fromId.split('/'); parts.pop();",
    "  spec.split('/').forEach(function (p) { if (p === '..') parts.pop(); else if (p !== '.') parts.push(p); });",
    "  var base = parts.join('/');",
    "  var cands = [base, base + '.js', base + '.jsx', base + '.mjs'];",
    "  for (var i = 0; i < cands.length; i++) if (__modules[cands[i]]) return cands[i];",
    "  throw new Error('module niet in bundle: ' + spec + ' (van ' + fromId + ')');",
    "}",
    "function __load(id) {",
    "  if (__cache[id]) return __cache[id].exports;",
    "  var m = { exports: {} };",
    "  __cache[id] = m;",
    "  __modules[id](m, m.exports, function (spec) { return __load(__resolve(id, spec)); });",
    "  return m.exports;",
    "}",
    // i18n: __t vertaalt GUI-teksten (auto-wrap in .jsx); bij ontbrekende module: identiteit
    "function __t(key, vars) { return __i18n.t(key, vars); }",
    "var __i18n = (function () { try { return __load(\"src/i18n/index.js\"); } catch (e) { return { t: function (k) { return k; } }; } })();",
    "var __entry = __load(" + JSON.stringify(entryId) + ");",
    "globalThis.App = __entry.default || __entry;",
    "globalThis.__weekmenuModules = __load; // test/debug: pure modules benaderen (tools/test-*.cjs)",
    "})();",
  ].join("\n"));
  return parts.join("\n") + "\n";
}

const input = path.resolve(process.argv[2]);
const output = path.resolve(process.argv[3]);
const entryId = path.posix.relative(ROOT, input).split(path.sep).join("/");
fs.writeFileSync(output, emit(crawl(input), entryId));
