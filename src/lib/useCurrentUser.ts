// src/lib/useCurrentUser.ts
//
// Loads the logged-in user's identity + role + parish from /api/me.
// Drives the login gate: null user => show sign-in; user => show app.

import { useEffect, useState } from "react";

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
  | { status: "signed_in"; user: CurrentUser };

export function useCurrentUser(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then(async (res) => {
        if (!alive) return;
        if (res.ok) {
          const user = (await res.json()) as CurrentUser;
          setState({ status: "signed_in", user });
        } else {
          setState({ status: "signed_out" });
        }
      })
      .catch(() => {
        if (alive) setState({ status: "signed_out" });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
