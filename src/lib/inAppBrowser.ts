// src/lib/inAppBrowser.ts
//
// Conservative detection of embedded in-app browsers (WebViews) where Google
// OAuth is blocked with "403: disallowed_useragent". We ONLY match unambiguous
// signatures for the apps common in the Philippines, so we never hide the
// sign-in button from a real browser.
//
// Pure function, no side effects.

export type InAppSource =
  | "Messenger"
  | "Facebook"
  | "Instagram"
  | "Threads"
  | "Viber"
  | "WhatsApp"
  | "Telegram"
  | "TikTok"
  | "in-app browser";

const SIGNATURES: { source: InAppSource; needles: string[] }[] = [
  { source: "Messenger", needles: ["Messenger"] },
  { source: "Threads", needles: ["Barcelona"] },
  { source: "Instagram", needles: ["Instagram"] },
  { source: "Facebook", needles: ["FBAN", "FBAV", "FB_IAB"] },
  { source: "Viber", needles: ["Viber"] },
  { source: "WhatsApp", needles: ["WhatsApp"] },
  { source: "Telegram", needles: ["Telegram", "TelegramBot"] },
  { source: "TikTok", needles: ["musical_ly", "BytedanceWebview", "TikTok", "Bytedance"] },
];

export function detectInAppBrowser(
  ua: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
): InAppSource | null {
  if (!ua) return null;
  for (const { source, needles } of SIGNATURES) {
    if (needles.some((n) => ua.includes(n))) return source;
  }
  return null;
}
