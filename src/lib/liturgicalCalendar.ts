// src/lib/liturgicalCalendar.ts
//
// Thin wrapper around romcal (v3, @dev) configured for the Philippine
// proper calendar in English, PLUS a corrections layer that patches known
// discrepancies between romcal and the current official CBCP calendar
// (see philippineCorrections.ts). All romcal interaction lives here so the
// UI depends on our small stable shape, not romcal's full API.
//
// romcal runs entirely client-side (architecture §2) so the calendar works
// offline. Philippines_En ships English feast names; Tagalog is a future
// content task (architecture §9/§11).

import { Romcal } from "romcal";
import { Philippines_En } from "@romcal/calendar.philippines";
import { PHILIPPINE_CORRECTIONS } from "./philippineCorrections";

const romcal = new Romcal({
  localizedCalendar: Philippines_En,
  scope: "gregorian",
});

export interface LiturgicalDayView {
  date: string;
  name: string;
  rank: string;
  rankName: string;
  colors: string[];
  seasonNames: string[];
  isHolyDayOfObligation: boolean;
  isOptional: boolean;
}

export type CalendarYear = Record<string, LiturgicalDayView[]>;

function toView(day: {
  date: string;
  name: string;
  rank: string;
  rankName: string;
  colors: string[];
  seasonNames: string[];
  isHolyDayOfObligation: boolean;
  isOptional: boolean;
}): LiturgicalDayView {
  return {
    date: day.date,
    name: day.name,
    rank: day.rank,
    rankName: day.rankName,
    colors: day.colors,
    seasonNames: day.seasonNames,
    isHolyDayOfObligation: day.isHolyDayOfObligation,
    isOptional: day.isOptional,
  };
}

function iso(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Apply CBCP corrections over romcal's raw output for a given year.
function applyCorrections(year: number, cal: CalendarYear): CalendarYear {
  for (const correction of PHILIPPINE_CORRECTIONS) {
    const date = iso(year, correction.month, correction.day);
    const existing = cal[date] ?? [];

    // Inherit season context from whatever romcal already computed for
    // that date, so our corrected day isn't missing season info.
    const seasonNames = existing[0]?.seasonNames ?? [];
    const corrected: LiturgicalDayView = {
      ...correction.day_view,
      date,
      seasonNames,
    };

    if (correction.replaceIfNameIncludes) {
      const needle = correction.replaceIfNameIncludes.toLowerCase();
      const idx = existing.findIndex((d) =>
        d.name.toLowerCase().includes(needle),
      );
      if (idx >= 0) {
        existing[idx] = corrected; // upgrade in place
      } else {
        existing.unshift(corrected); // wasn't there; add as default
      }
      cal[date] = existing;
    } else {
      // ADD as the new default (highest-precedence) celebration.
      cal[date] = [corrected, ...existing];
    }
  }
  return cal;
}

export async function generateYear(year: number): Promise<CalendarYear> {
  const raw = await romcal.generateCalendar(year);
  const out: CalendarYear = {};
  for (const [date, days] of Object.entries(raw)) {
    out[date] = (days as unknown[]).map((d) =>
      toView(d as Parameters<typeof toView>[0]),
    );
  }
  return applyCorrections(year, out);
}

export function defaultCelebration(
  year: CalendarYear,
  isoDate: string,
): LiturgicalDayView | null {
  const days = year[isoDate];
  return days && days.length > 0 ? days[0] : null;
}
