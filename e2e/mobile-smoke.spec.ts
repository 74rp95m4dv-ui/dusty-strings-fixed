import { expect, test } from "@playwright/test";

test("starts a career and keeps the mobile layout within the viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Dusty Strings", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New Career" }).click();
  await page.getByPlaceholder("Enter name or roll the dice").fill("Smoke Test");
  await page.getByRole("button", { name: "Start Career" }).click();

  await expect(page.getByText("Smoke Test", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /End Week/i }).first()).toBeVisible();
  expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.reload();
  await expect(page.getByText("Smoke Test", { exact: true })).toBeVisible();
});

test("offers a safe reset when a local save is corrupt", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("dusty_strings_v1", "not-json"));
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Save recovery");
  await page.getByRole("button", { name: "Reset Local Save" }).click();
  await expect(page.getByText("Dusty Strings", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
