// src/lib/philippineCorrections.ts
//
// Local corrections applied over romcal's Philippine calendar output.
//
// WHY THIS EXISTS: romcal's @romcal/calendar.philippines plugin (as of
// 3.0.0-dev) lags the current official CBCP calendar on the two canonized
// Filipino saints. The CBCP (Catholic Bishops' Conference of the
// Philippines) updated the national calendar effective 1 December 2024
// (Liturgical Year 2025):
//
//   1. San Pedro Calungsod: MOVED from April 2 -> October 21 (his
//      canonization date), and ELEVATED from Optional Memorial -> FEAST.
//      Reason for the move: April 2 usually falls in Holy Week / the
//      Easter Octave. romcal currently OMITS him entirely.
//      Sources:
//        - Archdiocese of Manila (RCAM) liturgical notes, Oct 2025:
//          "elevation of the memorial of St. Pedro Calungsod to a Feast
//          (CBCP 127th Plenary Assembly)"
//        - dominusest.ph, "Updates in the Philippine Liturgical Calendar"
//
//   2. San Lorenzo Ruiz: ELEVATED from Memorial -> FEAST on September 28.
//      romcal currently has him as a "memorial" (rank MEMORIAL).
//      Source: same CBCP update (dominusest.ph).
//
// This is the concrete implementation of architecture §13 ("diff romcal
// against the official CBCP ordo and ship corrections"). It is data-driven
// so additional corrections found during the full pre-launch CBCP diff
// slot in here without code changes.
//
// A matching upstream contribution to the romcal project is being prepared
// so these can eventually be fixed at source and this override dropped.

import type { LiturgicalDayView } from "./liturgicalCalendar";

// A correction is applied by (month, day) in the gregorian year. Each
// entry is a full LiturgicalDayView that REPLACES romcal's default
// celebration for that date. Ranks/colors use romcal's own vocabulary.
export interface Correction {
  // Gregorian month (1-12) and day (1-31) the celebration belongs on.
  month: number;
  day: number;
  // Match key: if romcal already has an entry whose name includes this
  // (case-insensitive), we REPLACE it (used to upgrade Lorenzo Ruiz's
  // rank). If omitted, the correction is ADDED as a new celebration
  // (used to insert the missing Calungsod).
  replaceIfNameIncludes?: string;
  day_view: LiturgicalDayView;
}

export const PHILIPPINE_CORRECTIONS: Correction[] = [
  {
    // ADD: San Pedro Calungsod, missing from romcal entirely.
    month: 10,
    day: 21,
    day_view: {
      date: "", // filled in at apply time with the actual ISO date
      name: "Saint Pedro Calungsod, Martyr",
      rank: "FEAST",
      rankName: "Feast",
      colors: ["RED"], // martyr
      seasonNames: [], // filled from romcal's context for that date
      isHolyDayOfObligation: false,
      isOptional: false,
    },
  },
  {
    // UPGRADE: San Lorenzo Ruiz, present in romcal but as a memorial;
    // CBCP elevated to Feast. Match romcal's English name
    // "Saint Lawrence Ruiz and Companions, Martyrs".
    month: 9,
    day: 28,
    replaceIfNameIncludes: "lawrence ruiz",
    day_view: {
      date: "",
      name: "Saint Lorenzo Ruiz and Companions, Martyrs",
      rank: "FEAST",
      rankName: "Feast",
      colors: ["RED"], // martyrs
      seasonNames: [],
      isHolyDayOfObligation: false,
      isOptional: false,
    },
  },
];
