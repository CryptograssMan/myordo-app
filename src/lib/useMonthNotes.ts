// src/lib/useMonthNotes.ts
//
// Fetches all PARISH-PUBLIC notes across a month's date range (GET
// /api/notes/month) so the month grid can show reminder chips per day.
// Public-only by design — private notes appear only in the day panel.
// Returns a Map keyed by ISO date -> notes for that day, plus refetch().

import { useCallback, useEffect, useState } from "react";
import { type Note } from "./useDayNotes";

export interface MonthNotes {
  byDate: Map<string, Note[]>;
  refetch: () => void;
}

export function useMonthNotes(
  startIso: string | null,
  endIso: string | null,
): MonthNotes {
  const [byDate, setByDate] = useState<Map<string, Note[]>>(new Map());
  const [nonce, setNonce] = useState(0);
  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!startIso || !endIso) return;
    let alive = true;

    async function load(start: string, end: string) {
      try {
        const res = await fetch(
          `/api/notes/month?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
        );
        if (!alive) return;
        if (!res.ok) {
          setByDate(new Map());
          return;
        }
        const notes = (await res.json()) as Note[];
        const map = new Map<string, Note[]>();
        for (const n of notes) {
          const arr = map.get(n.liturgical_date);
          if (arr) arr.push(n);
          else map.set(n.liturgical_date, [n]);
        }
        if (alive) setByDate(map);
      } catch {
        if (alive) setByDate(new Map());
      }
    }

    load(startIso, endIso);
    return () => {
      alive = false;
    };
  }, [startIso, endIso, nonce]);

  return { byDate, refetch };
}
