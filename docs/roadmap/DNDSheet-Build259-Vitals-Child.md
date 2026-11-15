# DNDSheet Build 259 — C1b: vitals section as a child component

Base `4960ab1` (Build 258). Pure move refactor, verified pixel-identical.

## Deltas

| Measure | Before | After |
|---|---:|---:|
| `WebRenderer.vue` lines | 1,440 | 1,143 |
| Child components of the stat block | 2 | 3 |

## Changes

| File | Lines | Content |
|---|---:|---|
| `useStatblockVitalsView.ts` | 96 | the vitals view: 15 bindings moved verbatim (passive groups, senses/languages/speed badges and lines, the row-striping map and its stripe flags) plus the pure `shouldStripeVital`; exports `StatblockVitalsView` and the typed injection key `STATBLOCK_VITALS` |
| `StatblockVitals.vue` | 256 | both layout branches (2024 precedence `v-if`, 2014 classic `v-else`) moved together as a fragment; injects the view |

`WebRenderer` builds the view once, `provide`s it, and destructures the same names for the rows it still renders (AC/HP stripes). One typed object replaces ~20 props. `DefenseRow` is now an exported type of `useDefenseText`.

Typecheck caught three bindings the template read through the parent's `...textRenderer` spread (`statsAndSavesByKey`, `stats`, `saves`); the view passes those same refs.

## Evidence

- `tools/qa/visual-diff.mjs` vs the Build 257 baseline: **104 / 104 identical** (4 fixtures × 12 themes × 2 layouts + 8 toolbar states).
- Typecheck 48 / 0 new; lint clean; full gate.
