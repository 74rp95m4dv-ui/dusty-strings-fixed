import { expect, test } from "@playwright/test";
import { INITIAL_STATE, type GameState } from "../src/gameLogic.ts";
import { createSaveEnvelope, SAVE_KEY } from "../src/persistence.ts";

for (const layout of [
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true },
  { name: "desktop", viewport: { width: 1440, height: 1000 }, isMobile: false },
]) {
  test.describe(layout.name, () => {
    test.use({ viewport: layout.viewport, isMobile: layout.isMobile });

    test.beforeEach(async ({ page }) => {
      const state: GameState = structuredClone(INITIAL_STATE);
      state.screen = "game";
      state.artistName = "Merch Test";
      state.money = 10000;
      state.catalog = [{
        id: "release-1", title: "Test Album", type: "Album", genre: "Country",
        quality: 75, outcome: "Moderate", lifecycle: "Normal", decayRate: 0.9,
        streamFloor: 0, weeklyStreams: 1000, peakStreams: 1000, totalStreams: 1000,
        releasedWeek: 1, weeksActive: 1, promoted: false, comebackCooldown: 0,
        tracks: [], hasMusicVideo: false,
      }];
      await page.goto("/");
      await page.evaluate(({ key, save }) => localStorage.setItem(key, save), {
        key: SAVE_KEY, save: JSON.stringify(createSaveEnvelope(state)),
      });
      await page.reload();
      await page.getByRole("button", { name: "Office", exact: true }).click();
      await page.getByRole("button", { name: "Merch", exact: true }).click();
      await page.getByRole("button", { name: "Add Merch Item" }).click();
    });

    for (const item of [
      { name: "standard T-shirt", physical: false, premium: false, cost: 7, setup: 175, suggested: 25 },
      { name: "standard vinyl", physical: true, premium: false, cost: 9, setup: 225, suggested: 30 },
      { name: "premium vinyl", physical: true, premium: true, cost: 13, setup: 325, suggested: 43 },
    ]) {
      test(`lists ${item.name} at the entered price and preserves it after reload`, async ({ page }) => {
        const drawer = page.locator(".drawer");
        if (item.physical) {
          await drawer.getByRole("button", { name: /Vinyl$/ }).click();
          await drawer.locator("select").selectOption("release-1");
        }
        if (item.premium) {
          await drawer.getByRole("button", { name: "Translucent Blue" }).click();
          await drawer.getByRole("button", { name: "Limited Edition", exact: true }).click();
        }
        await expect(drawer.locator("#merch-price-help")).toContainText(`Suggested: $${item.suggested}`);
        await expect(drawer.locator("#merch-price-help")).toContainText(`Setup: $${item.setup}`);
        await drawer.getByLabel("Selling price").fill("25");
        await drawer.getByRole("button", { name: "List Item" }).click();
        await expect(page.getByRole("dialog")).toContainText("is live in the shop");
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state, SAVE_KEY);
        expect(saved.merchShop).toHaveLength(1);
        expect(saved.merchShop[0]).toMatchObject({ price: 25, cost: item.cost });
        expect(saved.money).toBe(10000 - item.setup);
        expect(await page.locator("body").evaluate(body => body.scrollWidth <= window.innerWidth)).toBe(true);
        await page.reload();
        await page.getByRole("button", { name: "Office", exact: true }).click();
        await page.getByRole("button", { name: "Merch", exact: true }).click();
        await expect(page.locator(".rel-meta").filter({ hasText: "$25 • Sold" })).toHaveCount(1);
      });
    }

    test("rejects blank, zero, negative, and fractional selling prices", async ({ page }) => {
      const drawer = page.locator(".drawer");
      for (const price of ["", "0", "-1", "25.5"]) {
        await drawer.getByLabel("Selling price").fill(price);
        await expect(drawer.getByRole("button", { name: "List Item" })).toBeDisabled();
        await expect(drawer).toContainText("Enter a positive whole-dollar selling price.");
      }
      const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state, SAVE_KEY);
      expect(saved.money).toBe(10000);
      expect(saved.merchShop).toHaveLength(0);
      await drawer.getByLabel("Selling price").fill("1");
      await expect(drawer.getByRole("button", { name: "List Item" })).toBeEnabled();
    });
  });
}
