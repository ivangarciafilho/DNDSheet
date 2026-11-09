# Domain inventories (B2.1, B3.1, B5.1)

Read from the code at Build217. Each table is the ground truth the matching Backlog loop builds on; update it in the same commit as any change to the code it describes.

## B5.1 — Persistent storage: every key and every writer

| Key / store | Owner | Writer | Reader | Notes |
|---|---|---|---|---|
| `app.monster` | `monster-store` (`pinia-plugin-persistedstate`) | every store mutation | app start | the live monster; includes `randomTables` since Build209 |
| `app.character` | `character-store` | store mutations | app start | |
| `app.editor` | `editor-store` | store mutations | app start | presentation only (template, style, theme, columns) |
| `app.combat` | `combat-store` | store mutations | app start | encounter state |
| `app.spells` | `spells-store` | store mutations | app start | custom spells; migrates legacy `app.customSpells` once and removes it |
| `app.templates` | `templates-store` | store mutations | app start | custom templates; migrates legacy `app.customTemplates` once and removes it |
| `app.customSpells`, `app.customTemplates` | legacy v1 | — | `useV1Updater`, the two stores above | read once, then deleted |
| `dndsheet.storageHintSeen` | `App.vue` | first-run notice | `App.vue` | wrapped in try/catch |
| `dndsheet_monster_*` | `LocalStorageAdapter` | **nobody** | **nobody** | adapter is never instantiated outside `core/adapters` |
| IndexedDB `DndSheetDB` / `monsters` | `IndexedDbStorageAdapter` | **nobody** | **nobody** | same: implemented and unit-sized, but not wired to any store or UI |

Findings:
- **The `StoragePort` layer is unused.** Persistence is entirely `pinia-plugin-persistedstate` on six keys. B5.3 (“repository wiring”) starts from zero wiring, not from a half-wired adapter.
- **`ErrorCorrection.vue` resets** `app.monster`, `app.character`, `app.spells` and `app.templates`, but not `app.editor` or `app.combat`. Presentation and encounter state survive a recovery reset; decide whether that is intended (B5.2).
- **Silent save failures:** `pinia-plugin-persistedstate` 3.2.3 wraps every write in `try/catch` and logs only when `debug` is set, which this app never sets. A `QuotaExceededError` (large portrait, many custom spells) therefore stops saving with no message to the user (B5.5).

## B3.1 — Auto-Tune: what each recommendation writes

`generateAutoTunePlan` (`core/usecases/AutoTuneCr.ts`) returns recommendations plus a `tunedMonster` copy. Applying the plan replaces the monster with that copy.

| Recommendation `field` | Written to `tunedMonster` | Notes |
|---|---|---|
| (target CR) | `CR` | always |
| `proficiency` | `proficiency` | |
| `AC` | `AC` | |
| `HP.HD` | `HP.HD`, `HP.modifier` | both written, one row shown |
| `attacks.damage` | every attack's `damage.count` (rounded, ≥ 1) | only when `scaleAttacksProportionally !== false`; die size never changes, so tuning is coarse for small dice counts |
| `attacks.toHit` | **nothing** | advisory only: the attack bonus is derived from ability score + proficiency, and Auto-Tune does not change scores. This is the behaviour B3.1 asked to confirm. B3.5 (“prefer tuning sources”) is where it would be made real |

## B2.1 — Lint codes, fixable flags and real repairs

| Code | Severity | Fixable flag | Real repair in `autoFixMonster` |
|---|---|---|---|
| `MULTIATTACK_ORPHAN_ATTACK` | ERROR | yes | removes the dangling attack id |
| `MULTIATTACK_ORPHAN_ACTION` | ERROR | yes | removes the dangling action id |
| `EMPTY_MULTIATTACK` | WARNING | yes | drops the empty option |
| `MISSING_DAMAGE_TYPE` | WARNING | no | — |
| `ZERO_DAMAGE_ATTACK` | INFO | no | — |
| `CR_DRIFT` | WARNING | **was yes, now no** (Build217) | none — the lint dialog showed “Auto-Fixable” and counted it on the Fix button |
| `REDUNDANT_SENSES` | INFO | no | — |
| `SPELL_SLOTS_EMPTY` | WARNING | **was yes, now no** (Build217) | none |

`test/core/Build217.test.ts` now asserts that every issue flagged fixable is gone after `autoFixMonster`. Track A families still missing from lint (broken binding, prepared-over-limit, dangling references beyond multiattack) remain in B2.1's original scope.
