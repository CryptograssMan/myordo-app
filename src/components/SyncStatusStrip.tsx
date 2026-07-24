// src/components/SyncStatusStrip.tsx
//
// Connectivity / sync status (offline-pwa spec §1.2/§1.3).
//
// RULE: never contradict the browser. `navigator.onLine === true` means we
// do NOT say "offline", no matter what the last sync attempt did. A failed
// sync while connected is a sync problem, not a connectivity problem, and
// telling a user they're offline when they aren't destroys trust in every
// other message the app shows.
//
// Nothing renders when online and synced — the quiet default.

import { useEffect, useState } from "react";
import { forceSync, subscribeSync, syncState } from "../lib/syncEngine";
import "./InstallBanner.css";

export function SyncStatusStrip({
  sessionExpired,
  language,
}: {
  sessionExpired: boolean;
  language?: "en" | "tl";
}) {
  const [, setTick] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => subscribeSync(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    // navigator.onLine can change without an event firing (PWA cold start,
    // wake from sleep). Poll cheaply so the strip can't get stuck.
    const poll = setInterval(() => setOnline(navigator.onLine), 5000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      clearInterval(poll);
    };
  }, []);

  const s = syncState();
  const tl = language === "tl";

  // Self-heal: browser says online but the engine is still parked on a
  // stale "offline" from a transient cold-start failure (e.g. the first
  // /api/me fired before the service worker finished claiming). Re-run
  // once rather than leaving a false "offline" on screen.
  const stale = online && s.status === "offline";
  useEffect(() => {
    if (!stale || retrying) return;
    const t = setTimeout(() => {
      setRetrying(true);
      void forceSync().finally(() => setRetrying(false));
    }, 0);
    return () => clearTimeout(t);
  }, [stale, retrying]);

  // --- Genuinely offline -------------------------------------------
  if (!online) {
    if (sessionExpired) {
      return (
        <div className="syncstrip syncstrip--warning" role="status">
          <span className="syncstrip__dot" />
          {tl
            ? "Nag-expire ang iyong session. Naka-save ang iyong mga tala sa device na ito at masi-sync pagkatapos mong mag-sign in muli."
            : "Your session expired. Your notes are saved on this device and will sync after you sign in again."}
        </div>
      );
    }
    return (
      <div className="syncstrip syncstrip--offline" role="status">
        <span className="syncstrip__dot" />
        {tl
          ? `Offline — naka-save ang mga pagbabago sa device na ito${s.pendingCount > 0 ? ` (${s.pendingCount} nakabinbin)` : ""}`
          : `Working offline — changes are saved on this device${s.pendingCount > 0 ? ` (${s.pendingCount} pending)` : ""}`}
      </div>
    );
  }

  // --- Online, but the session needs renewing -----------------------
  if (sessionExpired) {
    return (
      <div className="syncstrip syncstrip--warning" role="status">
        <span className="syncstrip__dot" />
        {tl
          ? "Mag-sign in muli upang ma-sync ang iyong mga tala."
          : "Sign in again to sync your notes."}
      </div>
    );
  }

  // --- Online, but the server rejected or errored -------------------
  // Say what is actually true: connected, sync is failing, retrying.
  if (s.status === "error") {
    return (
      <div className="syncstrip syncstrip--warning" role="status">
        <span className="syncstrip__dot" />
        {tl
          ? `Hindi maka-sync sa ngayon — susubukan muli${s.pendingCount > 0 ? ` (${s.pendingCount} nakabinbin)` : ""}`
          : `Can't sync right now — retrying${s.pendingCount > 0 ? ` (${s.pendingCount} pending)` : ""}`}
        <button
          className="syncstrip__retry"
          onClick={() => void forceSync()}
          disabled={retrying}
        >
          {tl ? "Subukan muli" : "Retry"}
        </button>
      </div>
    );
  }

  // Online and healthy — say nothing.
  return null;
}
