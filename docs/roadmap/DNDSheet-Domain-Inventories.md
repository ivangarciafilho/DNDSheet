# Domain inventories (B2.1, B3.1, B5.1)

Read from the code at Build217. Each table is the ground truth the matching Backlog loop builds on; update it in the same commit as any change to the code it describes.

## B5.1 — Persistent storage: every key and every writer

| Key / store | Owner | Writer | Reader | Notes |
|---|---|---|---|---|
| `app.monster` | `monster-store` (`pinia-plugin-persistedstate`) | every store mutation | app start | the live monster; includes `randomTables` since Build209 |
| `app.character` | `character-store` | store mutations | app start | |
| `app.editor` | `editor-store` | store mutations | app start | presentation & workspace chrome (template, style, theme, columns, `a4MultiPagePrint`, `studioTheme` dark/light) |
| `app.combat` | `combat-store` | store mutations | app start | encounter state, immutable `sourceSnapshot` roster, encounter XP budget thresholds |
| `app.spells` | `spells-store` | store mutations | app start | custom spells; migrates legacy `app.customSpells` once and removes it |
| `app.templates` | `templates-store` | store mutations | app start | custom templates; migrates legacy `app.customTemplates` once and removes it |
| `app.customSpells`, `app.customTemplates` | legacy v1 | — | `useV1Updater`, the two stores above | read once, then deleted |
| `dndsheet.storageHintSeen` | `App.vue` | first-run notice | `App.vue` | wrapped in try/catch |
| `dndsheet_monster_*` | `LocalStorageAdapter` | **nobody** | **nobody** | adapter is never instantiated outside `core/adapters` |
| IndexedDB `DndSheetDB` / `monsters` | `IndexedDbStorageAdapter` | **nobody** | **nobody** | same: implemented and unit-sized, but not wired to any store or UI |

Findings (Build 217 baseline & Build 249–273 repository wiring):
- **Guarded storage (`B5.8`, Build 218):** Every `pinia-plugin-persistedstate` store above routes through `createGuardedStorage()` (`src/core/domain/guarded-storage.ts`), which surfaces persistent throttled UI warnings on `QuotaExceededError` or write failure and safely reads empty state when storage is blocked.
- **Repository & recovery (`B5.1`–`B5.7`, Builds 249 & 262):** `selectRepositoryBackend()` and `RepositoryStorage.ts` manage local repository persistence (`DNDSheetRepositoryMigrationV1` verify-then-mark, `DNDSheetRepositoryBackupV1` quarantine/rollback) and `CreatureLibraryDialog.vue`; `ErrorCorrection.vue` recovery reset (`B5.7`) also clears `app.editor` and `app.combat` since Build 262.
- **Standalone domain adapters:** `LocalStorageAdapter` (`dndsheet_monster_*`) and `IndexedDbStorageAdapter` (`DndSheetDB` / `monsters`) are tested behind `StoragePort` alongside `RepositoryStorage`.

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
