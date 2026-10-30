# DNDSheet session checkpoint - 2026-10-30

## Recovery sync after HEAD9a37339

Build157/A8 closure is committed;do not repeat retirement.86/216 complete,130remaining,9/28loops shipped. Existing uncommitted work is preserved:ability-grammar noun agreement plus AbilityGrammar/ExportStatblock tests,and new structured-attack helper/tests. The helper has no production consumers yet. Review and finish that bounded consistency slice before beginning A9.0 inventory/A9.1 bindings. Check shared web/prose render contexts,ComposerChain and core exports;preserve explicit/custom/formula semantics. No fresh tests,builds or deployments run in this recovery sync. Latest handoff's9100/9106/9127 routing and storage claims were not live-reverified. Three docs contain the same recovery packet and mirrors are synchronized. Do not mistake old failed scratch157smoke logs for the corrected committed closeout.

## CURRENT: Build157 one actions module (A8 ✅, R2 ✅)

Code `b4eef8e` (retirement) + `38c4738` (orphaned `AttackPanel` deleted, byte-neutral); tag `rc-2.4.3-build-157-one-actions-module`; frozen RC with 97 verified hashes. Served on 9100 (Seraphic Herald origin; `app.monster` and `app.editor` bytes unchanged) and 9106. RC 156 stays frozen on 9127; `9124/candidate157/` is the pre-fix Codex preview and is superseded.

Hand-over: Codex hit its usage limit at 12:13 with the retirement uncommitted. Its WIP is backed up in `%TEMP%\dndsheet-a7-backup\codex-wip-157` and was finished, not redone. Fixes: the Step 49 reset locator (QEditor toolbar buttons are `<a class="q-btn">`; a reset-disabled control fails 4/4), one attribute-order lint warning, and a portable two-build `test/retirement-render-parity.mjs` in place of the build-specific script.

Proof: 274 core, production build, 49 browser steps with zero console/runtime errors, 5 spell / 12 help themes, focused lint clean. Parity 156 → 157: 6 saved monsters, 24/24 identical plates, reload round trips and dangling references stable; the 154 → 156 control fails on the deliberate heading change, as it must. LaTeX not compiled.

Progress 86/216 (39.81%), 0 active, 130 pending, 9/28 loops; A8.5–A8.8 closed, no scope added. Next: A9.0 pre-flight. `AttackPanel` is gone, so the binding inventory reads studio numeric leaves (Handoffs §6.7). Build with `DNDSHEET_BUILD_DIR` outside `dist/spa`.

## Build156 studio capability homes (historical)

Codeaf32093/tag rc-2.4.3-build-156-studio-capabilities;eval http://localhost:9124/index.html?build=156#/. Existing9124server serves dist/spa;DO NOT rebuild that directory until successor ready,use separate output. Frozen156 archive retained separately. Protected1559125archive97hashes verified;main153unchanged. Newserver-start command blocked by automatic review,genericpolicy/no detail,no retry. A later combined documentation/packaging command was also blocked;documentation was safely edited with the dedicated patch tool instead.

10files,+289/-4:stable-ID actiondisplay/phase/customheading/action+lairCR,traitsorting,legendary/mythic add/remove/cost/missingrepair. Pure entry-display/action-associations. Shared CR locktoggle now receives actioncontext. No panels retired.273core(+6),productionbuild,48browser zero console/runtimeerrors,5spell/12helpthemes,lintclean,detector[]. Review CR finding red→green;Step48 damage28/DC17 parity/reorder safety. Synchronous duplicate membership index+ID guard retained;future queued editing requires occurrence identity.

Progress82/216,1active(A8.5),133pending,8/28loops shipped;no whole-task closure/scope growth. Three docs/mirrors updated. Next exhaustive remaining panel-control/template/reset/delete audit,three saved baselines,replace legacy browserpaths,then retirement retainingVillainActionsEditor and A8.6/7/8 closeout. Evaluation origin initiallyMyNewMonster;normalUI addedVeilofRadiance actiontemplate,settingsopen. Other-origin configured user data untouched. Screenshot .codex-temp/build156-evaluation.png. Prior155 checkpoint below is historical.

Build155 delivered A8.15, code46785a0, tag rc-2.4.3-build-155-heading-grammar; independent evaluation http://localhost:9125/index.html#/. Frozen155 archive and SHA256SUMS sealed. Build154 at9123 and Build153 at main9100/9106 remain unchanged; protected153/154 each97hashes verified. Do not retry/bypass prior automatic policy rejection of running-server replacement. New155 has separate localStorage; actual fresh selection My New Monster. User configured data was not copied/reset.

9files +89/-27: composer head order, modern head, classic structured identity/cadence/cost and 2024 core action/bonus export lead. Pure abilityHeadOrder/abilityIdentity, componentsInLead flag keeps standalone text2024 compatibility. Components once beside name, classification/duration preserved. Cantrip school-beforeCantrip retained; numerical state untouched; custom preamble paths unchanged. Recharge range typography remains existing Recharge 4-12 with en dash, no schema migration.

267coretests(+3), production build,47browser scenarios zero console/runtime errors,5-theme spells,12-themehelp; lint0errors/5existingwarnings. Final independent review found HTML escaping and encoding regressions; fixed and covered. One test assertion intentionally changed from old legendary name/cost order; mutable staging run invalidated by rebuild, then final regression green on frozen155. Use explicit UTF8 bytes and never rebuild test serving roots mid-run.

Progress82/216(37.96%),134pending,0active tasks,8/28loops shipped,A8active,R2 32/36. No new scope; A8.13/14/15 complete. Three canonical docs and output mirrors synchronized. Next A8.5 exact capability/control/association ownership before panel retirement, thenA8.6 fixture parity against155,A8.7browser,A8.8closeout. Keep VillainActionsEditor; do not delete controls without working studio homes. New CR154 roll/outcome/traversal/phase/casting/generation/layout scope remains its existing A9/A11/A12/A13/B3 task IDs, no duplicates.
