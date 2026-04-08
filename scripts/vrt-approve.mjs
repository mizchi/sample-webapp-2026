import { copyFile, readFile, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { repoRoot } from "./_tooling.mjs";

const config = JSON.parse(await readFile(resolve(repoRoot, "vrt.config.json"), "utf-8"));
const outputDir = resolve(repoRoot, config.outputDir);
const files = await readdir(outputDir);

for (const file of files) {
  if (file.endsWith("-current.png")) {
    const baselineName = file.replace("-current.png", "-baseline.png");
    await copyFile(resolve(outputDir, file), resolve(outputDir, baselineName));
  }
}

await Promise.all(
  files
    .filter((file) => file.endsWith("-current.png") || file.endsWith(".html") || file === "snapshot-report.json")
    .map((file) => rm(resolve(outputDir, file), { force: true })),
);
