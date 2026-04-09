import { cp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ensureArtifactsDir,
  repoRoot,
  resolveExternalRepo,
  runCommandChecked,
  startCommand,
  waitForUrl,
} from "./_tooling.mjs";

const ciMode = process.argv.includes("--ci");
const configPath = resolve(repoRoot, "vrt.config.json");
const config = JSON.parse(await readFile(configPath, "utf-8"));
const outputDir = resolve(repoRoot, config.outputDir);
const viteEntry = resolve(repoRoot, "node_modules/vite/bin/vite.js");
const apiPort = "48787";
const dashboardPort = "43173";

function getEffectiveDiffRatio(entry) {
  const rawDiffRatio = entry.diffRatio ?? Number.POSITIVE_INFINITY;
  const compensatedDiffRatio = entry.compensatedDiffRatio ?? Number.POSITIVE_INFINITY;
  return Math.min(rawDiffRatio, compensatedDiffRatio);
}

await ensureArtifactsDir();
await rm(resolve(repoRoot, ".artifacts", "vrt-summary.md"), { force: true }).catch(() => {});

const apiProcess = startCommand(
  process.execPath,
  [
    "--experimental-strip-types",
    "apps/api/src/server.ts",
  ],
  {
    env: {
      ...process.env,
      PORT: apiPort,
    },
  },
);
const dashboardProcess = startCommand(
  process.execPath,
  [
    viteEntry,
    "--config",
    "vite.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    dashboardPort,
    "--strictPort",
  ],
  {
    env: {
      ...process.env,
      DASHBOARD_API_PROXY: `http://127.0.0.1:${apiPort}`,
    },
  },
);

const shutdown = async () => {
  apiProcess.kill("SIGTERM");
  dashboardProcess.kill("SIGTERM");
  await Promise.allSettled([
    new Promise((resolveNext) => apiProcess.once("exit", resolveNext)),
    new Promise((resolveNext) => dashboardProcess.once("exit", resolveNext)),
  ]);
};

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(130));
});

process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(143));
});

try {
  await waitForUrl(`http://127.0.0.1:${apiPort}/api/health`);
  await waitForUrl(config.baseUrl);

  const vrtRoot = resolveExternalRepo("vrt", "VRT_DIR");
  const urls = config.routes.map((route) => new URL(route, config.baseUrl).toString());

  runCommandChecked("pnpm", [
    "--dir",
    vrtRoot,
    "exec",
    "node",
    "--experimental-strip-types",
    "src/vrt.ts",
    "snapshot",
    ...urls,
    "--output",
    outputDir,
  ]);

  const report = JSON.parse(await readFile(resolve(outputDir, "snapshot-report.json"), "utf-8"));
  const results = report.results ?? [];
  const newBaselines = results.filter((entry) => entry.isNew);
  const compared = results.filter((entry) => !entry.isNew);
  const regressions = compared.filter((entry) => {
    const diffRatio = getEffectiveDiffRatio(entry);
    return diffRatio > config.threshold;
  });

  const lines = [
    "# vrt snapshot summary",
    "",
    `- compared: ${compared.length}`,
    `- new baselines: ${newBaselines.length}`,
    `- threshold: ${(config.threshold * 100).toFixed(2)}%`,
    `- regressions: ${regressions.length}`,
    "",
  ];

  if (regressions.length > 0) {
    lines.push("## regressions", "");
    for (const regression of regressions) {
      const diffRatio = getEffectiveDiffRatio(regression);
      lines.push(`- ${regression.label} / ${regression.viewport}: ${(diffRatio * 100).toFixed(2)}%`);
    }
    lines.push("");
  }

  if (newBaselines.length > 0) {
    lines.push("## new baselines", "");
    for (const entry of newBaselines) {
      lines.push(`- ${entry.label} / ${entry.viewport}`);
    }
    lines.push("");
  }

  await writeFile(resolve(repoRoot, ".artifacts", "vrt-summary.md"), lines.join("\n"));
  await cp(resolve(outputDir, "snapshot-report.json"), resolve(repoRoot, ".artifacts", "snapshot-report.json"));

  if (regressions.length > 0 || (ciMode && newBaselines.length > 0)) {
    process.exitCode = 1;
  }
} finally {
  await shutdown();
}
