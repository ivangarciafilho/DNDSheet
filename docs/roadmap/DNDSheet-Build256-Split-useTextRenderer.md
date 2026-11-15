# DNDSheet Build 256 — C1b: split useTextRenderer

Base `5a5aa5c` (Build 255). Pure move refactor: no rendering change.

## Deltas

| Measure | Before | After |
|---|---:|---:|
| `useTextRenderer.ts` lines | 2,037 | 871 |
| Files ≥ 900 lines in `src` | 20 | 19 |
| Core tests / typecheck | 688 / 48, 0 new | 688 / 48, 0 new |

## New sub-composables (`src/components/rendering/`)

| File | Lines | Owns | Receives from the parent |
|---|---:|---|---|
| `useDefenseText.ts` | 271 | vulnerability/resistance/immunity/condition lines, cascading defenses | — |
| `useSpeedsText.ts` | 237 | speeds, base and rider badges | `formattedNumeric`, `basicRiderText`, `options` |
| `useCheckRowsText.ts` | 212 | Search/Study/Influence/Hide rows, skills/tools rows, action passives | `t`, `options` |
| `useSensesLanguagesText.ts` | 215 | senses and languages badges/lines | `formattedNumeric`, `basicRiderText`, `processTokens` |
| `useTraitsText.ts` | 191 | processed traits, stage-pool filter, grouping | `processTrait`, `dynCtx`, `scheduleDefense` |
| `useEncounterDynamicsText.ts` | 103 | villain/bloodied/reactive/combo actions, anatomy, Runehammer, paragon | `processTokens` |

## Method (why it is safe)

- Each block was moved **verbatim** by a script that cuts the line range and writes it into the new function; no code was retyped.
- Each call sits exactly where the original declarations were, so evaluation order and `computed` laziness are unchanged.
- The parent's `processTokens` (bound to the `web` option) is passed in rather than re-created, so web and export projections stay distinct.
- Dependencies were found by a scan, then confirmed by the typecheck; over-reported ones were removed when lint showed them unused.
- Imports pruned per file to what each body uses (typecheck caught one spread-only use, restored).
- Output equality is proven by the gate: Foundry/HTML/plain-text export goldens and the full SPA + Pages browser suites.

## Not covered

`WebRenderer.vue` (2,983) and 18 other files ≥ 900 lines remain (`C1a`/`C1b`).
