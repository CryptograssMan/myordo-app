// src/lib/useDayNotes.ts
//
// Day-panel notes, read from IndexedDB (offline-pwa spec §2: the UI
// always renders from the local store; the network is the sync engine's
// job). Re-reads whenever the sync engine reports data changed.

import { useCallback, useEffect, useState } from "react";
import { notesForDate, getSnapshot } from "./localdb";
import { subscribeSync } from "./syncEngine";

export interface Note {
  id: string;
  visibility: "private" | "parish_public";
  liturgical_date: string;
  title: string | null;
  body: string | null;
  version: number;
  updated_at: string;
  author_user_id: string;
  attribution: string | null; // email prefix of last editor/author (public only)
  dirty?: boolean; // pending un-synced local edit
}

export interface DayNotes {
  loading: boolean;
  error: string | null;
  publicNotes: Note[];
  privateNotes: Note[];
  refetch: () => void;
}

export function useDayNotes(isoDate: string | null): DayNotes {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  // Re-read after every sync-engine event (pull applied, push resolved…)
  useEffect(() => subscribeSync(refetch), [refetch]);

  useEffect(() => {
    if (!isoDate) return;
    let alive = true;

    async function load(date: string) {
      setLoading(true);
      const snapshot = await getSnapshot();
      if (!alive) return;
      if (!snapshot) {
        setNotes([]);
        setLoading(false);
        return;
      }
      const rows = await notesForDate(snapshot.activeParishId, date);
      if (!alive) return;
      // Private notes: author-only, mirroring the server's visibility rule.
      setNotes(
        rows.filter(
          (n) =>
            n.visibility === "parish_public" ||
            n.author_user_id === snapshot.userId,
        ),
      );
      setLoading(false);
    }

    void load(isoDate);
    return () => {
      alive = false;
    };
  }, [isoDate, nonce]);

  const active = isoDate !== null;
  return {
    loading: active ? loading : false,
    error: null,
    publicNotes: active ? notes.filter((n) => n.visibility === "parish_public") : [],
    privateNotes: active ? notes.filter((n) => n.visibility === "private") : [],
    refetch,
  };
}
