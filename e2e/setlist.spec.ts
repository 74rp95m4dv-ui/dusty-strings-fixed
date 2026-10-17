import { expect, test, type Page } from "@playwright/test";
import { CITIES, INITIAL_STATE, type GameState } from "../src/gameLogic.ts";
import { createSaveEnvelope, SAVE_KEY } from "../src/persistence.ts";

function career(stops = 0): GameState {
  const state = structuredClone(INITIAL_STATE);
  state.screen = "game";
  state.artistName = "Setlist Test";
  state.money = 100000;
  state.energy = 100;
  state.tourQueue = CITIES.slice(0, stops).map(city => {
    const venue = city.venues[0];
    return {
      cityName: city.name, region: city.region, genreMod: city.genreMod, travelCost: city.travelCost,
      venueName: venue.name, venueCap: venue.cap, venueCost: venue.cost, venueTier: venue.tier,
    };
  });
  state.catalog = [{
    id: "album", title: "Setlist Songs", type: "Album", genre: "Country", quality: 75,
    outcome: "Moderate", lifecycle: "Normal", decayRate: 0.9, streamFloor: 0,
    weeklyStreams: 1000, peakStreams: 1000, totalStreams: 1000, releasedWeek: 1,
    weeksActive: 1, promoted: false, comebackCooldown: 0, tracks: [], hasMusicVideo: false,
  }];
  return state;
}

async function openCareer(page: Page, state = career()) {
  await page.goto("/");
  await page.evaluate(({ key, save }) => localStorage.setItem(key, save), {
    key: SAVE_KEY, save: JSON.stringify(createSaveEnvelope(state)),
  });
  await page.reload();
  await page.getByRole("button", { name: "Live", exact: true }).click();
}

async function readSave(page: Page): Promise<GameState> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state, SAVE_KEY);
}

async function adjust(page: Page, category: string, direction: "Increase" | "Decrease", times = 1) {
  for (let index = 0; index < times; index++) {
    await page.getByRole("button", { name: new RegExp(`${direction}.*${category}`) }).click();
  }
}

for (const layout of [
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true },
  { name: "desktop", viewport: { width: 1440, height: 1000 }, isMobile: false },
]) {
  test.describe(layout.name, () => {
    test.use({ viewport: layout.viewport, isMobile: layout.isMobile });

    test("edits freely, saves explicitly, and restores the saved mix after reload", async ({ page }) => {
      await openCareer(page);
      await page.getByRole("button", { name: "Setlist", exact: true }).click();
      const save = page.getByRole("button", { name: "Save Setlist", exact: true });
      await expect(save).toBeDisabled();
      await adjust(page, "Deep Cuts", "Increase");
      await expect(page.getByRole("status")).toContainText("Total: 7 / 6 songs");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByText(/Provisional preview/)).toBeVisible();
      await expect(save).toBeDisabled();
      expect((await readSave(page)).setlistConfig).toEqual(INITIAL_STATE.setlistConfig);
      await adjust(page, "Hits", "Decrease");
      await expect(save).toBeEnabled();
      await expect(page.getByText("Preview:", { exact: false })).toBeVisible();
      await expect(page.getByText("+6 fans", { exact: true })).toBeVisible();
      await save.click();
      await expect(page.getByRole("dialog")).toContainText("Setlist saved:");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      expect((await readSave(page)).setlistConfig).toEqual({
        deepCutCount: 2, hitCount: 3, newMaterialCount: 1, totalSlots: 6,
      });
      await page.reload();
      await page.getByRole("button", { name: "Live", exact: true }).click();
      await page.getByRole("button", { name: "Setlist", exact: true }).click();
      await expect(save).toBeDisabled();
      await expect(page.getByRole("status")).toContainText("Total: 6 / 6 songs");
      expect(await page.locator("body").evaluate(body => body.scrollWidth <= window.innerWidth)).toBe(true);
    });

    test("resets draft edits and discards unsaved edits when leaving Live", async ({ page }) => {
      await openCareer(page);
      await page.getByRole("button", { name: "Setlist", exact: true }).click();
      await adjust(page, "Deep Cuts", "Increase");
      await page.getByRole("button", { name: "Reset Changes", exact: true }).click();
      await expect(page.getByRole("status")).toContainText("Total: 6 / 6 songs");
      await expect(page.getByRole("button", { name: "Save Setlist", exact: true })).toBeDisabled();
      await adjust(page, "Deep Cuts", "Increase");
      await page.getByRole("button", { name: "Home", exact: true }).click();
      await page.getByRole("button", { name: "Live", exact: true }).click();
      await page.getByRole("button", { name: "Setlist", exact: true }).click();
      await expect(page.getByRole("status")).toContainText("Total: 6 / 6 songs");
      expect((await readSave(page)).setlistConfig).toEqual(INITIAL_STATE.setlistConfig);
    });

    test("requires a saved 22-song mix before charging for a long tour", async ({ page }) => {
      await openCareer(page, career(6));
      const launch = page.getByRole("button", { name: /^Launch Tour \(/ });
      await expect(launch).toBeDisabled();
      await expect(page.getByRole("status")).toContainText("22-song setlist");
      expect((await readSave(page)).money).toBe(100000);
      await page.getByRole("button", { name: "Edit Setlist", exact: true }).click();
      await expect(page.getByRole("status")).toContainText("Total: 6 / 22 songs");
      await adjust(page, "Deep Cuts", "Increase", 4);
      await adjust(page, "Hits", "Increase", 8);
      await adjust(page, "New Material", "Increase", 4);
      // Valid drafts still cannot satisfy the launch requirement until saved.
      await page.getByRole("button", { name: "Tour", exact: true }).click();
      await expect(launch).toBeDisabled();
      await page.getByRole("button", { name: "Setlist", exact: true }).click();
      await page.getByRole("button", { name: "Save Setlist", exact: true }).click();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByRole("button", { name: "Tour", exact: true }).click();
      await expect(launch).toBeEnabled();
      await launch.click();
      await page.getByRole("button", { name: "Launch tour", exact: true }).click();
      await expect.poll(async () => (await readSave(page)).tourActive?.shows.length).toBe(6);
      const saved = await readSave(page);
      expect(saved.money).toBeLessThan(100000);
      expect(saved.tourQueue).toHaveLength(0);
      // Reload clears the launch presentation and proves active-tour precedence.
      await page.reload();
      await page.getByRole("button", { name: "Live", exact: true }).click();
      await page.getByRole("button", { name: "Setlist", exact: true }).click();
      await expect(page.getByRole("status")).toContainText("Total: 22 / 22 songs");
    });

    test("shows signed fan and reputation penalties without a hype bonus", async ({ page }) => {
      const state = career(6);
      state.setlistConfig = { deepCutCount: 0, hitCount: 0, newMaterialCount: 22, totalSlots: 22 };
      await openCareer(page, state);
      await page.getByRole("button", { name: "Setlist", exact: true }).click();
      await expect(page.getByText("-1 rep", { exact: true })).toBeVisible();
      await expect(page.getByText("-2 fans", { exact: true })).toBeVisible();
      await expect(page.getByText(/hype/i)).toHaveCount(0);
    });
  });
}
