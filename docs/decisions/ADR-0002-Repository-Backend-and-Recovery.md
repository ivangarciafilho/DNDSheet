# ADR-0002: Repository Backend Selection, Fail-Loud Persistence, Legacy Migration, and Recovery

- **Status:** Accepted (Build 249)
- **Covers:** `B5.2`, `B5.3`, `B5.4`, `B5.5`, `B5.6`, `B6.1`, `B6.2`, `B6.3`, `B6.4`
- **Date:** 2026-11-14

## Context

`IndexedDbStorageAdapter` previously swallowed per-operation IndexedDB errors inside each method and silently switched individual calls to `this.fallback` (`LocalStorageAdapter`), risking split-brain writes, hidden quota truncation, and undetected data loss. Meanwhile, creatures lived primarily in a single active slot (`app.monster`) plus ad-hoc `dndsheet_monster_*` keys without an indexed multi-creature library, atomic backup/restore bundles, or a truthful save-state indicator.

Per explicit owner decision (`B5.7`), `ErrorCorrection.vue`'s emergency recovery reset (`app.editor` / `app.combat`) remains untouched outside this repository redesign.

## Decisions

### 1. Startup-Once Backend Selection & Typed Storage Errors (`B5.2`, `B5.3`)
- `StorageFailureCode` classifies failures into `'quota_exceeded' | 'storage_blocked' | 'corrupted_entry' | 'io_error'`.
- `LocalStorageAdapter` and `IndexedDbStorageAdapter` surface typed `StorageFailureError` failures rather than silently dropping writes or falling back mid-session.
- `selectRepositoryBackend()` probes storage availability **once at startup** (`indexeddb` -> fallback `localstorage` when IndexedDB is unavailable in the browser environment, or throws/enters explicit `'read_only'` / `'error'` state if blocked). Mid-session per-operation silent failover is eliminated.
- Every save operation returns a `SaveResult` (`ok: true` with timestamp & backend, or `ok: false` with typed `StorageFailureError`) and leaves the last good persisted snapshot intact when a write fails (`QuotaExceededError`, blocked IDB transaction, etc.).

### 2. Local Creature Library & Safe Identity (`B6.1`–`B6.4`)
- `CreatureSummary` indexes `{ id, name, size, type, cr, folder, tags, archived, trashed, updatedAt, createdAt, saveVersion, ruleset }` separately from heavy full `Monster` documents so 200+ creature queries remain fast.
- Duplicating a creature allocates a fresh UUID (`MonsterId`), remaps nested item/entry IDs (`traits`, `actions`, `reactions`, `attacks`, `lairActions`, `legendaryActions`, `mythicActions`, `anatomyParts`, `languagesList`, `paragonConfig.phaseConfigs`, etc.), re-keys matching `bindings` prefixes via `entryBindingPrefix` + `copyEntryBindings`, and preserves distinct IDs so clones never alias live state or bindings.
- Archiving, trashing, restoring, and permanently purging entries preserve filter invariants (`All` excludes Trash & optionally Archive; `Archived` and `Trash` views isolate items cleanly).

### 3. Verify-Then-Mark Legacy Migration (`B5.4`)
- At initialization, `migrateLegacySources()` inspects legacy `dndsheet_monster_*` keys and any valid `app.monster` payload not yet present in the repository index.
- Each migrated creature is written, verified back via read-back checksum/schema check (`migrateMonsterSchema`), indexed, and **only then** marked with `DNDSheetRepositoryMigrationV1` completion metadata. Unverified/corrupt legacy records are quarantined in diagnostics without deleting original keys.

### 4. Versioned Backup/Restore & Recovery (`B5.5`, `B5.6`)
- Repository backups serialize a versioned bundle (`format: 'DNDSheetRepositoryBackupV1'`) containing validated `Monster` envelopes, library metadata, and exported timestamp.
- Restoring validates each entry BEFORE mutating live repository state, quarantining invalid entries in diagnostics, and restores under a pre-restore rollback guard: if writing fails mid-restore, the prior repository snapshot is restored intact.
- `MainLayout` exposes a truthful `[data-save-status]` badge (`idle` | `saving` | `saved` | `error` | `read_only`) with clickable error diagnostics & recovery link (`ErrorCorrection.vue` + backup export/restore).

## Consequences
- Save failures (quota exhaustion, blocked storage, corrupted entries) never look like silent success; last-good saves survive intact.
- Legacy creatures remain safe and idempotently discoverable inside the local Creature Library alongside new, duplicated, archived, and trashed entries.
