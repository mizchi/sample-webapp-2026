// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DashboardSnapshot,
  ServiceDetail,
} from "../../../packages/contracts/src/index.ts";
import { App } from "./App.tsx";

const dashboardAll: DashboardSnapshot = {
  generatedAt: "2026-04-08T08:20:00.000Z",
  severity: "all",
  summary: [
    { id: "review-debt", title: "Review Debt", value: "14", delta: "-3", caption: "queue", status: "good" },
  ],
  deploymentSeries: [
    { label: "Mon", deployed: 12, blocked: 1 },
  ],
  incidents: [
    {
      id: "inc-payments-timeout",
      title: "Checkout webhook retry storm",
      serviceId: "payments",
      serviceName: "Payments",
      severity: "critical",
      owner: "SRE West",
      openedAt: "08:05 UTC",
      status: "mitigating",
      note: "Timeout budget regressed after queue fan-out hit the new concurrency cap.",
    },
  ],
  services: [
    {
      id: "payments",
      name: "Payments",
      owner: "SRE West",
      status: "critical",
      latencyMs: 482,
      errorRate: 2.3,
      saturation: 0.87,
      changeBudget: 1,
    },
  ],
  recommendations: [
    {
      id: "rec-1",
      title: "Split retry policy constants out of the webhook worker",
      action: "Refactor queue retry config.",
      rationale: "Same hotspot keeps surfacing.",
      confidence: 0.82,
    },
  ],
};

const dashboardCritical: DashboardSnapshot = {
  ...dashboardAll,
  severity: "critical",
};

const paymentsDetail: ServiceDetail = {
  id: "payments",
  name: "Payments",
  owner: "SRE West",
  status: "critical",
  latencyMs: 482,
  errorRate: 2.3,
  saturation: 0.87,
  changeBudget: 1,
  runbook: "https://example.com/runbooks/payments",
  notes: ["Queue fan-out is saturating the webhook worker pool."],
  releases: [
    { id: "rel-pay-042", label: "retry-window-tuning", startedAt: "07:54 UTC", status: "blocked" },
  ],
};

describe("Dashboard App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(dashboardAll)))
        .mockResolvedValueOnce(new Response(JSON.stringify(paymentsDetail)))
        .mockResolvedValueOnce(new Response(JSON.stringify(dashboardCritical))),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the dashboard and loads a focused service detail", async () => {
    render(<App initialSeverity="all" initialFocusServiceId="payments" />);

    await screen.findByRole("heading", { name: "Control Atlas" });
    await screen.findByRole("heading", { name: "Payments" });

    expect(screen.getByText("Split retry policy constants out of the webhook worker")).toBeInTheDocument();
  });

  it("reloads the incident feed when the severity filter changes", async () => {
    render(<App initialSeverity="all" initialFocusServiceId={null} />);

    await screen.findByRole("heading", { name: "Control Atlas" });
    fireEvent.click(screen.getByRole("button", { name: "critical" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "critical" })).toHaveClass("active");
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard?severity=critical");
  });
});
