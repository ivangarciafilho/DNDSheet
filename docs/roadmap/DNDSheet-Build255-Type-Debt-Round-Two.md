# DNDSheet Build 255 — C8 type debt, round 2

Base `6b5adf1` (Build 254).

## Deltas

| Measure | Before | After | Delta |
|---|---:|---:|---:|
| `any` lines in `src` | 45 | 29 | −16 (2 of the 29 are the word "any" in UI copy) |
| ESLint warnings | 206 | 149 | −57 |
| `no-explicit-any` | 30 | 20 | −10 |
| `no-non-null-assertion` | 78 | 31 | −47 (test-only rule override) |
| Core tests / typecheck | 688 / 48, 0 new | 688 / 48, 0 new | 0 |

## Changes

- Casts removed now that Build 254 declared the fields: `SpeedsEditor` (`bonusActionHide`, `hideRider`), `EncounterDynamicsEditor` (`timerDie`/`die`), `CrFooter`, `monster-store` default stat, `useProcessTokens` structured check.
- `ProcessTokens` context tokens read `limitedUse` through an `in` narrowing: attacks have none; traits, actions and reactions do.
- `MigrateMonsterSchema` legacy empty-string checks use `unknown`, not `any`.
- `mathRendering` skill lookup typed like `useTextRenderer`'s.
- `MonsterTextEditor` editor ref typed as `QEditor` (+ the internal `caret` helper Quasar does not type).
- `DatabaseStudio` import error handling uses `unknown`; `Monster.customDatabase.presets` is `MonsterPreset[]`.
- `.eslintrc.js`: `no-non-null-assertion` off for `test/**` only.

## Non-null assertion audit (src, 31 left)

All 31 were read in context. Each is guarded on the preceding line or by construction: Map get-after-set buckets, `idMap.has` before `get`, history stacks checked for length, `custom` implying `contribution`, a missing-score early return before `stats[ability]!`, regex matches on a character already classified by the tokenizer, and formula refs validated at parse. None is a runtime risk; rewriting them is churn, so they stay.

## Remaining `any` (27 real)

Untyped boundaries: `JSON.parse` in the file loader, v1 template and v1 spell migration, export payload builders (`useMdRenderer`, `useHomebrewery3Renderer`, `useImprovedInitRenderer`, `useTarrasqueRenderer`), legacy spellcasting sync (`AutoSyncSpellcasting`, `monster-store` spell flattening), AI ingest patch, `ChainCell` draft, `download.saveJson`, `ProcessTokens.getProperty`, `MainLayout` query data, and `shims-vue.d.ts`. Typing these properly needs payload schemas per export target — tracked as the rest of `C8`.
