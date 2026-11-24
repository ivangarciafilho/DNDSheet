# DNDSheet Build 273 — Track F Complete (`v2.7.0`: Encounter Budget, 2024 Character Sheet, Offline Importers, Multi-Page A4 Print, Bundle Budgets & Dual Theme)

- **Release:** Build 273 (`v2.7.0`)
- **Date:** 2026-11-24
- **Branch:** `build185-repairs`
- **Source Commit:** `407023742bd0f7162f0cc64a74f8ecb29ed77cc7` (`4070237`, on base Build 272 docs `67dd4b9`)
- **Pages Commit:** `52c0656` (`gh-pages`, `105` files)
- **RC Tag:** `rc-2.7.0-build-273-track-f-complete-encounter-importers-print-and-theme`
- **Production URL:** https://ivangarciafilho.github.io/DNDSheet/#/
- **Receipt:** [Publication Receipt](DNDSheet-Build273-Publication-Receipt.json)

## Scope Delivered (All `12 / 12` Track F Sub-Tasks + `5` Interleaved Guard Checks Complete = `100.0%` ✅)

1. **Epic F1 — Encounter XP Budget & Combat Tracker Roster (`F1.1`–`F1.3`, Guard `F1.2→F1.3`):**
   - Added pure [src/core/domain/encounter-budget.ts](../../src/core/domain/encounter-budget.ts) calculating deterministic 2014 DMG (`Easy`/`Medium`/`Hard`/`Deadly` adjusted XP multipliers) and 2024 SRD 5.2.1 (`Low`/`Moderate`/`High`) encounter difficulty budgets, plus JSON/Markdown encounter export and lossless re-import helpers.
   - Extended [src/core/usecases/CombatTracker.ts](../../src/core/usecases/CombatTracker.ts), [src/stores/combat-store.ts](../../src/stores/combat-store.ts), [src/components/combat/EncounterBudgetPanel.vue](../../src/components/combat/EncounterBudgetPanel.vue), and [src/components/combat/CombatTrackerDrawer.vue](../../src/components/combat/CombatTrackerDrawer.vue) with batch encounter spawning under immutable `sourceSnapshot` isolation, unique `Combatant.id` + display ordinal disambiguation (`Goblin #1`, `Goblin #2`), active-turn-safe deterministic sorting/removal, full `v-help` coverage, and bilingual `studio.combat.*` strings. Verified in [test/core/EncounterBudget.test.ts](../../test/core/EncounterBudget.test.ts) & [test/core/CombatTracker.test.ts](../../test/core/CombatTracker.test.ts).

2. **Epic F2 — 2024 Character Sheet Features, `pt-BR` Parity & Character E2E (`F2.1`–`F2.3`, Guard `F2.1→F2.2`):**
   - Added pure [src/core/domain/character-2024.ts](../../src/core/domain/character-2024.ts) (origin feats, weapon mastery properties, `'2014' | '2024'` provenance tagging), [src/components/character/Character2024Section.vue](../../src/components/character/Character2024Section.vue), and integration in [src/components/character/CharacterEditor.vue](../../src/components/character/CharacterEditor.vue), [src/components/character/CharacterSheet.vue](../../src/components/character/CharacterSheet.vue), [src/core/domain/character-import.ts](../../src/core/domain/character-import.ts), [src/core/usecases/ExportStatblock.ts](../../src/core/usecases/ExportStatblock.ts), and [src/stores/character-store.ts](../../src/stores/character-store.ts) isolated cleanly from Monster CR formulas.
   - Completed `pt-BR` translation audit across Character Mode, AI Ingest (`AiIngestDialog.vue`), and Combat dialogs inside [src/i18n/en-US/studio.ts](../../src/i18n/en-US/studio.ts) & [src/i18n/pt-BR/studio.ts](../../src/i18n/pt-BR/studio.ts) (`1,141 / 1,141 = 100.0%`, `PT_BR_MIN_KEYS = 1130`), fixed `{ ... }` placeholder syntax in `aiIngest.placeholder`, and added [test/character-2024-browser-smoke.mjs](../../test/character-2024-browser-smoke.mjs) to both `help` and `pages-fuzz` gate suites.

3. **Epic F3 — Offline Foundry VTT, Homebrewery v3 & Improved Initiative Importers (`F3.1`–`F3.3`, Guard `F3.2→F3.3`):**
   - Built [src/core/domain/importer-utils.ts](../../src/core/domain/importer-utils.ts), [src/core/domain/foundry-import.ts](../../src/core/domain/foundry-import.ts), [src/core/domain/homebrewery-import.ts](../../src/core/domain/homebrewery-import.ts), and [src/core/domain/improved-init-import.ts](../../src/core/domain/improved-init-import.ts) validated strictly through `stripDangerousKeys()`, `inspectMonsterPayload()`, and `safe-html` allowlists (`vHtml: 0`), wired into [src/components/file/useFileLoader.ts](../../src/components/file/useFileLoader.ts) & [src/components/file/ImportButton.vue](../../src/components/file/ImportButton.vue) with dedicated test suites [FoundryImport.test.ts](../../test/core/FoundryImport.test.ts), [HomebreweryImport.test.ts](../../test/core/HomebreweryImport.test.ts), and [ImprovedInitImport.test.ts](../../test/core/ImprovedInitImport.test.ts).

4. **Epic F4 — Multi-Page A4 Print, Dual Dark/Light Studio Theme, `!important` Burn-Down & Bundle Budgets (`F4.1`–`F4.3`, Guards `F4.1→F4.2`, `F4.2→F4.3`):**
   - Added pure [src/core/domain/a4-pagination.ts](../../src/core/domain/a4-pagination.ts), [test/core/A4Pagination.test.ts](../../test/core/A4Pagination.test.ts), [src/css/print-page.scss](../../src/css/print-page.scss), and multi-page overflow guides & print controls in [useA4Composition.ts](../../src/components/rendering/useA4Composition.ts), [A4PreviewToolbar.vue](../../src/components/rendering/A4PreviewToolbar.vue), [WebRenderer.vue](../../src/components/rendering/WebRenderer.vue), and [editor-store.ts](../../src/stores/editor-store.ts), verified in [test/print-parity-browser-smoke.js](../../test/print-parity-browser-smoke.js) (`portrait` & `landscape` 2-page PDF proofs).
   - Shipped Dark/Light Studio theme switcher (`WebRendererSettingsButton.vue`, `App.vue`, `dark-contrast.scss`, `FocusedHelpBar.vue`, `CrFooter.vue`, `ActionsEditor.vue`), burned down CSS `!important` debt from `361` -> **`308`** (`importantDarkContrast: 13 -> 12`, `importantAppScss: 18`), and verified `0` contrast violations across both Dark & Light Studio in [test/budget-browser-probe.js](../../test/budget-browser-probe.js).
   - Added production bundle ceiling enforcement in [tools/bundle-budget.mjs](../../tools/bundle-budget.mjs) wired into `tools/ratchet.mjs`, `test/gate.mjs` (`pages-assets`), `tools/publish.mjs`, and `test/core/Budgets.test.ts`.
   - Upgraded QA Chromium reliability (`--incognito` in `tools/qa/chrome.mjs` & `tools/qa/visual-diff.mjs`, extended hydration/CDP timeouts in `tools/qa/browser-probe.mjs` & `test/locale-browser-smoke.mjs`, explicit connection cleanup in `test/gate.mjs`).

## Verification & Live Parity

- **11-Step Gate (`npm run gate` on frozen `4070237`):** **`GATE PASSED: 11 steps`** (`inputFingerprint`: `84b43d186e5f87ad2c07949a31bdd7c8850a89573b382ca3a399f3f59d62f149`, single startup retry recorded cleanly in `.gate/summary.json` `flaky`: `http://127.0.0.1:9230/index.html#/ node test/native-monster-roundtrip-browser-smoke.mjs`; `pages-fuzz` 26/26 passed with `0` retries).
  - `core` (`6 s`): **`733 / 733` pass** (`721` subtests, `0` fail/skipped/cancelled), `pt-BR`: **`1,141 / 1,141 (100.0 %)`**, `audit:help`: **`570 / 570 (100.0 %)`**, `ratchet`: `18 / 12 / 308 / 0 / 0 / 0 / 4 / 0`.
  - `lint` (`18 s`): **`0` errors, `0` warnings**; `typecheck` (`24 s`): **`0` diagnostics (`683` resolved)**; `visual` (`197 s`): **`104 / 104` byte-identical** (`diffs: []`).
  - `bundleBudgets` (`40` files in `dist-pages/assets`): **`ok: true`**, largest chunk `index.f1db5caf.js` (`1,041,985` raw / `313,195` gzip), total JS `2,788,760` raw / `812,034` gzip.
  - `budget-browser-probe`: SPA `4.6 ms` keystroke p95 / `26 ms` completion / `12.11:1` head contrast / **`0` UI violations**; Pages `4.3 ms` keystroke p95 / `24.7 ms` completion / `12.11:1` head contrast / **`0` UI violations**; `10`-view `fitInventory`: **`0` clipping observations**.
- **Live Pages HTTP `200` + SHA-256 Parity (`https://ivangarciafilho.github.io/DNDSheet/`):**
  - `index.html`: `1,337` B (`82de2fdb37f63c82863e60b53600319ed31ce234d70765f3b9f5a064cbbb33f7`) — matches local.
  - `assets/index.f1db5caf.js`: `1,041,985` B (`cfc5fd1d612742c1461a48af6b043223a4a934f0736d4389e6595c2cc8898693`) — matches local.
  - `assets/index.50bc56f0.css`: `682,567` B (`48f6ee488c3a52472f6e21bbe8d973c4a66ba60461352bffcc14e8d01cc8167a`) — matches local.
  - `assets/MonsterBuilder.22255966.js`: `860,182` B (`59b2089c2fa73f80f255b9a3b2994c939d1215144a1e6a5bdb4574ecac12b102`) — matches local.
  - `assets/i18n.ae85b7f3.js`: `265` B (`d94e22b26a9fb5685b7b60a5125f0f80b8bd159f3d696b88473c2fde4776a4fe`) — matches local.
  - `assets/quasar-lang.082b6152.js`: `2,938` B (`0ec3768f2b7897a5a9b3ade8e5bccd3be0ab47335658dc2f185b7808ba9ff1fc`) — matches local.
