// src/lib/readings.ts
//
// Daily Mass reading CITATIONS (references only — no scripture text) for the
// Philippine liturgical calendar, Liturgical Year 2026 (Cycle A / Year II).
// Source: CBCP-ECBA Catholic Daily Bible Reading Guide 2026 (Philippine Bible
// Society / CBCP Episcopal Commission on the Biblical Apostolate; Imprimatur
// Most Rev. Renato P. Mayugba, D.D.). Extracted via OCR, structurally validated
// (all 364 dates present, day-of-week verified). Displayed with attribution.
//
// Keyed by ISO date for LY2026 (2025-11-30 through 2026-11-28). A future revision
// will re-key by liturgical id + cycle so readings resolve in later years too.
//
// Feature-gated: set READINGS_ENABLED = false to hide the readings UI instantly.

export const READINGS_ENABLED = true;

export interface ReadingSet {
  /** Optional label, e.g. "Vigil", "Mass at Midnight", or a Philippine proper. */
  label: string | null;
  /** The reading citations as printed, separated by " / " (1st / Ps [/ 2nd] / Gospel). */
  citation: string;
  /** The responsorial psalm response, if given. */
  response: string | null;
}

export interface DayReadings {
  /** Celebration title for Sundays/solemnities/feasts, else null. */
  title: string | null;
  /** One or more Mass reading sets (multiple for e.g. Christmas, or PH propers). */
  sets: ReadingSet[];
}

const READINGS: Record<string, DayReadings> = {
  "2025-11-30": {
    title: "1st SUNDAY OF ADVENT",
    sets: [
      { label: null, citation: "Is 2:1-5 / Ps 122:1-2, 3-4, 4-5, 6-7, 8-9 / Rom 12:13-14 / Mt 24:37-44", response: "Let us go rejoicing to the house of the Lord." },
    ],
  },
  "2025-12-01": {
    title: null,
    sets: [
      { label: null, citation: "Is 4:2-6 / Ps 122:1-2, 3-4b, 4cd-5, 6-7, 8-9 / Mt 8:5-11", response: "Let us go rejoicing to the house of the Lord." },
    ],
  },
  "2025-12-02": {
    title: null,
    sets: [
      { label: null, citation: "Is 11:1-10 / Ps 72:1-2, 7-8, 12-13, 17 / Lk 10:21-24", response: "Justice shall flourish in his time, and fullness of peace for ever." },
    ],
  },
  "2025-12-03": {
    title: null,
    sets: [
      { label: null, citation: "Is 25:6-10a / Ps 23:1-3a, 3b-4, 5, 6 / Mt 15:29-37", response: "I shall live in the house of the Lord all the days of my life." },
    ],
  },
  "2025-12-04": {
    title: null,
    sets: [
      { label: null, citation: "Is 26:1-6 / Ps 118:1 and 8-9, 19-21, 25-27a / Mt 7:21, 24-27", response: "Blessed is he who comes in the name of the Lord." },
    ],
  },
  "2025-12-05": {
    title: null,
    sets: [
      { label: null, citation: "Is 29:17-24 / Ps 27:1, 4, 13-14 / Mt 9:27-31", response: "The Lord is my light and my salvation." },
    ],
  },
  "2025-12-06": {
    title: null,
    sets: [
      { label: null, citation: "Is 30:19-21, 23-26 / Ps 147:1-2, 3-4, 5-6 / Mt 9:35-10:1, 5a, 6-8", response: "Blessed are all who wait for the Lord." },
    ],
  },
  "2025-12-07": {
    title: "2nd SUNDAY OF ADVENT",
    sets: [
      { label: null, citation: "Is 11:1-10 / Ps 72:1-2, 7-8, 12-13, 17 / Rom 15:4-9 / Mt 3:1-12", response: "Justice shall flourish in his time, and fullness of peace for ever." },
    ],
  },
  "2025-12-08": {
    title: "IMMACULATE CONCEPTION OF THE BLESSED VIRGIN MARY S. Holy Day of Obligation.",
    sets: [
      { label: null, citation: "Gn 3:9-15, 20 / Ps 98:1, 2-3ab, 3cd-4 / Eph 1:3-6, 11-12 / Lk 1:26-38", response: "Sing to the Lord a new song, for he has done marvelous deeds." },
    ],
  },
  "2025-12-09": {
    title: null,
    sets: [
      { label: null, citation: "Is 40:1-11 / Ps 96:1-2, 3 and 10ac, 11-12, 13 / Mt 18:12-14", response: "The Lord our God comes with power." },
    ],
  },
  "2025-12-10": {
    title: null,
    sets: [
      { label: null, citation: "Is 40:25-31 / Ps 103:1-2, 3-4, 8 and 10 / Mt 11:28-30", response: "O bless the Lord, my soul!" },
    ],
  },
  "2025-12-11": {
    title: null,
    sets: [
      { label: null, citation: "Is 41:13-20 / Ps 145:1 and 9, 10-11, 12-13ab / Mt 11:11-15", response: "The Lord is gracious and merciful; slow to anger, and of great kindness." },
    ],
  },
  "2025-12-12": {
    title: null,
    sets: [
      { label: null, citation: "Zec 2:14-17 or Rv 11:19a; 12:1-6a, 10ab / Jdt 13:18bcde, 19 / Lk 1:26-38 or Lk 1:39-47", response: "You are the highest honor of our race." },
    ],
  },
  "2025-12-13": {
    title: null,
    sets: [
      { label: null, citation: "Sir 48:1-4, 9-11 / Ps 80:2ac and 3b, 15-16, 18-19 / Mt 17:9a, 10-13", response: "Lord, make us turn to you; let us see your face and we shall be saved." },
    ],
  },
  "2025-12-14": {
    title: "3rd SUNDAY OF ADVENT",
    sets: [
      { label: null, citation: "Is 35:1-6a, 10 / Ps 146:6-7, 8-9, 9-10 / Jas 5:7-10 / Mt 11:2-11", response: "Lord, come and save us." },
    ],
  },
  "2025-12-15": {
    title: null,
    sets: [
      { label: null, citation: "Nm 24:2-7, 15-17a / Ps 25:4-5ab, 6 and 7bc, 8-9 / Mt 21:23-27", response: "Teach me your ways, O Lord." },
    ],
  },
  "2025-12-16": {
    title: null,
    sets: [
      { label: null, citation: "Zep 3:1-2, 9-13 / Ps 34:2-3, 6-7, 17-18, 19 and 23 / Mt 21:28-32", response: "The Lord hears the cry of the poor." },
    ],
  },
  "2025-12-17": {
    title: null,
    sets: [
      { label: null, citation: "Gn 49:2, 8-10 / Ps 72:1-2, 3-4ab, 7-8, 17 / Mt 1:1-17", response: "Justice shall flourish in his time, and fullness of peace for ever." },
    ],
  },
  "2025-12-18": {
    title: null,
    sets: [
      { label: null, citation: "Jer 23:5-8 / Ps 72:1-2, 12-13, 18-19 / Mt 1:18-25", response: "Justice shall flourish in his time, and fullness of peace for ever." },
    ],
  },
  "2025-12-19": {
    title: null,
    sets: [
      { label: null, citation: "Jgs13:2-7, 24-25a / Ps 71:3-4a, 5-Gab, 16-17 / Lk 1:5-25", response: "My mouth shall be filled with your praise, and I will sing your glory!" },
    ],
  },
  "2025-12-20": {
    title: null,
    sets: [
      { label: null, citation: "Is 7:10-14 / Ps 24:1-2, 3-4ab, 5-6 / Lk 1:26-38", response: "Let the Lord enter; he is the king of glory." },
    ],
  },
  "2025-12-21": {
    title: "4th SUNDAY OF ADVENT",
    sets: [
      { label: null, citation: "Is 7:10-14 / Ps 24:1-2, 3-4, 5-6 / Rom 1:1-7 / Mt 1:18-24", response: "Let the Lord enter; he is king of glory." },
    ],
  },
  "2025-12-22": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 1:24-28 / 1 Sm 2:1, 4-5, 6-7, 8abcd / Lk 1:46-56", response: "My heart exults in the Lord, my Savior." },
    ],
  },
  "2025-12-23": {
    title: null,
    sets: [
      { label: null, citation: "Mal 3:1-4, 23-24 / Ps 25:4-5ab, 8-9, 10 and 14 / Lk 1:57-66", response: "Lift up your heads and see; your redemption is near at hand." },
    ],
  },
  "2025-12-24": {
    title: null,
    sets: [
      { label: null, citation: "2 Sm 7:1-5, 8b-12, 14a, 16 / Ps 89:2-3, 4-5, 27 and 29 / Lk 1:67-79", response: "For ever I will sing the goodness of the Lord." },
    ],
  },
  "2025-12-25": {
    title: "THE NATIVITY OF THE LORD S. Holy Day of Obligation.",
    sets: [
      { label: "Vigil", citation: "Is 62:1-5 / Ps 89:4-5, 16-17, 27, 29 / Acts 13:16-17, 22-25 / Mt 1:1-25, Midnight: Is 9:1-6 / Ps 96:1-2, 2-3, 11-12, 13 / Ti 2:11-14 / Lk 2:1-14, Dawn: Is 62:11-12 / Ps 97:1, 6, 11-12 / Ti 3:4-7 / Lk 2:15-20, Day: Is 52:7-10 / Ps 98:1, 2-3, 3-4, 5-6 / Heb 1:1-6 / Jn 1:1-18", response: "For ever I will sing the goodness of the Lord. (Psalm for Vigil Mass)" },
    ],
  },
  "2025-12-26": {
    title: null,
    sets: [
      { label: null, citation: "Acts 6:8-10; 7:54-59 / Ps 31:3cd-4, 6 and 8ab, 16bc and 17 / Mt 10:17-22", response: "Into your hands, O Lord, I commend my spirit." },
    ],
  },
  "2025-12-27": {
    title: null,
    sets: [
      { label: null, citation: "1Jn1:1-4 / Ps 97:1-2, 5-6, 11-12 / Jn 20:1a and 2-8", response: "Rejoice in the Lord, you just!" },
    ],
  },
  "2025-12-28": {
    title: "HOLY FAMILY",
    sets: [
      { label: null, citation: "Sir 3:2-6, 12-14 / Ps 128:1-2, 3, 4-5 / Col 3:12-21 / Mt 2:13-15, 19-23", response: "Blessed are those who fear the Lord and walk in his ways." },
    ],
  },
  "2025-12-29": {
    title: null,
    sets: [
      { label: null, citation: "1 Jn 2:3-11 / Ps 96:1-2a, 2b-3, 5b-6 / Lk 2:22-35", response: "Let the heavens be glad and the earth rejoice!" },
    ],
  },
  "2025-12-30": {
    title: null,
    sets: [
      { label: null, citation: "1 Jn 2:12-17 / Ps 96:7-8a, 8b-9, 10 / Lk 2:36-40", response: "Let the heavens be glad and the earth rejoice!" },
    ],
  },
  "2025-12-31": {
    title: null,
    sets: [
      { label: null, citation: "1 Jn 2:18-21 / Ps 96:1-2, 11-12, 13 / Jn 1:1-18", response: "Let the heavens be glad and the earth rejoice!" },
    ],
  },
  "2026-01-01": {
    title: "MARY, MOTHER OF GOD S. Holy Day of Obligation.",
    sets: [
      { label: null, citation: "Nm 6:22-27 / Ps 67:2-3, 5, 6, 8 / Gal 4:4-7 / Lk 2:16-21", response: "May God bless us in his mercy." },
    ],
  },
  "2026-01-02": {
    title: null,
    sets: [
      { label: null, citation: "1 Jn 2:22-28 / Ps 98:1, 2-3ab, 3cd-4 / Jn 1:19-28", response: "All the ends of the earth have seen the saving power of God." },
    ],
  },
  "2026-01-03": {
    title: null,
    sets: [
      { label: null, citation: "1 Jn 2:29-3:6 / Ps 98:1, 3cd-4, 5-6 / Jn 1:29-34", response: "All the ends of the earth have seen the saving power of God." },
    ],
  },
  "2026-01-04": {
    title: "EPIPHANY OF THE LORD",
    sets: [
      { label: null, citation: "Is 60:1-6 / Ps 72:1-2, 7-8, 10-11, 12-13 / Eph 3:2-3a, 5-6 / Mt 2:1-12", response: "Lord, every nation on earth will adore you." },
    ],
  },
  "2026-01-05": {
    title: null,
    sets: [
      { label: null, citation: "1Jn3:22-4:6 / Ps 2:7bc-8, 10-12a / Mt 4:12-17, 23-25", response: "I will give you all the nations for an inheritance." },
    ],
  },
  "2026-01-06": {
    title: null,
    sets: [
      { label: null, citation: "1 Jn 4:7-10 / Ps 72:1-2, 3-4, 7-8 / Mk 6:34-44", response: "Lord, every nation on earth will adore you." },
    ],
  },
  "2026-01-07": {
    title: null,
    sets: [
      { label: null, citation: "1Jn4:11-18 / Ps 72:1-2, 10, 12-13 / Mk 6:45-52", response: "Lord, every nation on earth will adore you." },
    ],
  },
  "2026-01-08": {
    title: null,
    sets: [
      { label: null, citation: "1Jn4:19-5:4 / Ps 72:1-2, 14 and 15bc, 17 / Lk 4:14-22", response: "Lord, every nation on earth will adore you." },
    ],
  },
  "2026-01-09": {
    title: null,
    sets: [
      { label: null, citation: "1 Jn 5:5-13 / Ps 147:12-13, 14-15, 19-20 / Lk 5:12-16", response: "Praise the Lord, Jerusalem." },
    ],
  },
  "2026-01-10": {
    title: null,
    sets: [
      { label: null, citation: "1Jn5:14-21 / Ps 149:1-2, 3-4, 5 and 6a and 9b / Jn 3:22-30", response: "The Lord takes delight in his people." },
    ],
  },
  "2026-01-11": {
    title: "BAPTISM OF THE LORD",
    sets: [
      { label: null, citation: "Is 42:1-4, 6-7 / Ps 29:1-2, 3-4, 9-10 / Acts 10:34-38 / Mt 3:13-17", response: "You will draw water joyfully from the springs of salvation." },
    ],
  },
  "2026-01-12": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 1:1-8 / Ps 116:12-13, 14-17, 18-19 / Mk 1:14-20", response: "To you, Lord, I will offer a sacrifice of praise." },
    ],
  },
  "2026-01-13": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 1:9-20 / 1 Sm 2:1, 4-5, 6-7, 8abcd / Mk 1:21-28", response: "My heart exults in the Lord, my Savior." },
    ],
  },
  "2026-01-14": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 3:1-10, 19-20 / Ps 40:2 and 5, 7-8a, 8b-9, 10 / Mk 1:29-39", response: "Here am I, Lord; I come to do your will." },
    ],
  },
  "2026-01-15": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 4:1-11 / Ps 44:10-11, 14-15, 24-25 / Mk 1:40-45", response: "Redeem us, Lord, because of your mercy." },
    ],
  },
  "2026-01-16": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 8:4-7, 10-22a / Ps 89:16-17, 18-19 / Mk 2:1-12", response: "For ever I will sing the goodness of the Lord." },
    ],
  },
  "2026-01-17": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 9:1-4, 17-19; 10:1 / Ps 21:2-3, 4-5, 6-7 / Mk 2:13-17", response: "Lord, in your strength the king is glad." },
    ],
  },
  "2026-01-18": {
    title: "2nd SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 49:3, 5-6 / Ps 40:2, 4, 7-8, 8-9, 10 / 1 Cor 1:1-3 / Jn 1:29-34", response: "Here am I, Lord; I come to do your will." },
      { label: "In the Philippines: Feast of the Sto. Niño", citation: "Is 9:1-6 / Ps 97:1, 2-3, 3-4, 5-6 / Eph 1:3-6, 15-18 / Mt 18:1-5, 10, 12-14", response: "All the ends of the earth have seen the saving power of God." },
    ],
  },
  "2026-01-19": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 15:16-23 / Ps 50:8-9, 16bc-17, 21 and 23 / Mk 2:18-22", response: "To the upright I will show the saving power of God." },
    ],
  },
  "2026-01-20": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 16:1-13 / Ps 89:20, 21-22, 27-28 / Mk 2:23-28", response: "I have found David, my servant." },
    ],
  },
  "2026-01-21": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 17:32-33, 37, 40-51 / Ps 144:1b, 2, 9-10 / Mk 3:1-6", response: "Blessed be the Lord, my Rock!" },
    ],
  },
  "2026-01-22": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 18:6-9; 19:1-7 / Ps 56:2-3, 9-10a, 10b-11, 12-13 / Mk 3:7-12", response: "In God I trust; I shall not fear." },
    ],
  },
  "2026-01-23": {
    title: null,
    sets: [
      { label: null, citation: "1 Sm 24:3-21 / Ps 57:2, 3-4, 6 and 11 / Mk 3:13-19", response: "Have mercy on me, God, have mercy." },
    ],
  },
  "2026-01-24": {
    title: null,
    sets: [
      { label: null, citation: "2 Sm 1:1-4, 11-12, 19, 23-27 / Ps 80:2-3, 5-7 / Mk 3:20-21", response: "Let us see your face, Lord, and we shall be saved." },
    ],
  },
  "2026-01-25": {
    title: "3rd SUNDAY IN ORDINARY TIME / SUNDAY OF THE WORD OF GOD",
    sets: [
      { label: null, citation: "Is 8:23-9:3 / Ps 27:1, 4, 13-14 / 1 Cor 1:10-13, 17 / Mt 4:12-23", response: "The Lord is my light and my salvation." },
    ],
  },
  "2026-01-26": {
    title: null,
    sets: [
      { label: null, citation: "2 Tm 1:1-8 or Ti 1:1-5 / Ps 96:1-2a, 2b-3, 7-8a, 10 / Mk 3:22-30", response: "Proclaim God's marvelous deeds to all the nations." },
    ],
  },
  "2026-01-27": {
    title: null,
    sets: [
      { label: null, citation: "2 Sm 6:12b-15, 17-19 / Ps 24:7, 8, 9, 10 / Mk 3:31-35", response: "Who is this king of glory? It is the Lord!" },
    ],
  },
  "2026-01-28": {
    title: null,
    sets: [
      { label: null, citation: "2 Sm 7:4-17 / Ps 89:4-5, 27-28, 29-30 / Mk 4:1-20", response: "For ever I will maintain my love for my servant." },
    ],
  },
  "2026-01-29": {
    title: null,
    sets: [
      { label: null, citation: "2 Sm 7:18-19, 24-29 / Ps 132:1-2, 3-5, 11, 12, 13-14 / Mk 4:21-25", response: "The Lord God will give him the throne of David, his father." },
    ],
  },
  "2026-01-30": {
    title: null,
    sets: [
      { label: null, citation: "2 Sm 11:1-4a, 5-10a, 13-17 / Ps 51:3-4, 5-6a, 6bced-7, 10-11 / Mk 4:26-34", response: "Be merciful, O Lord, for we have sinned." },
    ],
  },
  "2026-01-31": {
    title: null,
    sets: [
      { label: null, citation: "2 Sm 12:1-7a, 10-17 / Ps 51:12-13, 14-15, 16-17 / Mk 4:35-41", response: "Create a clean heart in me, O God." },
    ],
  },
  "2026-02-01": {
    title: "4th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Zep 2:3; 3:12-13 / Ps 146:6-7, 8-9, 9-10 / 1 Cor 1:26-31 / Mt 5:1-12a", response: "Blessed are the poor in spirit; the kingdom of heaven is theirs!" },
    ],
  },
  "2026-02-02": {
    title: null,
    sets: [
      { label: null, citation: "Mal3:1-4 / Ps 24:7, 8, 9, 10 / Heb 2:14-18 / Lk 2:22-40", response: "Who is this king of glory? It is the Lord!" },
    ],
  },
  "2026-02-03": {
    title: null,
    sets: [
      { label: null, citation: "2 Sm 18:9-10, 14b, 24-25a, 30-19:3 / Ps 86:1-2, 3-4, 5-6 / Mk 5:21-43", response: "Listen, Lord, and answer me." },
    ],
  },
  "2026-02-04": {
    title: null,
    sets: [
      { label: null, citation: "2 Sm 24:2, 9-17 / Ps 32:1-2, 5, 6, 7 / Mk 6:1-6", response: "Lord, forgive the wrong I have done." },
    ],
  },
  "2026-02-05": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 2:1-4, 10-12 / 1 Chr 29:10, 11ab, 11d-12a, 12bcd / Mk 6:7-13", response: "Lord, you are exalted over all." },
    ],
  },
  "2026-02-06": {
    title: null,
    sets: [
      { label: null, citation: "Sir 47:2-11 / Ps 18:31, 47 and 50, 51 / Mk 6:14-29", response: "Blessed be God my salvation!" },
    ],
  },
  "2026-02-07": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 3:4-13 / Ps 119:9, 10, 11, 12, 13, 14 / Mk 6:30-34", response: "Lord, teach me your statutes." },
    ],
  },
  "2026-02-08": {
    title: "5th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 58:7-10 / Ps 112:4-5, 6-7, 8-9 / 1 Cor 2:1-5 / Mt 5:13-16", response: "The just man is a light in darkness to the upright." },
    ],
  },
  "2026-02-09": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 8:1-7, 9-13 / Ps 132:6-7, 8-10 / Mk 6:53-56", response: "Lord, go up to the place of your rest!" },
    ],
  },
  "2026-02-10": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 8:22-23, 27-30 / Ps 84:3, 4, 5 and 10, 11 / Mk 7:1-13", response: "How lovely is your dwelling place, Lord, mighty God!" },
    ],
  },
  "2026-02-11": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 10:1-10 / Ps 37:30-31, 39-40 / Mk 7:14-23", response: "The mouth of the just murmurs wisdom." },
    ],
  },
  "2026-02-12": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 11:4-13 / Ps 106:3-4, 35-36, 37 and 40 / Mk 7:24-30", response: "Remember us, O Lord, as you favor your people." },
    ],
  },
  "2026-02-13": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 11:29-32; 12:19 / Ps 81:10-11ab, 12-13, 14-15 / Mk 7:31-37", response: "I am the Lord, your God: hear my voice." },
    ],
  },
  "2026-02-14": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 12:26-32; 13:33-34 / Ps 106:6-7ab, 19-20, 21-22 / Mk 8:1-10", response: "Remember us, O Lord, as you favor your people." },
    ],
  },
  "2026-02-15": {
    title: "6th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Sir 15:15-20 / Ps 119:1-2, 4-5, 17-18, 33-34 / 1 Cor 2:6-10 / Mt 5:17-37", response: "Blessed are they who follow the law of the Lord!" },
    ],
  },
  "2026-02-16": {
    title: null,
    sets: [
      { label: null, citation: "Jas 1:1-11 / Ps 119:67, 68, 71, 72, 75, 76 / Mk 8:11-13", response: "Be kind to me, Lord, and I shall live." },
    ],
  },
  "2026-02-17": {
    title: null,
    sets: [
      { label: null, citation: "Jas 1:12-18 / Ps 94:12-13a, 14-15, 18-19 / Mk 8:14-21", response: "Blessed the man you instruct, O Lord." },
    ],
  },
  "2026-02-18": {
    title: "ASH WEDNESDAY",
    sets: [
      { label: null, citation: "Jl 2:12-18 / Ps 51:3-4, 5-6ab, 12-13, 14 and 17 / 2 Cor 5:20-6:2 / Mt 6:1-6,16-18", response: "Be merciful, O Lord, for we have sinned." },
    ],
  },
  "2026-02-19": {
    title: null,
    sets: [
      { label: null, citation: "Dt 30:15-20 / Ps 1:1-2, 3, 4 and 6 / Lk 9:22-25", response: "Blessed are they who hope in the Lord." },
    ],
  },
  "2026-02-20": {
    title: null,
    sets: [
      { label: null, citation: "Is 58:1-9a / Ps 51:3-4, 5-6ab, 18-19 / Mt 9:14-15", response: "A heart contrite and humbled, O God, you will not spurn." },
    ],
  },
  "2026-02-21": {
    title: null,
    sets: [
      { label: null, citation: "Is 58:9b-14 / Ps 86:1-2, 3-4, 5-6 / Lk 5:27-32", response: "Teach me your way, O Lord, that I may walk in your truth." },
    ],
  },
  "2026-02-22": {
    title: "1st SUNDAY OF LENT",
    sets: [
      { label: null, citation: "Gn 2:7-9; 3:1-7 / Ps 51:3-4, 5-6, 12-13, 17 / Rom 5:12-19 or 5:12, 17-19 / Mt 4:1-11", response: "Be merciful, O Lord, for we have sinned." },
    ],
  },
  "2026-02-23": {
    title: null,
    sets: [
      { label: null, citation: "Lv 19:1-2, 11-18 / Ps 19:8, 9, 10, 15 / Mt 25:31-46", response: "Your words, Lord, are Spirit and life." },
    ],
  },
  "2026-02-24": {
    title: null,
    sets: [
      { label: null, citation: "Is 55:10-11 / Ps 34:4-5, 6-7, 16-17, 18-19 / Mt 6:7-15", response: "From all their distress God rescues the just." },
    ],
  },
  "2026-02-25": {
    title: null,
    sets: [
      { label: null, citation: "Jon 3:1-10 / Ps $1:3-4, 12-13, 18-19 / Lk 11:29-32", response: "A heart contrite and humbled, O God, you will not spurn." },
    ],
  },
  "2026-02-26": {
    title: null,
    sets: [
      { label: null, citation: "Est C:12, 14-16, 23-25 / Ps 130:1-2ab, 2cde-3, 7c-8 / Mt 7:7-12", response: "Lord, on the day I called for help, you answered me." },
    ],
  },
  "2026-02-27": {
    title: null,
    sets: [
      { label: null, citation: "Ez 18:21-28 / Ps 130:1-2, 3-4, 5-7a, 7bc-8 / Mt 5:20-26", response: "If you, O Lord, mark iniquities, who can stand?" },
    ],
  },
  "2026-02-28": {
    title: null,
    sets: [
      { label: null, citation: "Dt 26:16-19 / Ps 119:1-2, 4-5, 7-8 / Mt 5:43-48", response: "Blessed are they who follow the law of the Lord!" },
    ],
  },
  "2026-03-01": {
    title: "2nd SUNDAY OF LENT",
    sets: [
      { label: null, citation: "Gn 12:1-4a / Ps 33:4-5, 18-19, 20, 22 / 2 Tm 1:8b-10 / Mt 17:1-9", response: "Lord, let your mercy be on us, as we place our trust in you." },
    ],
  },
  "2026-03-02": {
    title: null,
    sets: [
      { label: null, citation: "Dn9:4b-10 / Ps 79:8, 9, 11 and 13 / Lk 6:36-38", response: "Lord, do not deal with us according to our sins." },
    ],
  },
  "2026-03-03": {
    title: null,
    sets: [
      { label: null, citation: "Is 1:10, 16-20 / Ps 50:8-9, 16bc-17, 21 and 23 / Mt 23:1-12", response: "To the upright I will show the saving power of God." },
    ],
  },
  "2026-03-04": {
    title: null,
    sets: [
      { label: null, citation: "Jer 18:18-20 / Ps 31:5-6, 14, 15-16 / Mt 20:17-28", response: "Save me, O Lord, in your kindness." },
    ],
  },
  "2026-03-05": {
    title: null,
    sets: [
      { label: null, citation: "Jer 17:5-10 / Ps 1:1-2, 3, 4 and 6 / Lk 16:19-31", response: "Blessed are they who hope in the Lord." },
    ],
  },
  "2026-03-06": {
    title: null,
    sets: [
      { label: null, citation: "Gn 37:3-4, 12-13a, 17b-28a / Ps 105:16-17, 18-19, 20-21 / Mt 21:33-43, 45-46", response: "Remember the marvels the Lord has done." },
    ],
  },
  "2026-03-07": {
    title: null,
    sets: [
      { label: null, citation: "Mi 7:14-15, 18-20 / Ps 103:1-2, 3-4, 9-10, 11-12 / Lk 15:1-3, 11-32", response: "The Lord is kind and merciful." },
    ],
  },
  "2026-03-08": {
    title: "3rd SUNDAY OF LENT",
    sets: [
      { label: null, citation: "Ex 17:3-7 / Ps 95:1-2, 6-7, 8-9 / Rom 5:1-2, 5-8 / Jn 4:5-42", response: "If today you hear his voice, harden not your hearts." },
    ],
  },
  "2026-03-09": {
    title: null,
    sets: [
      { label: null, citation: "2 Kgs 5:1-15b / Ps 42:2, 3; 43:3, 4 / Lk 4:24-30", response: "Athirst is my soul for the living God. When shall I go and behold the face of God?" },
    ],
  },
  "2026-03-10": {
    title: null,
    sets: [
      { label: null, citation: "Dn 3:25, 34-43 / Ps 25:4-5ab, 6 and 7bc, 8 and 9 / Mt 18:21-35", response: "Remember your mercies, O Lord." },
    ],
  },
  "2026-03-11": {
    title: null,
    sets: [
      { label: null, citation: "Dt 4:1, 5-9 / Ps 147:12-13, 15-16, 19-20 / Mt 5:17-19", response: "Praise the Lord, Jerusalem." },
    ],
  },
  "2026-03-12": {
    title: null,
    sets: [
      { label: null, citation: "Jer 7:23-28 / Ps 95:1-2, 6-7, 8-9 / Lk 11:14-23", response: "If today you hear his voice, harden not your hearts." },
    ],
  },
  "2026-03-13": {
    title: null,
    sets: [
      { label: null, citation: "Hos 14:2-10 / Ps 81:6c-8a, 8bc-9, 10-11ab, 14 and 17 / Mk 12:28-34", response: "I am the Lord your God: hear my voice." },
    ],
  },
  "2026-03-14": {
    title: null,
    sets: [
      { label: null, citation: "Hos 6:1-6 / Ps 51:3-4, 18-19, 20-21ab / Lk 18:9-14", response: "It is mercy I desire, and not sacrifice." },
    ],
  },
  "2026-03-15": {
    title: "4th SUNDAY OF LENT",
    sets: [
      { label: null, citation: "1 Sm 16:1b, 6-7, 10-13a / Ps 23:1-3a, 3b-4, 5, 6 / Eph 5:8-14 / Jn 9:1-41", response: "The Lord is my shepherd; there is nothing I shall want." },
    ],
  },
  "2026-03-16": {
    title: null,
    sets: [
      { label: null, citation: "Is 65:17-21 / Ps 30:2 and 4, 5-6, 11-12a and 13b / Jn 4:43-54", response: "I will praise you, Lord, for you have rescued me." },
    ],
  },
  "2026-03-17": {
    title: null,
    sets: [
      { label: null, citation: "Ez 47:1-9, 12 / Ps 46:2-3, 5-6, 8-9 / Jn 5:1-16", response: "The Lord of hosts is with us; our stronghold is the God of Jacob." },
    ],
  },
  "2026-03-18": {
    title: null,
    sets: [
      { label: null, citation: "Is 49:8-15 / Ps 145:8-9, 13cd-14, 17-18 / Jn 5:17-30", response: "The Lord is gracious and merciful." },
    ],
  },
  "2026-03-19": {
    title: "JOSEPH, HUSBAND OF MARY",
    sets: [
      { label: null, citation: "2 Sm 7:4-5a, 12-14a, 16 / Ps 89:2-3, 4-5, 27 and 29 / Rom 4:13, 16-18, 22 / Mt 1:16, 18-21, 24a or Lk 2:41-51a", response: "The son of David will live for ever." },
    ],
  },
  "2026-03-20": {
    title: null,
    sets: [
      { label: null, citation: "Wis 2:1a, 12-22 / Ps 34:17-18, 19-20, 21 and 23 / Jn 7:1-2, 10, 25-30", response: "The Lord is close to the brokenhearted." },
    ],
  },
  "2026-03-21": {
    title: null,
    sets: [
      { label: null, citation: "Jer 11:18-20 / Ps 7:2-3, 9bc-10, 11-12 / Jn 7:40-53", response: "O Lord, my God, in you I take refuge." },
    ],
  },
  "2026-03-22": {
    title: "5th SUNDAY OF LENT",
    sets: [
      { label: null, citation: "Ez 37:12-14 / Ps 130:1-2, 3-4, 5-6, 7-8 / Rom 8:8-11 / Jn 11:1-45", response: "With the Lord there is mercy and fullness of redemption." },
    ],
  },
  "2026-03-23": {
    title: null,
    sets: [
      { label: null, citation: "Dn 13:1-9, 15-17, 19-30, 33-62 or 13:41c-62 / Ps 23:1-3a, 3b-4, 5, 6 / Jn 8:1-11", response: "Even though I walk in the dark valley I fear no evil; for you are at my side." },
    ],
  },
  "2026-03-24": {
    title: null,
    sets: [
      { label: null, citation: "Nm 21:4-9 / Ps 102:2-3, 16-18, 19-21 / Jn 8:21-30", response: "O Lord, hear my prayer, and let my cry come to you." },
    ],
  },
  "2026-03-25": {
    title: "ANNUNCIATION OF THE LORD",
    sets: [
      { label: null, citation: "Is 7:10-14; 8:10 / Ps 40:7-8a, 8b-9, 10, 11 / Heb 10:4-10 / Lk 1:26-38", response: "Here I am, Lord; I come to do your will." },
    ],
  },
  "2026-03-26": {
    title: null,
    sets: [
      { label: null, citation: "Gn 17:3-9 / Ps 105:4-5, 6-7, 8-9 / Jn 8:51-59", response: "The Lord remembers his covenant for ever." },
    ],
  },
  "2026-03-27": {
    title: null,
    sets: [
      { label: null, citation: "Jer 20:10-13 / Ps 18:2-3a, 3bc-4, 5-6, 7 / Jn 10:31-42", response: "In my distress I called upon the Lord, and he heard my voice." },
    ],
  },
  "2026-03-28": {
    title: null,
    sets: [
      { label: null, citation: "Ez 37:21-28 / Jer 31:10, 11-12abcd, 13 / Jn 11:45-56", response: "In my distress I called upon the Lord, and he heard my voice." },
    ],
  },
  "2026-03-29": {
    title: "PALM SUNDAY OF THE LORD'S PASSION",
    sets: [
      { label: "Procession", citation: "Mt 21:1-11, Mass: Is 50:4-7 / Ps 22:8-9, 17-18, 19-20, 23-24 / Phil 2:6-11 / Mt 26:14-27:66", response: "My God, my God, why have you abandoned me?" },
    ],
  },
  "2026-03-30": {
    title: null,
    sets: [
      { label: null, citation: "Is 42:1-7 / Ps 27:1, 2, 3, 13-14 / Jn 12:1-11", response: "The Lord is my light and my salvation." },
    ],
  },
  "2026-03-31": {
    title: null,
    sets: [
      { label: null, citation: "Is 49:1-6 / Ps 71:1-2, 3-4a, 5ab-6ab, 15 and 17 / Jn 13:21-33, 36-38", response: "I will sing of your salvation. PRP 2 Ga a neers" },
    ],
  },
  "2026-04-01": {
    title: null,
    sets: [
      { label: null, citation: "Is 50:4-9a / Ps 69:8-10, 21-22, 31 and 33-34 / Mt 26:14-25", response: "Lord, in your great love, answer me." },
    ],
  },
  "2026-04-02": {
    title: null,
    sets: [
      { label: "Evening Mass of the Lord’s Supper", citation: "Ex 12:1-8, 11-14 / Ps 116:12-13, 15-16bc, 17-18 / 1 Cor 11:23-26 / Jn 13:1-15", response: "Our blessing-cup is a communion with the Blood of Christ." },
    ],
  },
  "2026-04-03": {
    title: null,
    sets: [
      { label: "Celebration of the Lord’s Passion", citation: "Is 52:13-53:12 / Ps 31:2, 6, 12-13, 15-16, 17, 25 / Heb 4:14-16; 5:7-9 / Jn 18:1-19:42", response: "Father, into your hands I commend my spirit." },
    ],
  },
  "2026-04-04": {
    title: null,
    sets: [
      { label: "Easter Vigil", citation: "Gn 1:1-2:2 or 1:1, 26-31a / Ps 104:1-2, 5-6, 10, 12, 13-14, 24, 35 or Ps 33:4-5, 6-7, 12-13, 20-22 / Gn 22:1-18 or 22:1-2, 9a, 10-13, 15-18 / Ps 16:5, 8, 9-10, 11 / Ex 14:15-15:1 / Ex 15:1-2, 3-4, 5-6, 17-18 / Is 54:5-14 / Ps 30:2, 4, 5-6, 11-12, 13 / Is 55:1-11 / Is 12:2-3, 4, 5-6 / Bar 3:9-15, 32-4:4 / Ps 19:8, 9, 10, 11 / Ez 36:16-17a, 18-28 / Ps 42:3, 5; 43:3, 4 or Is 12:2-3, 4bcd, 5-6 or Ps 51:12-13, 14-15, 18-19 / Rom 6:3-11 / Ps 118:1-2, 16-17, 22-23 / Mt 28:1-10", response: "Lord, send out your Spirit, and renew the face of the earth." },
    ],
  },
  "2026-04-05": {
    title: "EASTER SUNDAY. The Resurrection of the Lord",
    sets: [
      { label: null, citation: "Acts 10:34a, 37-43 / Ps 118:1-2, 16-17, 22-23 / Col 3:1-4 or 1 Cor 5:6b-8 / Jn 20:1-9 or Mt 28:1-10 or, at an afternoon or evening Mass, Lk 24:13-35", response: "This is the day the Lord has made; let us rejoice and be glad." },
    ],
  },
  "2026-04-06": {
    title: null,
    sets: [
      { label: null, citation: "Acts 2:14, 22-33 / Ps 16:1-2a and 5, 7-8, 9-10, 11 / Mt 28:8-15", response: "Keep me safe, O God; you are my hope." },
    ],
  },
  "2026-04-07": {
    title: null,
    sets: [
      { label: null, citation: "Acts 2:36-41 / Ps 33:4-5, 18-19, 20 and 22 / Jn 20:11-18", response: "The earth is full of the goodness of the Lord." },
    ],
  },
  "2026-04-08": {
    title: null,
    sets: [
      { label: null, citation: "Acts 3:1-10 / Ps 105:1-2, 3-4, 6-7, 8-9 / Lk 24:13-35", response: "Rejoice, O hearts that seek the Lord." },
    ],
  },
  "2026-04-09": {
    title: null,
    sets: [
      { label: null, citation: "Acts 3:11-26 / Ps 8:2ab and 5, 6-7, 8-9 / Lk 24:35-48", response: "O Lord, our God, how wonderful your name in all the earth!" },
    ],
  },
  "2026-04-10": {
    title: null,
    sets: [
      { label: null, citation: "Acts 4:1-12 / Ps 118:1-2 and 4, 22-24, 25-27a / Jn 21:1-14", response: "The stone rejected by the builders has become the cornerstone." },
    ],
  },
  "2026-04-11": {
    title: null,
    sets: [
      { label: null, citation: "Acts 4:13-21 / Ps 118:1 and 14-15ab, 16-18, 19-21 / Mk 16:9-15", response: "I will give thanks to you, for you have answered me." },
    ],
  },
  "2026-04-12": {
    title: "2nd SUNDAY OF EASTER",
    sets: [
      { label: null, citation: "Acts 2:42-47 / Ps 118:2-4, 13-15, 22-24 / 1 Pt 1:3-9 / Jn 20:19-31", response: "Give thanks to the LORD for he is good, his love is everlasting." },
    ],
  },
  "2026-04-13": {
    title: null,
    sets: [
      { label: null, citation: "Acts 4:23-31 / Ps 2:1-3, 4-7a, 7b-9 / Jn 3:1-8", response: "Blessed are all who take refuge in the Lord." },
    ],
  },
  "2026-04-14": {
    title: null,
    sets: [
      { label: null, citation: "Acts 4:32-37 / Ps 93:1ab, 1cd-2, 5 / Jn 3:7b-15", response: "The Lord is king; he is robed in majesty." },
    ],
  },
  "2026-04-15": {
    title: null,
    sets: [
      { label: null, citation: "Acts 5:17-26 / Ps 34:2-3, 4-5, 6-7, 8-9 / Jn 3:16-21", response: "The Lord hears the cry of the poor." },
    ],
  },
  "2026-04-16": {
    title: null,
    sets: [
      { label: null, citation: "Acts 5:27-33 / Ps 34:2 and 9, 17-18, 19-20 / Jn 3:31-36", response: "The Lord hears the cry of the poor." },
    ],
  },
  "2026-04-17": {
    title: null,
    sets: [
      { label: null, citation: "Acts 5:34-42 / Ps 27:1, 4, 13-14 / Jn 6:1-15", response: "One thing I seek: to dwell in the house of the Lord." },
    ],
  },
  "2026-04-18": {
    title: null,
    sets: [
      { label: null, citation: "Acts 6:1-7 / Ps 33:1-2, 4-5, 18-19 / Jn 6:16-21", response: "Lord, let your mercy be on us, as we place our trust in you." },
    ],
  },
  "2026-04-19": {
    title: "3rd SUNDAY OF EASTER",
    sets: [
      { label: null, citation: "Acts 2:14, 22-33 / Ps 16:1-2, 5, 7-8, 9-10, 11 / 1 Pt 1:17-21 / Lk 24:13-35", response: "Lord, you will show us the path of life." },
    ],
  },
  "2026-04-20": {
    title: null,
    sets: [
      { label: null, citation: "Acts 6:8-15 / Ps 119:23-24, 26-27, 29-30 / Jn 6:22-29", response: "Blessed are they who follow the law of the Lord!" },
    ],
  },
  "2026-04-21": {
    title: null,
    sets: [
      { label: null, citation: "Acts 7:51-8:1a / Ps 31:3cd-4, 6 and 7b and 8a, 17 and 21ab / Jn 6:30-35", response: "Into your hands, O Lord, I commend my spirit." },
    ],
  },
  "2026-04-22": {
    title: null,
    sets: [
      { label: null, citation: "Acts 8:1b-8 / Ps 66:1-3a, 4-5, 6-7a / Jn 6:35-40", response: "Let all the earth cry out to God with joy." },
    ],
  },
  "2026-04-23": {
    title: null,
    sets: [
      { label: null, citation: "Acts 8:26-40 / Ps 66:8-9, 16-17, 20 / Jn 6:44-51", response: "Let all the earth cry out to God with joy." },
    ],
  },
  "2026-04-24": {
    title: null,
    sets: [
      { label: null, citation: "Acts 9:1-20 / Ps 117:1bc, 2 / Jn 6:52-59", response: "Go out to all the world and tell the Good News." },
    ],
  },
  "2026-04-25": {
    title: null,
    sets: [
      { label: null, citation: "1 Pt 5:5b-14 / Ps 89:2-3, 6-7, 16-17 / Mk 16:15-20", response: "For ever I will sing the goodness of the Lord." },
    ],
  },
  "2026-04-26": {
    title: "4th SUNDAY OF EASTER",
    sets: [
      { label: null, citation: "Acts 2:14a, 36-41 / Ps 23:1-3a, 3b-4, 5, 6 / 1 Pt 2:20b-25 / Jn 10:1-10", response: "The Lord is my shepherd; there is nothing I shall want." },
    ],
  },
  "2026-04-27": {
    title: null,
    sets: [
      { label: null, citation: "Acts 11:1-18 / Ps 42:2-3; 43:3-4 / Jn 10:11-18", response: "Athirst is my soul for the living God." },
    ],
  },
  "2026-04-28": {
    title: null,
    sets: [
      { label: null, citation: "Acts 11:19-26 / Ps 87:1b-3, 4-5, 6-7 / Jn 10:22-30", response: "All you nations, praise the Lord." },
    ],
  },
  "2026-04-29": {
    title: null,
    sets: [
      { label: null, citation: "Acts 12:24-13:5a / Ps 67:2-3, 5, 6 and 8 / Jn 12:44-50", response: "O God, let all the nations praise you!" },
    ],
  },
  "2026-04-30": {
    title: null,
    sets: [
      { label: null, citation: "Acts 13:13-25 / Ps 89:2-3, 21-22, 25 and 27 / Jn 13:16-20", response: "For ever I will sing the goodness of the Lord." },
    ],
  },
  "2026-05-01": {
    title: null,
    sets: [
      { label: null, citation: "Acts 13:26-33 / Ps 2:6-7, 8-9, 10-11ab / Jn 14:1-6", response: "You are my Son; this day I have begotten you." },
    ],
  },
  "2026-05-02": {
    title: null,
    sets: [
      { label: null, citation: "Acts 13:44-52 / Ps 98:1, 2-3ab, 3cd-4 / Jn 14:7-14", response: "All the ends of the earth have seen the saving power of God." },
    ],
  },
  "2026-05-03": {
    title: "5th SUNDAY OF EASTER",
    sets: [
      { label: null, citation: "Acts 6:1-7 / Ps 33:1-2, 4-5, 18-19 / 1 Pt 2:4-9 / Jn 14:1-12", response: "Lord, let your mercy be on us, as we place our trust in you." },
    ],
  },
  "2026-05-04": {
    title: null,
    sets: [
      { label: null, citation: "Acts 14:5-18 / Ps 115:1-2, 3-4, 15-16 / Jn 14:21-26", response: "Not to us, O Lord, but to your name give the glory." },
    ],
  },
  "2026-05-05": {
    title: null,
    sets: [
      { label: null, citation: "Acts 14:19-28 / Ps 145:10-11, 12-13ab, 21 / Jn 14:27-31a", response: "Your friends make known, O Lord, the glorious splendor of your kingdom." },
    ],
  },
  "2026-05-06": {
    title: null,
    sets: [
      { label: null, citation: "Acts 15:1-6 / Ps 122:1-2, 3-4ab, 4cd-5 / Jn 15:1-8", response: "Let us go rejoicing to the house of the Lord." },
    ],
  },
  "2026-05-07": {
    title: null,
    sets: [
      { label: null, citation: "Acts 15:7-21 / Ps 96:1-2a, 2b-3, 10 / Jn 15:9-11", response: "Proclaim God’s marvelous deeds to all the nations." },
    ],
  },
  "2026-05-08": {
    title: null,
    sets: [
      { label: null, citation: "Acts 15:22-31 / Ps 57:8-9, 10 and 12 / Jn 15:12-17", response: "I will give you thanks among the peoples, O Lord." },
    ],
  },
  "2026-05-09": {
    title: null,
    sets: [
      { label: null, citation: "Acts 16:1-10 / Ps 100:1b-2, 3, 5 / Jn 15:18-21", response: "Let all the earth cry out to God with joy." },
    ],
  },
  "2026-05-10": {
    title: "6th SUNDAY OF EASTER",
    sets: [
      { label: null, citation: "Acts 8:5-8, 14-17 / Ps 66:1-3, 4-5, 6-7, 16, 20 / 1 Pt 3:15-18 / Jn 14:15-21", response: "Let all the earth cry out to God with joy." },
    ],
  },
  "2026-05-11": {
    title: null,
    sets: [
      { label: null, citation: "Acts 16:11-15 / Ps 149:1b-2, 3-4, 5-6a and 9b / Jn 15:26-16:4a", response: "The Lord takes delight in his people." },
    ],
  },
  "2026-05-12": {
    title: null,
    sets: [
      { label: null, citation: "Acts 16:22-34 / Ps 138:1-2ab, 2cde-3, 7c-8 / Jn 16:5-11", response: "Your right hand saves me, O Lord." },
    ],
  },
  "2026-05-13": {
    title: null,
    sets: [
      { label: null, citation: "Acts 17:15, 22-18:1 / Ps 148:1-2, 11-12, 13, 14 / Jn 16:12-15", response: "Heaven and earth are full of your glory." },
    ],
  },
  "2026-05-14": {
    title: null,
    sets: [
      { label: null, citation: "Acts 1:15-17, 20-26 / Ps 113:1-2, 3-4, 5-6, 7-8 / Jn 15:9-17", response: "The Lord will give him a seat with the leaders of his people." },
    ],
  },
  "2026-05-15": {
    title: null,
    sets: [
      { label: null, citation: "Acts 18:9-18 / Ps 47:2-3, 4-5, 6-7 / Jn 16:20-23", response: "God is king of all the earth." },
    ],
  },
  "2026-05-16": {
    title: null,
    sets: [
      { label: null, citation: "Acts 18:23-28 / Ps 47:2-3, 8-9, 10 / Jn 16:23b-28", response: "God is king of all the earth." },
    ],
  },
  "2026-05-17": {
    title: "ASCENSION OF THE LORD",
    sets: [
      { label: null, citation: "Acts 1:1-11 / Ps 47:2-3, 6-7, 8-9 / Eph 1:17-23 / Mt 28:16-20", response: "God mounts his throne to shouts of joy: a blare of trumpets for the Lord." },
    ],
  },
  "2026-05-18": {
    title: null,
    sets: [
      { label: null, citation: "Acts 19:1-8 / Ps 68:2-3ab, 4-5acd, 6-7ab / Jn 16:29-33", response: "Sing to God, O kingdoms of the earth." },
    ],
  },
  "2026-05-19": {
    title: null,
    sets: [
      { label: null, citation: "Acts 20:17-27 / Ps 68:10-11, 20-21 / Jn 17:1-11a", response: "Sing to God, O kingdoms of the earth." },
    ],
  },
  "2026-05-20": {
    title: null,
    sets: [
      { label: null, citation: "Acts 20:28-38 / Ps 68:29-30, 33-35a, 35bc-36ab / Jn 17:11b-19", response: "Sing to God, O kingdoms of the earth." },
    ],
  },
  "2026-05-21": {
    title: null,
    sets: [
      { label: null, citation: "Acts 22:30; 23:6-11 / Ps 16:1-2a and 5, 7-8, 9-10, 11 / Jn 17:20-26", response: "Keep me safe, O God; you are my hope." },
    ],
  },
  "2026-05-22": {
    title: null,
    sets: [
      { label: null, citation: "Acts 25:13b-21 / Ps 103:1-2, 11-12, 19-20ab / Jn 21:15-19", response: "The Lord has established his throne in heaven." },
    ],
  },
  "2026-05-23": {
    title: null,
    sets: [
      { label: null, citation: "Acts 28:16-20, 30-31 / Ps 11:4, 5 and 7 / Jn 21:20-25", response: "The just will gaze on your face, O Lord." },
    ],
  },
  "2026-05-24": {
    title: "PENTECOST S",
    sets: [
      { label: "Vigil", citation: "Gn 11:1-9 or Ex 19:3-8a, 16-20b or Ez 37:1-4 or J13:1-5 / Ps 104:1-2, 24, 35, 27-28, 29, 30 / Rom 8:22-27 / Jn 7:37-39, Day: Acts 2:1-11 / Ps 104:1, 24, 29-30, 31, 34 / 1 Cor 12:3b-7, 12-13 / Jn 20:19-23", response: "Lord, send out your Spirit, and renew the face of the earth." },
    ],
  },
  "2026-05-25": {
    title: "Mary, Mother of the Church",
    sets: [
      { label: null, citation: "Gn 3:9-15, 20 or Acts 1:12-14 / Ps 87:1-2, 3 and 5, 6-7 / Jn 19:25-34", response: "Glorious things are said of you, O city of God!" },
    ],
  },
  "2026-05-26": {
    title: null,
    sets: [
      { label: null, citation: "1 Pt 1:10-16 / Ps 98:1, 2-3ab, 3cd-4 / Mk 10:28-31", response: "The Lord has made known his salvation." },
    ],
  },
  "2026-05-27": {
    title: null,
    sets: [
      { label: null, citation: "1 Pt 1:18-25 / Ps 147:12-13, 14-15, 19-20 / Mk 10:32-45", response: "Praise the Lord, Jerusalem." },
    ],
  },
  "2026-05-28": {
    title: null,
    sets: [
      { label: null, citation: "1 Pt 2:2-5, 9-12 / Ps 100:2, 3, 4, 5 / Mk 10:46-52", response: "Come with joy into the presence of the Lord." },
    ],
  },
  "2026-05-29": {
    title: null,
    sets: [
      { label: null, citation: "1 Pt 4:7-13 / Ps 96:10, 11-12, 13 / Mk 11:11-26", response: "The Lord comes to judge the earth." },
    ],
  },
  "2026-05-30": {
    title: null,
    sets: [
      { label: null, citation: "Jude 17, 20b-25 / Ps 63:2, 3-4, 5-6 / Mk 11:27-33", response: "My soul is thirsting for you, O Lord my God." },
    ],
  },
  "2026-05-31": {
    title: "THE HOLY TRINITY",
    sets: [
      { label: null, citation: "Ex 34:4b-6, 8-9 / Dn 3:52, 53, 54, 55, 56 / 2 Cor 13:11-13 / Jn 3:16-18", response: "Glory and praise for ever! OS I O10 > eee" },
    ],
  },
  "2026-06-01": {
    title: null,
    sets: [
      { label: null, citation: "2 Pt 1:2-7 / Ps 91:1-2, 14-15b, 15c-16 / Mk 12:1-12", response: "In you, my God, I place my trust." },
    ],
  },
  "2026-06-02": {
    title: null,
    sets: [
      { label: null, citation: "2 Pt3:12-15a, 17-18 / Ps 90:2, 3-4, 10, 14 and 16 / Mk 12:13-17", response: "In every age, O Lord, you have been our refuge." },
    ],
  },
  "2026-06-03": {
    title: null,
    sets: [
      { label: null, citation: "2Tm1:1-3, 6-12 / Ps 123:1b-2ab, 2cdef / Mk 12:18-27", response: "To you, O Lord, I lift up my eyes." },
    ],
  },
  "2026-06-04": {
    title: null,
    sets: [
      { label: null, citation: "2 Tm 2:8-15 / Ps 25:4-5ab, 8-9, 10 and 14 / Mk 12:28-34", response: "Teach me your ways, O Lord." },
    ],
  },
  "2026-06-05": {
    title: null,
    sets: [
      { label: null, citation: "2Tm3:10-17 / Ps 119:157, 160, 161, 165, 166, 168 / Mk 12:35-37", response: "O Lord, great peace have they who love your law." },
    ],
  },
  "2026-06-06": {
    title: null,
    sets: [
      { label: null, citation: "2Tm4:1-8 / Ps 71:8-9, 14-15ab, 16-17, 22 / Mk 12:38-44", response: "! will sing of your salvation." },
    ],
  },
  "2026-06-07": {
    title: "10th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Dt 8:2-3, 14b-16a / Ps 147:12-13, 14-15, 19-20 / 1 Cor 10:16-17 / Jn 6:51-58", response: "Praise the Lord, Jerusalem." },
    ],
  },
  "2026-06-08": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 17:1-6 / Ps 121:1bc-2, 3-4, 5-6, 7-8 / Mt 5:1-12", response: "Our help is from the Lord, who made heaven and earth." },
    ],
  },
  "2026-06-09": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 17:7-16 / Ps 4:2-3, 4-5, 7b-8 / Mt 5:13-16", response: "Lord, let your face shine on us." },
    ],
  },
  "2026-06-10": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 18:20-39 / Ps 16:1b-2ab, 4, 5ab and 8, 11 / Mt 5:17-19", response: "Keep me safe, O God; you are my hope." },
    ],
  },
  "2026-06-11": {
    title: null,
    sets: [
      { label: null, citation: "Acts 11:21b-26; 13:1-3 / Ps 98:1, 2-3ab, 3cd-4, 5-6 / Mt 5:20-26", response: "The Lord has revealed to the nations his saving power." },
    ],
  },
  "2026-06-12": {
    title: null,
    sets: [
      { label: null, citation: "Dt 7:6-11 / Ps 103:1-2, 3-4, 6-7, 8,10 / 1 Jn 4:7-16 / Mt 11:25-30", response: "The Lord's kindness is everlasting to those who fear him." },
    ],
  },
  "2026-06-13": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 19:19-21 / Ps 16:1b-2a and 5, 7-8, 9-10 / Mt 5:33-37", response: "You are my inheritance, O Lord." },
    ],
  },
  "2026-06-14": {
    title: "11th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Ex 19:2-6a / Ps 100:1-2, 3, 5 / Rom 5:6-11 / Mt 9:36-10:8", response: "We are his people: the sheep of his flock." },
    ],
  },
  "2026-06-15": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 21:1-16 / Ps 5:2-3ab, 4b-6a, 6b-7 / Mt 12:38-42", response: "Lord, listen to my groaning." },
    ],
  },
  "2026-06-16": {
    title: null,
    sets: [
      { label: null, citation: "1 Kgs 21:17-29 / Ps 51:3-4, 5-6ab, 11 and 16 / Mt 5:43-48", response: "Be merciful, O Lord, for we have sinned." },
    ],
  },
  "2026-06-17": {
    title: null,
    sets: [
      { label: null, citation: "2 Kgs 2:1, 6-14 / Ps 31:20, 21, 24 / Mt 6:1-6, 16-18", response: "Let your hearts take comfort, all who hope in the Lord." },
    ],
  },
  "2026-06-18": {
    title: null,
    sets: [
      { label: null, citation: "Sir 48:1-14 / Ps 97:1-2, 3-4, 5-6, 7 / Mt 6:7-15", response: "Rejoice in the Lord, you just!" },
    ],
  },
  "2026-06-19": {
    title: null,
    sets: [
      { label: null, citation: "2 Kgs 11:1-4, 9-18, 20 / Ps 132:11, 12, 13-14, 17-18 / Mt 6:19-23", response: "The Lord has chosen Zion for his dwelling." },
    ],
  },
  "2026-06-20": {
    title: null,
    sets: [
      { label: null, citation: "2 Chr 24:17-25 / Ps 89:4-5, 29-30, 31-32, 33-34 / Mt 6:24-34", response: "For ever I will maintain my love for my servant." },
    ],
  },
  "2026-06-21": {
    title: "12th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Jer 20:10-13 / Ps 69:8-10, 14, 17, 33-35 / Rom 5:12-15 / Mt 10:26-33", response: "Lord, in your great love, answer me." },
    ],
  },
  "2026-06-22": {
    title: null,
    sets: [
      { label: null, citation: "2 Kgs 17:5-8, 13-15a, 18 / Ps 60:3, 4-5, 12-13 / Mt 7:1-5", response: "Help us with your right hand, O Lord, and answer us." },
    ],
  },
  "2026-06-23": {
    title: null,
    sets: [
      { label: null, citation: "2 Kgs 19:9b-11, 14-21, 31-35a, 36 / Ps 48:2-3ab, 3cd-4, 10-11 / Mt 7:6, 12-14", response: "God upholds his city for ever." },
    ],
  },
  "2026-06-24": {
    title: null,
    sets: [
      { label: null, citation: "Is 49:1-6 / Ps 139:1b-3, 13-14ab, 14c-15 / Acts 13:22-26 / Lk 1:57-66, 80", response: "I praise you, for I am wonderfully made." },
    ],
  },
  "2026-06-25": {
    title: null,
    sets: [
      { label: null, citation: "2 Kgs 24:8-17 / Ps 79:1b-2, 3-5, 8, 9 / Mt 7:21-29", response: "For the glory of your name, O Lord, deliver us." },
    ],
  },
  "2026-06-26": {
    title: null,
    sets: [
      { label: null, citation: "2 Kgs 25:1-12 / Ps 137:1-2, 3, 4-5, 6 / Mt 8:1-4", response: "Let my tongue be silenced, if I ever forget you!" },
    ],
  },
  "2026-06-27": {
    title: null,
    sets: [
      { label: null, citation: "Lam 2:2, 10-14, 18-19 / Ps 74:1b-2, 3-5, 6-7, 20-21 / Mt 8:5-17", response: "Lord, forget not the souls of your poor ones." },
    ],
  },
  "2026-06-28": {
    title: "13th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "2 Kgs 4:8-11, 14-16a / Ps 89:2-3, 16-17, 18-19 / Rom 6:3-4, 8-11 / Mt 10:37-42", response: "Forever I will sing the goodness of the Lord." },
    ],
  },
  "2026-06-29": {
    title: null,
    sets: [
      { label: null, citation: "Acts 12:1-11 / Ps 34:2-3, 4-5, 6-7, 8-9 / 2 Tm 4:6-8, 17-18 / Mt 16:13-19", response: "The angel of the Lord will rescue those who fear him." },
    ],
  },
  "2026-06-30": {
    title: null,
    sets: [
      { label: null, citation: "Am 3:1-8; 4:11-12 / Ps 5:4b-6a, 6b-7, 8 / Mt 8:23-27", response: "Lead me in your justice, Lord." },
    ],
  },
  "2026-07-01": {
    title: null,
    sets: [
      { label: null, citation: "Am 5:14-15, 21-24 / Ps 50:7, 8-9, 10-11, 12-13, 16bc-17 / Mt 8:28-34", response: "To the upright I will show the saving power of God." },
    ],
  },
  "2026-07-02": {
    title: null,
    sets: [
      { label: null, citation: "Am 7:10-17 / Ps 19:8, 9, 10, 11 / Mt 9:1-8", response: "The judgments of the Lord are true, and all of them are just." },
    ],
  },
  "2026-07-03": {
    title: null,
    sets: [
      { label: null, citation: "Eph 2:19-22 / Ps 117:1bce, 2 / Jn 20:24-29", response: "Go out to all the world and tell the Good News." },
    ],
  },
  "2026-07-04": {
    title: null,
    sets: [
      { label: null, citation: "Am9:11-15 / Ps 85:9 and 10, 11-12, 13-14 / Mt 9:14-17", response: "The Lord speaks of peace to his people." },
    ],
  },
  "2026-07-05": {
    title: "14th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Zec 9:9-10 / Ps 145:1-2, 8-9, 10-11, 13-14 / Rom 8:9, 11-13 / Mt 11:25-30", response: "I will praise your name for ever, my king and my God." },
    ],
  },
  "2026-07-06": {
    title: null,
    sets: [
      { label: null, citation: "Hos 2:16, 17c-18, 21-22 / Ps 145:2-3, 4-5, 6-7, 8-9 / Mt 9:18-26", response: "The Lord is gracious and merciful." },
    ],
  },
  "2026-07-07": {
    title: null,
    sets: [
      { label: null, citation: "Hos 8:4-7, 11-13 / Ps 115:3-4, 5-6, 7ab-8, 9-10 / Mt 9:32-38", response: "The house of Israel trusts in the Lord." },
    ],
  },
  "2026-07-08": {
    title: null,
    sets: [
      { label: null, citation: "Hos 10:1-3, 7-8, 12 / Ps 105:2-3, 4-5, 6-7 / Mt 10:1-7", response: "Seek always the face of the Lord." },
    ],
  },
  "2026-07-09": {
    title: null,
    sets: [
      { label: null, citation: "Hos 11:1-4, 8e-9 / Ps 80:2ac, 3b, 15-16 / Mt 10:7-15", response: "Let us see your face, Lord, and we shall be saved." },
    ],
  },
  "2026-07-10": {
    title: null,
    sets: [
      { label: null, citation: "Hos 14:2-10 / Ps 51:3-4, 8-9, 12-13, 14, 17 / Mt 10:16-23", response: "My mouth will declare your praise." },
    ],
  },
  "2026-07-11": {
    title: null,
    sets: [
      { label: null, citation: "Is 6:1-8 / Ps 93:1ab, 1cd-2, 5 / Mt 10:24-33", response: "The Lord is king; he is robed in majesty." },
    ],
  },
  "2026-07-12": {
    title: "15th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 55:10-11 / Ps 65:10, 11, 12-13, 14 / Rom 8:18-23 / Mt 13:1-23", response: "The seed that falls on good ground will yield a fruitful harvest." },
    ],
  },
  "2026-07-13": {
    title: null,
    sets: [
      { label: null, citation: "Is 1:10-17 / Ps 50:8-9, 16bc-17, 21, 23 / Mt 10:34-11:1", response: "To the upright I will show the saving power of God." },
    ],
  },
  "2026-07-14": {
    title: null,
    sets: [
      { label: null, citation: "Is 7:1-9 / Ps 48:2-3a, 3b-4, 5-6, 7-8 / Mt 11:20-24", response: "God upholds his city for ever." },
    ],
  },
  "2026-07-15": {
    title: null,
    sets: [
      { label: null, citation: "Is 10:5-7, 13b-16 / Ps 94:5-6, 7-8, 9-10, 14-15 / Mt 11:25-27", response: "The Lord will not abandon his people." },
    ],
  },
  "2026-07-16": {
    title: null,
    sets: [
      { label: null, citation: "Is 26:7-9, 12, 16-19 / Ps 102:13-14ab and 15, 16-18, 19-21 / Mt 11:28-30", response: "From heaven the Lord looks down on the earth." },
    ],
  },
  "2026-07-17": {
    title: null,
    sets: [
      { label: null, citation: "Is 38:1-6, 21-22, 7-8 / Is 38:10, 11, 12abcd, 16 / Mt 12:1-8", response: "You saved my life, O Lord; I shall not die." },
    ],
  },
  "2026-07-18": {
    title: null,
    sets: [
      { label: null, citation: "Mi 2:1-5 / Ps 10:1-2, 3-4, 7-8, 14 / Mt 12:14-21", response: "Do not forget the poor, O Lord!" },
    ],
  },
  "2026-07-19": {
    title: "16th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Wis 12:13, 16-19 / Ps 86:5-6, 9-10, 15-16 / Rom 8:26-27 / Mt 13:24-43", response: "Lord, you are good and forgiving." },
    ],
  },
  "2026-07-20": {
    title: null,
    sets: [
      { label: null, citation: "Mi 6:1-4, 6-8 / Ps 50:5-6, 8-9, 16bc-17, 21, 23 / Mt 12:38-42", response: "To the upright I will show the saving power of God." },
    ],
  },
  "2026-07-21": {
    title: null,
    sets: [
      { label: null, citation: "Mi 7:14-15, 18-20 / Ps 85:2-4, 5-6, 7-8 / Mt 12:46-50", response: "Lord, show us your mercy and love." },
    ],
  },
  "2026-07-22": {
    title: null,
    sets: [
      { label: null, citation: "Song 3:1-4b or 2 Cor 5:14-17 / Ps 63:2, 3-4, 5-6, 8-9 / Jn 20:1-2, 11-18", response: "My soul is thirsting for you, O Lord my God." },
    ],
  },
  "2026-07-23": {
    title: null,
    sets: [
      { label: null, citation: "Jer 2:1-3, 7-8, 12-13 / Ps 36:6-7ab, 8-9, 10-11 / Mt 13:10-17", response: "With you is the fountain of life, O Lord." },
    ],
  },
  "2026-07-24": {
    title: null,
    sets: [
      { label: null, citation: "Jer 3:14-17 / Jer 31:10, 11-12abced, 13 / Mt 13:18-23", response: "The Lord will guard us as a shepherd guards his flock." },
    ],
  },
  "2026-07-25": {
    title: null,
    sets: [
      { label: null, citation: "2Cor4:7-15 / Ps 126:1bc-2ab, 2cd-3, 4-5, 6 / Mt 20:20-28", response: "Those who sow in tears shall reap rejoicing." },
    ],
  },
  "2026-07-26": {
    title: "17th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "1 Kgs 3:5, 7-12 / Ps 119:57, 72, 76-77, 127-128, 129-130 / Rom 8:28-30 / Mt 13:44-52 or Mt 13:44-46", response: "Lord, I love your commands." },
    ],
  },
  "2026-07-27": {
    title: null,
    sets: [
      { label: null, citation: "Jer 13:1-11 / Dt 32:18-19, 20, 21 / Mt 13:31-35", response: "You have forgotten God who gave you birth." },
    ],
  },
  "2026-07-28": {
    title: null,
    sets: [
      { label: null, citation: "Jer 14:17-22 / Ps 79:8, 9, 11 and 13 / Mt 13:36-43", response: "For the glory of your name, O Lord, deliver us." },
    ],
  },
  "2026-07-29": {
    title: null,
    sets: [
      { label: null, citation: "Jer 15:10, 16-21 / Ps 59:2-3, 4, 10-11, 17, 18 / Jn 11:19-27 or Lk 10:38-42", response: "God is my refuge on the day of distress." },
    ],
  },
  "2026-07-30": {
    title: null,
    sets: [
      { label: null, citation: "Jer 18:1-6 / Ps 146:1b-2, 3-4, 5-6ab / Mt 13:47-53", response: "Blessed is he whose help is the God of Jacob." },
    ],
  },
  "2026-07-31": {
    title: null,
    sets: [
      { label: null, citation: "Jer 26:1-9 / Ps 69:5, 8-10, 14 / Mt 13:54-58", response: "Lord, in your great love, answer me." },
    ],
  },
  "2026-08-01": {
    title: null,
    sets: [
      { label: null, citation: "Jer 26:11-16, 24 / Ps 69:15-16, 30-31, 33-34 / Mt 14:1-12", response: "Lord, in your great love, answer me." },
    ],
  },
  "2026-08-02": {
    title: "18th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 55:1-3 / Ps 145:8-9, 15-16, 17-18 / Rom 8:35, 37-39 / Mt 14:13-21", response: "The hand of the Lord feeds us; he answers all our needs." },
    ],
  },
  "2026-08-03": {
    title: null,
    sets: [
      { label: null, citation: "— Jer 28:1-17 / Ps 119:29, 43, 79, 80, 95, 102 / Mt 14:22-36", response: "Lord, teach me your statutes." },
    ],
  },
  "2026-08-04": {
    title: null,
    sets: [
      { label: null, citation: "Jer 30:1-2, 12-15, 18-22 / Ps 102:16-18, 19-21, 29, 22-23 / Mt 14:22-36", response: "The Lord will build up Zion again, and appear in all his glory." },
    ],
  },
  "2026-08-05": {
    title: null,
    sets: [
      { label: null, citation: "I Jer 31:1-7 / Jer 31:10, 11-12ab, 13 / Mt 15:21-28", response: "The Lord will guard us as a shepherd guards his flock." },
    ],
  },
  "2026-08-06": {
    title: null,
    sets: [
      { label: null, citation: "Dn 7:9-10, 13-14 / Ps 97:1-2, 5-6,9 / 2 Pt 1:16-19 / Mt 17:1-9", response: "The Lord is king, the Most High over all the earth." },
    ],
  },
  "2026-08-07": {
    title: null,
    sets: [
      { label: null, citation: "Na 2:1, 3; 3:1-3, 6-7 / Dt 32:35cd-36ab, 39abcd, 41 / Mt 16:24-28", response: "It is I who deal death and give life." },
    ],
  },
  "2026-08-08": {
    title: null,
    sets: [
      { label: null, citation: "Hb 1:12-2:4 / Ps 9:8-9, 10-11, 12-13 / Mt 17:14-20", response: "You forsake not those who seek you, O Lord." },
    ],
  },
  "2026-08-09": {
    title: "19th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "1 Kgs 19:9a, 11-13a / Ps 85:9, 10, 11-12, 13-14 / Rom 9:1-5 / Mt 14:22-33", response: "Lord, let us see your kindness, and grant us your salvation." },
    ],
  },
  "2026-08-10": {
    title: null,
    sets: [
      { label: null, citation: "2 Cor 9:6-10 / Ps 112:1-2, 5-6, 7-8, 9 / Jn 12:24-26", response: "Blessed the man who is gracious and lends to those in need." },
    ],
  },
  "2026-08-11": {
    title: null,
    sets: [
      { label: null, citation: "Ez 2:8-3:4 / Ps 119:14, 24, 72, 103, 111, 131 / Mt 18:1-5, 10, 12-14", response: "How sweet to my taste is your promise!" },
    ],
  },
  "2026-08-12": {
    title: null,
    sets: [
      { label: null, citation: "Ez 9:1-7; 10:18-22 / Ps 113:1-2, 3-4, 5-6 / Mt 18:15-20", response: "The glory of the Lord is higher than the skies." },
    ],
  },
  "2026-08-13": {
    title: null,
    sets: [
      { label: null, citation: "Ez 12:1-12 / Ps 78:56-57, 58-59, 61-62 / Mt 18:21-19:1", response: "Do not forget the works of the Lord!" },
    ],
  },
  "2026-08-14": {
    title: null,
    sets: [
      { label: null, citation: "Ez 16:1-15, 60, 63 or Ez 16:59-63 / Is 12:2-3, 4bcd, 5-6 / Mt 19:3-12", response: "You have turned from your anger." },
    ],
  },
  "2026-08-15": {
    title: "SOLEMNITY OF THE ASSUMPTION OF THE BLESSED VIRGIN MARY",
    sets: [
      { label: "Mass during the day", citation: "Rv 11:19a; 12:1-6a, 10ab / Ps 45:10, 11, 12, 16 / 1 Cor 15:20-27 / Lk 1:39-56", response: "The queen stands at your right hand, arrayed in gold." },
    ],
  },
  "2026-08-16": {
    title: "20th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 56:1, 6-7 / Ps 67:2-3, 5, 6, 8 / Rom 11:13-15, 29-32 / Mt 15:21-28", response: "O God, let all the nations praise you!" },
    ],
  },
  "2026-08-17": {
    title: null,
    sets: [
      { label: null, citation: "Ez 24:15-23 / Dt 32:18-19, 20, 21 / Mt 19:16-22", response: "You have forgotten God who gave you birth." },
    ],
  },
  "2026-08-18": {
    title: null,
    sets: [
      { label: null, citation: "Ez 28:1-10 / Dt 32:26-27ab, 27cd-28, 30, 35cd-36ab / Mt 19:23-30", response: "It is I who deal death and give life." },
    ],
  },
  "2026-08-19": {
    title: null,
    sets: [
      { label: null, citation: "Ez 34:1-11 / Ps 23:1-3a, 3b-4, 5, 6 / Mt 20:1-16", response: "The Lord is my shepherd; there is nothing I shall want." },
    ],
  },
  "2026-08-20": {
    title: null,
    sets: [
      { label: null, citation: "Ez 36:23-28 / Ps 51:12-13, 14-15, 18-19 / Mt 22:1-14", response: "I will pour clean water on you and wash away all your sins." },
    ],
  },
  "2026-08-21": {
    title: null,
    sets: [
      { label: null, citation: "Ez 37:1-14 / Ps 107:2-3, 4-5, 6-7, 8-9 / Mt 22:34-40", response: "Give thanks to the Lord; his love is everlasting." },
    ],
  },
  "2026-08-22": {
    title: null,
    sets: [
      { label: null, citation: "Ez 43:1-7ab / Ps 85:9ab, 10, 11-12, 13-14 / Mt 23:1-12", response: "The glory of the Lord will dwell in our land." },
    ],
  },
  "2026-08-23": {
    title: "21st SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 22:19-23 / Ps 138:1-2, 2-3, 6, 8 / Rom 11:33-36 / Mt 16:13-20", response: "Lord, your love is eternal; do not forsake the work of your hands." },
    ],
  },
  "2026-08-24": {
    title: null,
    sets: [
      { label: null, citation: "Rv 21:9b-14 / Ps 145:10-11, 12-13, 17-18 / Jn 1:45-51", response: "Your friends make known, O Lord, the glorious splendor of your Kingdom." },
    ],
  },
  "2026-08-25": {
    title: null,
    sets: [
      { label: null, citation: "2 Thes 2:1-3a, 14-17 / Ps 96:10, 11-12, 13 / Mt 23:23-26", response: "The Lord comes to judge the earth." },
    ],
  },
  "2026-08-26": {
    title: null,
    sets: [
      { label: null, citation: "2 Thes 3:6-10, 16-18 / Ps 128:1-2, 4-5 / Mt 23:27-32", response: "Blessed are those who fear the Lord." },
    ],
  },
  "2026-08-27": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 1:1-9 / Ps 145:2-3, 4-5, 6-7 / Mt 24:42-51", response: "I will praise your name for ever, Lord." },
    ],
  },
  "2026-08-28": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 1:17-25 / Ps 33:1-2, 4-5, 10-11 / Mt 25:1-13", response: "The earth is full of the goodness of the Lord." },
    ],
  },
  "2026-08-29": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 1:26-31 / Ps 33:12-13, 18-19, 20-21 / Mk 6:17-29", response: "Blessed the people the Lord has chosen to be his own." },
    ],
  },
  "2026-08-30": {
    title: "22nd SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Jer 20:7-9 / Ps 63:2, 3-4, 5-6, 8-9 / Rom 12:1-2 / Mt 16:21-27", response: "My soul is thirsting for you, O Lord my God." },
    ],
  },
  "2026-08-31": {
    title: null,
    sets: [
      { label: null, citation: "1Cor2:1-5 / Ps 119:97, 98, 99, 100, 101, 102 / Lk 4:16-30", response: "Lord, I love your commands." },
    ],
  },
  "2026-09-01": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 2:10b-16 / Ps 145:8-9, 10-11, 12-13ab, 13cd-14 / Lk 4:31-37", response: "The Lord is just in all his ways." },
    ],
  },
  "2026-09-02": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 3:1-9 / Ps 33:12-13, 14-15, 20-21 / Lk 4:38-44", response: "Blessed the people the Lord has chosen to be his own." },
    ],
  },
  "2026-09-03": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 3:18-23 / Ps 24:1bc-2, 3-4ab, 5-6 / Lk 5:1-11", response: "To the Lord belongs the earth and all that fills it." },
    ],
  },
  "2026-09-04": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 4:1-5 / Ps 37:3-4, 5-6, 27-28, 39-40 / Lk 5:33-39", response: "The salvation of the just comes from the Lord." },
    ],
  },
  "2026-09-05": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 4:6b-15 / Ps 145:17-18, 19-20, 21 / Lk 6:1-5", response: "The Lord is near to all who call upon him." },
    ],
  },
  "2026-09-06": {
    title: "23rd SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Ez 33:7-9 / Ps 95:1-2, 6-7, 8-9 / Rom 13:8-10 / Mt 18:15-20", response: "If today you hear his voice, harden not your hearts." },
    ],
  },
  "2026-09-07": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 5:1-8 / Ps 5:5-6, 7, 12 / Lk 6:6-11", response: "Lead me in your justice, Lord." },
    ],
  },
  "2026-09-08": {
    title: null,
    sets: [
      { label: null, citation: "Mi 5:1-4a or Rom 8:28-30 / Ps 13:6ab, 6c / Mt 1:1-16, 18-23", response: "With delight I rejoice in the Lord." },
    ],
  },
  "2026-09-09": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 7:25-31 / Ps 45:11-12, 14-15, 16-17 / Lk 6:20-26", response: "Listen to me, daughter; see and bend your ear." },
    ],
  },
  "2026-09-10": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 8:1b-7, 11-13 / Ps 139:1b-3, 13-14ab, 23-24 / Lk 6:27-38", response: "Guide me, Lord, along the everlasting way." },
    ],
  },
  "2026-09-11": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 9:16-19, 22b-27 / Ps 84:3, 4, 5-6, 12 / Lk 6:39-42", response: "How lovely is your dwelling place, Lord, mighty God!" },
    ],
  },
  "2026-09-12": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 10:14-22 / Ps 116:12-13, 17-18 / Lk 6:43-49", response: "To you, Lord, I will offer a sacrifice of praise." },
    ],
  },
  "2026-09-13": {
    title: "24th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Sir 27:30-28:7 / Ps 103:1-2, 3-4, 9-10, 11-12 / Rom 14:7-9 / Mt 18:21-35", response: "The Lord is kind and merciful, slow to anger, and rich in compassion." },
    ],
  },
  "2026-09-14": {
    title: null,
    sets: [
      { label: null, citation: "Nm 21:4b-9 / Ps 78:1bc-2, 34-35, 36-37, 38 / Phil 2:6-11 / Jn 3:13-17", response: "Do not forget the works of the Lord!" },
    ],
  },
  "2026-09-15": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 12:12-14, 27-31a / Ps 100:1b-2, 3, 4,5 / Jn 19:25-27 or Lk 2:33-35", response: "We are his people: the sheep of his flock." },
    ],
  },
  "2026-09-16": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 12:31-13:13 / Ps 33:2-3, 4-5, 12 and 22 / Lk 7:31-35", response: "Blessed the people the Lord has chosen to be his own." },
    ],
  },
  "2026-09-17": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 15:1-11 / Ps 118:1b-2, 16ab-17, 28 / Lk 7:36-50", response: "Give thanks to the Lord, for he is good." },
    ],
  },
  "2026-09-18": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 15:12-20 / Ps 17:1bced, 6-7, 8b, 15 / Lk 8:1-3", response: "Lord, when your glory appears, my joy will be full." },
    ],
  },
  "2026-09-19": {
    title: null,
    sets: [
      { label: null, citation: "1 Cor 15:35-37, 42-49 / Ps 56:10c-12, 13-14 / Lk 8:4-15", response: "I will walk in the presence of God, in the light of the living." },
    ],
  },
  "2026-09-20": {
    title: "25th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 55:6-9 / Ps 145:2-3, 8-9, 17-18 / Phil 1:20c-24, 27a / Mt 20:1-16a", response: "The Lord is near to all who call upon him." },
    ],
  },
  "2026-09-21": {
    title: null,
    sets: [
      { label: null, citation: "Eph 4:1-7, 11-13 / Ps 19:2-3, 4-5 / Mt 9:9-13", response: "Their message goes out through all the earth." },
    ],
  },
  "2026-09-22": {
    title: null,
    sets: [
      { label: null, citation: "Prv 21:1-6, 10-13 / Ps 119:1, 27, 30, 34, 35, 44 / Lk 8:19-21", response: "Guide me, Lord, in the way of your commands." },
    ],
  },
  "2026-09-23": {
    title: null,
    sets: [
      { label: null, citation: "Prv 30:5-9 / Ps 119:29, 72, 89, 101, 104, 163 / Lk 9:1-6", response: "Your word, O Lord, is a lamp for my feet." },
    ],
  },
  "2026-09-24": {
    title: null,
    sets: [
      { label: null, citation: "Eccl 1:2-11 / Ps 90:3-4, 5-6, 12-13, 14, 17bc / Lk 9:7-9", response: "In every age, O Lord, you have been our refuge." },
    ],
  },
  "2026-09-25": {
    title: null,
    sets: [
      { label: null, citation: "Eccl 3:1-11 / Ps 144:1b and 2abc, 3-4 / Lk 9:18-22", response: "Blessed be the Lord, my Rock!" },
    ],
  },
  "2026-09-26": {
    title: null,
    sets: [
      { label: null, citation: "Eccl 11:9-12:8 / Ps 90:3-4, 5-6, 12-13, 14 and 17 / Lk 9:43b-45", response: "In every age, O Lord, you have been our refuge." },
    ],
  },
  "2026-09-27": {
    title: "26th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Ez 18:25-28 / Ps 25:4-5, 6-7, 8-9 / Phil 2:1-11 or Phil 2:1-5 / Mt 21:28-32", response: "Remember your mercies, O Lord." },
    ],
  },
  "2026-09-28": {
    title: null,
    sets: [
      { label: null, citation: "Jb 1:6-22 / Ps 17:1bcd, 2-3, 6-7 / Lk 9:46-50", response: "Incline your ear to me and hear my word." },
    ],
  },
  "2026-09-29": {
    title: null,
    sets: [
      { label: null, citation: "Dn 7:9-10, 13-14 or Rv 12:7-12ab / Ps 138:1-2ab, 2cde-3, 4-5 / Jn 1:47-51", response: "In the sight of the angels I will sing your praises, Lord." },
    ],
  },
  "2026-09-30": {
    title: null,
    sets: [
      { label: null, citation: "Jb 9:1-12, 14-16 / Ps 88:10bc-11, 12-13, 14-15 / Lk 9:57-62", response: "Let my prayer come before you, Lord." },
    ],
  },
  "2026-10-01": {
    title: null,
    sets: [
      { label: null, citation: "Jb 19:21-27 / Ps 27:7-8a, 8b-9abc, 13-14 / Lk 10:1-12", response: "I believe that I shall see the good things of the Lord in the land of the living." },
    ],
  },
  "2026-10-02": {
    title: null,
    sets: [
      { label: null, citation: "Jb 38:1, 12-21; 40:3-5 / Ps 119:66, 71, 75, 91, 125, 130 / Mt 18:1-5, 10", response: "Guide me, Lord, along the everlasting way." },
    ],
  },
  "2026-10-03": {
    title: null,
    sets: [
      { label: null, citation: "Jb 42:1-3, 5-6, 12-17 / Ps 69:33-35, 36-37 / Lk 10:17-24", response: "Lord, let your face shine on me." },
    ],
  },
  "2026-10-04": {
    title: "27th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 5:1-7 / Ps 80:9, 12, 13-14, 15-16, 19-20 / Phil 4:6-9 / Mt 21:33-43", response: "The vineyard of the Lord is the house of Israel." },
    ],
  },
  "2026-10-05": {
    title: null,
    sets: [
      { label: null, citation: "Gal 1:6-12 / Ps 111:1b-2, 7-8, 9, 10c / Lk 10:25-37", response: "The Lord will remember his covenant for ever." },
    ],
  },
  "2026-10-06": {
    title: null,
    sets: [
      { label: null, citation: "Gal 1:13-24 / Ps 139:1b-3, 13-14ab, 14c-15 / Lk 10:38-42", response: "Guide me, Lord, along the everlasting way." },
    ],
  },
  "2026-10-07": {
    title: null,
    sets: [
      { label: null, citation: "Gal 2:1-2, 7-14 / Ps 117:1bc, 2 / Lk 11:1-4", response: "Go out to all the world, and tell the Good News." },
    ],
  },
  "2026-10-08": {
    title: null,
    sets: [
      { label: null, citation: "Gal 3:1-5 / Lk 1:69-70, 71-72, 73-75 / Lk 11:5-13", response: "Blessed be the Lord, the God of Israel; he has come to his people." },
    ],
  },
  "2026-10-09": {
    title: null,
    sets: [
      { label: null, citation: "Gal 3:7-14 / Ps 111:1b-2, 3-4, 5-6 / Lk 11:15-26", response: "The Lord will remember his covenant for ever." },
    ],
  },
  "2026-10-10": {
    title: null,
    sets: [
      { label: null, citation: "Gal 3:22-29 / Ps 105:2-3, 4-5, 6-7 / Lk 11:27-28", response: "The Lord remembers his covenant for ever." },
    ],
  },
  "2026-10-11": {
    title: "28th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 25:6-10a / Ps 23:1-3a, 3b-4, 5, 6 / Phil 4:12-14, 19-20 / Mt 22:1-14 or Mt 22:1-10", response: "I shall live in the house of the Lord all the days of my life." },
    ],
  },
  "2026-10-12": {
    title: null,
    sets: [
      { label: null, citation: "Gal 4:22-24, 26-27, 31-5:1 / Ps 113:1b-2, 3-4, 5a, 6-7 / Lk 11:29-32", response: "Blessed be the name of the Lord forever." },
    ],
  },
  "2026-10-13": {
    title: null,
    sets: [
      { label: null, citation: "Gal 5:1-6 / Ps 119:41, 43, 44, 45, 47, 48 / Lk 11:37-41", response: "Let your mercy come to me, O Lord." },
    ],
  },
  "2026-10-14": {
    title: null,
    sets: [
      { label: null, citation: "Gal 5:18-25 / Ps 1:1-2, 3, 4, 6 / Lk 11:42-46", response: "Those who follow you, Lord, will have the light of life." },
    ],
  },
  "2026-10-15": {
    title: null,
    sets: [
      { label: null, citation: "Eph 1:1-10 / Ps 98:1, 2-3ab, 3cd-4, 5-6 / Lk 11:47-54", response: "The Lord has made known his salvation." },
    ],
  },
  "2026-10-16": {
    title: null,
    sets: [
      { label: null, citation: "Eph 1:11-14 / Ps 33:1-2, 4-5, 12-13 / Lk 12:1-7", response: "Blessed the people the Lord has chosen to be his own." },
    ],
  },
  "2026-10-17": {
    title: null,
    sets: [
      { label: null, citation: "Eph 1:15-23 / Ps 8:2-3ab, 4-5, 6-7 / Lk 12:8-12", response: "You have given your Son rule over the works of your hands." },
    ],
  },
  "2026-10-18": {
    title: "29th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Is 45:1, 4-6 / Ps 96:1, 3, 4-5, 7-8, 9-10 / 1 Thes 1:1-5b / Mt 22:15-21", response: "Give the Lord glory and honor." },
    ],
  },
  "2026-10-19": {
    title: null,
    sets: [
      { label: null, citation: "Eph 2:1-10 / Ps 100:1b-2, 3, 4ab, 4c-5 / Lk 12:13-21", response: "The Lord made us, we belong to him." },
    ],
  },
  "2026-10-20": {
    title: null,
    sets: [
      { label: null, citation: "Eph 2:12-22 / Ps 85:9ab-10, 11-12, 13-14 / Lk 12:35-38", response: "The Lord speaks of peace to his people." },
    ],
  },
  "2026-10-21": {
    title: null,
    sets: [
      { label: null, citation: "Eph 3:2-12 / Is 12:2-3, 4bcd, 5-6 / Lk 12:39-48", response: "You will draw water joyfully from the springs of salvation." },
    ],
  },
  "2026-10-22": {
    title: null,
    sets: [
      { label: null, citation: "Eph 3:14-21 / Ps 33:1-2, 4-5, 11-12, 18-19 / Lk 12:49-53", response: "The earth is full of the goodness of the Lord." },
    ],
  },
  "2026-10-23": {
    title: null,
    sets: [
      { label: null, citation: "Eph 4:1-6 / Ps 24:1-2, 3-4ab, 5-6 / Lk 12:54-59", response: "Lord, this is the people that longs to see your face." },
    ],
  },
  "2026-10-24": {
    title: null,
    sets: [
      { label: null, citation: "Eph 4:7-16 / Ps 122:1-2, 3-4ab, 4cd-5 / Lk 13:1-9", response: "Let us go rejoicing to the house of the Lord." },
    ],
  },
  "2026-10-25": {
    title: "30th SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Ex 22:20-26 / Ps 18:2-3, 3-4, 47, 51 / 1 Thes 1:5c-10 / Mt 22:34-40", response: "I love you, Lord, my strength." },
    ],
  },
  "2026-10-26": {
    title: null,
    sets: [
      { label: null, citation: "Eph 4:32-5:8 / Ps 1:1-2, 3, 4, 6 / Lk 13:10-17", response: "Behave like God as his very dear children." },
    ],
  },
  "2026-10-27": {
    title: null,
    sets: [
      { label: null, citation: "Eph 5:21-33 / Ps 128:1-2, 3, 4-5 / Lk 13:18-21", response: "Blessed are those who fear the Lord." },
    ],
  },
  "2026-10-28": {
    title: null,
    sets: [
      { label: null, citation: "Eph 2:19-22 / Ps 19:2-3, 4-5 / Lk 6:12-16", response: "Their message goes out through all the earth." },
    ],
  },
  "2026-10-29": {
    title: null,
    sets: [
      { label: null, citation: "Eph 6:10-20 / Ps 144:1b, 2, 9-10 / Lk 13:31-35", response: "Blessed be the Lord, my Rock!" },
    ],
  },
  "2026-10-30": {
    title: null,
    sets: [
      { label: null, citation: "Phil 1:1-11 / Ps 111:1-2, 3-4, 5-6 / Lk 14:1-6", response: "How great are the works of the Lord!" },
    ],
  },
  "2026-10-31": {
    title: null,
    sets: [
      { label: null, citation: "Phil 1:18b-26 / Ps 42:2, 3, 5cdef / Lk 14:1, 7-11", response: "My soul is thirsting for the living God." },
    ],
  },
  "2026-11-01": {
    title: "SOLEMNITY OF ALL SAINTS",
    sets: [
      { label: null, citation: "Rv 7:2-4, 9-14 / Ps 24:1bc-2, 3-4ab, 5-6 / 1 Jn 3:1-3 / Mt 5:1-12a", response: "Lord, this is the people that longs to see your face." },
    ],
  },
  "2026-11-02": {
    title: "The Commemoration of All the Faithful Departed (All Souls)",
    sets: [
      { label: null, citation: "Wis 3:1-9 / Ps 23:1-3a, 3b-4, 5, 6 / Rom 5:5-11 or Rom 6:3-9 / Jn 6:37-40", response: "The Lord is my shepherd; there is nothing I shall want. or Though I walk in the valley of darkness, I fear no evil, for you are with me." },
    ],
  },
  "2026-11-03": {
    title: null,
    sets: [
      { label: null, citation: "Phil 2:5-11 / Ps 22:26b-27, 28-30ab, 30e, 31-32 / Lk 14:15-24", response: "! will praise you, Lord, in the assembly of your people." },
    ],
  },
  "2026-11-04": {
    title: null,
    sets: [
      { label: null, citation: "Phil 2:12-18 / Ps 27:1, 4, 13-14 / Lk 14:25-33", response: "The Lord is my light and my salvation." },
    ],
  },
  "2026-11-05": {
    title: null,
    sets: [
      { label: null, citation: "Phil 3:3-8a / Ps 105:2-3, 4-5, 6-7 / Lk 15:1-10", response: "Let hearts rejoice who search for the Lord." },
    ],
  },
  "2026-11-06": {
    title: null,
    sets: [
      { label: null, citation: "Phil 3:17-4:1 / Ps 122:1-2, 3-4ab, 4cd-5 / Lk 16:1-8", response: "Let us go rejoicing to the house of the Lord." },
    ],
  },
  "2026-11-07": {
    title: null,
    sets: [
      { label: null, citation: "Phil 4:10-19 / Ps 112:1b-2, 5-6, 8a, 9 / Lk 16:9-15", response: "Blessed the man who fears the Lord." },
    ],
  },
  "2026-11-08": {
    title: "32nd SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Wis 6:12-16 / Ps 63:2, 3-4, 5-6, 7-8 / 1 Thes 4:13-18 or 1 Thes 4:13-14 / Mt 25:1-13", response: "My soul is thirsting for you, O Lord my God." },
    ],
  },
  "2026-11-09": {
    title: null,
    sets: [
      { label: null, citation: "Ez 47:1-2, 8-9, 12 / Ps 46:2-3, 5-6, 8-9 / 1 Cor 3:9c-11, 16-17 / Jn 2:13-22", response: "The waters of the river gladden the city of God, the holy dwelling of the Most High!" },
    ],
  },
  "2026-11-10": {
    title: null,
    sets: [
      { label: null, citation: "Ti2:1-8, 11-14 / Ps 37:3-4, 18 and 23, 27 and 29 / Lk 17:7-10", response: "The salvation of the just comes from the Lord." },
    ],
  },
  "2026-11-11": {
    title: null,
    sets: [
      { label: null, citation: "Ti3:1-7 / Ps 23:1b-3a, 3bc-4, 5, 6 / Lk 17:11-19", response: "The Lord is my shepherd; there is nothing I shall want." },
    ],
  },
  "2026-11-12": {
    title: null,
    sets: [
      { label: null, citation: "Phlm 7-20 / Ps 146:7, 8-9a, 9bc-10 / Lk 17:20-25", response: "Blessed is he whose help is the God of Jacob." },
    ],
  },
  "2026-11-13": {
    title: null,
    sets: [
      { label: null, citation: "2Jn4-9 / Ps 119:1, 2, 10, 11, 17, 18 / Lk 17:26-37", response: "Blessed are they who follow the law of the Lord!" },
    ],
  },
  "2026-11-14": {
    title: null,
    sets: [
      { label: null, citation: "3Jn5-8 / Ps 112:1-2, 3-4, 5-6 / Lk 18:1-8", response: "Blessed the man who fears the Lord." },
    ],
  },
  "2026-11-15": {
    title: "33rd SUNDAY IN ORDINARY TIME",
    sets: [
      { label: null, citation: "Prv 31:10-13, 19-20, 30-31 / Ps 128:1-2, 3, 4-5 / 1 Thes 5:1-6 / Mt 25:14-30 or Mt 25:14-15, 19-21", response: "Blessed are those who fear the Lord." },
    ],
  },
  "2026-11-16": {
    title: null,
    sets: [
      { label: null, citation: "Rv 1:1-4; 2:1-5 / Ps 1:1-2, 3, 4, 6 / Lk 18:35-43", response: "Those who are victorious I will feed from the tree of life." },
    ],
  },
  "2026-11-17": {
    title: null,
    sets: [
      { label: null, citation: "Rv 3:1-6, 14-22 / Ps 15:2-3a, 3bc-4ab, 5 / Lk 19:1-10", response: "I will seat the victor beside me on my throne." },
    ],
  },
  "2026-11-18": {
    title: null,
    sets: [
      { label: null, citation: "Rv 4:1-11 / Ps 150:1b-2, 3-4, 5-6 / Lk 19:11-28", response: "Holy, holy, holy Lord, mighty God!" },
    ],
  },
  "2026-11-19": {
    title: null,
    sets: [
      { label: null, citation: "Rv 5:1-10 / Ps 149:1b-2, 3-4, 5-6b, 9b / Lk 19:41-44", response: "The Lamb has made us a kingdom of priests to serve our God." },
    ],
  },
  "2026-11-20": {
    title: null,
    sets: [
      { label: null, citation: "Rv 10:8-11 / Ps 119:14, 24, 72, 103, 111, 131 / Lk 19:45-48", response: "How sweet to my taste is your promise!" },
    ],
  },
  "2026-11-21": {
    title: null,
    sets: [
      { label: null, citation: "Rv 11:4-12 / Ps 144:1, 2, 9-10 / Lk 20:27-40", response: "Blessed be the Lord, my Rock!" },
    ],
  },
  "2026-11-22": {
    title: "CHRIST THE KING",
    sets: [
      { label: null, citation: "Ez 34:11-12, 15-17 / Ps 23:1-2, 2-3, 5-6 / 1 Cor 15:20-26, 28 / Mt 25:31-46", response: "The Lord is my shepherd; there is nothing I shall want." },
    ],
  },
  "2026-11-23": {
    title: null,
    sets: [
      { label: null, citation: "Rv 14:1-3, 4b-5 / Ps 24:1bc-2, 3-4ab, 5-6 / Lk 21:1-4", response: "Lord, this is the people that longs to see your face." },
    ],
  },
  "2026-11-24": {
    title: null,
    sets: [
      { label: null, citation: "Rv 14:14-19 / Ps 96:10, 11-12, 13 / Lk 21:5-11", response: "The Lord comes to judge the earth." },
    ],
  },
  "2026-11-25": {
    title: null,
    sets: [
      { label: null, citation: "Rv 15:1-4 / Ps 98:1, 2-3ab, 7-8, 9 / Lk 21:12-19", response: "Great and wonderful are all your works, Lord, mighty God!" },
    ],
  },
  "2026-11-26": {
    title: null,
    sets: [
      { label: null, citation: "Rv 18:1-2, 21-23; 19:1-3, 9a / Ps 100:1b-2, 3, 4,5 / Lk 21:20-28", response: "Blessed are they who are called to the wedding feast of the Lamb." },
    ],
  },
  "2026-11-27": {
    title: null,
    sets: [
      { label: null, citation: "Rv 20:1-4, 11-21:2 / Ps 84:3, 4, 5-6a, 8a / Lk 21:29-33", response: "Here God lives among his people." },
    ],
  },
  "2026-11-28": {
    title: null,
    sets: [
      { label: null, citation: "Rv 22:1-7 / Ps 95:1-2, 3-5, 6-7ab / Lk 21:34-36", response: "Marana tha! Come, Lord Jesus!" },
    ],
  },
};

/** Return the readings for an ISO date (LY2026), or null if outside the dataset. */
export function readingsForDate(isoDate: string): DayReadings | null {
  if (!READINGS_ENABLED) return null;
  return READINGS[isoDate] ?? null;
}
