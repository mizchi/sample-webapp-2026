import { dashboardFilterSchema, type DashboardFilter } from "../../../../packages/contracts/src/index.ts";

export interface DashboardViewState {
  severity: DashboardFilter;
  focusServiceId: string | null;
}

export function readInitialViewState(): DashboardViewState {
  if (typeof window === "undefined") {
    return { severity: "all", focusServiceId: null };
  }

  const url = new URL(window.location.href);
  const segments = url.pathname.split("/").filter(Boolean);
  const pathSeverity = dashboardFilterSchema.safeParse(segments[0]);
  const pathFocusServiceId = segments[0] === "services" && segments[1] ? segments[1] : null;

  return {
    severity: dashboardFilterSchema.catch(pathSeverity.success ? pathSeverity.data : "all").parse(
      url.searchParams.get("severity") ?? (pathSeverity.success ? pathSeverity.data : "all"),
    ),
    focusServiceId: url.searchParams.get("focus") ?? pathFocusServiceId,
  };
}

export function writeViewState(next: DashboardViewState): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  if (next.focusServiceId) {
    url.pathname = `/services/${next.focusServiceId}`;
  } else if (next.severity !== "all") {
    url.pathname = `/${next.severity}`;
  } else {
    url.pathname = "/";
  }

  url.searchParams.delete("focus");
  url.searchParams.delete("severity");

  window.history.replaceState(null, "", url);
}
