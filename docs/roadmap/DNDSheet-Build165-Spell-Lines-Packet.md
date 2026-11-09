> Historical recovery record from `a13-9-sheet-density`. Superseded by the current Development Handoffs and Implementation Backlog; not a current release claim.

# DNDSheet — Build165 Spell Line Frame Packet

Parked slice (not on `statblock-overhaul`; Codex's Build162 work is uncommitted in that tree).
Branch `a13-9-sheet-density`, stacked on Build164 (`4bd5d56`).
Tag and release candidate: `rc-2.4.3-build-165-spell-lines`.

## What shipped (CR-154 spellcasting frame, first slice of A12.9)
- Each spell level renders as one prose line in reading order "amount per cadence, level, spells": `(3/Long Rest), Level 1: Protection from Evil and Good (V, S, M, C), Unseen Servant (V, S, M, R).` The per-spell grid cells are gone, which saves horizontal space.
- Cantrips read `Cantrips: Light, Sacred Flame.`; a cadence that carries its own count reads `(1/Day), Level 3: …`; At Will reads `(At Will), Level 2: …`.
- New `Hidden` cadence (catalog value `hidden`, appended last so resource-refresh indices stay stable): the level keeps its spells and prints no amount or cadence. Per-spell Hidden suppresses the badge.
- Innate groups use the same line grammar (`At Will: Light.`).
- Spell names are italic in lines; component tags and cadence badges stay upright.
- `SpellPlateLevel` gains `label` and `lead`; existing `ordinal`, `slotCount` and `cadence` fields are kept.

## Evidence
| Check | Result |
|---|---|
| Core tests | 329 / 329 (2 new spell-plate tests, written failing first) |
| Lint | 0 errors; 42 warnings, identical to the same files before the change |
| Spell-plate smoke | 5 themes, plus live slot edit (4 to 2 updates the lead) and Hidden cadence |
| Browser fuzz | 52 / 52 |
| Help and bindings smokes | pass |
| Visual | Cleric fixture checked on screen in wotc |

## Not covered
- Plain-text, Markdown, LaTeX and Homebrewery exports still use the old level wording (`useTextRenderer.ts` around the `levelCadenceMap` read); align them in the next spellcasting slice.
- The reported "slots do not follow the editor" could not be reproduced: a live slot edit re-renders the lead. The old header buried the count, which may be what was seen.
- Multiclass slot maths, known/prepared counts, subclass expanded lists and species spells (rest of A12.9/A12.10) are untouched.
- Only wotc was checked visually; other themes are covered by computed-style smokes only.

## Integration recipe
Cherry-pick `922d6fc`, the Build164 commit and this commit; resolve `build.json`, `exhaustive-ui-fuzz.js` and `spell-plate-browser-smoke.js` by keeping both sides; rerun everything; fold this packet into Backlog, Handoffs and Spec; delete it.