## Build226 published — 2026-11-10

Published source 2114f6ba40a31d680eebc7683c39ba91ffd50e92; Pages 61fee11f1772b95983d33233ff9a3e15a30db069; tag rc-2.4.3-build-226-emergency-editor-and-spellcasting. GitHub Pages reports built. Live index, entry JavaScript, CSS and MonsterBuilder bytes match the tested Pages output. Candidate226 archived and all96 checksums verified; prior223–225 archives preserved. Original modified tracked files remain unchanged. [Publication receipt](../evidence/build226/publication-receipt.json).

## Build226 final validation

Final frozen-source gate **10/10** passed: **540 core tests (+36 versus Build225)**; **58 exhaustive browser scenarios on SPA and Pages**, plus the three emergency suites on each target (11 skill, 10 spellcasting and 6 rich-mechanic checks); 19 outcome lifecycle checks, 60 fixture/theme cases, 120 representative contrast samples and 10 fit views with no clipping observations. Zero runtime exceptions. Type guard: 559 existing diagnostics, zero new against the unchanged baseline; lint: zero errors, 2692 warnings. Existing debt remains. Publication/live verification follows.

## Build226 candidate in final verification — 2026-11-10

Isolated candidate based on Build225 receipt43315ceda1677446b1b289ad969b2207dc2067ca. Eighteen implementation acceptance changes cover emergency skill routing/persistence, source-owned spell lists and row settings, spell typography, shared action-family fields/copies/bindings and safe mechanic rich text. Review retains copied recharge visibility and authored reaction triggers. Preliminary core539 (+35 versus504); focused skills11, spellcasting10 and rich mechanics6 boolean checks passed. Final frozen-source ten-step gate is running; publication/archive/live parity remain pending. Normalized268 IDs174 complete/94 open; raw277 IDs183/94; whole-ID delta0. See docs/roadmap/DNDSheet-Build226-Emergency-Editor-and-Spellcasting.md and docs/evidence/build226/workload.json. Build225 remains the verified production release until a new receipt proves otherwise.

## Build225 published — 2026-11-09

Twelve outcome lifecycle/projection implementation items completed in the isolated Build225 clone. Final frozen-source gate **10/10** passed: **504 core tests (+18 versus refreshed base486)**; **58 exhaustive browser steps on SPA and Pages**; **19 outcome lifecycle/Apply/Cancel/reload checks**;60 fixture/theme cases,120 representative AC contrast samples and10 fit views. No browser exceptions. Type guard613 existing diagnostics/0new; debt remains. Published source 84edd95b4cf946b82aa844fa15a0303a9a06476e; Pages 08bda4e9183b6658a0aeee6ea86925555f25ac10; tag rc-2.4.3-build-225-outcome-lifecycle-and-safe-projections. GitHub Pages reports built. Live footer225 and index/entry JavaScript/CSS/MonsterBuilder byte parity verified. Prior223/224 archives preserved; candidate225 archived with all96 checksums verified. A11.5/A11.9/H11 remain open: normalized174 complete/94 open, unchanged. Browser regression covers19 lifecycle/transaction/reload checks using an isolated temporary profile. Complete Apply metadata retention fixes a data-loss defect in the previous adapter. See docs/roadmap/DNDSheet-Build225-Outcome-Lifecycle-and-Safe-Projections.md.

## Build222 verified — 2026-11-09

- Remote refreshed through Build221 source964f645. Interrupted work preserved in stash, then applied to the current base. Build219 archive96 checksums verified; current published candidate remains intact.
- Ten existing target IDs: H22,A17.1,A17.3,A17.4,A13.6,B10.1,B10.2,A17.6,A17.7,B10.3. No new IDs. Baseline measured normalized152 complete/104 open; raw161/104. Build221 headline156/100 is not supported by its checkboxes.
- Character reference-only scope, recorded AC/speed provenance and labelled estimates; shared web/text projection, JSON round trip and focused reload proof. No render-time writes.
- Five fixtures,60 theme cases/120 computed contrast samples,10-view fit inventory and failing clipped control. Runner AST/unit checks pass; real Step35 replay passed. Final frozen-source gate10/10,469 core,58 scenarios per SPA/Pages; ten existing IDs closed, normalized162/94. Published source8aa695e, Pages b65df80; live footer222 and tested asset parity verified,96 candidate checksums verified. Publication receipt records full identities.

## Build219 — 2026-11-09

- Refreshed official remote: four new commits215–218 through fullbaseac4bdaea5998e80df81d19285cc21465da16dcd3. Isolated219 clone; prior214 candidate retained.
- Source identity drift: build.json still214 and canonicaltop214 despite append218. Fix219metadata, use fullcommit+gate fingerprint as authority.
- Scope B4.20/B4.7 remaining export work;20 acceptance items, whole-task accounting separate. Root browser/docs/integration; delegated exporter/sharedtrait boundary, read-only review.
- Baseline raw265/159done106open; normalized256/150done106open. No new task IDs planned.
- Final frozen-source gate10/10:442 core,57 SPA/Pages scenarios,22 export checks. Pinia reset fixture yielded before mutations to prove automatic persistence; no forced-save workaround. B4.7/B4.20 closed; normalized150/106 →152/104. Published source64066d6, Pages d28f171; live footer219 and asset byte parity verified. Central candidate96 checksums verified; receipt records full identities.

## Build214 resumed — 2026-11-09

- Official base verified: `e19a624`; isolated clone `.codex-temp/build214`, official origin. Protected `statblock-overhaul` checkout and Build213 candidate retained.
- Ruling: finish shared outcome data-loss/formula/escaping/container repairs, then land the existing H15/H14 compiler safeguard before widening A11.5. Full A11.5/H11 remains open.
- Compiler provenance: unchanged211 and213 both683 diagnostics with pinned TS6.0.3/vue-tsc3.3.14, no normalized differences. Historical682 is not relabeled as a clean baseline. Keep app dependencies separate.
- Delegated disjoint writes: outcome core/web; compiler tooling; browser regression. Root owns integration, documentation, release and evidence. One browser fuzz at a time, no active-gate source edits.
- Final gate10/10 passed on unchanged inputs:410 core,55 scenarios on SPA/Pages; H15 closes, combined118 complete/119 open. H14 guard is partial; H11 remains open. Source5ca9379/Pages e1ab48d/tag pushed, live footer214/index+entry parity verified;97 RC checksums copied and verified in central archive. Build214 report/receipt records publication.

# DNDSheet session checkpoint - 2026-10-30

## Current verified delivery — Build213 (2026-11-09)

Release source `e55215f`; Pages `09f9945`; live footer213 verified; tag `rc-2.4.3-build-213-table-import-and-a4-print`, based on `2363765`. **H6 closed**: transactional Paste rows, global row-ID reservation, statblock-owned A4 tables, accessible headers and inspected portrait/landscape print output. Shared print fixes remove the editor splitter/clipping and notification UI; landscape now selects its actual paper orientation. Final gate9/9:400 core;54 browser scenarios on both SPA and Pages. Prior candidates and protected checkout retained.

[Build213 delivery, evidence and groomed continuation](docs/roadmap/DNDSheet-Build213-Table-Import-and-A4-Print.md) records the acceptance ruling and boundaries. Next: **H11 (A11.5 → A11.9) → H9 → H15/H14**. H13 requires three consecutive unchanged-source gates; only one final qualifying run is supplied here. H12 and owner-decision H16 remain open. Typecheck is outside the nine-step gate.

Workload: canonical219 A/B IDs106 checked /113 open (unchanged); separate18 H IDs11 checked /7 open (**+1 completed /−1 open**). Combined237 IDs117 complete /120 open versus116 /121. New scope IDs0. Historical snapshots below retain their original counts and evidence.

## Historical checkpoint — Build212 (2026-11-09)

Recovery committed/pushed as `fb73b1a`; Pages `7aff988`; official site displays212. Final nine-step gate passed (396 core;53 browser steps on SPA and Pages). All16 Markdown documents reviewed and current canonical entry points synchronized. See `docs/roadmap/DNDSheet-Build212-Recovery-and-Documentation-Sync.md`. Resume H6, then H11, H9, H15/H14; keep remaining gates explicit. Protected dirty checkout and prior candidates unchanged.

The following Build157–161 records are historical checkpoints, including headings originally marked CURRENT.

## CURRENT: Build159 binding foundation

Code2b45cff/tag rc-2.4.3-build-159-binding-foundation;eval http://localhost:9124/candidate159/index.html#/. Frozen15997hashes;protected15897verified. Existingserver/versionedassetpath;no process changes. Same9124storage,actualUI MyNewMonster+VeilofRadiance+build159;main-origin data untouched. Buildsuccessors outside servedoutput.

A9.0 fullnumeric inventory refreshed (notold18fieldsubset):ID/keyaddressing,modegates,units/bounds/sentinels,derivedvseditable,decimal/catalog exceptions,identity-poor nested phase/outcome/membership prerequisites,tracker/presentation exclusions. FontAwesome6confirmed. A9.1literalNumericBinding +dependencyOrder/detectCycles implemented in formula.ts. Requiredpure referenceSources(canonicalRef,targetPath) callback supplies authored/transitive sources;futureA9.2mustprovecompletepolicy. SCCgroups,512node/16384edgecaps,Map/Set,iterativegraphanalysis,invalid/cyclicinputneverpartialorder. Literal finitevalues bypassparser;malformedimportsfailwithfallback. No storeoverlay/undo/replace-dropdown UI shipped.

286core(+7),productionbuild,50browser zero console/runtimeerrors,5spell/12helpthemes,5savedfixtures20byteidenticalplates versus158,reload/danglingrefs stable;lint0errors/5existingwarnings. FreshSolreview2importantfindingsred→green:scientificnotationliteral andrefmodeexpressions. No newdeferredminors;158'sprevious2minorsremainrecorded. NoLaTeXcompile.

Progress88/219(40.18%),131pending,0activetaskmarkers,9/28loopsshipped,A9active2/14. A9.0/A9.1closed,noaddedscope;all3docs+outputmirrorssynced. NextA9.2fieldregistry/complete source mapping,thenA9.3/4overlay/history,A9.5/6adapter/FormulaField,A9.7rollout;AttackPaneldeleted157neverresurrect. Don'tclaimbindingspersist/reacttoUIfromfoundationtests alone. CR158allrequirementsalreadyowned;don'tduplicatebacklog.

## CURRENT: Build158 consistency and CR158 scope

Codef958cd4/tag rc-2.4.3-build-158-consistency. Frozen archive97verified hashes;protected157archive97verified. Eval http://localhost:9124/candidate158/index.html#/ on existing previewserver,versionedbase/candidate158;root/predecessor files not overwritten and no serverprocess changes. Same9124origin storage retained;actualUI confirmsMyNewMonster withVeilofRadiance andbuild158. Main-origin configured monster not reset/transferred.

InheritedWIPfinished:target-noun countagreement and shared structuredAttackBonus integrated into webstructuredcontext/composercontext/modernlegacymechanics/core2024exports. Explicitfinite0wins,spelloverride respected,rangeddefaultDEX/meleeorbothSTR. Finesse/thrown/homebrew requireauthoredbonus pendingA9.11 provenance;do not claimuniversalweapon inference. No rollcount,grids,cadencepredicate/casting/species UI implemented.

279core(+5),productionbuild,50browser(+1) zero console/runtimeerrors,5spell/12helpthemes;lint0errors/5existingwarnings. Finalunusedimportcleanup rebuild97filesbyteidentical to testedbuild. Step50 16caseprojections,composer/liveDEX/explicit0 and3textdownloads. FreshSolreview(noavailableAstralane) no blockers;2deferredminors:comma-listcustomnouninflection anddedicatednonfinitefallbacktests. Recordthese,do notclaimfixed. NoLaTeXcompile.

Newuser18-topicCR158 mapped across all3docs. Added3tasks A11.9 randomoutcometables,A12.10 compactspelllines/liveamounts/hiddencadence,B3.7 speciesproposals;expandedexistingownersforwhile/whenbloodied/HPthresholds,contextualnumericregistry,roll-vs-target-vsdamagescaling,outcome4regionlayouts,reaction/phase/activityrouting/traversal,sourcecastingmetrics,typography/selectconsistency. Progress86/219(39.27%),133pending,0active,9/28loopsclosed;zero newwhole-task closure. Next A9.0 numericinventory thenbindings;A9.11remains pendingfinesse/abilitymetadata. Canonicaldocs+mirrors synchronized;oldercheckpointsbelowhistorical.

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


## Build160 recovery and delivery

Resumed from preserved159,not the older155 log above. Build159 source inventory/dependency foundation supersedes older counts. Build160 code656c164 adds stable numeric registry, safe collection addressing, scalar inspection and exact default-context source policies.314core(+28),50browser,5spell/12help,20plate parity;focusedlint clean. New160 and protected159 each97hashes verified. Evaluation http://localhost:9124/candidate160/index.html#/. Veil of Radiance sample retained on9124;no server replacement.

A9.2 remains active:finish complex AC/death applicability and inventory/source coverage before A9.3. Pending modes fail closed;symbolic values require explicit migration. No UI adoption,store overlay or whole-task completion claimed.88/219complete,1active,130pending,9/28loops;three canonical docs and output mirrors synchronized.


## Build161 live bindings

Code6049127,tagrc-2.4.3-build-161-live-bindings.327core(+13),50browser,focused UI/store/history/reload/attack matrix/narrow/sheet/stalled-font probe,5spell/12help,20plate parity;binding-code lintclean.95/219complete(+7),A9.7active,123pending;9/28loops. Build160 preserved;161/160 each97verified hashes. Configured Veil sample retained at http://localhost:9124/candidate161/index.html#/. Canonical docs and mirrors synchronized.

Next finish A9.7 remaining numeric ownership/lifecycle consumers;then A9.11/12/13,closeout,A10. Two review minors retained under closeout:disabled-selector detach and empty-undo flag refresh. No new scope, no unverified broad mechanics closure.
