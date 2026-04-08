import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface WeeklyReviewSignal {
  id: string;
  label: string;
  outcome: string;
}

export interface WeeklyReviewIssueInput {
  date: Date;
  signals: WeeklyReviewSignal[];
  flakerReview: string;
  vrtReview: string;
  runUrl?: string;
}

const PLACEHOLDER_FLAKER = "_flaker review was not generated in this run._";
const PLACEHOLDER_VRT = "_vrt summary was not generated in this run._";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

export function getIsoWeekParts(date: Date): { year: number; week: number } {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: utc.getUTCFullYear(), week };
}

export function buildWeeklyReviewTitle(date: Date): string {
  const { year, week } = getIsoWeekParts(date);
  return `weekly review: ${year}-W${pad2(week)}`;
}

function normalizeOutcome(outcome: string): "success" | "failure" | "skipped" | "cancelled" | "neutral" {
  switch (outcome) {
    case "success":
      return "success";
    case "skipped":
      return "skipped";
    case "cancelled":
      return "cancelled";
    case "neutral":
      return "neutral";
    default:
      return "failure";
  }
}

function formatOutcome(outcome: string): string {
  switch (normalizeOutcome(outcome)) {
    case "success":
      return "success";
    case "skipped":
      return "skipped";
    case "cancelled":
      return "cancelled";
    case "neutral":
      return "neutral";
    default:
      return "failure";
  }
}

function trimForIssue(body: string, maxChars: number): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars).trimEnd()}\n\n_Trimmed for issue size._`;
}

function extractFollowUps(input: WeeklyReviewIssueInput): string[] {
  const items: string[] = [];
  const failingSignals = input.signals.filter((signal) => normalizeOutcome(signal.outcome) === "failure");

  for (const signal of failingSignals) {
    items.push(`- [ ] Investigate the failing \`${signal.label}\` check from this weekly run.`);
  }

  if (input.flakerReview !== PLACEHOLDER_FLAKER) {
    items.push("- [ ] Review the flaker recommendations below and convert anything actionable into a PR or follow-up issue.");
  }

  const vrtHasRegressions = /regressions:\s*[1-9]/i.test(input.vrtReview);
  const vrtHasNewBaselines = /new baselines:\s*[1-9]/i.test(input.vrtReview);
  if (vrtHasRegressions || vrtHasNewBaselines) {
    items.push("- [ ] Inspect the VRT summary and decide whether the visual changes need a fix or a baseline approval.");
  }

  if (items.length === 0) {
    items.push("- [ ] No blocking signals were detected. Review the summaries below and close this issue if no action is needed.");
  }

  return items;
}

export function buildWeeklyReviewIssue(input: WeeklyReviewIssueInput): string {
  const title = buildWeeklyReviewTitle(input.date);
  const followUps = extractFollowUps(input);
  const lines = [
    "# Weekly Quality Review",
    "",
    `- Title: ${title}`,
    `- Generated (UTC): ${input.date.toISOString()}`,
  ];

  if (input.runUrl) {
    lines.push(`- Workflow run: ${input.runUrl}`);
  }

  lines.push(
    "",
    "## Check Status",
    "",
    "| Check | Result |",
    "| --- | --- |",
    ...input.signals.map((signal) => `| ${signal.label} | ${formatOutcome(signal.outcome)} |`),
    "",
    "## Follow-up",
    "",
    ...followUps,
    "",
    "## flaker",
    "",
    trimForIssue(input.flakerReview, 12000),
    "",
    "## vrt",
    "",
    trimForIssue(input.vrtReview, 8000),
    "",
  );

  return lines.join("\n");
}

async function readOrPlaceholder(path: string, placeholder: string): Promise<string> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return placeholder;
  }
}

async function main(): Promise<void> {
  await mkdir(resolve(repoRoot, ".artifacts"), { recursive: true });

  const date = process.env["WEEKLY_REVIEW_DATE"]
    ? new Date(process.env["WEEKLY_REVIEW_DATE"])
    : new Date();
  const flakerReview = await readOrPlaceholder(
    resolve(repoRoot, ".artifacts", "flaker-review.md"),
    PLACEHOLDER_FLAKER,
  );
  const vrtReview = await readOrPlaceholder(
    resolve(repoRoot, ".artifacts", "vrt-summary.md"),
    PLACEHOLDER_VRT,
  );
  const signals: WeeklyReviewSignal[] = [
    { id: "typecheck", label: "Typecheck", outcome: process.env["TYPECHECK_OUTCOME"] ?? "skipped" },
    { id: "unit", label: "Unit tests", outcome: process.env["UNIT_OUTCOME"] ?? "skipped" },
    { id: "e2e", label: "Playwright E2E", outcome: process.env["E2E_OUTCOME"] ?? "skipped" },
    { id: "flaker", label: "flaker scheduled run", outcome: process.env["FLAKER_RUN_OUTCOME"] ?? "skipped" },
    { id: "vrt", label: "VRT snapshot", outcome: process.env["VRT_OUTCOME"] ?? "skipped" },
  ];
  const runUrl = process.env["GITHUB_SERVER_URL"]
    && process.env["GITHUB_REPOSITORY"]
    && process.env["GITHUB_RUN_ID"]
    ? `${process.env["GITHUB_SERVER_URL"]}/${process.env["GITHUB_REPOSITORY"]}/actions/runs/${process.env["GITHUB_RUN_ID"]}`
    : undefined;

  const title = buildWeeklyReviewTitle(date);
  const body = buildWeeklyReviewIssue({
    date,
    signals,
    flakerReview,
    vrtReview,
    runUrl,
  });

  await writeFile(resolve(repoRoot, ".artifacts", "weekly-review-title.txt"), `${title}\n`);
  await writeFile(resolve(repoRoot, ".artifacts", "weekly-review.md"), body);
}

const isDirectExecution = process.argv[1] != null
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  await main();
}
