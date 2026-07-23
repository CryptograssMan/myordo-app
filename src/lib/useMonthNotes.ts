// src/lib/useMonthNotes.ts
//
// Parish-public notes across a month's range, read from IndexedDB
// (offline-pwa spec §2). Re-reads on sync-engine events so pulled
// changes appear without a manual refresh.

import { useCallback, useEffect, useState } from "react";
import { type Note } from "./useDayNotes";
import { getSnapshot, publicNotesForRange } from "./localdb";
import { subscribeSync } from "./syncEngine";

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

  useEffect(() => subscribeSync(refetch), [refetch]);

  useEffect(() => {
    if (!startIso || !endIso) return;
    let alive = true;

    async function load(start: string, end: string) {
      const snapshot = await getSnapshot();
      if (!alive) return;
      if (!snapshot) {
        setByDate(new Map());
        return;
      }
      const notes = await publicNotesForRange(snapshot.activeParishId, start, end);
      if (!alive) return;
      const map = new Map<string, Note[]>();
      for (const n of notes) {
        const list = map.get(n.liturgical_date) ?? [];
        list.push(n);
        map.set(n.liturgical_date, list);
      }
      setByDate(map);
    }

    void load(startIso, endIso);
    return () => {
      alive = false;
    };
  }, [startIso, endIso, nonce]);

  return { byDate, refetch };
}
