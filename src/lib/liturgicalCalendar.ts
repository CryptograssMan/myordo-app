// src/lib/liturgicalCalendar.ts
//
// Thin wrapper around romcal (v3, @dev) configured for the Philippine
// proper calendar in English, PLUS a corrections layer (see
// philippineCorrections.ts). All romcal interaction lives here so the UI
// depends on our small stable shape, not romcal's full API.
//
// romcal + the Philippines plugin are ~850kB of JS. To keep first paint
// fast on mobile (architecture §2/§6 — PWA on Philippine mobile networks),
// they are LAZY-LOADED via dynamic import() inside generateYear() rather
// than imported at the top level. The app shell renders immediately; the
// calendar engine streams in on demand (the UI shows a loading state).

import { PHILIPPINE_CORRECTIONS } from "./philippineCorrections";

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

// Cache the constructed Romcal instance across calls. Typed loosely as
// the dynamic import's runtime shape; we only touch generateCalendar().
let romcalInstance: { generateCalendar: (year?: number) => Promise<unknown> } | null =
  null;

async function getRomcal() {
  if (romcalInstance) return romcalInstance;
  const [{ Romcal }, { Philippines_En }] = await Promise.all([
    import("romcal"),
    import("@romcal/calendar.philippines"),
  ]);
  romcalInstance = new Romcal({
    localizedCalendar: Philippines_En,
    scope: "gregorian",
  });
  return romcalInstance;
}

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

function applyCorrections(year: number, cal: CalendarYear): CalendarYear {
  for (const correction of PHILIPPINE_CORRECTIONS) {
    const date = iso(year, correction.month, correction.day);
    const existing = cal[date] ?? [];
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
        existing[idx] = corrected;
      } else {
        existing.unshift(corrected);
      }
      cal[date] = existing;
    } else {
      cal[date] = [corrected, ...existing];
    }
  }
  return cal;
}

export async function generateYear(year: number): Promise<CalendarYear> {
  const romcal = await getRomcal();
  const raw = (await romcal.generateCalendar(year)) as Record<string, unknown[]>;
  const out: CalendarYear = {};
  for (const [date, days] of Object.entries(raw)) {
    out[date] = days.map((d) => toView(d as Parameters<typeof toView>[0]));
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
