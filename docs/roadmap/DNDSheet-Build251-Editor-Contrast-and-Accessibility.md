# DNDSheet Build 251 — Editor Dark-Mode Contrast Repair, Live Parity & Forward Roadmap Audit

- **Release:** Build 251 (`v2.4.3`, post-`v2.5.0-statblock` dark-theme contrast repair)
- **Date:** 2026-11-15
- **Branch:** `build185-repairs`
- **Source Commit:** `13ed663dbf2f8561d092228c2617d96b545b1c4d` (on parent `2694780738827e591fe7a8d75166d4f994689843`, extending Build 250 `f7219a79de85725e608280629929ac2a0432e6ef`)
- **Pages Commit:** `baf9b4d088ceb933eea1d803f60e304a2724cdb8` (`gh-pages`)
- **RC Tag:** `rc-2.4.3-build-251-editor-contrast-and-ui-polish`
- **Production URL:** https://ivangarciafilho.github.io/DNDSheet/#/
- **Receipt:** [Publication Receipt](DNDSheet-Build251-Publication-Receipt.json)
- **Architecture Decision Reference:** [ADR-0003](../decisions/ADR-0003-Basics-Decomposition-Interaction-Kit-and-CSS-Grammar.md)

## Root Cause & UI Contrast Fixes Shipped (`13ed663`)

1. **Why the live editor rendered unreadable dark-on-dark controls and white-on-white dropdown menus (`CatalogSelect` + stale Pages deployment):**
   - Before Build 251 was pushed, production GitHub Pages still served Build 250 (`87c24f4`), while `CatalogSelect.vue` defaulted `:dark` to `false` inside a dark `#2c2c2c` chrome. Quasar rendered dark input text over `#2c2c2c`, and `.q-menu` popups inherited an un-darkened light card background while dark-mode overrides colored menu item text white.
   - `quasar.config.js` was aligned to `dark: true`, `CatalogSelect.vue` updated `dark: null` (inheriting `$q.dark.isActive`) with explicit dark popup classes (`:popup-content-class`), and `src/css/app.scss` added dark contrast guards for inputs, popups, and menus (`app.scss` `!important`: `44 -> 65` occurrences across `57` lines, still well below the `< 150` gate ceiling).

2. **Remaining WCAG Contrast Repairs Across Chrome, Dialogs, Popups & Routes:**
   - `src/layouts/MainLayout.vue`: Updated the `D&D 2014` ruleset toggle from amber-9 with white text (`2.29:1` fail) to `amber-4` with explicit `:text-color="editorStore.style === '2024' ? 'white' : 'grey-10'"`.
   - `src/components/library/CreatureLibraryDialog.vue`: Replaced low-contrast `warning` / `positive` / `info` / `negative` / `amber-9` chips and badges with high-contrast color pairs (`green-9`, `blue-9`, `red-9`, `amber-4` + `grey-10` via `saveBadgeTextColor`, `grey-7`).
   - `src/components/rendering/WebRendererSettingsButton.vue`: Adjusted `THEME_OPTIONS` outline badge colors (`amber-4`, `grey-4`, `blue-grey-3`, `green-3`, `purple-2`, `indigo-2`, `cyan-3`, `deep-orange-3`, `light-blue-3`, `amber-3`) for legibility against both dark menus and active rows.
   - `src/layouts/ErrorCorrection.vue`: Fixed `/reset` contrast failures (`Monster JSON` -> `light-blue-3`, `Templates JSON` -> `purple-2`, `Purge Corrupted Local Storage` -> `text-red-3`) without altering `B5.7` storage-clear policy boundaries.
   - Explicit `color="green-9"` applied to solid primary action buttons across `CombatTrackerDrawer.vue`, `ImportButton.vue`, `DatabaseStudio.vue`, `RegionalEffectsEditor.vue`, `AtWillCastingEditor.vue`, and `ActionsEditor.vue`.
   - Additional component contrast & Build 251 hardening edits across `LockToggleButton.vue`, `AiIngestDialog.vue`, `CharacterEditor.vue`, `CharacterSheet.vue`, `AutoTuneDialog.vue`, `CrFooter.vue`, `MonsterLintDialog.vue`, `useCr.ts`, `A4LayerStudio.vue`, `RandomTablesEditor.vue`, `SkillsEditor.vue`, `TemplateSearch.vue`, `AbilitiesSection.vue`, `HitPointsSection.vue`, composer subcomponents (`ChainCell.vue`, `ChainOutcomesEditor.vue`, `ComposerChain.vue`, `RoleHeaderEditor.vue`, `RollScalingPopover.vue`), `DownloadButton.vue`, `WebRenderer.vue`, `species-and-heuristics.ts`, `statblock-grammar.scss`, and `SpellsEditor.vue` (`39 files changed, 503 insertions(+), 183 deletions(-)`).

3. **Permanent Automated UI Contrast Guard (`test/budget-browser-probe.js`):**
   - Added Windows virtual key code `27` in `pressEscape()` for reliable CDP menu dismissal and expanded `scanUiContrast` across `monster-2014-header`, `library-dialog`, `combat-drawer`, `#/templates`, `#/spells`, and `#/reset` (`uiContrastViolations: 0`).
   - Verified `impeccable detect` across the modified UI files returned `0` findings, and inspected rendered screenshots across both local SPA and live GitHub Pages (`Identity + Type menu`, `D&D 2014 + Theme Settings`, `Creature Library`, `FormulaField` autocomplete, `Combat Tracker`, `#/templates`, `#/spells`, `#/reset`).

## Verification & Live Parity

- **10-Step Gate (`npm run gate`):** `GATE PASSED: 10 steps` (`inputFingerprint`: `74f3b2e18620ecde6a3195206741397449baac3ab8b20f1671d529d44acbf624`).
  - `core` (`4 s`): **`678 / 678` pass** (`666` subtests, `0` fail, `0` skipped, `0` cancelled).
  - `lint` (`18 s`): **`0` errors** (`2,740` warnings; `2,416` auto-fixable).
  - `typecheck` (`35 s`): **`48` diagnostics; `0` new; `635` resolved** vs Build 213 `e19a624` baseline `683` (`0` in `src/`, all `48` in `node_modules/`).
  - `help` (`195 s`): `npm run audit:help` **`554 / 554 (100.0 %)`** (floor `100 %`), `statblock-help-browser-smoke.js` (`Print probe: 14`, 12 theme contrast probes), `release-matrix-browser-smoke.js` (`5` shared fixtures × `12` themes; `120` computed head/body contrast samples), `tools/qa/overflow-probe.js` (`Fit inventory: 10 views, 0 clipping observations`), SPA `budget-browser-probe.js` (`keystrokeP95Ms: 9.3`, `completionOpenMs: 28.7`, `catalogSelectOpenMs: 8.6`, `headContrast: 12.11`, `uiContrastViolations: 0`), and `build250-workflow-browser-smoke.js` pass.
  - `build` (`42 s`), `pages-build` (`40 s`), `pages-assets` (`0 s`), `spell` (`10 s`), `fuzz` (`202 s`), `pages-fuzz` (`389 s`): `print-parity-browser-smoke.js` (`1588×2246` portrait/landscape A4 1-page), Pages `budget-browser-probe.js` (`keystrokeP95Ms: 12.6`, `completionOpenMs: 39.3`, `catalogSelectOpenMs: 8.7`, `headContrast: 12.11`, `uiContrastViolations: 0`), and E2E workflow smoke passed (`topPanels: 15`, `basicsSections: true`, `crZero: 0`, `crFifteen: 18`, `keyboardControlsVisited: 14`, `pickedType: "Celestial"`).
- **Live GitHub Pages Parity (`https://ivangarciafilho.github.io/DNDSheet/#/`):**
  - HTTP `200` and exact byte-for-byte SHA-256 parity verified against `dist-pages/`:
    - `index.html`: `1,337` bytes (`sha256: f695903883ed5802dcc8bc012df55a82bb7c85bb07b1f20e38b483bb2fad34ca`)
    - `assets/index.f8cec1af.js`: `933,822` bytes (`sha256: 9c24988ea0e601fb4f69542943b741b3043cce1f6826deae2e04d1462078a154`)
    - `assets/index.35424311.css`: `674,754` bytes (`sha256: b3081883309d3df0dac19b2a7eff57e0223721d5f665722573ac03a2fb180afc`)
    - `assets/MonsterBuilder.33f6bcb8.js`: `833,548` bytes (`sha256: 2c302f68fe2d851557a6ebc92fc2b5ac7faeb6107e49791c448dd33c5fe8e45f`)
  - Live Pages probe (`DNDSHEET_E2E_URL=https://ivangarciafilho.github.io/DNDSheet/#/ node test/budget-browser-probe.js`): `keystrokeP95Ms: 6.5`, `completionOpenMs: 29.1`, `catalogSelectOpenMs: 9.2`, `headContrast: 12.11`, `uiContrastViolations: 0`. Footer verified as `v2.4.3 build 251`.

## Roadmap & Code Delta Evaluation (`Track C · v2.6+`)

A structured multi-perspective codebase/specification delta audit conducted after Build 251 identified that while Track A & Track B executable backlog work remains `311 / 313` raw checkboxes complete (only owner gates `B5.7` and `H16` open), concrete technical, specification, and feature deltas remain in `src/`, `test/`, and `docs/`:

1. **Architecture & Decomposition (`C1a`, `C1b`, `C8`, `C11`):**
   - `20` logic/style files in `src/` remain `>= 900` LOC (in addition to `src/data/spells.json` at `3,268` lines): `WebRenderer.vue` (`2,988`), `species-and-heuristics.ts` (`2,765`), `useTextRenderer.ts` (`2,037`), `defense-and-traits-utils.ts` (`1,854`), `types.ts` (`1,768`), `monster-store.ts` (`1,750`), `ExportStatblock.ts` (`1,558`), `A4LayerStudio.vue` (`1,543`), `AutoSyncSpellcasting.ts` (`1,433`), `app.scss` (`1,428`), `SkillsEditor.vue` (`1,410`), `useProcessTokens.ts` (`1,406`), `formula.ts` (`1,173`), `ResistancesEditor.vue` (`1,138`), `statblock-grammar.scss` (`1,087`), `ActionsEditor.vue` (`1,037`), `useBasicsContext.ts` (`1,012`), `RadialOffsetController.vue` (`972`), `ChangelogContent.vue` (`952`), `LoreSection.vue` (`914`).
   - `116` explicit TypeScript `: any` / `as any` / `<any>` lines remain across `31` `src/` files (led by `useTextRenderer.ts` `31`, `WebRenderer.vue` `12`, `DatabaseStudio.vue` `9`, `defense-and-traits-utils.ts` `7`, `templates-store.ts` `7`).
   - `app.scss` `!important` count rose `44 -> 65` occurrences across `57` lines during Build 251 dark contrast repair; moving dark/light chrome styling into semantic CSS theme variables (`C11`) cuts override debt and enables an intentional opt-in Light Studio theme.

2. **Spec, Version & Feature Gaps (`C9`, `C10`, `C2`, `C5`):**
   - `package.json` still reports `"version": "2.4.3"` alongside Build `251` while tag `v2.5.0-statblock` shipped in Build 250; `GenericFooter.vue:91` carries a changelog update `TODO`; and [Architecture Spec](DNDSheet-Professional-Product-and-Architecture-Spec.md) still shows `☐` on shipped items (`R3–R10`, `A9–B10`, `BS-11`, `BS-41`, `SB-04/05`, `AU-02/04/05`, `UX-01..03`).
   - Genuine unimplemented product/code items: `useOpen5eImport.ts:851` (`// TODO: legendary actions`) and `:552` (`// TODO` condition note), `useImprovedInitRenderer.ts:66` (`ii.InitiativeAdvantage = false // TODO`), `TemplateSearch.vue:77` (`// TODO: link this to the template search`), `spells-store.ts:123` custom spell storage location `TODO`, `monster-store.ts:672` & `:720` (`TODO`s), `useAutoUpdateCr.ts:44` (`TODO`), `BS-39` paired normal/long range on `RangeSpec` (`src/core/domain/types.ts:678-683`), `BS-33` Help i18n (`C5`), and `10` `review`-bucket numeric inputs out of `56` in `test/inventory.mjs` (`C2`).

3. **Gate & Test Debt (`C12`, `C3`, `C4`, `C6`):**
   - `test/gate.mjs` `help` vs `pages-fuzz` coverage differs (`help` runs `statblock-help-browser-smoke.js`, `release-matrix-browser-smoke.js`, and `tools/qa/overflow-probe.js`, whereas `pages-fuzz` omits those checks against the built Pages bundle), and `test/` still holds legacy ad-hoc scripts (`capture-candidate180..182.js`, `verify-candidate182-dom.js`, `debug-statblock.js`, `test-clip.js`, `emergency-*.js`).

These items are indexed in `Track C · v2.6+` (`C1a`, `C1b`, `C2`–`C12`) in [Implementation Backlog](DNDSheet-Implementation-Backlog.md#track-c--v26-forward-roadmap-post-v250-backlog-grooming).
