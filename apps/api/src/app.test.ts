import { describe, expect, it } from "vitest";
import {
  dashboardSnapshotSchema,
  healthResponseSchema,
  serviceDetailSchema,
} from "../../../packages/contracts/src/index.ts";
import { app } from "./app.ts";

describe("api app", () => {
  it("returns a health payload", async () => {
    const response = await app.request("http://localhost/api/health");
    expect(response.status).toBe(200);

    const payload = healthResponseSchema.parse(await response.json());
    expect(payload.status).toBe("ok");
  });

  it("filters dashboard incidents by severity", async () => {
    const response = await app.request("http://localhost/api/dashboard?severity=critical");
    expect(response.status).toBe(200);

    const payload = dashboardSnapshotSchema.parse(await response.json());
    expect(payload.severity).toBe("critical");
    expect(payload.incidents.length).toBeGreaterThan(0);
    expect(payload.incidents.every((incident) => incident.severity === "critical")).toBe(true);
  });

  it("returns service details for an operator drawer", async () => {
    const response = await app.request("http://localhost/api/services/payments");
    expect(response.status).toBe(200);

    const payload = serviceDetailSchema.parse(await response.json());
    expect(payload.id).toBe("payments");
    expect(payload.releases[0]?.status).toBe("blocked");
  });

  it("returns 404 for unknown services", async () => {
    const response = await app.request("http://localhost/api/services/unknown");
    expect(response.status).toBe(404);
  });
});
