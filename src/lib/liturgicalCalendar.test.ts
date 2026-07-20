import { describe, expect, it } from "vitest";
import { generateYear, defaultCelebration } from "./liturgicalCalendar";

describe("liturgical calendar (romcal, Philippines/English)", () => {
  it("computes a full year keyed by ISO date", async () => {
    const year = await generateYear(2026);
    const keys = Object.keys(year);
    expect(keys.length).toBeGreaterThan(360);
    expect(keys).toContain("2026-12-25");
  });

  it("identifies Christmas as a solemnity in white", async () => {
    const year = await generateYear(2026);
    const christmas = defaultCelebration(year, "2026-12-25");
    expect(christmas).not.toBeNull();
    expect(christmas!.rank).toBe("SOLEMNITY");
    expect(christmas!.colors).toContain("WHITE");
    expect(christmas!.isHolyDayOfObligation).toBe(true);
  });

  it("includes Philippine patronal feasts (confirms PH plugin is applied)", async () => {
    const year = await generateYear(2026);
    const names = Object.values(year)
      .flat()
      .map((d) => d.name.toLowerCase());
    expect(names.some((n) => n.includes("patroness of the philippines"))).toBe(
      true,
    );
  });

  // --- CBCP corrections (see philippineCorrections.ts) ---

  it("has San Pedro Calungsod as a Feast on October 21 (CBCP correction)", async () => {
    const year = await generateYear(2026);
    const day = defaultCelebration(year, "2026-10-21");
    expect(day).not.toBeNull();
    expect(day!.name.toLowerCase()).toContain("calungsod");
    expect(day!.rank).toBe("FEAST");
    expect(day!.colors).toContain("RED");
  });

  it("does NOT place Calungsod on April 2 (old, superseded date)", async () => {
    const year = await generateYear(2026);
    const names = (year["2026-04-02"] ?? []).map((d) => d.name.toLowerCase());
    expect(names.some((n) => n.includes("calungsod"))).toBe(false);
  });

  it("has San Lorenzo Ruiz upgraded to a Feast on September 28 (CBCP correction)", async () => {
    const year = await generateYear(2026);
    const day = defaultCelebration(year, "2026-09-28");
    expect(day).not.toBeNull();
    expect(day!.name.toLowerCase()).toContain("ruiz");
    expect(day!.rank).toBe("FEAST");
  });
});
