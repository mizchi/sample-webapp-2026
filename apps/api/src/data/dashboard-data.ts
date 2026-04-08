import type {
  DashboardFilter,
  DashboardSnapshot,
  Incident,
  Recommendation,
  ServiceCard,
  ServiceDetail,
  SummaryMetric,
} from "../../../../packages/contracts/src/index.ts";

const generatedAt = "2026-04-08T08:20:00.000Z";

const summary: SummaryMetric[] = [
  {
    id: "review-debt",
    title: "Review Debt",
    value: "14",
    delta: "-3",
    caption: "auto-fix candidates left in nightly queue",
    status: "good",
  },
  {
    id: "blocked-rollouts",
    title: "Blocked Rollouts",
    value: "2",
    delta: "+1",
    caption: "release trains waiting on approval",
    status: "attention",
  },
  {
    id: "vrt-delta",
    title: "VRT Drift",
    value: "0.7%",
    delta: "-0.4%",
    caption: "desktop/mobile median diff ratio",
    status: "good",
  },
  {
    id: "incident-burn",
    title: "Incident Burn",
    value: "4.2h",
    delta: "+0.8h",
    caption: "time spent on customer-facing recoveries",
    status: "critical",
  },
];

const deploymentSeries = [
  { label: "Mon", deployed: 12, blocked: 1 },
  { label: "Tue", deployed: 10, blocked: 0 },
  { label: "Wed", deployed: 8, blocked: 2 },
  { label: "Thu", deployed: 14, blocked: 1 },
  { label: "Fri", deployed: 9, blocked: 3 },
  { label: "Sat", deployed: 6, blocked: 0 },
  { label: "Sun", deployed: 11, blocked: 1 },
];

const incidents: Incident[] = [
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
  {
    id: "inc-search-cache",
    title: "Search cache invalidation lag",
    serviceId: "search",
    serviceName: "Search",
    severity: "warning",
    owner: "Catalog",
    openedAt: "07:10 UTC",
    status: "stable",
    note: "Stale facet counts appear for 90s after catalog writes.",
  },
  {
    id: "inc-notify-batch",
    title: "Digest email batch exceeded slot",
    serviceId: "notifications",
    serviceName: "Notifications",
    severity: "watch",
    owner: "Lifecycle",
    openedAt: "05:42 UTC",
    status: "open",
    note: "Backlog is contained, but next regional cutover needs a guardrail.",
  },
];

const serviceDetails: Record<string, ServiceDetail> = {
  payments: {
    id: "payments",
    name: "Payments",
    owner: "SRE West",
    status: "critical",
    latencyMs: 482,
    errorRate: 2.3,
    saturation: 0.87,
    changeBudget: 1,
    runbook: "https://example.com/runbooks/payments",
    notes: [
      "Queue fan-out is saturating the webhook worker pool.",
      "Nightly auto-review should split the retry policy constants from transport code.",
      "The critical dashboard tile is intentionally pinned for VRT coverage.",
    ],
    releases: [
      { id: "rel-pay-042", label: "retry-window-tuning", startedAt: "07:54 UTC", status: "blocked" },
      { id: "rel-pay-041", label: "queue-observability", startedAt: "06:22 UTC", status: "complete" },
    ],
  },
  search: {
    id: "search",
    name: "Search",
    owner: "Catalog",
    status: "attention",
    latencyMs: 211,
    errorRate: 0.8,
    saturation: 0.64,
    changeBudget: 3,
    runbook: "https://example.com/runbooks/search",
    notes: [
      "Facet invalidation is drifting behind writes on the primary shard.",
      "A small schema cleanup in the dashboard API contract is safe to automate.",
    ],
    releases: [
      { id: "rel-search-118", label: "facet-warm-cache", startedAt: "06:02 UTC", status: "running" },
      { id: "rel-search-117", label: "query-shaping", startedAt: "03:44 UTC", status: "complete" },
    ],
  },
  notifications: {
    id: "notifications",
    name: "Notifications",
    owner: "Lifecycle",
    status: "good",
    latencyMs: 94,
    errorRate: 0.2,
    saturation: 0.41,
    changeBudget: 7,
    runbook: "https://example.com/runbooks/notifications",
    notes: [
      "Digest workers are stable but batch start jitter is still visible on Mondays.",
      "This service is a useful low-risk target for scheduled auto-improvements.",
    ],
    releases: [
      { id: "rel-notify-077", label: "digest-shaper", startedAt: "05:35 UTC", status: "running" },
      { id: "rel-notify-076", label: "queue-ttl-guard", startedAt: "02:14 UTC", status: "complete" },
    ],
  },
};

const recommendations: Recommendation[] = [
  {
    id: "rec-separate-policy",
    title: "Split retry policy constants out of the webhook worker",
    action: "Refactor queue retry config into a dedicated module and retest affected flows.",
    rationale: "The payments incident and the scheduled auto-improve queue are both pointing at the same hotspot.",
    confidence: 0.82,
  },
  {
    id: "rec-add-vrt-route",
    title: "Pin the critical severity dashboard state into VRT coverage",
    action: "Keep `/?severity=critical` in the snapshot route list and approve only intentional visual shifts.",
    rationale: "This keeps the most volatile operator view under visual review without broadening the baseline set too far.",
    confidence: 0.76,
  },
  {
    id: "rec-reduce-review-debt",
    title: "Let the nightly codex batch land one low-risk cleanup per run",
    action: "Generate a PR only when tests and VRT stay green after a targeted fix.",
    rationale: "Small safe changes reduce review debt faster than waiting for larger quarterly cleanup work.",
    confidence: 0.88,
  },
];

function toServiceCards(): ServiceCard[] {
  return Object.values(serviceDetails).map((service) => ({
    id: service.id,
    name: service.name,
    owner: service.owner,
    status: service.status,
    latencyMs: service.latencyMs,
    errorRate: service.errorRate,
    saturation: service.saturation,
    changeBudget: service.changeBudget,
  }));
}

export function buildDashboardSnapshot(filter: DashboardFilter): DashboardSnapshot {
  const filteredIncidents =
    filter === "all"
      ? incidents
      : incidents.filter((incident) => incident.severity === filter);

  return {
    generatedAt,
    severity: filter,
    summary,
    deploymentSeries,
    incidents: filteredIncidents,
    services: toServiceCards(),
    recommendations,
  };
}

export function getServiceDetail(serviceId: string): ServiceDetail | null {
  return serviceDetails[serviceId] ?? null;
}
