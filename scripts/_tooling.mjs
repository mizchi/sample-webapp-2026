import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(scriptDir, "..");

export function resolveExternalRepo(name, envKey) {
  return resolve(process.env[envKey] ?? resolve(repoRoot, "..", name));
}

export async function ensureArtifactsDir() {
  await mkdir(resolve(repoRoot, ".artifacts"), { recursive: true });
}

export function runCommandChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
    ...options,
  });

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    throw result.error;
  }
}

export function startCommand(command, args, options = {}) {
  return spawn(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
    ...options,
  });
}

export async function waitForUrl(url, timeoutMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the timeout expires.
    }
    await new Promise((resolveNext) => setTimeout(resolveNext, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export function ensureFileExists(path, message) {
  if (!existsSync(path)) {
    throw new Error(message);
  }
}
