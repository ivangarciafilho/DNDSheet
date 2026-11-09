> Historical recovery record from `a13-9-sheet-density`. Superseded by the current Development Handoffs and Implementation Backlog; not a current release claim.

# DNDSheet — Build166 Spell Export Frame Packet

Parked slice (not on `statblock-overhaul`; Codex's Build162 work is uncommitted in that tree).
Branch `a13-9-sheet-density`, stacked on Build165 (`d26e056`).
Tag and release candidate: `rc-2.4.3-build-166-spell-exports`.

## What shipped (closes the export gap left by Build165)
- New pure helper `spellLevelHeading` in `spell-plate.ts` gives every export the plate's reading order: `(4/Long Rest), Level 1`, `(1/Day), Level 3`, bare `Level 2` for Hidden, `(Bonus Action)` suffix.
- `classSpellcastingSlots.renderedLabel` (feeds Markdown, Homebrewery V3, Improved Initiative and Tarrasque exports) now uses it. The old label put the cadence after the colon ("1st level (4 slots): (Long Rest)") and printed a double space before the spells; both are fixed.
- Default cadence matches the web plate: per-level cadence, else the resource refresh, else Short Rest for pact casters and Long Rest otherwise.

## Evidence
| Check | Result |
|---|---|
| Core tests | 330 / 330 (one new helper test, written failing first) |
| Lint | 0 errors; 57 warnings, identical to the same files before the change |
| Markdown export in the browser | "Copy Markdown" captured: `(4/Long Rest), Level 1: *Bless*`, `Level 2: *Aid*` (Hidden), `(2/Long Rest), Level 3: *Revivify*` |
| Spell-plate, help and bindings smokes; browser fuzz | pass (52 / 52) |

## Not covered
- Improved Initiative, Tarrasque and LaTeX outputs are not captured in a browser test; they read the same `renderedLabel`, proven only by code path.
- The i18n keys `slotLabel` and `slotQuantity` are now unused; left in place for other locales until a cleanup pass.
- The cantrip line keeps its existing i18n wording "Cantrips (at will):".

## Integration recipe
Cherry-pick `922d6fc` and the Build164, Build165 and Build166 commits in order; resolve `build.json` and the test files by keeping both sides; rerun everything; fold the packets into Backlog, Handoffs and Spec; delete them.