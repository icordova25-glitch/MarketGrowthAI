import { expect, test } from "@playwright/test";
import { bootstrapDemoSession, mockAnalysisPayload } from "./helpers";

test("competitor add rollback on POST failure shows request reference", async ({ page }) => {
  const competitors = [{ id: "cmp-1", name: "Existing Competitor", website: "https://existing.example.com" }];

  await page.route("**/api/business-analysis", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockAnalysisPayload) });
  });

  await page.route("**/api/competitors", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ competitors, requestId: "req-get-competitors" }) });
      return;
    }
    if (method === "POST") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Unable to save competitor.", requestId: "req-post-fail-competitors" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, requestId: "req-ok-competitors" }) });
  });

  await bootstrapDemoSession(page);
  await page.goto("/competitive");
  await expect(page.getByRole("heading", { name: "Competitive Intelligence" })).toBeVisible();

  const trackedSection = page.locator("section").filter({ hasText: "Tracked competitors" });
  await trackedSection.locator("form input").nth(0).fill("Failed Add Competitor");
  await trackedSection.locator("form input").nth(1).fill("https://failed-add.example.com");
  await trackedSection.getByRole("button", { name: "Track competitor" }).click();

  await expect(trackedSection.getByText("Existing Competitor")).toBeVisible();
  await expect(trackedSection.getByText("Failed Add Competitor")).toHaveCount(0);
  await expect(page.getByRole("alert").filter({ hasText: "Ref: req-post-fail-competitors" })).toBeVisible();
});

test("competitor edit rollback on PATCH failure shows request reference", async ({ page }) => {
  const competitors = [{ id: "cmp-1", name: "Competitor Before Edit", website: "https://before-edit.example.com" }];

  await page.route("**/api/business-analysis", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockAnalysisPayload) });
  });

  await page.route("**/api/competitors", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ competitors, requestId: "req-get-competitors" }) });
      return;
    }
    if (method === "PATCH") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Unable to update competitor.", requestId: "req-patch-fail-competitors" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, requestId: "req-ok-competitors" }) });
  });

  await bootstrapDemoSession(page);
  await page.goto("/competitive");
  await expect(page.getByRole("heading", { name: "Competitive Intelligence" })).toBeVisible();

  const trackedSection = page.locator("section").filter({ hasText: "Tracked competitors" });
  await trackedSection.getByRole("button", { name: "Edit" }).first().click();
  await trackedSection.locator("article").first().locator("input").first().fill("Edited competitor should rollback");
  await trackedSection.getByRole("button", { name: "Save" }).first().click();

  await expect(page.getByRole("alert").filter({ hasText: "Ref: req-patch-fail-competitors" })).toBeVisible();
  await trackedSection.getByRole("button", { name: "Cancel" }).first().click();
  await expect(trackedSection.getByText("Competitor Before Edit")).toBeVisible();
  await expect(trackedSection.getByText("Edited competitor should rollback")).toHaveCount(0);
});

test("competitor delete rollback on DELETE failure shows request reference", async ({ page }) => {
  const competitors = [{ id: "cmp-1", name: "Competitor Before Delete", website: "https://before-delete.example.com" }];

  await page.route("**/api/business-analysis", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockAnalysisPayload) });
  });

  await page.route("**/api/competitors", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ competitors, requestId: "req-get-competitors" }) });
      return;
    }
    if (method === "DELETE") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Unable to remove competitor.", requestId: "req-delete-fail-competitors" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, requestId: "req-ok-competitors" }) });
  });

  await bootstrapDemoSession(page);
  await page.goto("/competitive");
  await expect(page.getByRole("heading", { name: "Competitive Intelligence" })).toBeVisible();

  const trackedSection = page.locator("section").filter({ hasText: "Tracked competitors" });
  await trackedSection.getByRole("button", { name: "Remove" }).first().click();

  await expect(trackedSection.getByText("Competitor Before Delete")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Ref: req-delete-fail-competitors" })).toBeVisible();
});
