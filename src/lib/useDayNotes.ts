// src/lib/useDayNotes.ts
//
// Fetches notes for a selected day from GET /api/notes?date=. Returns the
// list plus refetch() so write actions (stage 3) can refresh after
// create/edit/delete. Only fetches when a date is provided.

import { useCallback, useEffect, useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!isoDate) return;
    let alive = true;

    // All state updates happen inside this async function rather than
    // synchronously in the effect body (react-hooks/set-state-in-effect).
    async function load(date: string) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/notes?date=${encodeURIComponent(date)}`);
        if (!alive) return;
        if (!res.ok) {
          setError(`Could not load notes (${res.status})`);
          setNotes([]);
        } else {
          setNotes((await res.json()) as Note[]);
        }
      } catch {
        if (alive) setError("Could not load notes");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load(isoDate);
    return () => {
      alive = false;
    };
  }, [isoDate, nonce]);

  const active = isoDate !== null;
  return {
    loading: active ? loading : false,
    error: active ? error : null,
    publicNotes: active ? notes.filter((n) => n.visibility === "parish_public") : [],
    privateNotes: active ? notes.filter((n) => n.visibility === "private") : [],
    refetch,
  };
}
