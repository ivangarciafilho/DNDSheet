# DNDSheet Build 254 — C8 type debt, and the preset bugs it exposed

Base `8096419` (Build 253).

## Deltas

| Measure | Before | After | Delta |
|---|---:|---:|---:|
| `any` lines in `src` (`: any` / `as any` / `<any>`) | 112 | 45 | −67 (−60 %) |
| `useTextRenderer.ts` `any` lines | 31 | 0 | −31 |
| `WebRenderer.vue` / `defense-and-traits-utils.ts` / `templates-store.ts` / `DatabaseStudio.vue` / `useProcessTokens.ts` | 13 / 7 / 7 / 9 / 6 | 0 / 0 / 3 / 3 / 1 | −35 |
| ESLint warnings | 282 | 206 | −76 |
| `@typescript-eslint/no-explicit-any` | 106 | 30 | −76 |
| Core tests | 682 | 688 | +6 |
| Typecheck | 48 / 0 new | 48 / 0 new | 0 |

## Method

Strip each `(x as any)` cast, let the typecheck name what is genuinely missing, then fix the type — never re-cast. Legacy persisted keys the renderers still read are declared as optional, documented fields (`MonsterSpeedTraversal.bonusActionHide/hideRider`, `Monster.splitDefenseRows/toolsActionType`, `ComboAction.triggerCondition`, `InvulnerabilityConfig.attackCount/disruptedBy`). `formatCurvedGradientCss` takes `Partial<GradientOverlayConfig>` — it already defaulted every field.

## Defects found by removing `any` (fixed, test-first)

The built-in "Ezra Meridian" library preset (`DatabaseStudio.vue`) applied through `state as any` and silently lost data:

| Preset key | Before | After |
|---|---|---|
| `initiative` | written to a non-existent `initiative` field | merged into `initiativeConfig` (advantage, disadvantage, `customEffectNote`) |
| `bonusActions` | never applied (`state.bonusActions` does not exist) | appended to `actions` with `bonusAction: true` |
| `hpNotes` | written to a non-existent field | one HP basic rider (deduplicated) |
| `proficiency`, `hpModifierOverride` | dropped | applied |
| `spellcasting` | partial object replaced the whole block (required fields lost) | merged over the current block |
| `HP.type` | `'d8'` (string; die maths NaN) | `8` |
| speeds / senses / targeting / refresh / metamagic | pre-schema shapes (no ids, `customText`, numeric `range`, `'Short Rest'`, no `sorceryPoints`, `attackType`) | current schema (`id`/`note`, `note`, `RangeSpec` + `planes`, `short_rest`, `sorceryPoints`, `actionType`/`attackReach`/`attackSource`) |

Preset application moved to `src/core/usecases/ApplyMonsterPreset.ts` (`applyMonsterPreset`), covered by `test/core/ApplyMonsterPreset.test.ts` (6 cases, written red first). `BUILTIN_PRESETS` is now typed `MonsterPreset[]`, so stale shapes fail the typecheck.

## Not covered

- No browser test applies a preset end to end; coverage is the domain function plus typecheck.
- 45 `any` lines remain (v1 template migration, file loader, math rendering, `shims-vue.d.ts`, spell sync); 78 non-null assertions untouched.

## Gate note

First full gate failed once in `pages-fuzz`: `emergency-spellcasting-browser-smoke.js` timed out waiting 4 s for cadence badges. The same test passed on the SPA run and 3/3 standalone against the same Pages build, so the wait budget was raised to 10 s (250 × 40 ms) and the full gate rerun.
