# Build 245 — No dead formatting

Owner report: AC Type showed bold and italic in the editor, but the stat block printed plain text.

## Causes found

| Field | Cause | Fix |
|---|---|---|
| AC Type with the compositor on | The compositor copies its generated wording into AC Type and kept its own copy when the stored text differed byte for byte. A formatted copy therefore printed as the plain generated text, and the editor previews interpolated with `{{ }}`. | `composeAcAndDefenses` compares plain text: a formatted copy of the generated wording prints as authored (row and split rows) and stays the synced AC Type. Both editor previews render the safe formatting. |
| Senses note | Collected only on the generic branch, so darkvision, blindsight, life sense and divine sense never printed it, even as plain text. | Collected for every sense kind. |
| Senses and Languages badges (both layouts) | Printed with text interpolation, which shows tags literally. | Rendered through `mechanicRichHtml`. |
| AC and HP riders, defense notes and fallback entries | Passed through `escapeHtml`. | `mechanicRichHtml`. |
| Conditional trait headings, random-table results | Text interpolation. | `mechanicRichHtml`. |
| Stat-block sanitizer | Restored only `b`, `i`, `u`, `br` and `strong` (other tags survived only on an earlier path). | Restores the whole attribute-free formatting vocabulary. |

## Evidence

- `test/core/FormattedAcCopy.test.ts` covers the formatted copy printing once, split rows, and plain or reworded AC types keeping today's behaviour.
- `test/formatting-reaches-statblock-browser-smoke.mjs` runs in the gate. It checks bold, italic and strike for languages, senses, defense notes, speed notes, HP riders, trait descriptions, usage tags and conditional headings, plus the owner's compositor case, across 2 templates and 4 themes. It failed on Build 244 for senses and passes now.
- An earlier probe of all 12 themes found formatting kept in every one once the tags reached the page; the visible failures were all upstream of the CSS.

## Not covered

Encounter Dynamics, villain action and character-sheet fields render on their own panels and are not part of this smoke.
