// src/lib/useCurrentUser.ts
//
// Auth gate with OFFLINE SESSION CONTINUATION (offline-pwa spec §1.2):
//   - Online: /api/me is authoritative; the fresh identity snapshot is
//     cached to IndexedDB (via syncEngine.refreshSnapshot).
//   - Network unreachable: fall back to the cached snapshot and enter
//     the app offline. Expired-offline still enters (spec §1.3) — the
//     server rejects sync until re-auth, but reading and writing locally
//     must keep working (the remote-chapel case).
//   - 401/403 while ONLINE: signed out (fresh login required).
//   - No cached snapshot + no network: blocked screen (nothing cached).

import { useEffect, useState } from "react";
import { getSnapshot } from "./localdb";
import { refreshSnapshot, startSyncTriggers } from "./syncEngine";

export interface CurrentUser {
  userId: string;
  parishId: string;
  role: "admin" | "staff";
  email: string;
  parishName: string;
  isSuperAdmin: boolean;
}

export type AuthState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "offline_blocked" } // offline + never signed in on this device
  | {
      status: "signed_in";
      user: CurrentUser;
      offline: boolean;
      sessionExpired: boolean;
    };

export function useCurrentUser(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let alive = true;

    async function resolve() {
      const result = await refreshSnapshot();
      if (!alive) return;

      if (result === "ok") {
        const s = await getSnapshot();
        if (!alive || !s) return setState({ status: "signed_out" });
        setState({
          status: "signed_in",
          user: {
            userId: s.userId,
            parishId: s.activeParishId,
            role: s.activeRole,
            email: s.email,
            parishName: s.activeParishName,
            isSuperAdmin: s.isSuperAdmin,
          },
          offline: false,
          sessionExpired: false,
        });
        startSyncTriggers();
        return;
      }

      if (result === "auth_required") {
        // Online but session invalid: a fresh Google login is required.
        // The cached snapshot/outbox stay put — they flush after login
        // (outbox is keyed by userId, so a different account never
        // inherits it; spec §1.3).
        setState({ status: "signed_out" });
        return;
      }

      // Offline: session continuation from the cached snapshot.
      const s = await getSnapshot();
      if (!alive) return;
      if (!s) {
        setState({ status: "offline_blocked" });
        return;
      }
      const expired =
        s.sessionExpiresAt !== null && new Date(s.sessionExpiresAt) < new Date();
      setState({
        status: "signed_in",
        user: {
          userId: s.userId,
          parishId: s.activeParishId,
          role: s.activeRole,
          email: s.email,
          parishName: s.activeParishName,
          isSuperAdmin: s.isSuperAdmin,
        },
        offline: true,
        sessionExpired: expired,
      });
      startSyncTriggers();
    }

    void resolve();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
