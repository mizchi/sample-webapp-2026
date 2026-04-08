import { expect, test } from "@playwright/test";

test("shows the operator dashboard spine", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Control Atlas" })).toBeVisible();
  await expect(page.getByText("Review Debt", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Safe next moves" })).toBeVisible();
});

test("keeps severity filter in a shareable URL", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "critical" }).click();
  await expect(page).toHaveURL(/\/critical$/);
  await expect(page.getByText("Checkout webhook retry storm")).toBeVisible();
});

test("hydrates service detail from focus query state", async ({ page }) => {
  await page.goto("/services/payments");

  await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible();
  await expect(page.getByText(/Queue fan-out is saturating the webhook worker pool/i)).toBeVisible();
});
