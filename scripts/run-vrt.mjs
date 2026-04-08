import { resolve } from "node:path";
import {
  repoRoot,
  resolveExternalRepo,
  runCommandChecked,
} from "./_tooling.mjs";

const vrtRoot = resolveExternalRepo("vrt", "VRT_DIR");
const vrtEntry = resolve(vrtRoot, "src/vrt.ts");

runCommandChecked(process.execPath, ["--experimental-strip-types", vrtEntry, ...process.argv.slice(2)], {
  cwd: repoRoot,
});
