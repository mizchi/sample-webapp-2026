import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  repoRoot,
  resolveExternalRepo,
  runCommandChecked,
} from "./_tooling.mjs";

const flakerRoot = resolveExternalRepo("flaker", "FLAKER_DIR");
const flakerEntry = resolve(flakerRoot, "dist/cli/main.js");

if (!existsSync(flakerEntry)) {
  runCommandChecked("pnpm", ["build"], {
    cwd: flakerRoot,
  });
}

runCommandChecked(process.execPath, [flakerEntry, ...process.argv.slice(2)], {
  cwd: repoRoot,
});
