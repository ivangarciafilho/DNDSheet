# Build 241 — Statblock wiring repairs

Owner-reported defects on Build 240. Each one was first reproduced in the live build (or by a test on unchanged Build 240 source), and then fixed.

## Delivered

| Area | Defect on Build 240 | Fix |
|---|---|---|
| Skill groups | Skill and tool names had the cell's 600 weight; no typographic split from numbers. | Names render as `<em class="dnd-skill-name">` (italic, 400); numbers keep `.dnd-num` bold. The sanitizer restores only this literal tag. |
| Studio plates | A structured entry whose only content was one mechanics/scope cell, or a skill group's scores, sat in a column beside the name and wrapped inside it (Ethereal Jaunt, Influence). | `buildPlateEntry` renders a head plus one text cell with no body as `sb-trait-streamlined`, so the text flows under the name. |
| Reactions | In the modern stat block the trigger was the last detail cell, after targets and mechanics. | The trigger leads the body text. A new `triggerPlacement: 'start' \| 'end'` field moves it after the response. Classic and structured classic paths follow the same field. The compositor gives Trigger its own row (`ComposerRow 'trigger'`) directly under the head, with a Before/After toggle. |
| Regeneration | Every default monster stores `maxHpReductionUntil: 'short rest'`, which hijacked the minimalist badge: the amount never printed. The detailed trait always said "at the start of its turn". | The max-HP-reduction phrase is used only when `conditionModifier === 'max_hp_reduction'`. `regenTimingPhrase` maps the chosen frequency into the trait prose. |
| Mortality | The default `dcRule` was the option label, so Undead Fortitude printed "DC 15". The detailed trait read `returnHpAmount`, which no editor writes. Changing the rule left `triggerCondition` and the death burst from the previous rule. | `normalizeDeathRule` / `normalizeDeathPrevention` resolve label values and drop rule-owned triggers once another rule is chosen (an explicit trigger with no rule is kept). The detailed trait reads `returnHpValue` and honours a custom save. The editor clears stale rule state. The store default is now the key. |
| Languages | No manufacturer option; a short list. | "Language of its Manufacturer" reads "understands the language of its manufacturer", and the checkbox appends "but can't speak". Added Common Sign Language, 26 monster tongues and 11 Forgotten Realms human languages. |

Damage Threshold, Damage Reduction, Bloodied (flat, half and dice sources) and the temporary hit point rider were exercised live and already reached the stat block.

## Evidence

- New `test/core/Build241.test.ts` (6 tests). The same behaviours, run as a control against unchanged Build 240 source, fail 5 of 5.
- Three existing composer tests encoded the old Trigger-in-Roll-row order. They were updated deliberately.
- Core: 600 tests pass. Typecheck: 505 diagnostics, 0 new. Lint: 0 errors.
- Built SPA checked in a browser: skill name 400 italic and number 800, flowing Ethereal Jaunt and Influence, trigger before and after the response, `+10/turn` regeneration, the DC 5 + damage taken rule, and the manufacturer language.

## Not covered

- **Unified text input (new H24).** The interface has 102 plain-text `q-input`s and 52 numeric ones. The rest use 55 `mechanic-text-editor`s (rich text, no formula resolution), 14 `monster-text-editor`s (rich text with macros) and 44 `formula-field`s. Not every plain input prints on the stat block: searches, layer names, dice formulas and file names are excluded by design. The printed-text inputs need one shared editor that offers both rich text and `{formula}` resolution, and the rendering adapters must resolve it. That is a cross-cutting change to editors and renderers, tracked as H24 and not attempted in this build.
- The Studio Before/After toggle is covered by unit tests and the gate's fuzz. Rendering was checked visually; the toggle was not clicked by hand.
