// src/pwa.ts
//
// Service-worker registration with a PROMPT update flow (spec §5): when
// a new version is waiting, show a small toast; never force-reload — a
// mid-edit homily draft must not be yanked away. If the outbox is
// non-empty, refresh triggers a sync attempt first.

import { registerSW } from "virtual:pwa-register";
import { syncNow } from "./lib/syncEngine";

export function setupPWA(): void {
  const updateSW = registerSW({
    onNeedRefresh() {
      showUpdateToast(async () => {
        try {
          await syncNow(); // flush the outbox before swapping versions
        } catch {
          /* offline — the outbox persists across the reload anyway */
        }
        void updateSW(true);
      });
    },
  });
}

function showUpdateToast(onRefresh: () => void) {
  if (document.getElementById("myordo-update-toast")) return;
  const toast = document.createElement("div");
  toast.id = "myordo-update-toast";
  toast.setAttribute("role", "status");
  toast.style.cssText =
    "position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);" +
    "background:#26241f;color:#f3efe4;padding:0.6rem 1rem;border-radius:0.5rem;" +
    "font-family:ui-sans-serif,system-ui,sans-serif;font-size:0.85rem;" +
    "display:flex;gap:0.75rem;align-items:center;z-index:1000;box-shadow:0 2px 12px rgba(0,0,0,0.25)";
  const text = document.createElement("span");
  text.textContent = "A new version of myORDO is ready.";
  const btn = document.createElement("button");
  btn.textContent = "Refresh";
  btn.style.cssText =
    "font:inherit;font-weight:600;background:#615380;color:#f3efe4;border:none;" +
    "border-radius:999px;padding:0.25rem 0.8rem;cursor:pointer";
  btn.onclick = onRefresh;
  toast.append(text, btn);
  document.body.append(toast);
}
