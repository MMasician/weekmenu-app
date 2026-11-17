const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SHIM = path.join(__dirname, "legacy-path-shim.cjs");
const tests = fs
  .readdirSync(__dirname)
  .filter((f) => /^test-.*\.cjs$/.test(f))
  .sort();

if (tests.length === 0) {
  console.error("Geen testbestanden gevonden (tools/test-*.cjs)");
  process.exit(1);
}

let failed = 0;
for (const t of tests) {
  console.log(`\n=== ${t} ===`);
  const r = spawnSync(process.execPath, ["--require", SHIM, path.join(__dirname, t)], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, WEEKMENU_APP_ROOT: ROOT },
  });
  if (r.status !== 0) failed++;
}

console.log(
  failed === 0
    ? `\nALLE TESTS GESLAAGD (${tests.length} bestand(en))`
    : `\n${failed} van ${tests.length} testbestand(en) GEFAALD`
);
process.exit(failed === 0 ? 0 : 1);
