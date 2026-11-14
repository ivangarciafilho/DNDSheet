# Build 249 — Bindings & roll scaling, unified catalogs/help, local repository & creature library, workspace sections & presets

- **Source commit:** `01a9ba94d64a0e26c1904b2926a8f29bb8cc09ae` (`01a9ba9` on `build185-repairs`, base `6f7a5cf`)
- **Pages commit:** `2dc8305c45aa869ac7cd13fb20fe074cd08d1f56` (`2dc8305` on `gh-pages`, 105 files)
- **Release tag:** `rc-2.4.3-build-249-repository-catalogs-help-and-workspace`
- **Live URL:** https://ivangarciafilho.github.io/DNDSheet/#/

## Gate & Verification Summary

- **Full Gate:** `npm run gate` **10/10 PASS** (`core` 5s, `lint` 29s, `typecheck` 55s, `build` 70s, `fuzz` 183s, `help` 169s, `spell` 22s, `pages-build` 69s, `pages-assets` 0s, `pages-fuzz` 336s; input fingerprint `4c060f4b5f9ed3ef086effb223a1abb5a08273226b6566a15aee12460b5991d0`)
- **Core unit suite (`npm run test:core`):** `669/669` passed, `0` failed (`+13` tests vs Build 248's `656`)
- **ESLint (`npx eslint --ext .js,.ts,.vue src test`):** `0` errors (`2835` warnings)
- **Typecheck (`npm run typecheck`):** `48` diagnostics (all third-party `node_modules/`), **`0` in `src/`**, `0` new, `635` resolved vs Build 213 (`683`)
- **Help coverage (`npm run audit:help`):** `73.8 %` (`409/554`, floor `70 %`)
- **Live Pages verification:** `https://ivangarciafilho.github.io/DNDSheet/` (`index.html`, HTTP `200`, SHA-256 `655ef77b1382b3c4ea4d6a79fd0999170bac30b041bdb2f3b43169b79484e25d`) and bundled assets (`assets/index.686369fd.js`, `assets/index.2189b89e.css`, HTTP `200`) match `dist-pages/` byte-for-byte
- **Browser verification:** Step 58 exhaustive UI fuzz (`0` runtime exceptions across SPA and Pages), 5-theme spell-plate live + `@media print`, 12-theme release matrix (`120` contrast samples), `overflow-probe` (`10` views, `0` clips), and new `test/build249-workflow-browser-smoke.js` (`desktopResult.panelCount = 15`, `toolbarGroups = 4`, `quarantinedCount = 1`, `narrowResult.overflowOk = true`) across both SPA and Pages

## Delivered Pillars (24 Tasks Closed)

1. **Pillar 1 — Bindings Closure, Stable Row IDs & Independent Roll Scaling (`A9.7`, `A9.10`, `A9.13`, `A11.2`, `A11.3`, `A11.4`):**
   - Registered stable-ID binding paths (`anatomyParts[id=*].hp/ac/threshold`, `paragonConfig.phaseConfigs[id=*].initiativeBonus/hpOverride`, `languagesList[id=*].saveDc`) in `src/core/domain/catalogs/field-types.ts` and migrated all 6 remaining blocked inputs across `AnatomyEditor.vue` and `BasicsEditor.vue` to `<formula-field>` (`node test/inventory.mjs` reports `0` remaining blocked inputs).
   - Added `RollScalingSpec` (`src/core/domain/roll-scaling.ts`, `DndAttack` `attackCount?`/`attackRollModifier?`/`attackException?`, `RollScalingPopover.vue` inside `ComposerChain.vue`), distinguishing target count vs `rollCount` vs `beamCount` vs `damageMultiplier`, scaling source with provenance (`level`/`hd`/`custom`), roll/save advantage/disadvantage, CR damage evaluation, grammar output, and schema migration/export parity.
   - Proven by `test/core/BindingsAndScaling.test.ts` and `test/core/FieldTypes.test.ts`.
2. **Pillar 2 — Unified Catalog Registry, Accessible `CatalogSelect` Kit & Purpose-Led Help (`A13.1`, `A13.2`, `A13.4`, `A13.7`, `H9`):**
   - Added `src/core/domain/catalogs/enumerations.ts` unifying all 13 canonical catalogs (`sizes`, `creatureTypes`, `alignments`, `damageTypes`, `conditions`, `languages`, `senses`, `skills`, `tools`, `schools`, `spellLevels`, `recharge`, `roles`).
   - Built `src/core/domain/catalogs/catalog-select-model.ts` and `src/components/kit/CatalogSelect.vue` (custom-first, alphabetical within semantic groups with explicit `preserveOrder` for numeric/chronological sets, case-insensitive filtering, keyboard navigation) and adopted it in `BasicsEditor.vue` and `SkillsEditor.vue`.
   - Authored structured purpose-led `HELP_MESSAGES` in `src/i18n/en-US/help.ts` and rewrote 228 generated/boilerplate `v-help` tooltips across 11 Vue editors.
   - Proven by `test/core/CatalogKit.test.ts` (asserting 0 boilerplate tooltips across `.vue` files) and `npm run audit:help` (`73.8%`, `409/554`).
3. **Pillar 3 — Fail-Loud Repository Persistence, Local Creature Library & Recovery (`B5.2`–`B5.6`, `B6.1`–`B6.4`):**
   - Authored [ADR-0002-Repository-Backend-and-Recovery.md](../decisions/ADR-0002-Repository-Backend-and-Recovery.md) (`B5.2`), separating `StorageFailureCode` classification (`LocalStorageAdapter.ts`, `IndexedDbStorageAdapter.ts`, `StoragePort.ts`) with startup-once `selectRepositoryBackend()` and eliminating mid-session per-write silent fallback.
   - Implemented `RepositoryStorage.ts`, `creature-library.ts`, `useRepositoryStore` (`src/stores/repository-store.ts`), `CreatureLibraryDialog.vue` (`q-virtual-scroll`, search/filter/sort, create/open/rename, duplicate with fresh nested IDs + remapped `bindings` prefixes, archive/trash/restore/purge, keyboard Arrow/Enter/Esc nav), `DNDSheetRepositoryMigrationV1` verify-then-mark legacy migration, and `DNDSheetRepositoryBackupV1` export/restore with entry quarantine and rollback protection (wired into `MainLayout.vue` `[data-save-status]` and `ErrorCorrection.vue`, keeping owner decision `B5.7` untouched).
   - Proven by `test/core/RepositoryAndLibrary.test.ts` (250+ creature index queries, quota preservation, mid-restore rollback, migration verification) and `test/build249-workflow-browser-smoke.js`.
4. **Pillar 4 — Workspace Toolbar Groups, Sticky Section Strip, Narrow Mode & Presentation Presets (`B7.1`–`B7.4`):**
   - Grouped `MainLayout.vue` toolbar into 4 accessible `role="group"` containers (`document`, `editing`, `context`, `presentation`) with flex-wrap responsive styling and 450ms debounced autosave.
   - Added `WORKSPACE_SECTIONS` (`src/core/domain/workspace-sections.ts`), `SectionStrip.vue`, and `data-editor-section` panel focus targets across all 15 sections (`MonsterBuilder.vue` + 6 remaining panels).
   - Added `< 600px` narrow pane switcher (`[data-narrow-pane-switcher]`: `Editor` / `Stat block`, default `Editor`) preserving all 15 `.q-expansion-item` elements in DOM and Step 56 splitter behavior, plus `WORKSPACE_PRESETS` (`screen`, `ink_saver`, `art_plate`) over existing presentation settings in `MainLayout.vue` and `WebRendererSettingsButton.vue`.
   - Proven by `test/core/WorkspacePresetsAndSections.test.ts`, `.gate/fit.json` (`10` views, `0` clipped), and `test/build249-workflow-browser-smoke.js`.

## Backlog Delta & Remaining Queue

- **Top-level bold task IDs (`273`):** `227 -> 251` checked / `46 -> 22` open (`+24 / -24`)
- **Raw backlog checkboxes (`313`):** `267 -> 291` checked / `46 -> 22` open (`+24 / -24`)
- **Whole sections closed (`☑`):** `A9`, `A11`, `A13`, `B6`, `B7` (`B5.1`–`B5.6` closed; owner decision `B5.7` and `H16` remain `[ ]`)
- **Next queue:** `A14.1`–`A14.6` (`BasicsEditor` 6-panel split & full `CatalogSelect`/fit/keyboard pass) -> `A15.1`–`A15.6` (`ClassCasting`/`Skills`/`Senses`/`Defenses` kit/fit/keyboard pass) -> `A16.1`–`A16.3`, `A16.5`–`A16.7` (studio/A4/`app.scss` cleanup & `1.00` help target) -> `A17.5`, `A17.9` (budgets & `v2.5.0-statblock` tag); owner decisions `B5.7` and `H16` remain explicit user gates.
