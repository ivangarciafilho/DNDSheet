# Build 263 — stat block layout and ordering fixes

Base `52313ab` (Build 262). These are owner-reported fixes from a two-column A4 stat block, done before the coupled C1a/C5 work.

| Report | Cause | Fix | Evidence |
|---|---|---|---|
| Traits split across both columns when the section could stay on one side | Column balancing could break between any two entries | `.traits` is unbreakable (`break-inside: avoid-column`) up to 8 entries; a longer section may still split, so one column can't grow far taller than the other | Probe: 6 traits in 2 columns are all in the left column |
| Moving a trait in the editor didn't change the stat block | `alphaTraits` (on by default) re-sorted the traits by name at render time | Moving a trait up or down now turns off the alphabetical sort, so the editor order is the render order and the checkbox shows the change | Probe: after a move the render order matches the store order and `alphaTraits` is false |
| A reaction whose header held only its name spent a whole row on that name | Reactions never used the single-row (streamlined) plate that actions and traits use | Both reaction branches now streamline under the same conditions as actions (no discipline, components, duration, scope or mechanics), so the trigger sits beside the name | Visual: `legacy-actions` reaction renders on one row |
| Text only reached the plate's left edge from line 3 | The floated name cell ended a few pixels below line 1, so line 2 also wrapped beside it | The name cell's bottom margin is calculated so the float ends within one text line, at any font scale | Probe: line 2 starts at the plate's left edge (`1184`, not `1234`+) |

Gate 11/11. The visual step was accepted for 12 intended diffs (`legacy-actions` × modern-2024 × 12 themes); the other 92 shots are identical to production.

**Limits of the evidence:** the 8-entry limit for keeping Traits together is a heuristic, not a measured height. A Traits section taller than a column will still break inside it.
