# DNDSheet Build 270 — C5 pt-BR Round 2, Quality Ratchet Burn-Down, Open5e Fixes & Backlog Convergence

- **Release:** Build 270 (`v2.5.0`)
- **Date:** 2026-11-18
- **Branch:** `build185-repairs`
- **Source Commit:** `e913cc1` (on parent Build 269 `47a0839`)
- **Pages Commit:** `38e7284` (`gh-pages`, `105` files)
- **RC Tag:** `rc-2.5.0-build-270-c5-i18n-ratchet-and-backlog-convergence`
- **Production URL:** https://ivangarciafilho.github.io/DNDSheet/#/
- **Receipt:** [Publication Receipt](DNDSheet-Build270-Publication-Receipt.json)

## Scope Delivered (`25` Track C & Cross-Cutting Convergence Items)

1. **`C5` Round 2 — Brazilian Portuguese (`pt-BR`) Domain & Preset Localization (`251 -> 533 / 919` keys, `27.4% -> 58.0%`):**
   - Translated 14 complete namespaces in [src/i18n/pt-BR/index.ts](../../src/i18n/pt-BR/index.ts): `app`, `monster` (78 keys), `import` (19 keys), `skill` (19 keys), `damageType` (32 keys), `attackType` (13 keys), `condition` (17 keys), `recharge` (31 keys), `statFull` (6 keys), `class` (12 keys), `range` (3 keys), `kind` (2 keys), `presets` (13 parameterized templates with exact `{'{'}...{'}'}` and `{0}`/`{1}` parity), and `changelog`.
   - Intentionally kept `editor` omitted in Round 2 so the English fallback smoke test in `test/locale-browser-smoke.mjs` (`editor.renderSettings === 'Stat Block Settings'`) continues passing while UI tabs are queued for `C5.R3`.
   - Raised `PT_BR_MIN_KEYS` coverage ratchet in `test/core/I18nCoverage.test.ts` from `251` to `533` (`4/4` tests pass).

2. **`C8` Round 3 — Quality Ratchet Burn-Down (`explicitAny: 22 -> 9`, `eslintDisables: 35 -> 23`):**
   - Replaced untyped `any` parameters, casts, and `eslint-disable` suppressions across `src/core/usecases/AutoSyncSpellcasting.ts` (`LegacySpellClassEntry`, `LegacyAtWillEntry`, `LegacySpellcastingInput`), `src/stores/spells-store.ts`, `src/stores/templates-store.ts`, `src/components/file/download.ts`, `src/components/file/importers/useOpen5eImport.ts`, `src/layouts/MainLayout.vue`, and `src/shims-vue.d.ts`.
   - Updated [tools/ratchet.json](../../tools/ratchet.json) via `node tools/ratchet.mjs --update`: `explicitAny` dropped `22 -> 9` (only 8 real `any` annotations left across `useFileLoader.ts`, `ChainCell.vue`, and 4 text exporters + 1 English prose occurrence `"any thinking creature"`), `eslintDisables` dropped `35 -> 23`, `filesOver900Lines: 0`, `todoFixme: 0`, `vHtml: 0`, `importantAppScss: 21`, `importantDarkContrast: 15`, `importantTotal: 365`.

3. **`C10` & `C9` Remaining Repairs + `build.json` / Changelog Convergence:**
   - Fixed Open5e attack trailing description duplication bug (`newAttack.description += newAttack.description + ...`) and normalized legendary action attack matching & cost forwarding (`monster.addLegendaryAction(id, cost)`) in `src/components/file/importers/useOpen5eImport.ts`.
   - Added `longDistance` (`BS-39` paired range) support to `supportsNumericPresentation` in `src/core/domain/numeric-presentation.ts`.
   - Exported canonical `STAT_KEYS_SHORT` constant from `src/data/STAT.ts`.
   - Aligned `build.json` (`261 -> 270`) and prepended the consolidated `v2.5.0 (Builds 250–270)` release entry in `src/components/ChangelogContent.vue`.
   - Reconciled [Spec](DNDSheet-Professional-Product-and-Architecture-Spec.md), [Backlog](DNDSheet-Implementation-Backlog.md), [Development Handoffs](DNDSheet-Development-Handoffs.md), and [Feature Matrix](DNDSheet-Feature-Matrix.md) across Builds 252–270, adding a fine-grained remaining sub-task & risk/caveat matrix (`C5.R3`–`D4.3`).

## Verification & Live Parity

- **11-Step Gate (`npm run gate` on frozen `e913cc1`):** `GATE PASSED: 11 steps` (`inputFingerprint`: `cc1362e695e63531389ba7baa7c72b8ebd3809f3951c247305df14a33a86280e`, `flaky: []`).
  - `core` (`5 s`): **`701 / 701` pass** (`689` subtests, `0` fail, `0` skipped, `0` cancelled); `node test/inventory.mjs` **`556 / 556 (100.0 %)`**, `0` unclassified `review` number inputs; `tools/ratchet.mjs` pass.
  - `lint` (`19 s`): **`0` errors, `0` warnings** across `src/` & `test/`.
  - `typecheck` (`20 s`): **`0` diagnostics; `0` new; `683` resolved** (zero-tolerance clean).
  - `build` (`29 s`), `pages-build` (`28 s`), `pages-assets` (`0 s`), `spell` (`11 s`), `fuzz` (`191 s`), `help` (`254 s`), `pages-fuzz` (`499 s`): all 25 shared browser smoke scripts pass with `0` retries (`Release matrix` `5 × 12` themes / `120` contrast samples, `Fit inventory` `10` views / `0` clips, SPA budget probe `9.3 / 28.6 / 8.3 ms` / `12.11:1` / `0` contrast violations, Pages budget probe `9.1 / 26.6 / 17.8 ms` / `12.11:1` / `0` violations).
  - `visual` (`215 s`): **`104 / 104` byte-exact PNG matches** vs live Build 269 production baseline (`diffs: []`, `baselineErrors: []`, `candidateErrors: []`).
- **Live GitHub Pages Parity (`https://ivangarciafilho.github.io/DNDSheet/`):** HTTP `200` and exact byte-for-byte SHA-256 parity verified across `index.html`, `assets/index.57421510.js`, `assets/index.5ce6c1ee.css`, `assets/MonsterBuilder.86034d09.js`, and `assets/i18n.e19a1fd8.js`.
