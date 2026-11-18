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
        props.push(JSON.stringify(s.slice(i + 1, end - 1)));
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
      if (txt !== null) children.push(JSON.stringify(txt));
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

// JSX-tekst volgens de JSX/Babel-regels:
// - witruimte op dezelfde regel blijft exact staan (ook spaties naast expressies)
// - witruimte naast een newline wordt weggehaald; lege regels vervallen
// - HTML-entities worden gedecodeerd
function jsxText(raw) {
  const decode = (s) =>
    s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
     .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, "\u00a0");
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

const fs = require("fs");
const input = process.argv[2];
const output = process.argv[3];
let src = fs.readFileSync(input, "utf8");
// import-regel vervangen door globale React-destructuring (zoals in de repo)
src = src.replace(
  /^import React[^\n]*\n/,
  'const { useState, useMemo, useEffect } = React; // React global (vendor/react.min.js)\n'
);
src = src.replace(/^export default /m, "");
fs.writeFileSync(output, transform(src) + "\n");
