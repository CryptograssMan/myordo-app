// src/components/InstallBanner.tsx
//
// "Save myORDO to your device" (offline-pwa spec §6). Two variants:
//  - Chromium: real install button via the stashed beforeinstallprompt.
//  - iOS Safari: instructional (Share → Add to Home Screen) — iOS has
//    no install API. Suppressed inside in-app browsers (can't install).
// Snoozed 14 days per dismissal; gone for good after 3 dismissals or a
// successful install. Never shown when already running standalone.

import { useEffect, useState } from "react";
import { detectInAppBrowser } from "../lib/inAppBrowser";
import "./InstallBanner.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Stash the event at module scope — it fires before React mounts.
let stashedPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    stashedPrompt = e as BeforeInstallPromptEvent;
  });
}

const LS_KEY = "myordo.installBanner";

interface BannerState {
  dismissals: number;
  dismissedAt: string | null;
  installed: boolean;
}

function readState(): BannerState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as BannerState;
  } catch {
    /* ignore */
  }
  return { dismissals: 0, dismissedAt: null, installed: false };
}

function writeState(s: BannerState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function InstallBanner({ language }: { language?: "en" | "tl" }) {
  const [visible, setVisible] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed & running as app
    if (detectInAppBrowser()) return; // FB/Messenger etc. can't install

    const s = readState();
    if (s.installed || s.dismissals >= 3) return;
    if (s.dismissedAt) {
      const snoozeUntil = new Date(s.dismissedAt).getTime() + 14 * 24 * 60 * 60 * 1000;
      if (Date.now() < snoozeUntil) return;
    }

    const ios = isIos();

    // Single path: become visible when eligible, and track prompt
    // availability separately. beforeinstallprompt can fire well after
    // mount (slow networks, late SW activation) — the banner must not
    // depend on a race with a timer.
    const show = setTimeout(() => {
      setCanPrompt(!ios && stashedPrompt !== null);
      setVisible(true);
    }, 0);

    // Chromium: if the prompt arrives later, upgrade the banner in place
    // from instructions to a real Install button.
    const onBip = () => setCanPrompt(true);
    window.addEventListener("beforeinstallprompt", onBip);

    const onInstalled = () => {
      writeState({ ...readState(), installed: true });
      setVisible(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      clearTimeout(show);
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  const tl = language === "tl";
  const ios = isIos();

  function dismiss() {
    const s = readState();
    writeState({
      ...s,
      dismissals: s.dismissals + 1,
      dismissedAt: new Date().toISOString(),
    });
    setVisible(false);
  }

  async function install() {
    if (!stashedPrompt) {
      setCanPrompt(false); // show the manual instructions instead
      return;
    }
    try {
      await stashedPrompt.prompt();
      const choice = await stashedPrompt.userChoice;
      if (choice.outcome === "accepted") {
        writeState({ ...readState(), installed: true });
        setVisible(false);
      }
      // Dismissed: leave the banner up so they can try again.
      stashedPrompt = null;
    } catch {
      // Stale/already-consumed event (Chrome throws InvalidStateError).
      // Never fail silently — degrade to the manual route.
      stashedPrompt = null;
      setCanPrompt(false);
    }
  }

  return (
    <div className="installbanner" role="region" aria-label="Install myORDO">
      <span className="installbanner__text">
        {ios ? (
          tl ? (
            <>
              I-save ang myORDO: i-tap ang <strong>Share</strong> (
              <span aria-hidden="true">&#x2BAD;</span>) at piliin ang{" "}
              <strong>&ldquo;Add to Home Screen&rdquo;</strong> — gagana ito kahit
              walang signal.
            </>
          ) : (
            <>
              Save myORDO: tap <strong>Share</strong> (
              <span aria-hidden="true">&#x2BAD;</span>) then{" "}
              <strong>&ldquo;Add to Home Screen&rdquo;</strong> — it works even
              without signal.
            </>
          )
        ) : canPrompt ? (
          tl ? (
            <>
              I-install ang myORDO sa iyong device — gagana ang iyong kalendaryo
              at mga tala kahit walang signal.
            </>
          ) : (
            <>
              Install myORDO on your device — your calendar and notes will work
              even without signal.
            </>
          )
        ) : tl ? (
          <>
            I-install ang myORDO: buksan ang menu ng Chrome (⋮) at piliin ang{" "}
            <strong>&ldquo;Install app&rdquo;</strong> — gagana ito kahit walang
            signal.
          </>
        ) : (
          <>
            Install myORDO: open the Chrome menu (⋮) and choose{" "}
            <strong>&ldquo;Install app&rdquo;</strong> — it works even without
            signal.
          </>
        )}
      </span>
      <span className="installbanner__actions">
        {!ios && canPrompt && (
          <button className="installbanner__install" onClick={() => void install()}>
            {tl ? "I-install" : "Install"}
          </button>
        )}
        <button
          className="installbanner__dismiss"
          onClick={dismiss}
          aria-label={tl ? "Isara" : "Dismiss"}
        >
          &times;
        </button>
      </span>
    </div>
  );
}
