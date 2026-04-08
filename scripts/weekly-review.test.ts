import { describe, expect, it } from "vitest";
import {
  buildWeeklyReviewIssue,
  buildWeeklyReviewTitle,
  type WeeklyReviewSignal,
} from "./weekly-review.ts";

describe("weekly review helpers", () => {
  it("builds a stable ISO-week title", () => {
    expect(buildWeeklyReviewTitle(new Date("2026-04-08T00:00:00.000Z"))).toBe("weekly review: 2026-W15");
  });

  it("includes failing checks and follow-up items in the issue body", () => {
    const signals: WeeklyReviewSignal[] = [
      { id: "typecheck", label: "Typecheck", outcome: "success" },
      { id: "vrt", label: "VRT snapshot", outcome: "failure" },
    ];

    const issue = buildWeeklyReviewIssue({
      date: new Date("2026-04-08T00:00:00.000Z"),
      signals,
      flakerReview: "# flaker\n\n## Recommendations\n\n- Collect more data",
      vrtReview: "# vrt snapshot summary\n\n- regressions: 2\n- new baselines: 1",
      runUrl: "https://github.com/mizchi/sample-webapp-2026/actions/runs/123",
    });

    expect(issue).toContain("weekly review: 2026-W15");
    expect(issue).toContain("| VRT snapshot | failure |");
    expect(issue).toContain("Investigate the failing `VRT snapshot` check");
    expect(issue).toContain("Review the flaker recommendations below");
    expect(issue).toContain("Inspect the VRT summary");
    expect(issue).toContain("https://github.com/mizchi/sample-webapp-2026/actions/runs/123");
  });
});
