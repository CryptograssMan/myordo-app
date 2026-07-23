// src/components/SyncStatusStrip.tsx
//
// Persistent, subtle status strip (offline-pwa spec §1.2/§1.3):
//  - offline: "Working offline — changes saved on this device"
//  - offline + expired session: sign-in-again warning (writes still allowed)
//  - auth_required while online is handled by the login gate, not here.
// Renders nothing when everything is synced and online.

import { useEffect, useState } from "react";
import { subscribeSync, syncState } from "../lib/syncEngine";
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

  useEffect(() => subscribeSync(() => setTick((t) => t + 1)), []);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const s = syncState();
  const tl = language === "tl";
  const isOffline = !online || s.status === "offline";

  if (sessionExpired && isOffline) {
    return (
      <div className="syncstrip syncstrip--warning" role="status">
        <span className="syncstrip__dot" />
        {tl
          ? "Nag-expire ang iyong session. Naka-save ang iyong mga tala sa device na ito at masi-sync pagkatapos mong mag-sign in muli."
          : "Your session expired. Your notes are saved on this device and will sync after you sign in again."}
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="syncstrip syncstrip--offline" role="status">
        <span className="syncstrip__dot" />
        {tl
          ? `Offline — naka-save ang mga pagbabago sa device na ito${s.pendingCount > 0 ? ` (${s.pendingCount} nakabinbin)` : ""}`
          : `Working offline — changes are saved on this device${s.pendingCount > 0 ? ` (${s.pendingCount} pending)` : ""}`}
      </div>
    );
  }

  return null;
}
