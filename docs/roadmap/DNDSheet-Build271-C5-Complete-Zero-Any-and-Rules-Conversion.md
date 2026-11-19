# DNDSheet Build 271 — `C5` 100% `pt-BR` + Quasar Lang, `C8` Zero-`any`, `BS-06` Reload E2E & `2014 ↔ 2024` Rules Converter

- **Release:** Build 271 (`v2.5.0`)
- **Date:** 2026-11-18
- **Branch:** `build185-repairs`
- **Source Commit:** `ef06142` (on parent Build 270 docs `9fe255f`)
- **Pages Commit:** `5b22089` (`gh-pages`, `105` files)
- **RC Tag:** `rc-2.5.0-build-271-c5-complete-zero-any-and-rules-conversion`
- **Production URL:** https://ivangarciafilho.github.io/DNDSheet/#/
- **Receipt:** [Publication Receipt](DNDSheet-Build271-Publication-Receipt.json)

## Scope Delivered (`24` Packed Actionable Items Across 4 Clusters)

1. **Cluster 1 — `C5` Complete (`100.0%` `pt-BR` Localization `533 → 920 / 920` Keys + Quasar Lang Pack Sync) (`6` items, closing Track C `13 / 13` `✅`):**
   - Extracted `SensesEditor.vue:153` inline `v-help` to i18n key `help.senses.sentienceScope` (`src/i18n/en-US/help.ts`, `src/i18n/pt-BR/help.ts`, `docs/roadmap/DNDSheet-Control-Inventory.md`), removing the last `: any` prose regex false-positive.
   - Translated all `386` remaining untranslated keys (`editor`: `343`, `io`: `35`, `error`: `8`) in [src/i18n/pt-BR/index.ts](../../src/i18n/pt-BR/index.ts), updated `locale.hint`, and raised `PT_BR_MIN_KEYS = 920` (`920 / 920 = 100.0%`) in `test/core/I18nCoverage.test.ts` (`4 / 4` pass).
   - Created [src/i18n/quasar-lang.ts](../../src/i18n/quasar-lang.ts) (`syncQuasarLang`) and wired it in `src/boot/i18n.ts` and `src/components/rendering/WebRendererSettingsButton.vue` so Quasar built-in widget translations synchronize dynamically with `en-US` / `pt-BR`.

2. **Cluster 2 — `C8` Zero-`any` & Zero-App-Disables Quality Ratchet (`explicitAny: 9 → 0`, `eslintDisables: 23 → 4` `.d.ts`-only) (`9` items):**
   - Created pure boundary validator [src/core/domain/file-payload-guard.ts](../../src/core/domain/file-payload-guard.ts) (`isPlainRecord`, `stripDangerousKeys`, `inspectMonsterPayload`) and replaced all `3` `any`s + `3` disables in `src/components/file/useFileLoader.ts` (`D3.3`).
   - Replaced `draft = ref<any>('')` with `ref<unknown>('')` + typed computed wrappers in `src/components/editor/composer/ChainCell.vue`, widened `ChainOutcomesEditor.vue` `modelValue` prop to accept raw malformed legacy drafts cleanly without losing recovery UI, and removed `vue/require-default-prop` disable.
   - Replaced all remaining renderer `any`s and disables in `useMdRenderer.ts`, `useHomebrewery3Renderer.ts`, `useImprovedInitRenderer.ts` (`ImprovedInitCreature`, preserving exact Step 51 JSON key order), and `useTarrasqueRenderer.ts` (`TarrasqueCreature`, preserving exact Step 51 JSON key order).
   - Removed the `4` stale disables in `templates-store.ts`, `2` non-null assertions in `useV1Updater.ts`, `no-unused-vars` in `CLASS.ts`, `no-explicit-any` in `SCHEMA.ts`, and template-type disables in `MechanicTextEditor.vue` (`rootStyle`) and `MonsterTextEditor.vue` (`onPickMacro`).
   - Locked [tools/ratchet.json](../../tools/ratchet.json): `explicitAny: 0`, `eslintDisables: 4` (ambient `.d.ts` files only), `filesOver900Lines: 0`, `todoFixme: 0`, `vHtml: 0`, `importantAppScss: 21`, `importantDarkContrast: 15`, `importantTotal: 365`.

3. **Cluster 3 — `C12` Event-Driven CDP Waits, `BS-06` Saved-Browser Reload Persistence (`42 / 42` Blindspots `✅`), & `C12.R4` Container Order (`3` items):**
   - Added bounded `waitFor(...)` condition polling to `tools/qa/browser-probe.mjs`; migrated `tools/qa/visual-diff.mjs` and `test/exhaustive-ui-fuzz.js` to explicit `'about:blank'` + CDP `Page.navigate` startup and reload-guarded `reloadApp()` retries.
   - Upgraded `test/locale-browser-smoke.mjs` with event-driven waits, full `pt-BR` UI + Quasar `pt-BR` assertions, zero-warning missing-key check, and full `BS-06` `Page.reload` persistence verification (mutated name, CR, HD, custom trait, Natural Armor `naturalBonus`, and `acConfig.riders`), closing Spec blindspot `BS-06` (`◐ → ✅`, `42 / 42 = 100.0%`).
   - Unified Modern Structured Reaction `descriptionContainers` ordering (`outcomes → descriptionContainers → prose`) in `src/components/rendering/useProcessTokens.ts:386-387` to match structured Actions/Traits and `text2024`, verified in `test/description-containers-browser-smoke.mjs` (`7 / 7`).

4. **Cluster 4 — Track D Domain Engineering (`D1.1`–`D1.3` Rules Converter & `D3.1`–`D3.3` Boundary/Exporter Suites) (`6` items):**
   - Implemented deterministic `2014 ↔ 2024` converter [src/core/domain/rules-conversion.ts](../../src/core/domain/rules-conversion.ts) (`previewRulesEditionConversion`, `convertMonsterRulesEdition`) with explicit loss/adjustment reports (`provenance`, casting `rulesEdition`, subclass grant warnings, `METAMAGIC_OPTIONS` cost/effect deltas) and lossless authored-spell preservation.
   - Added [test/core/RulesConversion.test.ts](../../test/core/RulesConversion.test.ts) (`D1.3`) and [test/core/FileBoundaryAndOpen5e.test.ts](../../test/core/FileBoundaryAndOpen5e.test.ts) (`D3.1`–`D3.3`).
   - Synced `build.json` (`271`), `src/components/ChangelogContent.vue` (`v2.5.0 (Builds 250–271)`), and all `docs/roadmap/` convergence ledgers.

## Verification & Live Parity

- **11-Step Gate (`npm run gate` on frozen `ef06142`):** **`GATE PASSED: 11 steps`** (`inputFingerprint`: `68cc92a3b57f28ebeb75207b9690f31474c63ebed98bca42d7d1b958f4153351`, `flaky: []`).
  - `core` (`5 s`): **`707 / 707` pass** (`695` subtests, `0` fail/skipped/cancelled), `pt-BR`: **`920 / 920 (100.0 %)`**, `inventory`: **`556 / 556 (100.0 %)`**, `ratchet`: `explicitAny: 0`, `eslintDisables: 4`.
  - `lint` (`19 s`): **`0` errors, `0` warnings**; `typecheck` (`26 s`): **`0` diagnostics (`683` resolved)**; Impeccable `detect --json`: **`[]`** (`0` findings).
  - `build` (`43 s`), `fuzz` (`189 s`), `help` (`244 s`), `spell` (`10 s`), `pages-build` (`43 s`), `pages-assets` (`0 s`), `pages-fuzz` (`441 s`): all 58 fuzz steps and 25 shared browser smokes pass with `0` retries (`Release matrix` `5 × 12` / `120` samples, `Fit inventory` `10` views / `0` clips, SPA budget `8.6 / 26.6 / 10.4 ms` / `12.11:1` / `0` violations, Pages budget `10.7 / 33.9 / 10.7 ms` / `12.11:1` / `0` violations).
  - `visual` (`205 s`): **`104 / 104` byte-exact PNG matches** vs live Build 270 production (`diffs: []`, `baselineErrors: []`, `candidateErrors: []`).
- **Live GitHub Pages Parity (`https://ivangarciafilho.github.io/DNDSheet/`):** HTTP `200` and exact SHA-256 parity verified across `index.html`, `assets/index.ea89b4fb.js`, `assets/index.5ce6c1ee.css`, `assets/MonsterBuilder.3a2345b5.js`, `assets/i18n.b9826fd0.js`, and `assets/quasar-lang.101b5b46.js`.
