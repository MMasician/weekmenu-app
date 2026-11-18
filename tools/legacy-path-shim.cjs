const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.join(__dirname, "..");
const LEGACY_PREFIX = "/home/user/weekmenu-app";
const mapPath = (p) =>
  typeof p === "string" && p.startsWith(LEGACY_PREFIX)
    ? path.join(ROOT, p.slice(LEGACY_PREFIX.length))
    : p;

const origReadFileSync = fs.readFileSync;
fs.readFileSync = function (p, ...rest) {
  return origReadFileSync.call(this, mapPath(p), ...rest);
};

const ModuleAny = /** @type {any} */ (Module);
const origResolveFilename = ModuleAny._resolveFilename;
ModuleAny._resolveFilename = function (request, ...rest) {
  return origResolveFilename.call(this, mapPath(request), ...rest);
};
