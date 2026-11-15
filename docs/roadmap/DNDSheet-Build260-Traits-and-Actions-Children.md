# DNDSheet Build 260 — C1b: traits and actions as child components; WebRenderer under 900 lines

Base `eadcd21` (Build 259). Pure move refactor, verified pixel-identical.

## Deltas

| Measure | Before | After |
|---|---:|---:|
| `WebRenderer.vue` lines | 1,143 | 866 |
| Child components of the stat block | 3 | 5 |

## Changes

| File | Content |
|---|---|
| `useStatblockBodyView.ts` | the stat-block body view: grouped traits and the has-traits flag, then attacks, actions, bonus actions, multiattack, legendary and mythic, reactions, lair, random tables, regional effects and inventory — 18 bindings moved verbatim; typed key `STATBLOCK_BODY` |
| `StatblockTraits.vue` | Traits heading, standard/recharge/conditional/mythic traits, with-traits spell plate, paragon pool filter, before-actions spell plate (fragment) |
| `StatblockActions.vue` | Actions heading through inventory, including the after-actions spell plate (fragment) |

- `inventory` (a lazy computed) was hoisted into the moved run.
- The view is `provide`d after the spell-plate bindings exist, adding `resolvedSpellPlacement` and `spellPlatesBind` (typed from `WebSpellPlates` props).
- `WebSpellPlates` is no longer registered in the parent; its three uses live in the children.
- Eleven A4 bindings the parent destructured but never read are no longer destructured; `useA4Composition` still owns and runs them.

## Trap recorded

The first build after the traits move failed on `vue/no-unused-components` (`WebSpellPlates` registered but unused). Quasar's build runs ESLint per module, so the error surfaced at build time; the folder lint had been run before that edit. Re-lint after every template move.

## Evidence

- Visual diff, actions-only step vs the Build 257 baseline: **104 / 104 identical**.
- Visual diff, final candidate vs the Build 257 baseline: **104 / 104 identical**.
- Not covered by the diff fixtures: the paragon pool filter bar (renders only with `paragonConfig` pools); its move is covered by the template typecheck and the build.
- Typecheck 48 / 0 new; lint 0 errors; full gate.
