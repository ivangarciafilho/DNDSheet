# Build 248 — Document envelope, rules policy, Track A checks, source-first tune & exports

- **Source commit:** `b7eda87dab20a68215a4b30ea0687e55e31d49b9` (`b7eda87` on `build185-repairs`, base `e17b185`)
- **Pages commit:** `440675b3ca0af2b1a622d4f6428b1226ca291384` (`440675b` on `gh-pages`, 103 files)
- **Release tag:** `rc-2.4.3-build-248-envelope-rules-checks-tune-and-export`
- **Live URL:** https://ivangarciafilho.github.io/DNDSheet/#/

## Gate & Verification Summary

- **Full Gate:** `npm run gate` **10/10 PASS** (`core` 5s, `lint` 42s, `typecheck` 57s, `build` 72s, `fuzz` 188s, `help` 163s, `spell` 9s, `pages-build` 67s, `pages-assets` 0s, `pages-fuzz` 326s; input fingerprint `5a08f57a8d3d3f0bbf951aa780dffcc9c578acb96219554d5cb91c67cc4c4bdd`)
- **Core unit suite (`npm run test:core`):** `656/656` passed, `0` failed (`+14` tests vs Build 247's `642`)
- **ESLint:** `0` errors (`2790` pre-existing warnings)
- **Typecheck (`npm run typecheck`):** `48` diagnostics (all third-party `node_modules/`), **`0` in `src/`**, `0` new, `635` resolved vs Build 213 (`683`)
- **Help coverage (`npm run audit:help`):** `72.7 %` (`389/535`, floor `70 %`)
- **Browser verification:** Step 58 exhaustive UI fuzz (`0` runtime exceptions across SPA and Pages), 5-theme spell-plate live + `@media print`, 12-theme release matrix (`120` contrast samples), `overflow-probe` (`10` views, `0` clipping observations), and new `test/build248-envelope-workflow-browser-smoke.js` covering all four Build 248 pillars across both SPA and Pages

## Delivered Pillars (25 Tasks Closed + `D-02`)

1. **Pillar 1 — Document Envelope, Rules Provenance & SRD 5.2.1 Casting (`B1.1`, `B1.2`, `B1.3`, `B1.5`, `B8.1`, `B8.2`, `A12.0`, `A12.9`, `A12.10`):**
   - Authored [ADR-0001-Document-Envelope-and-Ownership.md](../decisions/ADR-0001-Document-Envelope-and-Ownership.md) (`B1.1`) and [DNDSheet-SRD521-Spellcasting-Reference.md](DNDSheet-SRD521-Spellcasting-Reference.md) (`A12.0`, `BS-29`, `BS-30`, `BS-07`).
   - Added pure envelope/revision/provenance contracts in `src/core/domain/document-envelope.ts` and `src/stores/monster-session.ts` (`useMonsterSessionStore`, `MONSTER_STORE_COPY_INVENTORY` across `monster`, `history`, `combat`, `templates`, `editor`, `runSingleUndoCommand`, and deduplicated `HistoryLedger`).
   - Preserved `provenance.ruleset = 'unknown'` for unattributed legacy saves/fixtures while feeding `resolveRulesPolicy(document)` into SRD 5.1 (`2014`) vs SRD 5.2.1 (`2024`) cantrip/prepared/slot tables (`AutoSyncSpellcasting.ts`), per-source `sorceryPoints` (`ClassCastingEditor.vue`), and unified compact spell-plate rendering (`WebSpellPlates.vue`).
   - Proven by `test/core/DocumentSession.test.ts`, `test/core/Spellcasting2024.test.ts`, and `test/build248-envelope-workflow-browser-smoke.js`.
2. **Pillar 2 — Combat Identity & Snapshot Isolation (`B9.1`, `B9.2`, `B9.3`):**
   - `CombatTracker.ts`, `combat-store.ts`, and `CombatTrackerDrawer.vue` assign distinct stable combatant IDs, freeze immutable `sourceSnapshot` records at add time (with `sourceDocumentId`, `sourceRevision`, AC, HP, name badge `[data-combat-snapshot-badge]`), and preserve active turn by combatant ID across initiative sorts, removals, and reload.
   - Proven by `test/core/CombatTracker.test.ts` and `test/build248-envelope-workflow-browser-smoke.js`.
3. **Pillar 3 — Track A Linter/Checks & Source-First Auto-Tune (`B2.1`–`B2.5`, `B3.2`–`B3.5`):**
   - `LintMonster.ts` adds Track A families (`BROKEN_BINDING`, `PREPARED_OVER_LIMIT`, `MULTIATTACK_ORPHAN_ATTACK`, `UNKNOWN_MACRO`, `DANGLING_RANDOM_TABLE_REF`) with typed `LintableOutcome` / `LintableContainerOwner`.
   - `src/core/domain/check-session.ts` provides `LINT_TARGET_REGISTRY`, `CheckSession` (`current`, `stale`, `failed`, `empty`, `repaired`), `planLintRepairs`, `applyCheckSessionRepairs`, and `evaluateExportPolicy`; `MonsterLintDialog.vue` exposes Locate focus highlight, stale guard banner, repair diff preview, single-Undo atomic apply, and clean re-check.
   - `AutoTuneCr.ts` + `AutoTuneDialog.vue` deliver `AutoTuneSession` partial selection, stale revision guard, source-first ability/proficiency tuning when derived fields (`AC`, offense paths) are formula-bound, and single-Undo batch apply.
   - Proven by `test/core/ChecksAndTune.test.ts` and `test/build248-envelope-workflow-browser-smoke.js`.
4. **Pillar 4 — Export Contracts, Checks Rows, Grammar CSS & `D-02` Placement (`B4.2`–`B4.5`, `D-02`):**
   - `src/core/domain/export-contract.ts` defines `EXPORT_CAPABILITIES`, `detectMonsterExportOmissions`, `buildExportResult`, and `STATBLOCK_GRAMMAR_EXPORT_CSS`.
   - Updated `ExportStatblock.ts`, `WebRenderer.vue`, `useMdRenderer.ts`, `useHomebrewery3Renderer.ts`, `useLatexRenderer.ts`, and `DownloadButton.vue` with `text2024`/check-row export parity (`Search`/`Study`/`Influence`/`Hide`), `.sb-plate` embedded grammar CSS in HTML exports, blocking lint override gate in Export Preview & Capabilities dialog, and persisted `editor-store.spellcastingPlacement` (`auto` | `with_traits` | `before_actions` | `after_actions`).
   - Updated and re-verified 8 export goldens (`test/goldens/export-*`), `test/core/ExportContract.test.ts`, and Step 51 + `build248-envelope-workflow-browser-smoke.js`.

## Backlog Delta & Remaining Queue

- **Top-level bold task IDs (`273`):** `202 -> 227` checked / `71 -> 46` open (`+25 / -25`)
- **Raw backlog checkboxes (`313`):** `242 -> 267` checked / `71 -> 46` open (`+25 / -25`)
- **Whole sections closed (`☑`):** `A12`, `B1`, `B2`, `B3`, `B4`, `B8`, `B9`
- **Next queue:** `A9.7` / `A9.10` / `A9.13` / `A11.2–A11.4` (`BasicsEditor` & roll-count `FormulaField` bindings) -> `A13.1`, `A13.2`, `A13.4`, `A13.7`, `H9`, `H16` (`CatalogSelect` kit & purpose-led help) -> `A14–A17` panel splits & architecture -> `B5.2–B5.7`, `B6.1–B6.4`, `B7.1–B7.4` storage/library/workspace.
