import { describe, expect, it, vi } from "vitest";
import { getCinematicCloseHandler } from "./CinematicModals";

describe("cinematic completion handlers", () => {
  it("uses the tour wrap handler for a completed tour", () => {
    const release = vi.fn();
    const tour = vi.fn();
    getCinematicCloseHandler(true, release, tour)?.();
    expect(tour).toHaveBeenCalledOnce();
    expect(release).not.toHaveBeenCalled();
  });

  it("uses the release handler for release results", () => {
    const release = vi.fn();
    const tour = vi.fn();
    getCinematicCloseHandler(false, release, tour)?.();
    expect(release).toHaveBeenCalledOnce();
    expect(tour).not.toHaveBeenCalled();
  });
});
