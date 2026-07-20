import { useEffect, useMemo, useState } from "react";
import {
  generateYear,
  type CalendarYear,
  type LiturgicalDayView,
} from "./lib/liturgicalCalendar";
import { colorToken } from "./lib/liturgicalColors";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const NAMED_RANKS = new Set(["SOLEMNITY", "FEAST", "MEMORIAL"]);

interface DayCell {
  day: number;
  iso: string;
  celebration: LiturgicalDayView | null;
}

// The dominant season across a month, for the orienting label. We tally
// each day's first season and take the most frequent — so July reads
// "Ordinary Time", March reads "Lent", etc. The dot color comes from the
// most common liturgical color in that same month, so label and dot agree.
function dominantSeason(
  calendar: CalendarYear | null,
  year: number,
  month: number,
): { season: string; colors: string[] } | null {
  if (!calendar) return null;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const seasonTally = new Map<string, number>();
  const colorTally = new Map<string, number>();
  for (let d = 1; d <= daysInMonth; d++) {
    const day = calendar[isoDate(year, month, d)]?.[0];
    if (!day) continue;
    const s = day.seasonNames[0];
    if (s) seasonTally.set(s, (seasonTally.get(s) ?? 0) + 1);
    const c = day.colors[0];
    if (c) colorTally.set(c, (colorTally.get(c) ?? 0) + 1);
  }
  const topSeason = [...seasonTally.entries()].sort((a, b) => b[1] - a[1])[0];
  const topColor = [...colorTally.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!topSeason) return null;
  return { season: topSeason[0], colors: topColor ? [topColor[0]] : [] };
}

export function MonthGrid() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [calendar, setCalendar] = useState<CalendarYear | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // Mark loading for THIS year, then populate when romcal resolves.
    // (setLoading is deferred via the async callback rather than called
    // synchronously in the effect body, per react-hooks guidance.)
    generateYear(year).then((cal) => {
      if (!alive) return;
      setCalendar(cal);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [year]);

  const cells = useMemo<(DayCell | null)[]>(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (DayCell | null)[] = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = isoDate(year, month, d);
      const days = calendar?.[iso] ?? [];
      out.push({ day: d, iso, celebration: days[0] ?? null });
    }
    return out;
  }, [year, month, calendar]);

  const season = useMemo(
    () => dominantSeason(calendar, year, month),
    [calendar, year, month],
  );

  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="cal">
      <header className="cal__head">
        <button className="cal__nav" onClick={prevMonth} aria-label="Previous month">
          &larr;
        </button>
        <div className="cal__titleblock">
          <h1 className="cal__title">
            {MONTH_NAMES[month]} <span className="cal__year">{year}</span>
          </h1>
          {season && (
            <p className="cal__season">
              <span
                className="cal__season-dot"
                style={{ background: colorToken(season.colors).spine }}
              />
              {season.season}
            </p>
          )}
        </div>
        <button className="cal__nav" onClick={nextMonth} aria-label="Next month">
          &rarr;
        </button>
      </header>

      <div className="cal__dow">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={w} className={`cal__dow-cell${i === 0 ? " cal__dow-cell--sun" : ""}`}>
            {w}
          </div>
        ))}
      </div>

      <div className="cal__grid" aria-busy={loading}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`b${i}`} className="cal__cell cal__cell--empty" />;
          const c = cell.celebration;
          const token = colorToken(c?.colors);
          const named = c && NAMED_RANKS.has(c.rank);
          const isToday = cell.iso === todayIso;
          const isSunday = i % 7 === 0;
          return (
            <div
              key={cell.iso}
              className={`cal__cell${isToday ? " cal__cell--today" : ""}${isSunday ? " cal__cell--sun" : ""}`}
              style={{ background: token.wash }}
            >
              <span className="cal__spine" style={{ background: token.spine }} />
              <span className="cal__date">{cell.day}</span>
              {named && (
                <span className="cal__feast" style={{ color: token.ink }}>
                  {c!.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
