# ADR-0001: Document Envelope, Identity, Revision Tracking, Provenance, and Presentation Ownership

- **Status:** Accepted (Build 248)
- **Covers:** `B1.1`, `B1.2`, `B1.3`, `B1.5`, `B8.1`, `B8.2`, `BS-38`
- **Date:** 2026-11-14

## Context

DNDSheet stores a monster as a migrated flat JSON payload (`saveVersion: 11` in `CURRENT_MONSTER_VERSION`) inside Pinia (`app.monster`), alongside undo/redo snapshots (`history-store`), encounter combatants (`app.combat`), custom/user templates (`app.templates`), and layout/visual controls (`app.editor`). Prior to Build 248:

1. Two monsters with the same `name` shared no guaranteed unique `MonsterId` across duplicate imports or encounter instantiation (`CombatTracker` fell back to reusing `monster.id`).
2. `resolveBindings` reactive passes and presentation switches (`style`, `visualTheme`, `visualTemplate`) could not be distinguished from genuine authoring edits, making stale-preview guards impossible for Lint Repair (`B2`), Auto-Tune (`B3`), and Export Previews (`B4`).
3. Legacy `.5emm.json` files carried no ruleset provenance (`2014` vs `2024`), causing older statblocks to look falsely tagged or silently drift.
4. `monster.$state` vs `editor.$state` boundaries were implicit across save, share-link, and export paths.

## Decisions

### 1. `MonsterId` & Envelope Identity
- Every active monster document has a stable UUID `id` (`MonsterId`). Same-name copies always receive distinct `id`s when created or duplicated in session/combat adapters.
- `envelopeVersion` is `1`, orthogonal to `saveVersion` (`11`, owned exclusively by `MigrateMonsterSchema.ts`).
- **Export boundary preservation (`B4.6`):** `.5emm.json` serialization via `migrateMonsterSchema` + `nativeMonsterFile` remains idempotent and schema-compatible (`ExportBoundary.test.ts`). Runtime session envelope metadata (`documentId`, `contentRevision`, `provenance`, `lastEditedBy`) lives on the document session adapter (`src/stores/monster-session.ts` and `src/core/domain/document-envelope.ts`) and reads `monster.id` / `monster.provenance` when present without injecting unexpected volatile timestamps into migrated `.5emm.json` saves.

### 2. Monotonic `contentRevision`
- `contentRevision` is a strictly increasing integer (`>= 1`) maintained by `useMonsterSessionStore`.
- It increments **only** when the serialized canonical `Monster` payload changes through:
  - direct authoring mutations / `$patch`,
  - single-command atomic operations (Lint Repair `B2.4`, Auto-Tune `B3.4`, AI Ingest),
  - `historyStore.undo()` and `historyStore.redo()`.
- **Exclusions (`B1.3`):**
  - Derived binding passes (`bindingRuntimeFor(monsterStore).resolving` / `historySilent`) do **not** increment `contentRevision` and do **not** create history entries.
  - Presentation changes in `editor-store` (`style`, `visualTemplate`, `visualTheme`, `statBlockColumns`, `spellcastingPlacement`, `a4*`) do **not** mutate `monster.$state` and do **not** increment `contentRevision`.
  - Consecutive no-op snapshots with identical canonical state are deduplicated in `HistoryLedger` / session revision checks so duplicate history entries are never recorded.
- Asynchronous or modal operations (`AutoTuneSession`, `CheckSession`, `ExportResult`) capture `sourceRevision` when planned and reject or warn on stale apply if `session.contentRevision !== sourceRevision`.

### 3. Rules Provenance (`B8.1`, `B8.2`)
- `DocumentProvenance` records `{ ruleset: '2014' | '2024' | 'unknown', editionLabel: string, sourceKind: 'authored' | 'legacy_fixture' | 'imported' | 'migrated' }`.
- Legacy documents and fixtures without an explicit top-level `provenance.ruleset` or explicit `spellcasting.rulesEdition` report `provenance.ruleset = 'unknown'` — provenance is never fabricated from editor display toggles.
- `resolveRulesPolicy(document, fallbackEdition)` returns `{ activeRuleset: '2014' | '2024', provenance: DocumentProvenance, catalogLabel: string }` and feeds ruleset-aware catalogs (`METAMAGIC_OPTIONS` costs, `CASTER_PROGRESSIONS`, 2014 vs 2024 cantrip & prepared/known tables in `AutoSyncSpellcasting.ts`, and `ClassCastingEditor.vue` capacity guidance).

### 4. Presentation vs Mechanics Ownership
- **`monster-store` (`Monster`):** owns all mechanical truth — identity, vitals, ability scores, formula bindings, traits, actions, reactions, spellcasting sources/grants/slots/pools, CR annotations, and random tables.
- **`editor-store` (`EditorState`):** owns visual rendering choices (`style`, `visualTemplate`, `visualTheme`, `statBlockColumns`, `spellcastingPlacement`, `condenseImmunities`, `a4*`). Switching presentation never mutates `monster-store` (`B8.3`).

### 5. `BS-38` Inventory of Stores Holding Monster Copies
| Store | Key / Storage | Shape Held | Sync Policy |
|---|---|---|---|
| `monster-store` | `app.monster` | Canonical mutable `Monster` state | Single live authoring source |
| `history-store` | In-memory (`HistoryLedger(50)`) | Deep JSON clones of prior `Monster` states | Deduplicated snapshots on real edits (`!historySilent`) |
| `combat-store` | `app.combat` | `Combatant[]` with immutable `sourceSnapshot` cloned at add time (`B9.2`) | Strictly isolated from live editor mutations unless explicitly re-added |
| `templates-store` | `app.templates` | Saved custom monster templates (`Monster[]`) | Loaded via `useFileLoader.loadMonster` with fresh migration |
| `editor-store` | `app.editor` | Visual/A4 presentation settings only (no `Monster` copy) | Coupled solely by `.5emm.json` optional `sheetPresentation` sidecar |

## Consequences
- UI features (`LintMonsterDialog`, `AutoTuneDialog`, `DownloadButton` Export Preview, `CombatTrackerDrawer`, `ClassCastingEditor`) share one pure envelope/revision/policy contract in `src/core/domain/document-envelope.ts` and `src/stores/monster-session.ts`.
- All existing save files remain loadable with `'unknown'` provenance and round-trip byte-identical through `MigrateMonsterSchema`.
