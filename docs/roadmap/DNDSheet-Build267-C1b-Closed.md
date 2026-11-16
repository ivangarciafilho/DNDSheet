# Build 267 — C1b closed: no source file of 900+ lines (5 → 0)

Base `3be0b59` (Build 266).

| File | Before | After | Technique | New modules |
|---|---|---|---|---|
| `statblock-grammar.scss` | 1,107 | 626 | in-place `@import` partial at a top-level boundary | `_statblock-grammar-1.scss` |
| `app.scss` | 1,295 | 842 | same | `_app-1.scss` |
| `useProcessTokens.ts` | 1,410 | ~870 | factory extraction (Build 256 pattern): a contiguous run of inner closures becomes `create…(deps)` with typed deps, called at the same position | `useEntryTokens.ts` (per-entry `{token}` substitution), `usePlateEntries.ts` (plate construction; `PlateEntrySpec` hoisted to module scope) |
| `useBasicsContext.ts` | 1,012 | ~770 | same | `useLanguageEntries.ts`, `useParagonPhases.ts` |
| `monster-store.ts` | 1,752 | 730 | default state moved verbatim; getters that never read `this` spread from a module with `(state: Monster)`; the four CR getters that call each other through `this` take an explicit `this: MonsterCrThis` (state plus the getter results they use) | `monster-state.ts`, `monster-state-getters.ts`, `monster-cr-getters.ts` |

## Proof

- **SCSS:** `split-scss` compiles the stylesheet before and after and refuses (and reverts) unless the CSS is **byte-identical**. Result: identical for both files.
- **TypeScript:** typecheck 0, core 691/691, ESLint 0/0, gate 11/11, visual 104/104 identical to production (no intended render change).

## Traps found and disarmed

| Trap | Evidence | Disarm |
|---|---|---|
| Moving the store's state object left it un-exported, so `...monsterState` became untyped and **the whole store typed as `{}`** | typecheck: 1,900 diagnostics across the app | Export the moved declaration. The split tool now has to export every name the original imports back |
| Factory deps detected from property names (`monster.paragonConfig`) | lint: unused deps | Unused deps removed; deps are now checked against lint |
| `t` destructured from `useI18n()` was invisible to the closure scan | review | Passed explicitly as a typed dep |
| A ratchet loophole: moving `!important` into an `_app-*` partial would have lowered the `app.scss` count | review | The metric now counts `app.scss` plus its partials |

## Limit of the evidence

`MonsterCrThis` is a hand-written structural slice of the store. TypeScript checks the moved getters against it, but if a moved getter starts using another getter it must be added to the interface (typecheck will say so).

**Gate:** 11/11 with **1 reported retry**: `build250-workflow` timed out once on the SPA build, then passed on retry and passed on Pages in `pages-fuzz`. It is the same timing-flake class as Build 262; event-driven waits stay on the backlog.
