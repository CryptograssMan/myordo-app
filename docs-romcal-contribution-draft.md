# DRAFT — romcal upstream issue (NOT YET FILED)

Status: ready to file at https://github.com/romcal/romcal/issues/new
File under GitHub account: CryptograssMan (must be filed manually by the human
while logged in — nobody can file it on their behalf).

Once filed, paste the issue URL into PROJECT_HISTORY.md next to the
corrections-layer entry, and update this file's status to FILED + link.

---

## Title

Philippines calendar: update St. Pedro Calungsod & St. Lorenzo Ruiz per CBCP changes effective LY2025 (Dec 2024)

## Body

## Summary

The `@romcal/calendar.philippines` calendar is out of date on both canonized Filipino saints following changes approved by the Catholic Bishops' Conference of the Philippines (CBCP), effective the First Sunday of Advent, 1 December 2024 (Liturgical Year 2025).

Two corrections are needed:

**1. St. Pedro Calungsod — currently missing entirely; should be added**
- **Date:** moved from **April 2** to **October 21** (the date of his 2012 canonization). The move was made because April 2 frequently falls during Holy Week or the Easter Octave.
- **Rank:** elevated from Optional Memorial to **Feast**.
- **Color:** Red (martyr).
- I could not find this saint at any date in the current Philippines calendar output (romcal 3.0.0-dev / `@romcal/calendar.philippines@dev`).

**2. St. Lorenzo Ruiz and Companions — present, but rank is out of date**
- **Date:** September 28 (unchanged).
- **Rank:** elevated from Memorial to **Feast**.
- Currently romcal returns this celebration with rank `MEMORIAL`; it should now be `FEAST`.

## Sources

- Roman Catholic Archdiocese of Manila (RCAM), liturgical notes (Oct 2025): the elevation of St. Pedro Calungsod's memorial to a Feast, approved at the CBCP 127th Plenary Assembly.
- "Updates in the Philippine Liturgical Calendar" (dominusest.ph, Sept 2024), summarizing the CBCP changes effective 1 Dec 2024: Lorenzo Ruiz Memorial -> Feast (Sept 28), and Calungsod moved to Oct 21 as a Feast (rather than April 2), specifically to avoid Holy Week / Easter Octave.

## Verification

I confirmed the current output is missing Calungsod and lists Ruiz as a memorial by generating the Philippines/English calendar for 2026 and scanning all celebrations. Happy to provide the reproduction snippet if useful, or to open a PR against the Philippines calendar definition file if the maintainers can point me to the right source location and confirm the preferred format for the rank/date change.
