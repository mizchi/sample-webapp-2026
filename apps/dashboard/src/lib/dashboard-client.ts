import {
  dashboardSnapshotSchema,
  serviceDetailSchema,
  type DashboardFilter,
  type DashboardSnapshot,
  type ServiceDetail,
} from "../../../../packages/contracts/src/index.ts";

async function readJson<T>(input: RequestInfo | URL, schema: { parse(value: unknown): T }): Promise<T> {
  const response = await fetch(input);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return schema.parse(await response.json());
}

export async function fetchDashboardSnapshot(severity: DashboardFilter): Promise<DashboardSnapshot> {
  const query = new URLSearchParams({ severity });
  return readJson(`/api/dashboard?${query.toString()}`, dashboardSnapshotSchema);
}

export async function fetchServiceDetail(serviceId: string): Promise<ServiceDetail> {
  return readJson(`/api/services/${serviceId}`, serviceDetailSchema);
}
