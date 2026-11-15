# DNDSheet Build 258 — C1b template split groundwork and C6 visual regression

Base `af9473b` (Build 257).

## Deltas

| Measure | Before | After |
|---|---:|---:|
| `WebRenderer.vue` lines | 1,688 | 1,440 |
| Scoped style blocks in `WebRenderer.vue` | 1 | 0 (namespaced) |
| Visual regression coverage | none | 104 screenshots per build (4 fixtures × 12 themes × 2 layouts + 8 toolbar states) |

## C6 — `tools/qa/visual-diff.mjs`

Renders the same fixtures in a baseline build and a candidate build and compares the stat-block PNGs byte for byte (same machine, same Chrome, same fonts; transitions, animations and the caret are frozen; fonts awaited).

| Check | Result |
|---|---|
| Determinism: Build 257 vs an identical copy | 72 / 72 identical |
| Sensitivity control (`VDIFF_CONTROL=1`, 1 px padding on the candidate) | 0 / 72 identical — every change detected |
| Namespaced styles vs Build 257 | 72 / 72 identical |
| Final candidate vs Build 257 (adds an encounter-dynamics fixture and toolbar captures) | 104 / 104 identical |

The `seraph+dynamics` fixture was confirmed to render all six encounter sections (3 villain, 1 each of bloodied, reactive, combo, anatomy, Runehammer). Differing pairs are written as `*.base.png` / `*.cand.png`. Not in the gate: it needs a baseline build; run it before and after any presentation refactor.

## Scoped → namespaced styles

`web-renderer.scoped.scss` became `web-renderer.namespaced.scss`, wrapped in `.web-renderer-root { … }` and loaded unscoped. Vue's scope attribute (0,1,0) is replaced by the root class (0,1,0), so specificity is unchanged; the sheet has three top-level rules, all on `.statblock`, no `:deep`, no keyframes, and nothing targets the root element or the teleported help tip. Child components rendering stat-block sections now receive these rules.

## Child components

| Component | Lines | Content | Inputs |
|---|---:|---|---|
| `StatblockEncounterDynamics.vue` | ~100 | villain, bloodied, reactive, combo actions; anatomy; Runehammer (fragment, no wrapper) | the six lists as props; `monster` from the store |
| `A4PreviewToolbar.vue` | ~215 | preview toggle, occlusion/opacity popovers, layer studio, fit badge, print | `a4PageOverflowPx`, `printA4Sheet`, `openLayerStudio`; `editorStore` from the store |

Templates moved verbatim; prop names match the bindings they replace.

## Next

The vitals block (2024 and 2014 branches, ~240 lines) reads ~20 bindings; it needs a typed provide/inject view context rather than 20 props — its own build.
