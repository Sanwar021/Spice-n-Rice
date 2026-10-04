import { describe, it, expect } from "vitest";
import { isOpen } from "./App";
const settings = {
  hours: Array.from({ length: 7 }, () => ({
    open: "11:00",
    close: "22:00",
    closed: false,
  })),
  holiday_closures: [],
};
describe("Richardson opening hours", () => {
  it("uses Chicago time instead of visitor time", () => {
    expect(isOpen(settings, new Date("2026-07-01T16:00:00Z"))).toBe(true);
    expect(isOpen(settings, new Date("2026-07-01T15:59:00Z"))).toBe(false);
    expect(isOpen(settings, new Date("2026-07-02T03:00:00Z"))).toBe(false);
  });
  it("honors winter time and holiday closures", () => {
    expect(isOpen(settings, new Date("2026-01-01T16:00:00Z"))).toBe(false);
    expect(
      isOpen(
        { ...settings, holiday_closures: ["2026-07-01"] },
        new Date("2026-07-01T18:00:00Z"),
      ),
    ).toBe(false);
  });
});
