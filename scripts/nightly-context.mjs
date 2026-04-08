import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ensureArtifactsDir, repoRoot } from "./_tooling.mjs";

async function readOrPlaceholder(path, placeholder) {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return placeholder;
  }
}

await ensureArtifactsDir();

const flakerReview = await readOrPlaceholder(
  resolve(repoRoot, ".artifacts", "flaker-review.md"),
  "_flaker review was not generated in this run._",
);
const vrtReview = await readOrPlaceholder(
  resolve(repoRoot, ".artifacts", "vrt-summary.md"),
  "_vrt summary was not generated in this run._",
);

const combined = [
  "# nightly quality context",
  "",
  "## flaker",
  "",
  flakerReview.trim(),
  "",
  "## vrt",
  "",
  vrtReview.trim(),
  "",
].join("\n");

await writeFile(resolve(repoRoot, ".artifacts", "nightly-context.md"), combined);
