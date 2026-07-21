// src/lib/liturgicalColors.ts
//
// The liturgical colors ARE the palette. These are canonical data the
// Church assigns to every day, not decorative choices. Tuned to read as
// ecclesiastical/missal rather than primary-bright, so the month grid
// shows the *rhythm of the liturgical year* at a glance (long green
// Ordinary Time, violet Lent, bursts of white/gold feasts, red martyrs).
//
// romcal emits colors as uppercase enums: WHITE, RED, GREEN, VIOLET
// (a.k.a. PURPLE), ROSE, GOLD, BLACK. We map each to a spine color
// (the saturated edge marker) and a soft wash (a barely-tinted cell
// background) so color reads clearly without hurting text legibility.

export interface LiturgicalColorToken {
  label: string;
  spine: string;
  wash: string;
  ink: string;
}

const TOKENS: Record<string, LiturgicalColorToken> = {
  GREEN: { label: "Green", spine: "#3f6b4c", wash: "#f1f5ee", ink: "#233829" },
  WHITE: { label: "White", spine: "#d8c9a3", wash: "#fbf8f0", ink: "#6b5c38" },
  GOLD: { label: "Gold", spine: "#9c6b0a", wash: "#f7e9c8", ink: "#5c4a1e" },
  RED: { label: "Red", spine: "#9e3630", wash: "#f8eeec", ink: "#5a201c" },
  VIOLET: { label: "Violet", spine: "#5b4a7e", wash: "#f1eef6", ink: "#33264a" },
  PURPLE: { label: "Violet", spine: "#5b4a7e", wash: "#f1eef6", ink: "#33264a" },
  ROSE: { label: "Rose", spine: "#c17d94", wash: "#faf0f3", ink: "#5e3547" },
  BLACK: { label: "Black", spine: "#2f2f33", wash: "#efeff0", ink: "#1c1c20" },
};

const FALLBACK: LiturgicalColorToken = {
  label: "Green",
  spine: "#3f6b4c",
  wash: "#f1f5ee",
  ink: "#233829",
};

export function colorToken(colors: string[] | undefined): LiturgicalColorToken {
  const first = colors && colors.length > 0 ? colors[0].toUpperCase() : "";
  return TOKENS[first] ?? FALLBACK;
}
