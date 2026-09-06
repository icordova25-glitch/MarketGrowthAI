import { expect, test } from "@playwright/test";
import { bootstrapDemoSession, mockAnalysisPayload, tomorrowIsoDate } from "./helpers";

test("content add rollback on POST failure shows request reference", async ({ page }) => {
  const items = [
    {
      id: "item-1",
      type: "Social post",
      title: "Existing calendar item",
      date: tomorrowIsoDate(),
    },
  ];

  await page.route("**/api/business-analysis", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockAnalysisPayload) });
  });

  await page.route("**/api/content-calendar", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items, requestId: "req-get-content" }) });
      return;
    }
    if (method === "POST") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Unable to schedule this draft.", requestId: "req-post-fail-content" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, requestId: "req-ok-content" }) });
  });

  await bootstrapDemoSession(page);
  await page.goto("/content");
  await expect(page.getByRole("heading", { name: "Content Studio" })).toBeVisible();

  const createSection = page.locator("section").filter({ hasText: "Create content" });
  await createSection.locator("textarea").first().fill("Optimistic rollback draft");
  await createSection.getByRole("button", { name: "Generate draft" }).click();

  const draftSection = page.locator("section").filter({ hasText: "Draft review" });
  await draftSection.locator('input[type="date"]').first().fill(tomorrowIsoDate());
  await draftSection.getByRole("button", { name: "Add to calendar" }).click();

  const calendarSection = page.locator("section").filter({ hasText: "Content calendar" });
  await expect(calendarSection.getByText("Existing calendar item")).toBeVisible();
  await expect(calendarSection.getByText("Optimistic rollback draft")).toHaveCount(0);
  await expect(page.getByRole("alert").filter({ hasText: "Ref: req-post-fail-content" })).toBeVisible();
});

test("content edit rollback on PATCH failure shows request reference", async ({ page }) => {
  const items = [
    {
      id: "item-1",
      type: "Social post",
      title: "Calendar item before failed edit",
      date: tomorrowIsoDate(),
    },
  ];

  await page.route("**/api/business-analysis", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockAnalysisPayload) });
  });

  await page.route("**/api/content-calendar", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items, requestId: "req-get-content" }) });
      return;
    }
    if (method === "PATCH") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Unable to update scheduled content.", requestId: "req-patch-fail-content" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, requestId: "req-ok-content" }) });
  });

  await bootstrapDemoSession(page);
  await page.goto("/content");
  await expect(page.getByRole("heading", { name: "Content Studio" })).toBeVisible();

  const calendarSection = page.locator("section").filter({ hasText: "Content calendar" });
  await calendarSection.getByRole("button", { name: "Edit" }).first().click();
  await calendarSection.locator("article").first().locator("input").nth(1).fill("Edited title should rollback");
  await calendarSection.getByRole("button", { name: "Save" }).first().click();

  await expect(page.getByRole("alert").filter({ hasText: "Ref: req-patch-fail-content" })).toBeVisible();
  await calendarSection.getByRole("button", { name: "Cancel" }).first().click();
  await expect(calendarSection.getByText("Calendar item before failed edit")).toBeVisible();
  await expect(calendarSection.getByText("Edited title should rollback")).toHaveCount(0);
});

test("content delete rollback on DELETE failure shows request reference", async ({ page }) => {
  const items = [
    {
      id: "item-1",
      type: "Social post",
      title: "Calendar item before failed delete",
      date: tomorrowIsoDate(),
    },
  ];

  await page.route("**/api/business-analysis", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockAnalysisPayload) });
  });

  await page.route("**/api/content-calendar", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items, requestId: "req-get-content" }) });
      return;
    }
    if (method === "DELETE") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Unable to remove scheduled content.", requestId: "req-delete-fail-content" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, requestId: "req-ok-content" }) });
  });

  await bootstrapDemoSession(page);
  await page.goto("/content");
  await expect(page.getByRole("heading", { name: "Content Studio" })).toBeVisible();

  const calendarSection = page.locator("section").filter({ hasText: "Content calendar" });
  await calendarSection.getByRole("button", { name: "Remove" }).first().click();

  await expect(calendarSection.getByText("Calendar item before failed delete")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Ref: req-delete-fail-content" })).toBeVisible();
});
