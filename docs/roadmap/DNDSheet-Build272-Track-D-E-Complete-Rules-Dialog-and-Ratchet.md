# DNDSheet Build 272 — Track D & E Complete (`RulesConversionDialog`, `FocusedHelpBar`, Open5e Parse, `!important` Ratchet & Structured Release Sync)

- **Release:** Build 272 (`v2.5.0`)
- **Date:** 2026-11-23
- **Branch:** `build185-repairs`
- **Source Commit:** `7663992` (on parent Build 271 docs `1b83654`)
- **Pages Commit:** `1af0b90` (`gh-pages`, `105` files)
- **RC Tag:** `rc-2.5.0-build-272-track-d-e-complete-rules-dialog-and-ratchet`
- **Production URL:** https://ivangarciafilho.github.io/DNDSheet/#/
- **Receipt:** [Publication Receipt](DNDSheet-Build272-Publication-Receipt.json)

## Scope Delivered (`24` Packed Actionable Items Across 4 Clusters, Closing All `15 / 15` Build 271 Track D/E Sub-Tasks)

1. **Cluster 1 — Track D1 Complete: `2014 ↔ 2024` Rules Conversion Dialog & Single-Step Atomic Undo (`D1.4`–`D1.5`, `5` items):**
   - Created modular bilingual studio i18n namespaces [src/i18n/en-US/studio.ts](../../src/i18n/en-US/studio.ts) & [src/i18n/pt-BR/studio.ts](../../src/i18n/pt-BR/studio.ts) (`47` keys each, keeping root `index.ts` files `< 900` lines), raising `pt-BR` coverage `920 → 967 / 967 (100.0%)`.
   - Declared `provenance` explicitly in [src/stores/monster-state.ts](../../src/stores/monster-state.ts) and hardened optional-key deletion on `undo()` / `redo()` in [src/stores/history-store.ts](../../src/stores/history-store.ts) so reverting conversions removes newly added optional metadata cleanly.
   - Added atomic conversion command [src/core/usecases/ApplyRulesEditionConversion.ts](../../src/core/usecases/ApplyRulesEditionConversion.ts), built [src/components/editor/RulesConversionDialog.vue](../../src/components/editor/RulesConversionDialog.vue) with live preview diff, adjustment list, warnings banner, and lossless undo messaging, and wired `[data-open-rules-converter]` inside [src/components/rendering/WebRendererSettingsButton.vue](../../src/components/rendering/WebRendererSettingsButton.vue).
   - Verified end-to-end conversion (`2024 → 2014`) + single-step `history.undo()` rollback in [test/locale-browser-smoke.mjs](../../test/locale-browser-smoke.mjs).

2. **Cluster 2 — Track D2 & E1 Complete: Focused Help Bar, Dual-Theme Contrast Probe, CSS `!important` Burn-Down, Brace Parity, Macro Token Pills & CR Provenance (`D2.1`–`D2.3`, `E1.1`–`E1.4`, `7` items):**
   - Built non-focus-stealing [src/components/editor/FocusedHelpBar.vue](../../src/components/editor/FocusedHelpBar.vue) (`D2.1`) and mounted it inside [src/pages/MonsterBuilder.vue](../../src/pages/MonsterBuilder.vue) (`0` overflow clips across `10` views).
   - Localized settings & navigation chrome literals across `WebRendererSettingsButton.vue` & [src/components/AppDrawer.vue](../../src/components/AppDrawer.vue) (`E1.1`), and enforced brace balance & non-English `studio.*`/`help.*` parity in [test/core/I18nCoverage.test.ts](../../test/core/I18nCoverage.test.ts) (`E1.2`, `PT_BR_MIN_KEYS = 958`).
   - Added pure [src/core/domain/macro-pill-preview.ts](../../src/core/domain/macro-pill-preview.ts) (`E1.3`) rendered in [src/components/editor/MechanicTextEditor.vue](../../src/components/editor/MechanicTextEditor.vue) without altering `[data-macro-preview]` text, and pure [src/core/domain/cr-breakdown.ts](../../src/core/domain/cr-breakdown.ts) (`E1.4`) wired to clipboard copy button `[data-copy-cr-breakdown]` in [src/components/cr/CrFooter.vue](../../src/components/cr/CrFooter.vue) preserving exact `Lint` badge pixel geometry.
   - Reduced CSS `!important` ratchet ([src/css/app.scss](../../src/css/app.scss) `21 → 18`, [src/css/dark-contrast.scss](../../src/css/dark-contrast.scss) `15 → 13`, total `365 → 361` in [tools/ratchet.json](../../tools/ratchet.json), `D2.3`) and extended [test/budget-browser-probe.js](../../test/budget-browser-probe.js) (`D2.2`) to audit `FocusedHelpBar` + `RulesConversionDialog` contrast (`0` violations) and `Escape` dismissal.

3. **Cluster 3 — Track D3 Complete: Pure Open5e Parsers, Payload Coercion Warnings & Build 269 Multi-Exporter Parity (`D3.4`–`D3.5`, `6` items):**
   - Extracted pure [src/core/domain/open5e-parse.ts](../../src/core/domain/open5e-parse.ts) (`parseOpen5eActionHeader`, `parseOpen5eLegendaryCost`, `parseOpen5eAttackHeader`, `parseOpen5eAttackDamage`) and delegated from [src/components/file/importers/useOpen5eImport.ts](../../src/components/file/importers/useOpen5eImport.ts) (`862 → ~738` lines, safely `< 900`).
   - Extended [src/core/domain/file-payload-guard.ts](../../src/core/domain/file-payload-guard.ts) to warn on stripped prototype keys and legacy `acConfig.onMiss` migration, surfacing dismissible compatibility warnings in [src/components/file/useFileLoader.ts](../../src/components/file/useFileLoader.ts).
   - Added `verifyBuild269DefenseParity` to [src/core/domain/export-contract.ts](../../src/core/domain/export-contract.ts) (`D3.5`) and expanded [test/core/FileBoundaryAndOpen5e.test.ts](../../test/core/FileBoundaryAndOpen5e.test.ts).

4. **Cluster 4 — Track D4, `C5.R7`, Windows CDP Hardening & Track F Grooming (`6` items):**
   - Added `resolveEffectivePresentationPreset` (`document override > workspace > default`) and `getPrintPresetMarginBounds` (`D4.1`) in [src/core/domain/workspace-presets.ts](../../src/core/domain/workspace-presets.ts) & [test/core/WorkspacePresetsAndSections.test.ts](../../test/core/WorkspacePresetsAndSections.test.ts), plus `RUNTIME_INTERACTION_BUDGETS` & CSS ceiling assertions (`D4.2`) in [test/core/Budgets.test.ts](../../test/core/Budgets.test.ts).
   - Created structured bilingual release metadata [src/data/RELEASE_NOTES.ts](../../src/data/RELEASE_NOTES.ts) (`C5.R7`) consumed by [src/components/ChangelogContent.vue](../../src/components/ChangelogContent.vue), bumped [build.json](../../build.json) to `"272"`, and added [tools/sync-release.mjs](../../tools/sync-release.mjs) + [test/core/ReleaseConsistency.test.ts](../../test/core/ReleaseConsistency.test.ts) (`D4.3`).
   - Hardened Windows headless Chrome gate reliability (`flaky: []` across all 50 browser checks & 58 fuzz steps): ephemeral CDP port allocation (`tools/qa/browser-probe.mjs`), Windows `taskkill /T /F` process-tree teardown & `CHROME_HEADLESS_FLAGS` (`tools/qa/chrome.mjs`), and `'about:blank'` + explicit `Page.navigate` startup (`test/exhaustive-ui-fuzz.js`, `test/spell-plate-browser-smoke.js`).

## Verification & Live Parity

- **11-Step Gate (`npm run gate` on frozen `7663992`):** **`GATE PASSED: 11 steps`** (`inputFingerprint`: `1d9c4f091918755247f694c293a3eecbd785b9513d652a5e1e17e986ed34e921`, `flaky: []`).
  - `core` (`5 s`): **`713 / 713` pass** (`701` subtests, `0` fail/skipped/cancelled), `pt-BR`: **`967 / 967 (100.0 %)`**, `inventory`: **`556 / 556 (100.0 %)`**, `ratchet`: `18 / 13 / 361 / 0 / 0 / 0 / 4 / 0`.
  - `lint` (`13 s`): **`0` errors, `0` warnings**; `typecheck` (`15 s`): **`0` diagnostics (`683` resolved)**; Impeccable `detect --json`: **`[]`** (`0` findings).
  - `build` (`29 s`), `fuzz` (`194 s`), `help` (`275 s`), `spell` (`9 s`), `pages-build` (`28 s`), `pages-assets` (`0 s`), `pages-fuzz` (`497 s`): `0` retries (`Release matrix` `5 × 12` / `120` samples, `Fit inventory` `10` views / `0` clips, SPA budget `8.6 / 26.3 / 0 ms` / `12.11:1` / `0` violations, Pages budget `9.1 / 27.8 / 0 ms` / `12.11:1` / `0` violations).
  - `visual` (`203 s`): **`104 / 104` byte-exact PNG matches** vs live Build 271 production (`diffs: []`, `baselineErrors: []`, `candidateErrors: []`).
- **Live GitHub Pages Parity (`https://ivangarciafilho.github.io/DNDSheet/`):** HTTP `200` and exact SHA-256 parity verified across `index.html`, `assets/index.66944fac.js`, `assets/index.e8275f67.css`, `assets/MonsterBuilder.2c4abafb.js`, `assets/i18n.869e2a35.js`, and `assets/quasar-lang.81d129a1.js`.
