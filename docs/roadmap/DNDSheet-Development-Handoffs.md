## Build 244 — Autocomplete close-out and grooming

The [Build 244 packet](DNDSheet-Build244-Autocomplete-Closeout.md) closes A10.3 (ARIA combobox on every suggestion list), A10.6 (identifier completion in custom formulas) and A10.8 (a browser smoke, now in the gate). **Groomed order from here:** A13.9 sheet density (Senses and Languages beside the scores, fewer rules, initiative as styled text) → H14 type debt (505 diagnostics; split BasicsEditor first) → A11.6/A11.7 (reaction availability and skill-group routing; much already shipped in Builds 226–241) → A12.8–A12.10 casting-source identity and compact spell lists → the B1 foundation chain.

## Build 243 — Unified text field closed

The [Build 243 packet](DNDSheet-Build243-Unified-Text-Closure.md) adds caret autocomplete in rich text and description editors, field-level formula resolution in every printed export, and the standard field with a character scope on the character sheet. Closed: H24, A10.1, A10.2, A10.4 and A10.5. Next in this area: A10.3 (combobox ARIA) and A10.6 (FormulaField completion).

## Build 242 — Unified text field

The [Build 242 packet](DNDSheet-Build242-Unified-Text-Field.md) delivers H24's core: one macro catalog, one standard text field (plain, rich and formula-aware, with scoped suggestions) and resolution on the stat block. It also advances A10.1 (catalog) and A10.5 (menus generated from the catalog). The workload is unchanged at 174 complete and 95 open; H24 stays open for caret autocomplete in rich mode and export resolution.

## Build 241 — Statblock wiring repairs

The [Build 241 packet](DNDSheet-Build241-Statblock-Wiring-Repairs.md) covers italic skill names, plates that flow under their name, the reaction trigger leading (or trailing) its text, and the regeneration, mortality and language wiring. It adds open item H24 (unified rich-text and formula input), so the normalized workload moves from 94 to 95 open. Next: H24 classification, then H14.

## Build 235 — Composition and autosave

The [Build 235 packet](DNDSheet-Build235-Composition-and-Autosave.md) records the compact casting and skill render, artwork transforms, A4 typography and text width, and browser autosave fallback. The normalized workload remains 174 complete and 94 open. Continue the shared casting catalogue and output parity items under their existing parent IDs.

## Build 230 — Spell availability and A4 output

The [Build 230 packet](DNDSheet-Build230-Spellcasting-Availability-and-A4.md) records preparation lists, restricted spell grouping, concise metamagic, single-page A4 print and PNG export. The normalized backlog remains 174 complete and 94 open.

## Build 229 — Shared spellcasting and A4 print

The [Build 229 packet](DNDSheet-Build229-Shared-Casting-and-Print.md) covers one editor for all casting sources, independent learning and grant progression, anonymous spellcasting rows, and the A4 landscape overflow regression. The normalized workload remains 268 items, with 174 complete and 94 open. The 15 acceptance changes do not close the broader casting-source migration or grant catalogue work.

## Build228 — spellcasting sources and A4 print

Each class owns its settings and spell lists. Zero class sources are supported; combined caster level and independently configurable cantrip and known/prepared limits reach the statblock. The source-owned grammar, verified grants and same-sheet A4 print projection are shared across the documented adapters.

Frozen release gate **10/10** passed with **581 core tests (+19)**, exhaustive SPA and Pages browser scenarios, casting source lifecycle and learning checks, five spell themes, and A4 portrait and landscape PDF parity. Typecheck: 515 diagnostics; 0 new; 168 resolved (approved baseline 683, Build213 e19a624). Build227 and 480 files across five prior archives remain verified. Published and verified. Source `ef9f9f59eeb350fcd324f871d68e995b117dd2e1`, Pages `3b079efb6aa4b2ce2843a30c8a63b4b426ab88d8`, tag `rc-2.4.3-build-228-spellcasting-sources-and-print`. Live index and application assets match the tested Pages build. The fresh browser footer reads `v2.4.3 build 228`. All 96 archive checksums pass.

**Workload:** 268 normalized IDs, 174 complete / 94 open before and after; delta 0. This packet implements 20 bounded acceptance changes without closing the broader source migration and catalogue parents. See the [Build228 packet](DNDSheet-Build228-Spellcasting-and-Print.md). Continue A12.8/A12.9 catalogue and identity work, and extend print tests to oversized and multipage fixtures.

## Build227 published release candidate — composition and casting (2026-11-10)

**Adapter follow-through:** the supplemental Lair/Tarrasque check passes container/plain-text retention. Existing Tarrasque movement output does not include traversal riders; finish that disclosure under A11.9/all-adapter acceptance. Build227 does not claim complete export parity.

**Published and verified.** The isolated Build227 candidate starts from remote `4128dde`; Build227 is now published; Build226 remains preserved for recovery. The original checkout, sample and prior candidates remain protected. This newest section governs current execution; the Build226 publication sections below are historical evidence.

[Build227 packet, acceptance boundaries and groomed continuation](DNDSheet-Build227-Composition-and-Casting-Candidate.md) records sixteen bounded implementation acceptance items: repaired source-owned additional containers across roles, Role first in the compositor, richer authored mechanic/presentation controls, shared cadence projection and compact spell rows, inferred multiclass state, enriched source-local filtered choices, honest capacities and explicitly configured custom resource-pool contributions. Native spell learning remains separate from custom pool contribution. Native/manual slot arrays remain authoritative, and each source keeps its explicit row recovery cadence. Numeric presentation excludes usage/recharge paths without consumer support.

**Workload is unchanged: 268 normalized IDs, 174 complete / 94 open; whole-ID delta 0, added IDs 0. Raw ledger 277 IDs, 183 complete / 94 open.** Final frozen-source gate **10/10** passed: **562 core tests (+22 versus Build226)**, exhaustive SPA/Pages browser scenarios, container lifecycle, numeric presentation, source-owned spellcasting, rich mechanics, release matrix and fit checks. Typecheck: 531 diagnostics; 0 new; 152 resolved (approved baseline 683, Build213 e19a624). Lint: zero errors, 2721 warnings. Existing debt remains. Published source 750b65868ac4a7d3cedef372cea797b83a789950; Pages ad8f8f4dcdd6dfed4b3eb2f82972eaf8c99c17c8; tag rc-2.4.3-build-227-composition-casting-and-presentation. GitHub Pages reports built; live index and application asset bytes match the tested Pages output. Build227 archived with 96 verified checksums; previous223–226 candidates and original modified checkout remain intact. [Publication receipt](../evidence/build227/publication-receipt.json).

The existing catalog lacks complete authoritative duration/casting-time metadata and complete subclass/species always-prepared grants. Capacity labels remain Legacy 2014 base-class references; authored Points/Focus/custom pool settings do not claim third-party rules automation. Continue A11.5 → A11.9 → H9/H14, with casting-source/pool identity and ruleset-aware capacity/grant work tracked separately under A12.8–A12.9. No parent ID is closed by partial emergency acceptance.

## Build226 published release candidate — emergency editor and spellcasting packet (2026-11-10)

**Published and verified.** Build226 supersedes Build225 on GitHub Pages; the Build225 candidate remains preserved. Work resumes from its receipt commit `43315ceda1677446b1b289ad969b2207dc2067ca` in the isolated Build226 clone; the protected original checkout and existing sample remain separate. The newest section governs current execution; older release headings below are historical.

The candidate implements the emergency requests across shared skill routing, source-owned spell editing, row cadence/action economy, normal-weight italic spell names, a common action-family compositor and safe rich mechanic text. [Build226 packet and acceptance boundaries](DNDSheet-Build226-Emergency-Editor-and-Spellcasting.md) records eighteen implementation changes and the remaining verification/architecture work. **Normalized workload: 268 IDs, 174 complete / 94 open before and after; whole-ID delta 0.** Raw ledger: 277 IDs, 183 complete / 94 open. No new ledger IDs or parent-task closures are claimed.

Final frozen-source gate **10/10** passed: **540 core tests (+36 versus Build225)**; **58 exhaustive browser scenarios on SPA and Pages**, plus the three emergency suites on each target (11 skill, 10 spellcasting and 6 rich-mechanic checks); 19 outcome lifecycle checks, 60 fixture/theme cases, 120 representative contrast samples and 10 fit views with no clipping observations. Zero runtime exceptions. Type guard: 559 existing diagnostics, zero new against the unchanged baseline; lint: zero errors, 2692 warnings. Existing debt remains. Published source 2114f6ba40a31d680eebc7683c39ba91ffd50e92; Pages 61fee11f1772b95983d33233ff9a3e15a30db069; tag rc-2.4.3-build-226-emergency-editor-and-spellcasting. GitHub Pages reports built. Live index, entry JavaScript, CSS and MonsterBuilder bytes match the tested Pages output. Candidate226 archived and all96 checksums verified; prior223–225 archives preserved. Original modified tracked files remain unchanged. [Publication receipt](../evidence/build226/publication-receipt.json).

### Resume and release handoff for Build226

1. Finish the focused skill reload, source-owned spell row and rich-text/shared-compositor browser checks against a freshly rebuilt candidate. A prior browser failure revealed unsaved passive editor state; the candidate adds canonical optional `passives` state. Verify the fix through automatic persistence, not a forced save.
2. Verify trait/reaction numeric paths and cross-family copied formulas after changing their referenced input; preserve unknown extension fields and source assignments through JSON/reload.
3. Inspect the changed UI and run the one prescribed Impeccable detector pass. Freeze source/tests/tools before the complete ten-step gate. Do not edit gate inputs while it runs; replace any superseded run with one complete fresh run.
4. Record actual final counts and focused checks in the Build226 report. No pending claim may be promoted to verified without its evidence. Preserve Build225 archive checksums and the original sample before publishing.
5. Refresh the official remote before committing. Publish only the tested candidate; record source, tag, Pages commit, live footer and asset byte parity in a receipt. Replace the candidate status at the top only after that proof exists.
6. Continue A11.5 stable container/region ownership and typed predicates → A11.9 random-result interaction/adapter/print evidence → H9 purpose-led help → H14 per-file type debt. Casting-source IDs/pool migration and complete ruleset capacities remain separately open under A12.8–A12.9.

## Historical verified delivery — Build225 (2026-11-09)

Outcome lifecycle and safe projection packet: twelve implementation items within A11.5, including draft identities, immutable move/copy/delete, explicit repair, complete Apply metadata retention, iterative graph diagnostics and safe table/prose projection. **Whole-ID accounting remains 174 complete/94 open of268 normalized IDs; delta0/0.** No new IDs; raw183/94 of277. A11.5/A11.9/H11 remain open.

[Build225 scope, integration findings and ordered continuation](DNDSheet-Build225-Outcome-Lifecycle-and-Safe-Projections.md). Final frozen-source gate **10/10** passed: **504 core tests (+18 versus refreshed base486)**; **58 exhaustive browser steps on SPA and Pages**; **19 outcome lifecycle/Apply/Cancel/reload checks**;60 fixture/theme cases,120 representative AC contrast samples and10 fit views. No browser exceptions. Type guard613 existing diagnostics/0new; debt remains. Published source 84edd95b4cf946b82aa844fa15a0303a9a06476e; Pages 08bda4e9183b6658a0aeee6ea86925555f25ac10; tag rc-2.4.3-build-225-outcome-lifecycle-and-safe-projections. GitHub Pages reports built. Live footer225 and index/entry JavaScript/CSS/MonsterBuilder byte parity verified. Prior223/224 archives preserved; candidate225 archived with all96 checksums verified.

### Resume contract for the next loop

Current integrated base4adb4be includes remote223/224 and post-release migration tests. Local outcome lifecycle work was preserved in a named stash before fast-forwarding. Do not replay that stash again after this integration; its retained copy is a recovery artifact.

Finish A11.5 by tracing container/region commands through UI → draft → commit → saved JSON → all render/export adapters. The previous commit adapter discarded IDs/refs/layout/tables even though the child editor displayed them; test the entire chain. Keep bare trigger labels, numeric zero, malformed sibling records and unknown extension data in the preservation fixtures. Then complete A11.9's explicit-roll-only interaction and print/adapter evidence, followed by H9 and H14. The exact counts at the top supersede unsupported historical headlines.

## Historical verified delivery — Build 223 (2026-11-09)

Delivered **Build 223** with 22 actionable engineering tasks across 5 domains, closing **A11.5** (items a, b, and c) and advancing H11: Action Description Region typed model (`ActionDescriptionRegion`), hard cap of 4 regions per container (`MAX_REGIONS_PER_CONTAINER = 4`), continuous dice roll range parsing and table overlap/gap diagnostics (`diagnoseDiceTable`), audience and plane sub-region filtering, semantic HTML/prose region exports with XSS escaping, HP rider grammar normalization ("Gains X Temporary Hit Points while not Bloodied"), speed traversal preset grammar, speed badge trailing period stripping (preventing `., ` collisions), HTML-tag aware punctuation cleaning (preventing `14. (` and `14/+4. (`), universal senses spacing normalization (eliminated unspaced `60ft` -> `60 ft.`), and expanded 2024 core rules conditions glossary (`grappled`, `prone`, `incapacitated`, `restrained`, `invisible`).

Final frozen-source gate **10/10**: **472 core tests (+3)**, **57 exhaustive browser scenarios on SPA and Pages**, help 12 themes and spell 5 themes; zero browser errors. Pinned baseline verified at exactly 613 diagnostics, 0 new diagnostics against the approved baseline. Base: `e766f8d`. Published source: `44a87af`; Pages: `039b0f7`. Release tag: `rc-2.4.3-build-223-description-containers-regions-and-grammar-hygiene`. Prior release candidates and protected files preserved.

**Measured workload:** normalized 256 IDs, **162 complete / 94 open → 164 complete / 92 open (+2 / -2)**.

[Build 223 delivery and continuation](DNDSheet-Build223-Container-Regions-Dice-Diagnostics-and-Grammar-Hygiene.md). Next: **A11.9 random-result integration → H9 purpose-led help → H14 per-file debt burn-down**.

### Historical verified delivery — Build222 (2026-11-09)

Completed **ten existing tasks**: H22, A17.1, A17.3, A17.4, A13.6, B10.1, B10.2, A17.6, A17.7 and B10.3. Character AC/speed now disclose recorded provenance or explicit estimates; identity/equipment names remain reference-only. Reusable fixtures, AST prerequisite replay, portable browser discovery, computed theme contrast, fit diagnostics and evidence-based documentation support the next model work.

Final frozen-source gate **10/10**, **469 core tests (+16 versus reproduced base453)**, **58 exhaustive browser steps on SPA and Pages**, plus **60 fixture/theme cases with120 computed AC head/body contrast samples**,10 fit views and the existing help/spell probes. Type guard613 existing diagnostics/0new; existing debt remains. Prior candidates219–221 preserved. Release tag: rc-2.4.3-build-222-character-truth-and-release-proofs. Base:964f645fe5352b8cd7c9f8908a6ebd9cbd12133e. Published source8aa695e; Pages b65df80; live footer222 and tested asset byte parity verified. Publication receipt records full identities.

**Measured workload:** normalized256 IDs, **152 complete/104 open →162 complete/94 open (+10/−10)**; raw265 IDs161/104 →171/94, including9 historical checked B183 rows. No new IDs. Build221's historical headline156/100 is not the checkbox baseline; clean-base tests reproduce453, not its headline454. The actual ledger and test command outputs govern this packet.

[Build222 delivery and continuation](DNDSheet-Build222-Character-Truth-and-Release-Proofs.md) and [feature matrix](DNDSheet-Feature-Matrix.md) record evidence and limits. A17.7/B10.3 have overlapping documentation outputs and distinct pre-existing contracts; they are not new acceptance aliases. The representative contrast/fit probes do not close all panel accessibility/zoom/print work. **Next: A11.5 stable container/region ownership and typed validation →A11.9 →H9 →H14 per-file debt.**

### Historical verified delivery — Build 221 (2026-11-09)

Delivered **Build 221** with 22 actionable engineering tasks across 5 domains: Attack & Action Bonus Typography & Grammar (+0 signed attack roll bonuses, automated target noun fallbacks), Action Prose & Outcome Grammar Sanitization (colon leading whitespace elimination, distance unit normalization, composite punctuation stripping), Skill Action Group Parentheses & Notation Cleanup (elimination of nested double parens in Search/Hide), Speed Locomotion & Senses Distance Typography, and Documentation & Provenance Ledger.

Final frozen-source gate **10/10**: **454 core tests (+1)**, **57 exhaustive scenarios on SPA and Pages**, help 12 themes and spell 5 themes; zero browser errors. Pinned baseline verified at exactly 613 diagnostics, 0 new diagnostics against the approved baseline. Base: `ed91feb`. Release tag: `rc-2.4.3-build-221-attack-sign-and-prose-grammar`. Prior release candidates and protected files preserved.

Workload (unique IDs): **256 total; 156 complete / 100 open (+2 / -2)**.

[Build 221 evidence and groomed continuation](DNDSheet-Build221-Attack-Sign-and-Prose-Grammar.md). Next: **A11.5 stable container/region ownership and typed validation → A11.9 random-result integration → H9 purpose-led help → H14 per-file debt**.

### Historical verified delivery — Build 220 (2026-11-09)

Delivered **Build 220** with 22 actionable engineering tasks across 5 domains: Domain Engine (Number & Distance Grammar, Punctuation Sanitization), WCAG Accessibility & 2024 Rule Glossary (`bloodied`, `temporary-hit-points`, `disengage`, `dodge`, `cover`), High-Contrast Spell Components & School Contrast Tokens (`#6a1b9a` / `#ce93d8`, WCAG AA 4.5:1), A4 Layer Studio Live Page Overflow Diagnostics Meter & 1-Click Quick Controls, and Typography & Trait Outcome Defensive Hygiene.

Final frozen-source gate **10/10**: **453 core tests (+11)**, **57 exhaustive scenarios on SPA and Pages**, help 12 themes and spell 5 themes; zero browser errors. Pinned baseline verified at exactly 613 diagnostics, 0 new diagnostics against the approved baseline. Base: `95a6ab6`. Release tag: `rc-2.4.3-build-220-spell-components-a4-overflow-and-typographic-grammar`. Prior release candidates and protected files preserved.

Workload (unique IDs): **256 total; 154 complete / 102 open (+2 / -2)**.

[Build 220 evidence and groomed continuation](DNDSheet-Build220-Spell-Components-A4-Overflow-and-Typographic-Grammar.md). Next: **A11.5 stable container/region ownership and typed validation → A11.9 random-result integration → H9 purpose-led help → H14 per-file debt**.

### Historical verified delivery — Build219 (2026-11-09)

Completed the remaining Tarrasque export scope **B4.20 and B4.7**, retaining Build218's Improved Initiative work. Twenty acceptance items cover shared trait/action/reaction prose, triggers, formulas, exact physical attack metadata, duplicate names, phase retention, containers, legendary definitions, innate spells, cantrips, mythic narrative, plain-text boundaries, determinism and reload. No new task IDs were created.

Final frozen-source gate **10/10**: **442 core tests (+15)**, **57 exhaustive scenarios on SPA and Pages (+1 each)**, including22 export checks; help12 themes and spell5. Type guard:613 existing diagnostics,0new; the approved683 baseline is unchanged. Prior candidates214–218 and83 protected files are preserved. Base: ac4bdaea5998e80df81d19285cc21465da16dcd3. Release tag: rc-2.4.3-build-219-tarrasque-prose-and-mechanics. Published source64066d6; Pages d28f171; live footer219 and index/entry/builder asset parity verified. Publication receipt records full identities.

Workload (unique IDs, excluding9 historical B183 rows): **256 total;150 complete/106 open →152 complete/104 open (+2/−2)**. Raw ledger:265 total;159/106 →161/104. The20 acceptance items are not20 whole-task closures. H13 retains its recorded Build215 closure; H14 debt, H22 tooling and H11/A11.5/A11.9 remain open.

[Build219 evidence and groomed continuation](DNDSheet-Build219-Complete-Tarrasque-Export.md). Next: **A11.5 stable container/region ownership and typed validation → A11.9 random-result integration → H9 purpose-led help → H14 per-file debt**. The eight-step A11.5 packet preserves migration, identity, transactional editing, export and print gates before closure. Historical status below is superseded for current planning.

 DNDSheet — Development Handoffs

## Historical verified delivery — Build214 (2026-11-09)

Outcome pipeline repairs retain filters/sectors/dice tables, resolve shared formulas in action/reaction sectors, preserve containers in prose/reaction paths, render actual tables through the web boundary and tolerate incomplete older table data. **H15 closed**: compiler tools are pinned independently; configuration replaces the ad-hoc deprecation flag. H14's new-error safeguard is delivered, with613 existing diagnostics/0new/70resolved against the683-diagnostic approved baseline. Its debt burn-down remains open. Full H11/A11.5/A11.9 is not claimed complete.

Final gate **10/10**,410 core tests,55 exhaustive browser scenarios on both SPA and Pages, help12 themes and spell5; zero browser errors. Inputs remained fingerprint-identical through the final run. Prior candidates and83 protected files are preserved. Release tag: `rc-2.4.3-build-214-outcome-pipeline-and-type-guard`; source `5ca9379`, Pages `e1ab48d`; live footer214 and index/entry-asset byte parity verified. Publication receipt records full identities.

[Build214 delivery and continuation](DNDSheet-Build214-Outcome-Pipeline-and-Type-Guard.md). Next: **H11/A11.5 stable container/region model and validation → A11.9 integration → H9 copy → H14 per-file debt**. H13 still requires three consecutive unchanged-source gates; this packet supplies one final qualifying run. H12 and H16 remain open.

Workload: canonical219 IDs106 checked/113 open (unchanged); recovery18 IDs12 checked/6 open (**+1/−1**); combined237 IDs118 complete/119 open versus117/120. New scope IDs0. Repairs and new tests are not counted as additional roadmap closures. Historical snapshots below retain their original evidence boundaries.

## Historical verified delivery — Build213 (2026-11-09)

Release source `e55215f`; Pages `09f9945`; tag `rc-2.4.3-build-213-table-import-and-a4-print`, based on `2363765`. Official live footer213 and entry-asset parity verified. **H6 closed**: transactional Paste rows, global row-ID reservation, statblock-owned A4 tables, accessible headers and inspected portrait/landscape print output. Shared print fixes remove the editor splitter/clipping and notification UI; landscape now selects its actual paper orientation. Final gate9/9:400 core;54 browser scenarios on both SPA and Pages. Prior candidates and protected checkout retained.

[Build213 delivery, evidence and groomed continuation](DNDSheet-Build213-Table-Import-and-A4-Print.md) records the acceptance ruling and boundaries. Next: **H11 (A11.5 → A11.9) → H9 → H15/H14**. H13 requires three consecutive unchanged-source gates; only one final qualifying run is supplied here. H12 and owner-decision H16 remain open. Typecheck is outside the nine-step gate.

Workload: canonical219 A/B IDs106 checked /113 open (unchanged); separate18 H IDs11 checked /7 open (**+1 completed /−1 open**). Combined237 IDs117 complete /120 open versus116 /121. New scope IDs0. Historical snapshots below retain their original counts and evidence.

## Historical verified release — Build212 (2026-11-09)

Build212 release source `fb73b1a` on `build185-repairs`; Pages `7aff988`; tag `rc-2.4.3-build-212-recovery-and-release-sync`. Live footer212 verified. Recovery restored initiative cancellation/accessibility and four historical records; all 83 protected files remain unchanged. Final gate: 396 core tests, 53 browser steps on SPA and Pages, nine steps passed. Typecheck is outside this gate.

Read [Build212 recovery and documentation reconciliation](DNDSheet-Build212-Recovery-and-Documentation-Sync.md) for the complete evidence, document conflicts and fine-grained continuation. Current delivery order: **H6 → H11 (A11.5 then A11.9) → H9 → H15/H14**. H13's three-run proof and H12 remain open; H16 needs its recorded owner decision. Preserve existing source/pool, species/provenance, binding and print acceptance requirements.

Accounting: 219 unique canonical A/B task IDs, 106 checked / 113 open; separate H ledger10 checked /8 open. These document counts do not revalidate every closure. Build212 claims **zero new whole-task closures**. Historical snapshots below retain their original counts and are superseded for current status and priority.

## Historical start snapshot — Build199 state (2026-11-08)

📍 *Handoffs › Start here* — **Historical Build199–203 entry point; the Build212 entry above governs current execution.**

**Where the code is.**
- Branch `build185-repairs` at Build203 (see `STACK_STATE.md` for the commit) on https://github.com/ivangarciafilho/DNDSheet (default branch). Tag `rc-2.4.3-build-199-inventories-and-flake-fixes`.
- Live app: https://ivangarciafilho.github.io/DNDSheet/ (branch `gh-pages`, same commit built with `PUBLIC_PATH=/DNDSheet/`).
- Release candidates: `.codex-temp/release-candidates/rc-2.4.3-build-NNN-*` (runnable `spa`, `release-candidate.json` with the gate summary, `SHA256SUMS.txt`). Local servers: 9106 → Build199, 9100 → Build185.
- `statblock-overhaul` (`F:\AI_Resources\DNDSheet`, `1869921` + 84 uncommitted paths) equals the Build184 baseline `a7cc729`; it is another agent's checkout. Do not write there.

**Workflow for every build.**
1. Work in a fresh tree from `build185-repairs` (clone, or `git archive` into a temp folder with `node_modules` linked). One writer per tree; never edit a tree whose gate is running.
2. Write the failing test first (core: `test/core/*.test.ts`; browser: fuzz step or smoke).
3. `npm run gate` — nine steps: core, lint (0 errors), build, fuzz, help smoke, spell smoke, Pages build, Pages assets, Pages fuzz. Result in `.gate/summary.json`; any failure blocks the commit.
4. An intended export change fails fuzz Step 51 and writes `test/goldens/<file>.actual`. Review it, then run `DNDSHEET_UPDATE_GOLDENS=1 npm run gate` and check `git diff test/goldens` shows only the intended lines.
5. Commit on `build185-repairs`: lowercase `feat:`/`fix:`/`docs:` subject only, no AI attribution trailers. Bump `build.json`.
6. Freeze the release candidate from `dist/spa`, tag `rc-2.4.3-build-NNN-<slug>`, push branch and tag.
7. Publish Pages: commit the `dist-pages` tree (plus `.nojekyll`) on top of `gh-pages` and push.
8. Docs: tick the Backlog task ids the build proves (with evidence and build number), update this section and `STACK_STATE.md`.

**Next slices, in order.**

| # | Slice | Input / note |
|---|---|---|
| 1 | **A11.2–A11.4** (A11.1 done in Build200: 53 inputs classified, 3 migrated) — add stable-id paths for `anatomy`, `paragonConfig.phaseConfigs` and language rows, register and migrate the 6 blocked inputs, then audit option arrays | `DNDSheet-Control-Inventory.md` (regenerate with `node test/inventory.mjs docs/roadmap/DNDSheet-Control-Inventory.md`) |
| 2 | **A13.3–A13.5** finish the kit (`HelpTip.vue`, delegated host), `help.ts` keys, `audit:help` floor; adopt `v-help` panel by panel | kit and audit done (Build202); coverage 237 / 559 = 42.4 %, floor 40 % (Build203); next: chips, toolbar, Inventory, Spells editor tips |
| 3 | **A12.10 d** print proof (a3 done in Build201: heading words in i18n) | |
| 4 | **A13.9 f2** PDF/pixel print proof with a bloodied fixture | print probe currently checks 0 bloodied numbers |
| 5 | ~~Pages d4~~ done in Build201 | first-run notice in `App.vue` |
| 6 | Partial tasks: A11.7 → A11.8 → B3.7 → B3.6 → A11.5/A11.9 → A12.8/A12.9 | Backlog §Build186 grooming lists each item |
| — | **A13.9 g2** white top plate on dark themes: keep or theme it? | design decision, ask Ivan before coding |

**Traps (newest first).**
- Code passed to `evalInPage` sits in a template literal: `\s`, `\n` lose their backslash. Avoid backslash escapes there.
- Never sleep a fixed time before reading a menu, a store or storage; poll with a bound (Steps 37, 48, 49 flaked this way).
- Pinia registers a store only when something first uses it; `pinia._s.get(name)` can be `undefined` early.
- A Vue `computed` must not write the store (the paragon rows rewrote data on render until Build190).
- Lint and the Quasar build do not catch an identifier returned from `setup()` that was never imported; only the browser fuzz does.
- PowerShell `>` writes UTF-16; write generated files from Node. Count every anchor before a scripted edit (CRLF vs LF breaks matches silently).
- Root-relative asset paths break on Pages; render them through `appAsset()`.
- `monster.CR` is an index into the CR table; set it with `setCR()` so proficiency follows.

### Workload (Backlog checkboxes)

| | Build185 `48fbbb4` | Build195 `7ffa77d` | Build199 `96403c0` |
|---|---|---|---|
| Task ids done / open (raw count) | 104 / 124 | 104 / 124 | 111 / 117 |
| Headline (Backlog rule) | 95 / 219 | 95 / 219 | 102 / 219 (46.58 %); Build200: 103 / 219 (47.03 %) |
| Acceptance sub-items done / open | 0 / 0 | 15 / 20 | 15 / 20 |

Closed since Build185: A9.11, A9.12, A11.0, A11.1 (Build200), A12.3, A12.6, A13.0, A13.8. Product defects fixed: 9. Test flakes fixed: 4.

---

## Build185 handoff — one committed baseline, one gate, one writer

📍 *Handoffs › Build185* — **Start every session from the committed branch, not from a working tree; run the whole gate; tick tasks, don't prepend summaries.**

**State.** `build185-repairs` = `a7cc729` (Builds 162–184 baseline) → `68e18bd` (Build185 repairs) → docs commit. Release candidate `rc-2.4.3-build-185-baseline-and-repairs` (runnable app inside) served on 9100/9106. `statblock-overhaul` (`1869921`) is another agent's live checkout. `a13-9-sheet-density` is superseded. Backlog §Build185 lists what is partial and in what order to converge.

### Rules adopted from the Build162–184 divergence

1. **Commit every build** on a branch before freezing its release candidate; the candidate folder must contain the runnable `spa`, never only `release-candidate.json`.
2. **The gate is `npm run gate`** (nine steps since Build195; it replaced the four manual runs), always on the final source after the last edit (plus `test/bindings-browser-smoke.mjs` when bindings change). A redesign updates the smoke it breaks in the same commit, with the reason in a comment.
3. **One writer per checkout.** A second agent works in an exported copy or its own clone and lands through commits; it never edits another agent's working tree or index.
4. **Docs ritual:** tick the task ids a build proves, update the Backlog dashboard and timeline, record partial work in the reconciliation table. Do not prepend per-build marketing summaries to Spec, Backlog and Handoffs.
5. **Contrast and print are proofs, not opinions:** any theme or vitals CSS change re-runs the 12-theme help smoke.

### Traps found in Build185

- Inline `span.name.dnd-cascade-title` ignores `transform`; tests that move a vitals title must move its row.
- `app.scss` has an `#render .statblock … .dnd-cascade-title` rule; theme overrides need `:is(#render, .composer-preview, html)` scope to win. A16.5 should delete the conflicting blocks instead.
- The help tip clamps inside the viewport; centre a target before asserting it moves.
- A fuzz step placed after `ws.close()` never runs yet exits 0; check the log for the final "ALL NN STEPS" line.
- PowerShell variables are case-insensitive (`$t` overwrites `$T`).

### Absorption audit (2026-11-08, after Build186)

The live checkout (statblock-overhaul, 84 uncommitted paths) is byte-identical to baseline `a7cc729`: no agent has written to it since Build184 (last edit 2026-11-06 15:09). Nothing is pending there. `stash@{0}` (Codex A7 composer draft, 2026-10-29, 2 files) is superseded: `ComposerChain` is mounted in `ActionsEditor.vue` since the baseline, and its preview-equality fuzz step contradicts Step 46, which requires a single rendered sheet with no composer preview. The stash is kept, not applied. The `build138` worktree is clean.

### Workload measure (2026-11-08, Builds 186–193)

Counted with `^- \[x\]` / `^- \[ \]` on the Backlog. The headline 95/219 uses its own rule; raw top-level task ids read 104 done / 124 open.

| | Build185 docs `48fbbb4` | Build193 | Delta |
|---|---|---|---|
| Task ids done | 104 | 104 | 0 |
| Task ids open | 124 | 124 | 0 |
| Acceptance items done | 0 | 12 | +12 |
| Acceptance items open | 0 | 21 | +21 |

No parent task closed: A13.9 has all items a–h ticked but keeps f2/g2 open; A12.10 has a ticked with a2/a3/b/c/d open. Defects fixed in this run: 6 (unreachable pool wording, store-writing paragon rows, white-top-plate ink on 9 themes, export cadence after colon, retired pill CSS, `/homebrew/` 404 on Pages).

Trap: lint and the Quasar build do not flag an identifier returned from `setup()` that was never imported; only the browser fuzz did (`appAsset is not defined`). Count every anchor before editing.

**Pages:** https://ivangarciafilho.github.io/DNDSheet/ serves `gh-pages`; rebuild with `PUBLIC_PATH=/DNDSheet/` and push the `dist-pages` tree there.

### Next slice

Build186 landed A13.9 items a–c (one `.dnd-num` number role, initiative on the shared `advHtml` grammar, pool counts in plain words). Build187 deleted the retired pill CSS (item d) behind a regression test. Build188 extended fuzz Step 25 with a number-role audit on the paragon fixture. Build189 closed item e (theme × template matrix) and fixed the unreachable "Pools of" wording (`describePools`). Build190 made `paragonPhaseRows` side-effect free (item h; rows materialise on first focus). Build191 added print and 12-theme initiative-ink proofs (f, g) and fixed white-top-plate ink on 9 dark themes. Build192 landed A12.10 item a (`spellLevelHeading` for exports; fixed cadence-after-colon export labels). Build194 proved A12.10 b–c in the spell-plate smoke. Build195 committed the gate as `npm run gate` (`test/gate.mjs`); every agent runs it before committing and records `.gate/summary.json` in the release candidate. The recurring fuzz Step 49 flake (Build185) has a root cause: Pinia registers the `templates` store only when a component first uses it, so a step that reads `pinia._s.get('templates')` too early sees `undefined`; Step 49 now polls for it. Build196 added golden exports (Step 51) and fixed two export defects they exposed. Golden rule: a changed export fails Step 51 and writes `<golden>.actual`; review the diff, then rerun with `DNDSHEET_UPDATE_GOLDENS=1`. Builds 197–198 closed A9.11, A12.3, A12.6 and A9.12. Flake fixed: fuzz Step 37 reloaded before the debounced save landed and read after a fixed 1.2 s; it now waits for storage and polls after reload. Build199 closed A11.0, A13.0 (`test/inventory.mjs` → `DNDSheet-Control-Inventory.md`: 56 number inputs, 12.5 % help coverage) and A13.8 (one rendered sheet), resolved a5 as a fixture error (`setCR`), and fixed the Step 48 menu-timing flake. Flake rule: never a fixed sleep before reading a menu, store or storage; poll with a bound. Next: A11.1–A11.4 numeric field classification and migration (the inventory is the input), then A13.3–A13.5 help kit and coverage audit; A13.9 f2/g2 are small follow-ups. Trap: code passed to `evalInPage` sits inside a template literal, so `\s` reaches the page as `s` (a Build189 diagnostic regex ate every "s"); avoid backslash escapes there entirely (`\n` likewise becomes a raw newline and breaks a regex literal) (print and 12-theme proofs), then A12.10 item a. Trap: a Vue computed that calls an "ensure" helper mutates state; fuzz fixtures that set `phaseConfigs: []` are refilled while BasicsEditor is mounted, then A12.10 item a (one shared heading helper for web and text exports). Track items in Backlog §Build186 grooming.

---
## Build 184 closing packet — Flush Trait/Action Headers, Per-Slider/Per-Side Radial Resets, Auto-Balanced Ability Score Grid, Composer-Aligned Plate Rows (`Exorcise` & `Astral Binding`), Enriched Durations/Catalogs & Contextual Split Rider Toggles

- **Release Candidate**: `rc-2.4.3-build-184-flush-headers-radial-resets-stat-balance-and-plate-rows`
- **Build**: `184` (previous `rc-2.4.3-build-183-radial-crop-knobs-curved-gradient-bar-and-hierarchical-plates` preserved untouched)
- **Verification Evidence**:
  - `npm test`: **361 / 361 core unit tests passed** (100% green across 51 test suites).
  - `node test/exhaustive-ui-fuzz.js`: **All 50 live CDP browser fuzz steps passed with 0 console errors and 0 runtime exceptions**.
  - `npx quasar build`: Clean build into `dist/spa` with exit code 0.
- **Key Architectural Evolutions**:
  1. **Flush Trait & Action Header Border Alignment**: Updated `.sb-plate.sb-trait-streamlined` and `.sb-single-line` in `src/css/statblock-grammar.scss` and `src/components/rendering/useProcessTokens.ts` so every `.sb-head` badge sits `0px` flush against the `.sb-plate` frame border while multi-line descriptions wrap beneath the header badge on lines 2+.
  2. **Redundant Standalone Crop Sliders Removed**: Removed duplicate `<dual-knob-crop-slider>` blocks from `A4LayerStudio.vue` now that parallel `Crop X` and `Crop Y` sliders are integrated directly into `RadialOffsetController.vue`.
  3. **Exclusive Per-Slider & Per-Side Reset Icons**: Added `resetX`, `resetY`, `resetCropXMin`, `resetCropXMax`, `resetCropYMin`, and `resetCropYMax` buttons to `RadialOffsetController.vue` and `DualKnobCropSlider.vue`.
  4. **Auto-Balanced Ability Scores & Saves**: Rebalanced `.dnd-stats-2024 .stat-table` column tracks (`minmax(22px, 0.82fr) minmax(16px, 0.60fr) minmax(20px, 0.72fr) minmax(38px, 1.66fr)`) and compact `.save` arrow styling in `WebRenderer.vue` and `statblock-grammar.scss` so `DEX 18 | +4 | +6 ▲▲` never collides or clips.
  5. **Composer-Aligned Plate Row Ordering (`Exorcise` & `Astral Binding`)**: Updated `buildPlateEntry` in `useProcessTokens.ts` so spell-like plates render `Head + Duration + Mechanics (Save DC / Attack)` on Row 1, `Scope / Targets` on Row 2, and `Outcomes / Body` on Row 3.
  6. **Enriched Durations & Categorized Tooltipped Catalogs**: Expanded `DURATIONS`, `TARGET_KINDS`, `TARGET_QUALIFIERS`, `PLANES`, and `AREA_SHAPES` in `action-composer.ts` and added categorized, alphabetically ordered, color-coded, icon-annotated, tooltipped options in `ChainCell.vue` and `BasicsEditor.vue`.
  7. **Contextual Split Riders Toggles**: Added `↳ Sub-Row` toggles directly inside the AC Decoupled Riders section and each HP Rider module header in `BasicsEditor.vue`.

---

## Build 181 closing packet — A4 Layer Occlusion, Transparent CR, Top-Aligned Traits, Streamlined Actions & Unified Spellcasting

- **Release Candidate**: `rc-2.4.3-build-181-occlusion-streamlined-actions-and-unified-spells`
- **Build**: `181`
- **Verification Evidence**:
  - `npm test`: **357 / 357 core unit tests passed** (100% green across 50 test suites).
  - `node test/exhaustive-ui-fuzz.js`: **All 50 live CDP browser fuzz steps passed with 0 console errors and 0 runtime exceptions**.
  - `npx quasar build`: Clean build into `dist/spa` with exit code 0.
  - Visual proof artifact: `candidate181-layers-traits-spells.png` in artifact directory.
- **Key Architectural Evolutions**:
  1. **A4 Layer Stack Precedence & Occlusion**: Custom layers placed above statblock in `A4LayerStudio.vue` with `blendMode: 'normal'` and 100% opacity occlude elements beneath them via dynamic descending z-index (`zIndex = (total - idx) * 10 + 10`) and `.statblock-wrapper { z-index: auto }` inside `.a4-page-sheet` isolation context.
  2. **Transparent CR Badge**: `.cr-main-region` and `.compact-nameplate-row-1 .cn-cr` background is transparent, letting parchment show through and creature name visually pop.
  3. **Top-Aligned Multi-Line Trait Labels**: `.sb-plate.sb-trait-streamlined .sb-row > .sb-cell.sb-head` uses `align-items: flex-start !important; padding-top: 5px !important;` so trait names (Arcane Condenser, Cortex) align with top of multi-line descriptions.
  4. **Streamlined Single-Row Action Plates**: Simple actions without secondary mechanics (Multiattack 'Make 2 Attacks.') collapse into a single-row plate `[Multiattack] [Make 2 Attacks.]`.
  5. **Single Unified Spellcasting Cell**: Consolidated all standard spell levels into a single unified cell (`.sb-spells-unified-cell`) with alternating line striping and removed horizontal cell divider borders.
  6. **Decoupled Regeneration & Temporary Hit Points**: `recoveryType === 'temp_hp'` with `conditionModifier === 'not_bloodied'` writes 'Gains X of Temporary Hit Points while not Bloodied'.
  7. **Defensive CR Calculations**: Optional chaining and safe fallback arrays for `crAnnotation` and `atWill` across `monster-store.ts` and `CalculateCr.ts`.

---

## Build161 continuation — visible bindings before remaining sweep

Read the new Specification contract and Backlog A9.7 packet, then the verified closing evidence. The completed pipeline uses core/domain/monster-bindings.ts, stores/binding-runtime.ts, kit/useBindings.ts and kit/FormulaField.vue. Main store actions delegate to the tested production action object. Runtime revision/errors/historySilent are nonpersisted; only authored bindings live in monster state.

Two workers reached usage limits during implementation. Their partial files were preserved and completed in this session, not counted as finished handoffs. The final independent source reviewer found no blocking defects and two minor follow-ups, recorded under A9 closeout. Subsequent target-facing checks reproduced/fixed raw-descriptor reactivity gaps with a failing computed-value test and visible sheet assertion. Do not regress safe own-property reading to arbitrary property traversal to gain Vue tracking; keep the explicit reactive adapter.

Resume A9.7 with a consumer/owner checklist and a bounded batch; no extra framework or duplicate preview. Preserve Build160 and configured origin data. Complete remaining numeric consumers and lifecycle ownership before A9.10; keep casting/outcomes/species expansion on their existing tasks. Use fresh frozen build output during browser jobs. The earlier provisional runs that failed are not final evidence; only the closing packet's successful runs count.

## Build160 continuation packet — finish A9.2 before overlay adoption

Read the Build160 Specification contract and Backlog remaining packet first. Four new pure catalog modules own descriptors, safe paths, inspection and reference sources; tests live in FieldTypes, FieldPaths, FieldInspection and ReferenceSources. No store/UI consumers have adopted them. Preserve predecessor RCs and sample storage; do not reconfigure servers.

Resume with complex mode coverage rather than starting A9.3. AC descriptors and death-prevention save/burst descriptors expose pending mode policy; inspector blocks them. Read actual BasicsEditor applicability/default/OR branches and current domain consumers before declaring those gates reviewed. Keep original optional/null/symbolic authorship intact. Numeric fields with unsupported source identities remain blocked until their existing migration owners land.

Use execution/verification and functional-core guidance; apply UI/TTRPG skills only when that scope begins. Ruling: no A9.2 completion credit from a broad registry without exhaustive ownership/gate reconciliation. Progress remains88/219,one active task,130pending,9/28loops shipped. This packet refines existing work;it adds no new task IDs.

Independent review's concrete defects were reproduced with failing tests and fixed: array readers bypassed accessors through iteration; absent literal source modes were rejected; poolCount depended on its own derived enabled flag; mixed symbolic values appeared scalar-editable. Reference review also corrected false cycles for disabled override values and raw spell ability keys. These checks do not replace saved-overlay/history/browser propagation tests in A9.3–9.

> **No loop starts unarmed, no loop ends undocumented.** For every loop of the [Implementation Backlog](DNDSheet-Implementation-Backlog.md): the goal, the exact sections of the [Specification](DNDSheet-Professional-Product-and-Architecture-Spec.md) to read, the files to open, the skills to load, the research to settle, the traps to disarm, the proofs to collect — and a closing packet that hands the next loop everything it needs.

| | |
|---|---|
| **Version** | Build161 - live numeric bindings - `rc-2.4.3-build-161-live-bindings` - Build160 preserved |
| **State at hand-over** | `6049127`,Build161 at http://localhost:9124/candidate161/index.html#/. Build160 frozen,sample retained;327core/50browser plus focused binding lifecycle pass. |
| **Shipped** | A0 · A1 · A2 · A3 · A4 · A5 · A6 · A7 · A8 (A4 closeout §6.2; A5 §6.3; A6 §6.4; A7 §6.5.2; A8 Build 157 packet) |
| **Current loop** | A9 active:9/14complete.95/219complete,A9.7active,123pending;no new scope. |

---

## Build 157 closing packet → A9

**Hand-over.** Codex reached its usage limit at 12:13 with the panel retirement uncommitted; it reports it can resume around 15:46. Its patch, changed files and logs are kept outside the repo in `%TEMP%\dndsheet-a7-backup\codex-wip-157`. The work was finished rather than redone: one test locator and one lint warning fixed, the build-specific parity script replaced by a portable two-build harness, and the orphaned `AttackPanel` deleted.

**Shipped.** `b4eef8e` + `38c4738` · tag `rc-2.4.3-build-157-one-actions-module` (on `b4eef8e`) · frozen release candidate with 97 verified hashes; the later deletion rebuilds byte-identical. A8.5–A8.8 close; loop A8 and release R2 are complete.

| Port | Serves | Note |
|---|---|---|
| 9100 | RC 157 | Evaluation origin holding the Seraphic Herald (D-20); `app.monster` and `app.editor` bytes unchanged |
| 9106 | RC 157 | Mirror |
| 9127 | RC 156 | Frozen predecessor; 97 hashes re-verified |
| 9125 · 9123 | RC 155 · RC 154 | Older frozen candidates; 9101–9121 hold earlier ones |
| 9122 · 9124 | `dist/spa` | Codex previews of a mutable folder; `9124/candidate157/` predates the fixes, so evaluate the RC instead |

**Traps disarmed.**
- QEditor toolbar controls render as `<a class="q-btn" role="button">`, not `<button>`; select them with `.q-btn`.
- In `cmd /c "… & echo %ERRORLEVEL%"`, `%ERRORLEVEL%` is expanded when the line is parsed, before the command runs. Use `cmd /v:on` with `!ERRORLEVEL!` for a real exit code.
- Build candidates with `DNDSHEET_BUILD_DIR` pointing outside `dist/spa`, so no running preview is rebuilt during an evaluation.
- Reproduce A8.6 with `node --experimental-strip-types test/retirement-render-parity.mjs <beforeUrl> <afterUrl>`; set `DNDSHEET_PARITY_EXTRA` to a saved `app.monster` value to include an evaluator's own monster.

**Next loop: A9 · NumericBinding fields (§6.7).** Start with A9.0: confirm Font Awesome 6 in `quasar.config.js` extras (BS-24), design stable-id field paths `attacks[id=…]` (BS-25) and refresh the binding inventory, including CR154-05. Attack numbers now live in the studio, so read the files §6.7 lists instead of the deleted panel. Keep A11 outcome and availability expansion out of A9.

## Build156 closing packet → finish A8.5

Code `af32093`,tag `rc-2.4.3-build-156-studio-capabilities`;evaluator http://localhost:9124/index.html?build=156#/. Frozen archive is retained separately. Existing9124server serves dist/spa:protect it from rebuild until a successor is ready and use a separate build output. Build155 remains9125,97hashes verified;main remains153. Automatic approval review blocked starting another preview server with generic blocked-by-policy/no detail;no retry or alternate start occurred. The existing preview served the verified release bytes.

Delivered complete capability homes for action display/phase/custom-heading policies,action/lair CR,trait sorting and non-destructive memberships with cost/repair. No panels removed. Progress82/216 complete,oneactive(A8.5),133pending;zero scope growth or newly closed whole tasks. Code10files,+289/-4.

Final review correction:shared CR lock toggle omitted the action context supplied by initialization. Browser reproduction changed damage28 to7 on manual→automatic;the toggle now receives action context. Green fixture also checks overriddenDC17 and correct CR target after source reorder.273core/48browser suites pass,5spell/12help themes pass;focusedlint clean;Impeccable detector[]. No reviewer minors deferred. Ruling:current synchronous membership edits retain index+ID guards and existing duplicate schema. Cost if wrong:future queued same-ID edits could target a different duplicate;add persistent occurrence identity before introducing delayed edits. No claim of concurrency-safe queued editing is made.

Evaluation9124 initially had My New Monster. Normal UI applied the existing Veil of Radiance action template and opened Display and CR settings. Configured data on other origins was not copied/reset. Screenshot `.codex-temp/build156-evaluation.png` records the actual view. Served156index/entry bytes match archive across localhost/IPv4/IPv6. No LaTeX compilation. A focused startup check needed a bounded studio-mount readiness wait;final full suite passed.

Next preparation:read the updated capability contract and Build150 control map;load execution/verification,functional-core,Impeccable Operate,UX-copy and TTRPG guidance as relevant. Inventory every remaining old-panel-only operation,then prepare three baseline fixtures and replacement browser paths BEFORE unmounting panels. Keep VillainActionsEditor. Do not fold A9/A11 numeric/outcome/availability expansion into retirement. Closing evidence must distinguish controls,fixture parity,actual panel removal and loop closure.

---

## 0. How to use this file

📍 *Handoffs › 0 Usage* — **Read the card, run the start ritual, work in small green steps, run the close ritual, write the packet.**

**Card anatomy (every loop, same order):**

```text
Goal · Release/feature · Readiness light
Entry criteria          what must be true before touching code
Read in the spec        exact sections (§)
Backlog tasks           ids
Open first              files with line ranges
Skills                  exact skill names to load
Research                questions to settle, with sources
Traps & blindspots      known pitfalls, BS-ids to verify
Plan                    numbered steps (the micro-loops)
Verify                  commands, probes, acceptance → proof
Exit                    the Done-when of the backlog, restated
Closing packet          filled at the end (template §1.5)
Next-loop prep          what to stage for the successor
```

**Readiness lights:** 🟢 ready (all entry criteria met) · 🟡 ready with open questions (defaults recorded) · 🔴 blocked (named blocker).

---

## 1. Loop protocol

📍 *Handoffs › 1 Protocol* — **The same ritual every time, so nothing depends on memory.**

### 1.1 Start ritual

```powershell
Set-Location F:\AI_Resources\DNDSheet
git status --short                      # must be empty (or only the docs mirror you are about to commit)
git branch --show-current               # statblock-overhaul
git log --oneline -3                    # note the starting commit in the packet
npm test                                # must be green before any change
Get-NetTCPConnection -LocalPort 9106 -State Listen   # inspect every IPv4/IPv6 listener and its archive root (§2.2)
```

Then: read the card · open the spec sections · load the skills · run the card's pre-flight task (`Ax.0`) · turn every surprise into a task or a blindspot **before** writing feature code (§1.6).

### 1.2 Inside the loop — micro-cycles

1. **Smallest testable step first** — a catalog, a pure function, a builder; write its test (node:test) before or with it.
2. **Green, then visible** — run `npm test`; then probe the running app in the built-in browser (§2.3).
3. **Commit at green when a slice is meaningful** — short lowercase message (§2.5); never leave the tree red at a pause.
4. **One outcome per loop** — anything else goes to the backlog as a new task in the right loop (*added Ax*).
5. **Measure, don't guess** — LOC deltas from `git diff --shortstat`, counts from scripts, colours from computed styles.

### 1.3 Close ritual

```powershell
npm test                                               # green
npx eslint --ext .js,.ts,.vue <touched files>          # 0 errors
git diff --shortstat <start>..HEAD                      # for the packet
```

Browser: reload with an error marker (§2.3 probe P1), confirm no new console errors, run the loop's probes and theme probe if it touched the renderer. Then the documentation ritual (§1.4) and the packet (§1.5).

### 1.4 Documentation ritual (order matters)

1. **Spec** — status columns (§9 dossier header, §11.1 loop table), defect/blindspot registers (§2.3, §13.2), decisions (§13.3) if any were made.
2. **Backlog** — tick tasks, header of the loop (`✅ <commit>`), dashboard counts (§1), living timeline row (§2), Now/Next/Later (§3), new tasks appended to future loops.
3. **Handoffs** — paste the closing packet into the loop's card, flip the next card's readiness light, update the top table.
4. **Mirror and commit** — the canonical files live in the outputs folder; the repository keeps a versioned mirror:

```powershell
$out = 'C:\Users\Administrador\Documents\Codex\2026-10-29\ttrpg-gm-craft-c-users-administrador\outputs'
Copy-Item "$out\DNDSheet-*.md" F:\AI_Resources\DNDSheet\docs\roadmap\ -Force
Set-Location F:\AI_Resources\DNDSheet
git add docs/roadmap
git commit -m "roadmap: close <loop id> (<one-line outcome>)"
```

### 1.5 Closing packet template

```text
Loop / tasks ............ A? · A?.0–A?.n (ticked n / total)
Outcome for the user .... one sentence
Commits ................. <start> → <end> (code) · <docs commit>
Diff .................... files · +ins / −del (git diff --shortstat)
Tests ................... npm test n / n · new tests: …
Lint .................... eslint touched files: 0 errors
Browser proofs .......... probes run + key outputs (copy the JSON lines)
Themes .................. probed themes and result (render loops)
Requirements proven ..... ids
Defects closed .......... DEF-…
Blindspots resolved ..... BS-… (answer) · new BS-… (question)
Decisions ............... D-… added/changed
Deviations from plan .... what changed and why
Known limits ............ what is still not done or not proven
Rollback point .......... <start commit>
Next loop readiness ..... 🟢/🟡/🔴 + what to stage
```

### 1.6 Blindspot expansion — before the first line of feature code

For each card: (1) open every file listed in **Open first** and confirm the line ranges still match; (2) list every assumption the plan makes about that code; (3) test each assumption with a read, a probe or a tiny script; (4) every false assumption becomes a backlog task (*added Ax*) or a blindspot row; (5) only then start the plan. This is task `Ax.0` in every loop.

---

## 2. Environment and tooling

📍 *Handoffs › 2 Environment* — **Everything a fresh session needs to be productive in five minutes.**

### 2.1 Paths and identities

| What | Value |
|---|---|
| Repository | `F:\AI_Resources\DNDSheet` (branch `statblock-overhaul`) |
| Canonical documents (versioned) | `F:\AI_Resources\DNDSheet\docs\roadmap\` |
| Evaluation mirror | `C:\Users\Administrador\Documents\Codex\2026-10-29\ttrpg-gm-craft-c-users-administrador\outputs\` · copy from canonical docs and verify SHA-256 equality |
| v1 documents backup | `outputs\_previous-v1\*.v1-0819.md` and git `b83ee56` |
| QA evidence | `test/exhaustive-ui-fuzz.js` (41 steps), `test/spell-plate-browser-smoke.js`, `test/statblock-help-browser-smoke.js`; build 147–148 logs in `%LOCALAPPDATA%\Temp\dndsheet-a7-backup\` (`e2e147.log`, `e2e148.log`, `export-probe148.log`, exported files under `exports148\`) |
| Evaluation / development | Configured sample origin 9100 and latest 9106 both serve frozen 148; exact candidates keep their own ports (148 → 9113, 147 → 9112, 146 → 9110, 145 → 9109, 144 → 9107, 143 → 9108, 142 → 9105, 139 → 9114). 9111 serves an untagged, unverified Codex staging folder for build 147 — not a candidate. Pick a free port (9115+) for mutable development |
| Built-in browser | The owner's configured sample (Seraphic Herald) lives in origin `http://localhost:9100` storage; 9106 and 9110 hold only default or probe monsters. Discover tabs each session; tab IDs are transient; a tab opened before a promotion needs a real reload (cached index). Doc check page `/__doccheck.html` is git-excluded |
| Persisted state keys | `app.monster`, `app.editor`, `app.spells`, `app.templates`, `app.combat`, `app.character` |
| Toolchain | Node 22.23 · Quasar ^2.16 · @quasar/app-vite ^1.9 · Pinia ^2 · TypeScript ^4.5 |

### 2.2 Commands

```powershell
# dev server (no auto-open)
$env:DNDSHEET_NO_OPEN = '1'; npx quasar dev --port 9110
# tests (node:test, strip-types; core imports use .ts extensions and `import type`)
npm test
node --experimental-strip-types --test test/core/Plate.test.ts      # one suite
# lint touched files
npx eslint --ext .js,.ts,.vue src/components/rendering/plate.ts
# e2e against the immutable candidate (headless Chrome CDP port 9223)
$env:DNDSHEET_E2E_URL = 'http://localhost:9107/index.html#/'
npm run test:e2e
# production build
npx quasar build
```

### 2.2.1 Candidate promotion and browser-state continuity

1. Build `dist/spa`, copy into a new `.codex-temp/release-candidates/<tag>/spa`, and validate that archive on an isolated port. Never point a protected/latest evaluation server at mutable `dist/spa`.
2. Commit/tag the code; record evidence in `release-candidate.json`; generate and verify `SHA256SUMS.txt` (excluding itself). Preserve the prior artifact/tag before promotion.
3. Inspect every IPv4/IPv6 listener and confirm identity/root before stopping one. Both addresses must serve the same frozen archive. Build 144 corrected a stale IPv6 server serving mutable dist while IPv4 served archived 143.
4. After proofs pass, promote the new archive to `localhost:9100` (the origin holding the owner's configured sample, D-20) and to `localhost:9106`. Move the previous candidate to a free port instead of stopping it. Serve 9100 with `python -m http.server <port> --directory <archive>\spa` so the root URL keeps working; `.codex-temp/serve-build.js` only serves explicit file paths (`/index.html`). Use a hidden persistent server process that outlives the tool call.
5. Compare served index/asset hashes on `127.0.0.1`, `[::1]` and `localhost`; verify the visible footer and predecessor checksums. Retaining the origin preserves configured `app.monster` state without storage migration or fixture overwrites.
6. Mutable development uses a free port (9115+); 9110 serves exact 146. Browser tests use isolated temporary profiles. Inspect actual roots/processes each session; HTTP 200 and an open tab alone do not identify a release.

### 2.3 Built-in browser probes (run with the JavaScript tool on tab `seed`)

**P1 · reload with an error marker** — then read console errors; the marker must be the last error.

```js
console.error('MARK-' + Date.now()); setTimeout(() => location.reload(), 50); 'ok'
```

**P2 · load the Seraphic Herald fixture** — paste the content of `%TEMP%\dnd-fixture-seraph.js` (it patches the `monster` and `editor` Pinia stores through `#q-app.__vue_app__`).

**P3 · plates and rows**

```js
({
  plates: [...document.querySelectorAll('#render .sb-plate')].map(p => p.innerText.replace(/\s+/g, ' ').slice(0, 160)),
  rows: [...document.querySelectorAll('#render .dnd-cascade-panel, #render .sb-row')].map(r => r.innerText.replace(/\s+/g, ' ').slice(0, 100)),
})
```

**P4 · theme probe** (computed colours across themes; restores the class afterwards)

```js
(() => { const sb = document.querySelector('#render .statblock'), p = document.querySelector('#render .sb-plate'), orig = sb.className, out = {};
  for (const t of ['theme-wotc','theme-printer','theme-lovecraft_golden','theme-lovecraft_spooky','theme-art_nouveau']) {
    sb.className = orig.replace(/theme-[a-z_]+/, t);
    const h = getComputedStyle(p.querySelector('.sb-head')), c = getComputedStyle(p.querySelector('.sb-cell:not(.sb-head)'));
    out[t] = { head: h.backgroundColor + ' / ' + h.color, cell: c.backgroundColor + ' / ' + c.color, frame: getComputedStyle(p).borderTopColor };
  } sb.className = orig; return out })()
```

**P5 · quick overflow probe** (formal version arrives in A13)

```js
[...document.querySelectorAll('.q-page *')].filter(e => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible').slice(0, 20).map(e => e.className.toString().slice(0, 60))
```

**P6 · formula macros**

```js
const m = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster'); m.name
```

*(Use P6 as the entry point to inspect store values; render checks go through the stat block DOM.)*

### 2.4 QA helpers

| Script | Usage |
|---|---|
| `dnd-shot.mjs` | `node dnd-shot.mjs --url <url> --out <png> [--w 1600] [--h 1200] [--setup <js>] [--selector <css>] [--eval <js>] [--wait 600]` — headless Chrome screenshot + probe |
| `dnd-fixture-seraph.js` | Seraphic Herald fixture (CHA caster, advantage on Religion, Soul Barrage and Veil of Radiance) |
| `dnd-splice.mjs` | `node dnd-splice.mjs <file> <startMarker> <endMarker> <replacementFile> [--include-end]` — replace a marked block |
| `dnd-skills-editor.mjs` | One-off refactor script from A1 (reference only) |
| `public/__doccheck.html` | Mermaid parse check of `docs/roadmap/*.md` (`?files=a.md,b.md`); git-excluded |

### 2.5 Git conventions

- One branch: `statblock-overhaul`; commit at green; never rewrite pushed history (nothing is pushed — work is local).
- Messages: short lowercase phrase describing the user-visible change, matching the history (`formula engine for references, custom formulas and text macros`).
- **No AI-attribution trailers** (no `Co-Authored-By`, no session links, no "Generated with") — owner rule, overrides tooling defaults.
- Docs commits use the `roadmap:` prefix (`roadmap: close A4 (spellcasting plate)`).

### 2.6 Environment traps (learned the hard way)

| Trap | Effect | Do instead |
|---|---|---|
| `$env:TEMP` resolves to `F:\temp` in some shells | scripts written to `C:\…\AppData\Local\Temp` not found | use absolute paths |
| .NET `[IO.File]` with relative paths | resolves against the process cwd, not `Set-Location` | absolute paths |
| Reading screenshots as files (`read_media_file`) | dumps ~94 k tokens of base64 | use the browser `screenshot`/`zoom` actions at scale ≤ 0.7 |
| Puppeteer/Playwright MCP | detached frames, missing browsers | built-in browser + `dnd-shot.mjs` |
| Vite serving an `.html` outside `public/` | HTTP 500 | put ad-hoc pages in `public/` and git-exclude them |
| HMR after a half-applied edit | page blank, stale errors in console | reload with P1 and judge only errors after the marker |
| Legacy `!important` rules | new styles "do nothing" | scope under `#render .statblock`, use tokens (§4.1 of the spec) |
| Device bridge drops in long sessions | lost context | commit at green; write the packet before long steps |
| `public/__doccheck.html` is git-excluded but `quasar build` copies `public/` into `dist/` | a QA page in a release build | delete it before release builds; A17 moves it to `tools/qa/` |
| Remote shell calls end after ~60 s | builds and the 41-step e2e outlive the call; output looks missing | start long jobs with `Start-Process` (hidden) writing a log plus an exit marker, then poll the log |
| Finding Vue components by name in a production build | `type.name` lookups miss and `setupState` is undefined | drive the real control (toolbar Open File, download menu) and read stores through `#q-app.__vue_app__` |
| Comparing previews with sheet entries | traits render as `.trait` on the sheet but `.action` in previews | search `#render .statblock :is(.trait, .action)` and compare `innerHTML` |
| Toolbar after app mount | the header can render a beat after `#q-app` mounts | poll for `header .mdi-folder-open` before clicking |
| Composer previews carry `.statblock` | bare `document.querySelector('.statblock')` hits a preview first | scope queries to `#render .statblock` (BS-40) |
| A collapsed studio expansion | hidden chips cannot take focus; keyboard steps silently fail | expand `.q-expansion-item--collapsed` ancestors before focusing a chip |

---

## 3. Skills library

📍 *Handoffs › 3 Skills* — **Load the skill before the work it governs; every name below exists in this environment.**

| Skill (exact name) | Use it for | Loops |
|---|---|---|
| `superpowers:writing-plans` | Turning a card's plan into ordered micro-steps before coding | every loop with ≥ 6 tasks |
| `superpowers:executing-plans` | Working through the task list with checkpoints | every loop |
| `superpowers:test-driven-development` | Catalogs, builders, resolvers, grammars — test first | A4, A6, A9, A10, A12, B1–B5 |
| `superpowers:systematic-debugging` | Any probe output that contradicts the plan | as needed |
| `superpowers:verification-before-completion` | Close ritual — evidence before claims | every loop |
| `superpowers:brainstorming` | Open interaction design (chain UI, kit anatomy) | A7, A13 |
| `superpowers:requesting-code-review` | L-size loops before closing | A8, A9, A14, B5 |
| `engineering:architecture` | Boundaries, ADR-worthy choices | A6, A9, A12, B1, B5 |
| `backend-development:architecture-patterns` | Ports/adapters, repository, session adapter | B1, B5 |
| `documentation-generation:architecture-decision-records` | Writing D-records (D-11, D-13, B-track decisions) | A9, A12, B1, B5, B8 |
| `engineering:testing-strategy` | Fixture design, golden strings, test pyramid | A4, A6, A17 |
| `developer-essentials:e2e-testing-patterns` | CDP e2e update | A17 |
| `developer-essentials:error-handling-patterns` | Broken bindings, metric failures, save errors | A9, A12, B5 |
| `code-refactoring:refactor-clean` | Pure-move splits, panel retirement | A8, A14, A16 |
| `code-refactoring:tech-debt` | CSS `!important` paydown, debt table | A16 |
| `impeccable:impeccable` | Visual quality of plates, rows, chain, kit | A4, A5, A7, A13–A16 |
| `frontend-design` | Distinctive, intentional look for new UI | A7, A13 |
| `ui-design:visual-design-foundations` | Typography, hierarchy, colour roles of the grammar | A4, A5 |
| `ui-design:interaction-design` | Chain cells, completion, select behaviour | A7, A10, A13 |
| `ui-design:design-system-patterns` | Tokens, kit components, catalogs | A13 |
| `ui-design:responsive-design` | Fit contract, narrow mode | A14–A16, B7 |
| `ui-design:accessibility-compliance` | ARIA combobox/listbox/tooltip, WCAG 1.4.13 | A10, A13–A16 |
| `design:accessibility-review` | Close-ritual accessibility pass | A10, A13–A16, B7 |
| `design:ux-copy` | Short labels, HelpTip copy, error messages | A5, A13–A16, B2 |
| `design:design-critique` | Owner-facing review of visual loops | A4, A5, A7, A16 |
| `anthropic-skills:ttrpg-gm-craft` | Rules accuracy (2024 grammar, metamagic, spells, actions) | A4, A6, A12, B3 |
| `anthropic-skills:built-in-browser` | Every browser probe | every loop |
| `context7:docs` | Current Quasar/Vue/Pinia API details | A9, A10, A13 |
| `modern-web-guidance:modern-web-guidance` | Caret geometry, `:has()`, modern CSS/DOM APIs | A5, A10, A13 |
| `avoid-ai-writing:avoid-ai-writing` | Release notes, README, help dictionary copy | A13, A17, B10 |
| `skill-forge-essentials:ai-debt-detector` | Spotting generated-code debt during sweeps | A16, A17 |

---

## 4. Research library

📍 *Handoffs › 4 Research* — **Where facts come from, and the open questions each loop must settle before it builds.**

### 4.1 Sources

| Topic | Source | Extract |
|---|---|---|
| Search / Study / Influence / Hide | [Free Rules 2024 — Rules Glossary](https://www.dndbeyond.com/sources/dnd/free-rules/rules-glossary) | skill lists, DC 15 Hide |
| 2024 stat block grammar | [How to Use a Monster (2024)](https://www.dndbeyond.com/sources/dnd/br-2024/how-to-use-a-monster) | Attack Roll lines, Hit/Miss, Recharge X–Y, Spellcasting placement |
| Metamagic costs (2024) | [dnd2024.wikidot — Sorcerer Metamagic](http://dnd2024.wikidot.com/sorcerer:metamagic) | 10 options and costs |
| SRD subclasses | [Open 5e SRD explorer](https://dnd5esrd.vercel.app/explore/subclasses) · [D&D Beyond SRD page](https://www.dndbeyond.com/srd) | the 12 SRD subclasses; SRD licence (CC BY 4.0) |
| 2014 rules cross-check | [5e SRD (5esrd.com)](https://www.5esrd.com) · [dnd5e.wikidot](https://dnd5e.wikidot.com) | 2014 values for ruleset-aware catalogs |
| Quasar components | [QSelect](https://quasar.dev/vue-components/select) · [QTooltip](https://quasar.dev/vue-components/tooltip) · [QEditor](https://quasar.dev/vue-components/editor) · [QMenu](https://quasar.dev/vue-components/menu) · [QVirtualScroll](https://quasar.dev/vue-components/virtual-scroll) | slots, events, virtual scroll, caret helpers |
| Vue | [Custom directives](https://vuejs.org/guide/reusability/custom-directives.html) | `v-help` lifecycle |
| Pinia | [Pinia docs](https://pinia.vuejs.org/) · [persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) | `$patch`, `$subscribe`, hydration of new keys |
| Caret geometry | [MDN Range.getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Range/getBoundingClientRect) · [textarea-caret-position](https://github.com/component/textarea-caret-position) | contenteditable and input caret rectangles |
| Accessibility | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) · [APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) · [WCAG 1.4.13](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html) · [1.4.10 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html) | roles, keys, dismissal, reflow |
| CSS `:has()` | [MDN :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) | support matrix |
| Diagrams | [Mermaid](https://mermaid.js.org/intro/) | syntax for doc updates |

### 4.2 Standing research questions

| Loop | Question | Default if unresolved |
|---|---|---|
| A4 | Sorcerer *Font of Magic* conversion table (2024) for the Metamagic head tip | Tip omits numbers, links the class |
| A4 | Multiclass head title format (BS-18) | "Warlock 5 / Sorcerer 10 (CHA)" |
| A5 | Should the classic template change? (BS-12) | Untouched |
| A6 | `<1d0>` typo (BS-22); economy chip in plates (BS-23) | `1d10`; no chip inside sections |
| A8 | Villain actions and CR cards (BS-26, BS-27) | Villain stays a panel; CR cards stay in studio |
| A9 | Decimals in formulas (BS-16) | Integers only |
| A12 | PHB'24 prepared-spell table; SRD subclass expanded lists; multiclass slots (BS-29, BS-30) | SRD 5.2.1 values; others custom |
| A13 | Ordinal ordering (Q-1); localisation of help (BS-33) | Natural order for ordinals; English |

---

## 5. Release checklist (R1 … R10)

📍 *Handoffs › 5 Release* — **A release closes only when this list is green on one commit.**

- [ ] Every loop in the release is ✅ with a closing packet in §6.
- [ ] `npm test` green; ESLint 0 errors on every file touched by the release.
- [ ] Acceptance rows of every dossier in the release proven (tests, probes, screenshots listed in packets).
- [ ] Theme probe for render-affecting releases (R1, R5, R6): 5 themes minimum, 12 at R6.
- [ ] No open high-severity defect in the release's scope (spec §2.3).
- [ ] Spec status columns, backlog dashboard and timeline, handoff cards updated.
- [ ] Docs mirror committed (`roadmap: release Rn`).
- [ ] R6 only: `npx quasar build` clean; `npm run test:e2e` green; README and STACK_STATE rewritten from evidence; local tag `v2.5.0-statblock`.

---

## 6. Loop cards

📍 *Handoffs › 6 Cards* — **Shipped loops keep their closing packets; the next loop is fully armed; later loops carry everything known today and are re-armed at their pre-flight.**

### 6.1 Shipped — closing packets

#### A0 · Baseline snapshot ✅

```text
Loop / tasks ............ A0 · A0.1–A0.4 (4 / 4)
Outcome for the user .... the local work is frozen and reviewable; QA tooling (dev server, fixture) ready
Commits ................. 387f827 (upstream) → 52355c2
Diff .................... 135 files · +41 791 / −2 884 (pre-existing local work, not authored in this overhaul)
Tests ................... npm test 69 / 69 at baseline
Browser proofs .......... Seraphic Herald fixture renders on http://localhost:9100
Known limits ............ STACK_STATE.md claims not reproduced (BS-03)
Rollback point .......... 387f827
Next loop readiness ..... A1 🟢
```

#### A1 · Check rows + whole-label advantage ✅

```text
Loop / tasks ............ A1 · A1.1–A1.9 (9 / 9)
Outcome for the user .... skills read as Search / Study / Influence / Hide rows; no duplicate Skills row; advantage colours the whole label
Commits ................. 52355c2 → 574f196
Diff .................... 9 files · +868 / −486
Tests ................... 79 / 79 · new: SkillActionGroups.test.ts (10)
Browser proofs .......... "Search ACTION 13/+3, (15, +5 Insight)" · "Study ACTION 11/+1, (13, +3 Investigation; 15, +5 Medicine; 18, +3 Religion ▲▲)"
                          · "Influence ACTION 15/+5, (17, +7 Persuasion)" · "Hide BONUS ACTION 11/+1, (13, +3 Sleight of Hand)" · no Skills row
Requirements proven ..... CHK-001…004, SBG-003 (rows)
Decisions ............... D-01 (owner skill groups)
Known limits ............ text exports may still print a Skills line (BS-13)
Rollback point .......... 52355c2
Next loop readiness ..... A2 🟢
```

#### A2 · Formula engine, references and text macros ✅

```text
Loop / tasks ............ A2 · A2.1–A2.8 (8 / 8)
Outcome for the user .... {…} macros and formulas render correct numbers anywhere; no code execution from text
Commits ................. 574f196 → be0cf3f
Diff .................... 8 files · +1 409 / −106
Tests ................... 98 / 98 · new: Formula.test.ts (18) + ProcessTokens macro case (1)
Browser proofs .......... {CANTRIP_DICE d10} → "16 (3d10)" · {spellcasting.attack} → "+7" · {HIT_DIE} → "4 (1d8)"
                          · {8 + PB + CHA_MOD} → "15" · {spellcasting.nonsense} left verbatim
Requirements proven ..... REF-001, REF-003…006
Decisions ............... D-04 (small grammar, no eval)
Known limits ............ fields still store flat numbers (A9); no caret completion yet (A10)
Rollback point .......... 574f196
Next loop readiness ..... A3 🟢
```

#### A3 · Plate grammar for abilities ✅

```text
Loop / tasks ............ A3 · A3.1–A3.5 (5 / 5)
Outcome for the user .... traits, actions, attacks, reactions and legendary entries are framed plates with crimson heads and parchment cells
Commits ................. be0cf3f → c543615
Diff .................... 4 files · +494 / −186
Tests ................... 103 / 103 · new: Plate.test.ts (5)
Lint .................... 0 errors (two quote warnings fixed in useProcessTokens.ts)
Browser proofs .......... WotC: head rgb(88,24,13) / ink rgb(253,241,220); cells rgb(251,242,227); body stripes 24 px / 48 px at line-height 24 px;
                          container frame removed; console clean after a marked reload
Themes .................. wotc · printer · lovecraft_golden · lovecraft_spooky · art_nouveau — palettes applied
Requirements proven ..... SBG-001…004; SBG-005 for 5 themes
Blindspots resolved ..... BS-01 (plate WIP was this overhaul's own work) · BS-02 (app runs from the tree)
Decisions ............... D-03 (shared visual grammar; rendering follows content type; supersedes the initial one-builder hypothesis)
Deviations from plan .... the plate builder started before a context reset; CSS finished and committed in this loop
Known limits ............ spellcasting still legacy markup (A4); top rows legacy (A5); e2e expectations (A17)
Rollback point .......... be0cf3f
Next loop readiness ..... A4 🟢
```

---

### 6.2 A4 · Spellcasting plate — ✅ CLOSED `f35cd6d` · verified follow-up `ae16b86`

| | |
|---|---|
| **Goal** | Class and innate spellcasting render through shared plate grammar: summary, metamagic, cantrips, level rows and spell cells |
| **Backlog tasks** | A4.0–A4.12 · all complete |
| **Implementation** | Pure projections in `src/core/domain/spell-plate.ts`; shared cadence and metamagic catalogs; Vue text-bound rows in `WebRenderer.vue`; shared grammar SCSS; localized label |
| **Measured impact** | 12 files · +802 / −389 · commit `f35cd6d` |
| **Tests** | `npm test` 111 / 111 · `npm run build` passes · targeted browser smoke passes class and innate fixtures across five themes · targeted lint 0 errors (existing warnings remain) |
| **Closeout follow-up** | `ae16b86` hides the generic class preamble already represented by the plate while preserving enabled custom preambles; it aligns browser checks with semantic advantage wrappers and the no-duplicate Skills row contract. |
| **Verification** | `npm test` 111 / 111 · `npm run build` succeeds · focused spell smoke passes across 5 themes · full e2e passes all 23 groups with 0 runtime exceptions · touched-path lint 0 errors (existing warnings remain). |

**Decisions confirmed** — retain pure domain projections as the testable boundary; render typed spellcasting rows with Vue text nodes; do not manufacture missing slot/point values; keep innate casting separate; edition-specific Metamagic effect text is distinct; cadence catalog is shared with editor and text renderer. Spellcasting does not add another `v-html` surface.

**Closeout / next-loop preparation**

- A4 is complete and committed. Its acceptance includes the core suite, build, focused browser smoke, and the passing full UI suite stated above.
- A5 is closed at `8487335` and tagged as `rc-2.4.3-build-135-a5`; its final-state theme and A4 print evidence is retained in `docs/evidence/a5/`. The earlier build 134 candidate remains preserved at `a6c87e4`.
- The original A5 historical screenshot baseline was unavailable. Final screenshots and measured contrast are evidence of the delivered state only; do not claim historical pixel parity. Formula derivation remains scoped to A9.
- A15.7 aligned Step 25 with the no-duplicate Skills-row contract; grouped skill/tool content and row absence now pass.
- Full e2e passed 33 scenario steps with zero runtime exceptions on 2026-10-29; retain A17 as the regression gate after later rendering or interaction changes.

---
### 6.3 A5 · Row grammar + head tooltips — ✅ CLOSED `8487335` · `rc-2.4.3-build-135-a5`

| | |
|---|---|
| **Goal** | Top-block rows adopt the head/data grammar and tokens; every row head and plate head explains itself (delegated tooltip host) |
| **Release · feature** | R1 · SB-05 |
| **Entry criteria** | A4 ✅ · A5 implementation and verified behaviors closed; original dirty edits were preserved through this commit |
| **Read in the spec** | §9 SB-05 · §4.1, §4.5 · §6.4 · §13.2 BS-12, 14, 19, 20 · D-09 |
| **Backlog tasks** | A5.0 – A5.9 complete; e2e Steps 18/20 pass; A5.6 final evidence at `docs/evidence/a5/` |
| **Open first** | Closed packet: `WebRenderer.vue`, `statblock-help.ts`, `useProcessTokens.ts`, shared cascade styles and print CSS were reviewed. Twelve final-state theme screenshots, A4 preview screenshot and one-page A4 PDF are retained. Historical screenshots are absent; contrast/token probes and visual review support final-state claims, not historical pixel parity. Formula derivation remains A9 NumericBinding and is never inferred from renderer text. |
| **Skills** | `ui-design:visual-design-foundations` · `impeccable:impeccable` · `design:ux-copy` · `modern-web-guidance:modern-web-guidance` · `anthropic-skills:built-in-browser` · `superpowers:verification-before-completion` |
| **Research** | WCAG 1.4.13 behaviour for the host; event delegation with `mouseover/focusin` on `#render` |
| **Traps** | Do not claim historical pixel parity: baseline is absent · do not infer numeric provenance from rendered strings · retain delegated events because descendants can be replaced |
| **Plan** | Closed: print stage/shell sizing fix → capture theme/A4/PDF evidence in fresh browser profile → core/build/lint/help/spell/full UI checks → roadmap reconciliation; formula provenance remains A9 |
| **Verify** | 12 screenshots; `pdfinfo` confirms 1 A4 page; e2e Steps 18/20; `.sb-head`/row semantics; focus/ARIA/Escape/detach/scroll/resize; recharge wording; CSS delta; full e2e |
| **Exit** | ✅ SBG-010…012, HELP-002, TIP-006 (statblock), 12-theme contrast and one-page A4 print proven |
| **Defaults** | BS-12 classic template untouched · BS-14 row named "Other checks" · BS-20 ability grid unchanged |
| **Next-loop prep** | A6 is armed by §6.4: inspect real action entries in templates and AI ingest, preserve authored legacy prose, and derive ability grammar fixtures before changing the composer. |

---

### 6.4 A6 · Ability composer model — ✅ `rc-2.4.3-build-136-a6`

| | |
|---|---|
| **Goal** | Actions carry reach, source, targeting and outcomes (optional); plates and 2024 text read them through one grammar module |
| **Release · feature** | R2 · AU-01 · fixes DEF-05 |
| **Entry criteria** | A3 ✅ · inventory completed; bundled legacy data and AI-ingest fixture behavior recorded |
| **Read in the spec** | §9 AU-01 (grammar → fields → outputs table) · §6.5 · §7.5 · §8.6 · §13.2 BS-06, 09, 10, 22, 23 · D-10 |
| **Backlog tasks** | A6.0 – A6.9 |
| **Open first** | `components/models.ts` (`MonsterAction` L≈590) · `core/domain/types.ts` (mirror type) · `useProcessTokens.ts` modern branches (`processAction`, `processAttack`, `buildPlateEntry`) · `src/data/templates/*` · `core/usecases/IngestAiStatblock.ts` output shape |
| **Skills** | `superpowers:test-driven-development` · `engineering:architecture` · `anthropic-skills:ttrpg-gm-craft` · `engineering:testing-strategy` |
| **Research** | Repository inventory found no bundled structured-action example or committed Seraph fixture. This pass implements the product text-grammar contract; it does not claim official rules validation. |
| **Traps** | Inference never writes to the store · malformed optional data is sanitized · ambiguous legacy text remains visible · configured monster data remains unchanged · 2024-style export is opt-in |
| **Plan** | Completed: inventory → optional types → pure grammar/inference → 2024-style projection → modern plates/export → migration/ingest/core/browser verification |
| **Verify** | `AbilityGrammar.test.ts` (8 cases) · migration and ingestion round-trip tests · core 124/124 · production build 136 · exhaustive UI 33/33, zero runtime exceptions |
| **Exit** | CMP-001…008, COMP-001 (screen/text), COMP-003 proven for modeled/fixture cases; no native editor composer yet (A7) |
| **Defaults** | `1d0` → `1d10` · no economy chip inside its own section |
| **Next-loop prep** | A7 reads optional `MonsterAction` fields and uses the A6 phrase ordering. Map each existing Actions Studio field to a chain cell before moving UI; do not add required persisted fields unless A7 defines their migration first. |

---

### 6.5 A7 · Composer chain and templates — ✅ `49edfdf` · `rc-2.4.3-build-148-a7-prose-exports`

| | |
|---|---|
| **Goal** | Each ability is edited as a chain of chips in plate order, with a live plate preview and a template picker |
| **Release · feature** | R2 · AU-03 (part 1) · fixes DEF-12 |
| **Entry criteria** | A6 ✅ (fields and phrases exist) |
| **Read in the spec** | §9 AU-03 (concept, W-05) · §6.7 `ComposerChain` · §8.3 · §4.2 precedence |
| **Backlog tasks** | A7.0 – A7.8, with A7.7 split into shipped A7.7a and pending A7.7b |
| **Completed slice** | Completed A7.0/1/2/4/5/6/7a scope retained. Build 144 adds typed trait cadence/drafts/validation, phase/grouping/conditional/custom-heading/CR settings, trait templates and exact renderer preview. Step 37 proves cancel/validation/focus, modern/classic parity, live multiword headings, grouping/custom heading, 375px popup fit, legacy partial-annotation automatic CR preserving inclusion, and reload persistence. Build 145 completes A7.3; A7.7b remains active for full all-role preservation/conversion proofs. |
| **Field inventory** | Template-owned: name/description/action type/attack mode/source/bonus/targets/save/stat/range/effects/spell metadata/duration/delivery/targeting/outcomes. Preserved: ID, collection membership/role, bonus-action and legendary/mythic association, uses, recharge, stage pool, custom preamble and CR annotation. Confirmed apply recomputes derived CR display. |
| **Open first** | `composer-chain.ts`, `reaction-composer.ts`, `trait-composer.ts`, `action-composer.ts`; composer UI including `TraitCadenceEditor.vue` and `TraitDisplaySettings.vue`; `ActionsEditor.vue`, `useProcessTokens.ts`, `useTextRenderer.ts`, `MonsterBuilder.vue` and surviving legacy panels. Preserve all seven routes plus `role-headers.ts` and `RoleHeaderEditor.vue`. Keep lair id/prose/CR separate from section initiative/preamble context. Audit conversion factories/data-loss handling before panel removal. Keep rich-text prose ownership and the existing renderer authority. |
| **Skills** | `build-web-apps:frontend-app-builder` · `design:accessibility-review` · `design:ux-copy` · `impeccable` · `superpowers:test-driven-development` · `engineering:testing-strategy` |
| **Research** | Keyboard model for chip rows (roving tabindex), menu/dialog focus return and Escape semantics (APG toolbar/grid/menu patterns); narrow viewport overflow; current range model cannot store a long-range pair (BS-39). |
| **Traps** | Do not lose fields from the editor inventory; keep authored casing; never auto-replace authored actions; template-owned missing optionals must clear stale values; preview must be pure; preserve arrays/schema; do not claim 80/320 ft. with a single-distance model; no sample fixture mutations. |
| **Plan** | A7.0–A7.6 ✅ → A7.7a ✅ → A7.7b ✅ (146 role transitions, 147 old saves and order, 148 exports) → A7.8 ✅ closed at build 148 |
| **Verify already passed** | 159 core tests; production build; changed-file lint; 37 browser steps with zero console errors/runtime exceptions; five-theme spellcasting; twelve-theme help/contrast; diff check. Step 37 proves trait draft cancel/validation, focus return, exact modern/classic HTML parity, grouping/custom heading, live spaces, 375px popup fit, legacy partial-annotation automatic CR with preserved inclusion, and reload persistence. Build 145 additionally proves lair/header interactions and narrow stacking in Step 38 with 165 core tests and all 38 steps passing. This still does not prove every field, every role transition, or every export format. |
| **Remaining proof** | None — closed at build 148; reconciliation in the backlog's A7 section and packet §6.5.2. Keep browser Steps 32–41 as regression |
| **Next-loop prep** | A8.0 is staged in §6.6 and the Build 147–148 packet; A8.9–A8.12 carry the composer polish found while closing A7 |

### 6.5.1 Build 144 partial-slice closing packet

| Item | Evidence / decision |
|---|---|
| Base → code | `dffecb9` → `7f2e572`; tag `rc-2.4.3-build-144-a7-trait-chain` |
| Impact | 10 tracked files, +467/−103; seven source files and three test/build-support files |
| Outcome | Trait cadence, phase/grouping/conditional/custom-heading/CR policy, templates and the sheet's own preview are usable in the studio |
| Architecture | Pure adapter validates/patches; UI owns isolated drafts/focus; existing Pinia collections persist; `computeTraitTag` and `processTrait` remain projection authority |
| Review / fixes | Automatic CR recalculates from description while preserving inclusion; shared popup overflow and live-space trimming reproduced/fixed; imported phase options bounded while retaining a saved legacy choice |
| Verification | 159 core tests; production build; changed-file lint; 37 browser steps, zero errors; modern/classic parity; popup width=scroll width at 375px; reload persistence; five-theme spellcasting and twelve-theme help/contrast |
| Fixture boundary | A live trait requires CR annotation; test legacy data through the import shape. Step 37 uses its actual partial, excluded annotation and proves recalculation fills automatic estimates while keeping exclusion. New trait role conversion uses the existing default factory |
| Status audit | 67 done, 2 active (A7.3/A7.7b), 124 pending; task IDs unchanged; one active loop A7; six/seven role adapters integrated; loop remains open |
| Release | Prior archive/tag retained; latest serves frozen 144 on both loopback families; stable origin preserves configured browser data |
| Next grouped work | Lair entry/context → remaining role headers → complete preservation/conversion matrix → A7 closeout → A8 retirement after capability parity |

### 6.5.2 A7 closing packet — builds 147–148

```text
Loop / tasks ............ A7 · A7.0–A7.8 (ticked 10 / 10)
Outcome for the user .... Every role is edited as a chain of plate cells with a live preview that is the
                          sheet's own entry; older saves keep every authored field; text exports print
                          every role as prose in either template.
Commits ................. 8d40537 → 7f1e4ea (build 147) → 49edfdf (build 148) · docs commit follows
Diff .................... 147: 8 files +194/−236 · 148: 12 files +372/−333
Tests ................... npm test 231/231 · new: ComposerPreservation (6), ExportMarkup (9)
Lint .................... eslint touched files: 0 errors (existing warnings only)
Browser proofs .......... 41 steps, zero runtime exceptions/console errors; Step 35 type matrix 56/56;
                          Step 40 v8-labelled file via Open File: lost [], unmatched [], usage,name, persisted;
                          Step 41 exports: problems [], unchanged state, modern = classic for all formats
Themes .................. help 12 themes · spellcasting 5 themes · preview type parity 12 themes
Requirements proven ..... CMP-009, CMP-010, CMP-011 (reconciliation in backlog A7)
Defects closed .......... DEF-12, DEF-19 … DEF-25
Blindspots resolved ..... — · new BS-40 (previews carry .statblock), BS-41 (II/Tarrasque raw projections)
Decisions ............... D-18 export boundary · D-19 canonical docs in docs/roadmap · D-20 evaluation origin 9100
Deviations from plan .... Adopted and split the uncommitted Codex build-147 work: kept its migration, order and
                          export-boundary changes; rewrote browser Step 40 (real Open File control, .trait
                          twins) and replaced plate flattening with the prose projection
Known limits ............ Improved Initiative/Tarrasque actions and reactions still come from raw descriptions
                          (B4.7–B4.8); LaTeX does not escape raw monster strings (B4.9); plain-text, HTML and
                          Foundry exports untouched; the v8 witness is current-shaped data
Rollback point .......... 8d40537 (code) · rc-2.4.3-build-146-a7-safe-role-transitions (candidate)
Next loop readiness ..... 🟢 A8 — run A8.0 first
```

Release handling: candidates 147 and 148 are frozen with `release-candidate.json` and verified `SHA256SUMS.txt` (97 entries each, QA page excluded) and tagged. Candidate 148 replaced 139 on 9100 — the owner asked that new candidates reuse the configured sample — and also serves 9106; 139 moved to 9114 untouched. The sample's stored hash (`229a780f…`) was identical before and after the switch.

### 6.6 A8 · One Actions module — ✅ build 157 (`b4eef8e`, `38c4738`)

| | |
|---|---|
| **Goal** | The studio covers every role; seven (or eight) duplicate panels retire; storage unchanged |
| **Release · feature** | R2 · AU-03 (part 2) · fixes DEF-08 |
| **Entry criteria** | A7 ✅ · capability matrix complete · BS-26/27 decided or defaulted |
| **Read in the spec** | §9 AU-03 capability table · §13.3 D-10 · §14 CMP-012…015 |
| **Backlog tasks** | A8.0 – A8.12 (A8.9–A8.12 added by A7; A8.1 and A8.4 delivered early — confirm at A8.0) |
| **Open first** | `pages/MonsterBuilder.vue` L37–57 · `TraitsEditor.vue` (388) · `widgets/AttackPanel.vue` (586) · `MultiattackEditor.vue` (222) · `ReactionsEditor.vue` (152) · `LegendaryActionsEditor.vue` (243) · `MythicActionsEditor.vue` (150) · `LairActionsEditor.vue` (132) · `VillainActionsEditor.vue` |
| **Skills** | `code-refactoring:refactor-clean` · `superpowers:requesting-code-review` · `engineering:testing-strategy` · `ui-design:interaction-design` |
| **Research** | none beyond the matrix |
| **Traps** | Multiattack references by id survive reorder · legendary costs and pools live in different arrays · deleting components breaks imports elsewhere (grep before delete) · e2e steps that open removed panels |
| **Plan** | A8.10 ✅ · A8.12 ✅ (build 149) → A8.0 matrix (tick A8.1/A8.4 if covered) → A8.2 attack role → A8.3 multiattack → A8.9 usage editor → A8.11 classic prose parity → A8.5 unmount + delete → A8.6 fixture diff → A8.7 e2e → A8.8 close |
| **Verify** | builder panel count ≤ 14 (DOM probe) · three saved monsters render byte-identical plates · every matrix row ticked |
| **Exit** | CMP-012…015, UX-006, COMP-002 proven; DEF-08 closed |
| **Defaults** | Villain actions stay a panel; CR annotation cards stay in the studio |
| **Next-loop prep** | List the numeric fields of the studio chips for A9's registry |

### 6.7 A9 · NumericBinding fields — 🟡

| | |
|---|---|
| **Goal** | Numeric fields bind to references or formulas through `FormulaField`; a resolver keeps values in sync |
| **Release · feature** | R3 · AU-02 · fixes DEF-09 |
| **Entry criteria** | A2 ✅ · BS-24/25 settled |
| **Read in the spec** | §9 AU-02 (W-06) · §6.2 · §7.4 · §8.1 · §8.5 · §13.1 R-04, R-06 · D-05, D-11 |
| **Backlog tasks** | A9.0 – A9.10 |
| **Open first** | `widgets/DynamicReferenceSelect.vue` (619) · `BasicsEditor.vue` L204, 305, 322, 927, 973, 1281 · studio numeric leaves (`widgets/AttackPanel.vue` was deleted in build 157): `composer/ChainCell.vue` number editor L39–42, which `composer/AttackComposer.vue` + `core/domain/attack-composer.ts` use for attack leaves · `composer/ActionUsageEditor.vue` L12–16 · `composer/TraitCadenceEditor.vue` L4, 17 · `composer/ActionAssociations.vue` L15 · `composer/RoleHeaderEditor.vue` L6 · `core/domain/formula.ts` (`NumericBinding`, `resolveNumeric`, `describeBinding`) · `stores/monster-store.ts` · history store / `useHistoryShortcuts` |
| **Skills** | `engineering:architecture` · `documentation-generation:architecture-decision-records` (D-11) · `superpowers:test-driven-development` · `developer-essentials:error-handling-patterns` · `context7:docs` (QSelect) · `ui-design:accessibility-compliance` |
| **Research** | Pinia `$patch` + `$subscribe` ordering; how the history ledger detects changes (to flag resolver patches) |
| **Traps** | Resolver writing on every keystroke (equality check) · cycles · array paths by index break on reorder (use ids) · persisted payload size |
| **Plan** | A9.0 → A9.1 formula additions → A9.2 registry → A9.3 store → A9.4 history filter → A9.5 composable → A9.6 component → A9.7 migrate + delete old widget → A9.8 tests → A9.9 browser sequence → A9.10 close |
| **Verify** | `Bindings.test.ts` · §8.5 sequence in the browser (one undo step) · reload keeps bindings |
| **Exit** | BND-001…008, REF-001 (fields), REF-002 proven; DEF-09 closed |
| **Next-loop prep** | Formula-mode input element exposed for A10's completion |

### 6.8 A10 · Caret intellisense and macro menus — 🟡

| | |
|---|---|
| **Goal** | `{` opens the catalog at the caret with live values; toolbar menus come from the same catalog; the bottom strip is gone |
| **Release · feature** | R3 · AU-04 |
| **Entry criteria** | A9 ✅ · BS-21/28 checked |
| **Read in the spec** | §9 AU-04 (W-07) · §7.7 · §8.2 · §14 ITL-001…008 |
| **Backlog tasks** | A10.0 – A10.8 |
| **Open first** | `MonsterTextEditor.vue` (411: toolbar menus L20–160, `allIntellisenseTokens` L315) · `useTokens.ts` (251) · `ActionsEditor.vue` L408 · `formula.ts` `suggestFormulaRefs` |
| **Skills** | `ui-design:interaction-design` · `ui-design:accessibility-compliance` · `modern-web-guidance:modern-web-guidance` · `context7:docs` (QEditor) · `superpowers:test-driven-development` |
| **Research** | Range rect in contenteditable; textarea caret mirror; `execCommand('insertText')` support in Chromium |
| **Traps** | Focus stealing by the menu · caret lost after insert · IME composition events · menu clipped at the viewport bottom |
| **Plan** | A10.0 → A10.1 catalog → A10.2 composable → A10.3 menu → A10.4 editor → A10.5 toolbar → A10.6 formula mode → A10.7 remove strip → A10.8 close |
| **Verify** | type `{SPE` → three items with values; Enter inserts; Esc closes; narrow width; screen reader announcement |
| **Exit** | ITL-001…008 proven |

### 6.9 A11 · Binding sweep — 🟡

| | |
|---|---|
| **Goal** | Every remaining binding-capable numeric field accepts references and formulas |
| **Release · feature** | R3 · AU-02 |
| **Entry criteria** | A9 ✅ |
| **Read in the spec** | §9 AU-02 · §14 BND-009 |
| **Backlog tasks** | A11.0 – A11.4 |
| **Open first** | output of the A11.0 inventory script (77 numeric inputs) |
| **Skills** | `code-refactoring:refactor-clean` · `superpowers:verification-before-completion` |
| **Traps** | Some numbers are *derived* (read-only) — never bind them; slots tables are literal by nature |
| **Plan** | inventory → classify → register → migrate → audit + close |
| **Exit** | BND-009, BND-002 (global) proven |

### 6.10 A12 · Spellcasting authoring accuracy — 🟡

| | |
|---|---|
| **Goal** | Subclasses for every caster, persisted; honest counters; SRD subclass spells always prepared; complete cadence pickers |
| **Release · feature** | R4 · AU-05 · fixes DEF-06, DEF-07, BS-07 |
| **Entry criteria** | A4 ✅ · A9 ✅ · research BS-29/30 done |
| **Read in the spec** | §9 AU-05 (W-10, data governance) · §6.6 · §8.4 · §13.3 D-08, D-13 |
| **Backlog tasks** | A12.0 – A12.7 |
| **Open first** | `ClassCastingEditor.vue` (1 056: subclass L27–35, L256, `primarySubclass` L742, metrics `catch` L762, `spellOptionsByLevel` L593) · `AutoSyncSpellcasting.ts` (556: `SRD_SUBCLASSES_BY_CLASS` L273, `calculateSpellcastingMetrics`, multiclass) · `data/spells.json` · `components/spell/useSpellLevels.ts` |
| **Skills** | `anthropic-skills:ttrpg-gm-craft` · `superpowers:test-driven-development` · `documentation-generation:architecture-decision-records` (D-13) · `developer-essentials:error-handling-patterns` · `design:ux-copy` |
| **Research** | SRD 5.2.1 class tables and subclass spell lists; 2014 values for ruleset variants (§4.1 sources) |
| **Traps** | Licensing: only SRD content curated · granted spells must not count · removing a subclass must not silently delete authored spells · multiclass slot math unchanged unless researched |
| **Plan** | A12.0 research + BS-07 repro → A12.1 catalogs → A12.2 metrics → A12.3 persistence → A12.4 editor → A12.5 candidates → A12.6 metamagic by ruleset → A12.7 close |
| **Verify** | reload keeps subclass · Fiend Patron fixture adds its spells with badges · counters show over-limit · forced metric failure shows "limit unavailable" |
| **Exit** | SPELL-001…008 proven |

### 6.11 A13 · Interaction kit — 🟡

| | |
|---|---|
| **Goal** | `CatalogSelect`, `HelpTip`, `v-help`, delegated host, help dictionary, coverage and fit audits |
| **Release · feature** | R5 · UX-01, UX-02 |
| **Entry criteria** | A9 ✅ (FormulaField anatomy) · Q-1 ordinal ordering answered or defaulted |
| **Read in the spec** | §9 UX-01, UX-02, UX-03 · §4.3–4.7 · §6.7 · §14 SEL, TIP, QA-005 |
| **Backlog tasks** | A13.0 – A13.7 |
| **Open first** | three representative selects in `BasicsEditor.vue`, `ClassCastingEditor.vue`, `SkillsEditor.vue` · existing `q-tooltip` usages · `css/statblock-grammar.scss` `.q-tooltip.dnd-tip` |
| **Skills** | `ui-design:design-system-patterns` · `frontend-design` · `impeccable:impeccable` · `ui-design:accessibility-compliance` · `design:ux-copy` · `avoid-ai-writing:avoid-ai-writing` · `context7:docs` |
| **Traps** | Directive cost at scale (BS-32) · headers selectable by keyboard (must be skipped) · tooltips hiding errors |
| **Plan** | inventory → CatalogSelect → catalogs → HelpTip/directive/host → dictionary → audits → close |
| **Exit** | SEL-002…008, TIP-002…005, TIP-007, QA-005 proven |

### 6.12 A14 · Sweep 1 — Basics — 🟡

| | |
|---|---|
| **Goal** | Split `BasicsEditor.vue` into six panels, adopt the kit, 100 % tips, zero overflow |
| **Release · feature** | R5 · UX-01…03 |
| **Entry criteria** | A13 ✅ |
| **Read in the spec** | §9 UX-01…03 · §12.4 debt targets · §13.1 R-13 |
| **Backlog tasks** | A14.1 – A14.6 |
| **Open first** | `BasicsEditor.vue` (4 445 LOC) — map its sections before moving |
| **Skills** | `code-refactoring:refactor-clean` · `superpowers:requesting-code-review` · `ui-design:responsive-design` · `design:accessibility-review` |
| **Traps** | Moves and behaviour changes in the same commit (forbidden: move first, then adopt the kit) · shared local state across sections |
| **Exit** | SEL-001, TIP-001, FIT-001…003 proven for Basics |

### 6.13 A15 · Sweep 2 — casting, checks, senses, defenses — 🟡

| | |
|---|---|
| **Goal** | The rules-heavy panels adopt the kit, tips and fit |
| **Release · feature** | R5 · UX-01…03 |
| **Entry criteria** | A13 ✅ · A12 ✅ |
| **Backlog tasks** | A15.1 – A15.7 (A15.7 done; Step 25 verifies no redundant Skills row) |
| **Open first** | `ClassCastingEditor.vue`, `SpellcastingEditor.vue`, `AtWillCastingEditor.vue`, `SkillsEditor.vue`, `SavesEditor.vue`, `SensesEditor.vue`, `SpeedsEditor.vue`, `ResistancesEditor.vue`, `InventoryEditor.vue` |
| **Skills** | `ui-design:responsive-design` · `design:ux-copy` · `design:accessibility-review` |
| **Exit** | SEL-001, TIP-001, FIT-001…003 proven for these panels |

### 6.14 A16 · Sweep 3 — studio, A4, toolbar, CSS cleanup — 🟡

| | |
|---|---|
| **Goal** | Last surfaces adopt the kit; legacy statblock CSS removed; app-wide audits green |
| **Release · feature** | R5 · UX-01…03 · fixes DEF-10, DEF-11 |
| **Entry criteria** | A13 ✅ · A8 ✅ |
| **Backlog tasks** | A16.1 – A16.7 |
| **Open first** | Actions Studio + composer · `A4LayerStudio.vue` (1 416) · `MainLayout.vue` (378) · `css/app.scss` blocks: `.action-composite-*` (L804–905, L1354–1366), `.zebra-stripe-text` (L1104), cascade blocks |
| **Skills** | `code-refactoring:tech-debt` · `skill-forge-essentials:ai-debt-detector` · `impeccable:impeccable` · `design:accessibility-review` |
| **Traps** | CSS still used by the classic template or exports (grep markup before deleting) |
| **Exit** | SEL-001, TIP-001, FIT-001…005 app-wide; DEF-10, DEF-11 closed; `!important` < 200 |

### 6.15 A17 · Hardening and release — 🟡

| | |
|---|---|
| **Goal** | Prove everything once more, write only proven claims, tag the overhaul |
| **Release · feature** | R6 · QA-01 · fixes DEF-13, DEF-14 |
| **Entry criteria** | A4…A16 ✅ |
| **Read in the spec** | §9 QA-01 · §15 · §11.4 · §13.2 BS-03, 15, 36, 37 |
| **Backlog tasks** | A17.1 – A17.9 |
| **Open first** | `test/exhaustive-ui-fuzz.js` (2 416) · `README.md` · `STACK_STATE.md` · QA helpers in `%TEMP%` |
| **Skills** | `developer-essentials:e2e-testing-patterns` · `engineering:testing-strategy` · `superpowers:verification-before-completion` · `avoid-ai-writing:avoid-ai-writing` |
| **Exit** | QA-001…006, SBG-005 (12 selectable themes), NFR-001 (Track A) proven; tag `v2.5.0-statblock` |

---

### 6.16 Track B cards — 🔵 specified (re-arm at each pre-flight)

Every Track B card inherits the protocol of §1 and the v1 package notes; the rows below are what a fresh session needs to start.

| Loop | Goal | Read in the spec | Open first | Skills | Key traps | Exit |
|---|---|---|---|---|---|---|
| **B1** Identity & revision | Envelope with immutable id and monotonic revision around the current store | §10 F-00 · §6.8 · D-11 | `core/domain/types.ts` · `components/models.ts` · `MigrateMonsterSchema.ts` · history store · stores holding monster copies (BS-38) | `engineering:architecture` · `backend-development:architecture-patterns` · `documentation-generation:architecture-decision-records` · `superpowers:test-driven-development` | No schema bump without D-record; resolver patches excluded from revisions | DOM-002, DOM-003 (contract), DATA-001 |
| **B2** Checks & safe repair | Navigable, honest, undoable checks incl. Track A families | §10 F-05 · §8 (states) | `LintMonster.ts` · `MonsterLintDialog.vue` · `CrFooter.vue` · section/field targets | `design:ux-copy` · `design:accessibility-review` · `superpowers:test-driven-development` | "fixable" only when an operation exists; stale results never shown as current | UX-003, DOM-001, DOM-003 |
| **B3** CR tuner | Preview-first, selective, one-undo tuning | §10 F-06 | `AutoTuneCr.ts` · `AutoTuneDialog.vue` · `CalculateCr.ts` | `anthropic-skills:ttrpg-gm-craft` · `superpowers:test-driven-development` | Prefer tuning sources when fields are bound | DOM-001, DOM-003 |
| **B4** Exports | Capability report and preview for each target | §10 F-08 · AU-01 `text2024` | `ExportStatblock.ts` · `DownloadButton.vue` · renderer adapters | `engineering:testing-strategy` · `design:ux-copy` | Plates need grammar CSS in HTML/PNG (BS-11); Skills line (BS-13); Spellcasting placement (D-02) | DATA-002, SEC-001, COMP-001…002 |
| **B5** Repository & recovery | One startup-selected backend, truthful save, verified migration | §10 F-07 | `StoragePort.ts` · `LocalStorageAdapter.ts` · `IndexedDbStorageAdapter.ts` · Pinia persistence | `backend-development:architecture-patterns` · `developer-essentials:error-handling-patterns` · `documentation-generation:architecture-decision-records` | Never silent per-operation failover; keep sources until verified | DATA-001, DATA-003, NFR-003, SEC-002, ARC-002 |
| **B6** Library | Find/open/duplicate/rename/delete by id | §10 F-02 | repository from B5 · router/drawer | `ui-design:responsive-design` · `design:accessibility-review` | Duplicate must remap bindings and nested ids | DOM-002, UX-004 |
| **B7** Workspace | Toolbar groups, section strip, narrow tabs, presets | §10 F-01/F-03/F-12 · W-01, W-02 | `MainLayout.vue` · `MonsterBuilder.vue` · `editor-store.ts` | `ui-design:responsive-design` · `ui-design:interaction-design` · `design:accessibility-review` | Presets must not touch mechanics | UX-001, UX-002, UX-005, NFR-004 |
| **B8** Provenance | Explicit/unknown ruleset; ruleset-aware catalogs | §10 F-09 · D-08 | envelope from B1 · catalogs with `ruleset` | `anthropic-skills:ttrpg-gm-craft` · `engineering:architecture` | Style switch is not a rules switch | DOM-004 |
| **B9** Combat | Stable combatant ids, snapshots | §10 F-10 | `CombatTracker.ts` · `combat-store.ts` · `CombatTrackerDrawer.vue` | `superpowers:test-driven-development` | Active actor removal policy; legacy index migration | DOM-005 |
| **B10** Character & docs | Honest character values; final documentation from evidence | §10 F-11 · QA-01 | `CharacterSheet.vue` · `character-store.ts` · `README.md` · `STACK_STATE.md` | `design:ux-copy` · `avoid-ai-writing:avoid-ai-writing` | Claims only from release evidence | DOM-006, PRD-002…003, REL-002 |

---

## 7. Stop and escalate

📍 *Handoffs › 7 Stop* — **Stop the affected task — not the whole loop — and write down exactly what would unblock it.**

| Condition | Action |
|---|---|
| A change would alter saved data shape without a decision record | Stop; draft the D-record with migration and fixtures; ask the owner |
| A rules fact lacks a cited source | Label it custom/owner variant or stop the task; add a research row |
| The working tree contains changes you did not make | Do not reset or overwrite; inspect, record, ask |
| A probe contradicts a passing unit test | Treat the probe as truth; `superpowers:systematic-debugging`; add a failing test first |
| A loop needs a later loop to be useful | Split it; ship the independent slice (G-6) |
| The device bridge is unstable | Commit at the last green state; write the packet; resume from §8 |

---

## 8. Session hand-over note

📍 *Handoffs › 8 Hand-over* — **If you are a new session, start here.**

1. **State** — `statblock-overhaul`; code `0dbcd23`, tag `rc-2.4.3-build-149-a8-plate-word-order`; candidate 149 on 9100 (configured Seraphic Herald) and 9106, exact 149 at 9115, 148 at 9113, 147 at 9112, 146 at 9110, 139 at 9114. Core 234/234; build; focused lint 0 errors; 41 browser steps with zero errors; 5-theme spellcasting and 12-theme help pass. Status: 72/204 done, 0 active, 132 pending; 8/28 loops shipped; A8 ◐.
2. **What exists** — A0–A7 shipped. The studio edits all seven roles as plate-ordered chains with a live preview that is the sheet's own entry (markup and computed styles proven). Older saves keep every authored field through one migration; text exports print every role as prose through one boundary (D-18). The owner's configured sample and storage were never modified; a byte-exact snapshot sits in `%LOCALAPPDATA%\Temp\dndsheet-a7-backup\origin-9100-app.*.json`.
3. **What to do next** — A8.0: build the capability matrix from the surviving legacy panels, tick A8.1 and A8.4 if the studio already covers them, then retire panels only where every field has a verified studio home. Keep browser Steps 32–41 as regression. A8.9–A8.12 hold the composer polish found while closing A7.
4. **Where truth lives** — Versioned canonical files are `docs/roadmap/`; `outputs/` is the evaluation mirror. Spec defines intent/contracts, backlog defines order/status, handoffs define preparation/evidence. Synchronize all three and verify mirrored hashes before closing a slice.
5. **House rules** — local-only work; short lowercase commit messages; no AI-attribution trailers; one outcome per loop; prove before you tick.


## Build 145 — section context and lair integration contract

This release completes adapter integration, not the A7 acceptance matrix. Use this section with the companion backlog task A7.7b and handoff preparation below.

| User workflow | Owner / function | Contract and alternatives |
|---|---|---|
| Read/edit a lair entry | `ComposerChain.vue`, `lairChainView`, existing description editor | Readonly “Lair Action” identity; persisted `LairAction` keeps ID/prose/CR only. Rejected alternative: fabricate a name/action schema that would break old data. |
| Edit legendary economy | `RoleHeaderEditor.vue` → `roleHeaderDraft/validateRoleHeader/roleHeaderPatch` | Whole pool 0–99; custom switch and preamble. Defaults remain defaults; no per-entry duplication. |
| Edit mythic context | Same section editor, mythic descriptor | Trait name/recharge/trigger description and preamble; optional prose stays optional. Existing action IDs/costs retained. |
| Edit lair context | Same section editor, lair descriptor | Whole initiative 0–40, default 20; preserve other initiative settings. `{LAIR_INITIATIVE}` drives default preamble, including 0. Custom text is never rewritten to match initiative. |
| Apply or cancel | Local primitive draft → validation → current-store patch | Invalid numbers disable Apply. Cancel writes nothing. Apply spreads current collections/configuration, retaining intervening membership changes. Old panels remain during A7; A8 must retire duplicates only after capability parity. |
| Preview/export | `processLairAction(context, monster, web=false)` | WebRenderer and composer explicitly opt into modern cards; classic and text projections retain processed prose. HTML export leakage found in review was removed before promotion; exhaustive export-format verification remains a named closeout gate. |
| Work at narrow widths | `MonsterBuilder.vue` scoped screen styles | At ≤599px, editor and preview stack; desktop splitter remains. Browser checks use 375px; print rules unaffected. |

```mermaid
sequenceDiagram
  actor Author
  participant UI as RoleHeaderEditor
  participant Core as role-headers pure functions
  participant Store as Existing Pinia monster
  participant View as Preview and sheet
  Author->>UI: Expand section
  UI->>Core: roleHeaderDraft(current monster)
  Core-->>UI: Primitive isolated draft
  Author->>UI: Edit fields
  UI->>Core: validateRoleHeader(role, draft)
  alt Invalid
    Core-->>UI: Visible error; Apply disabled
  else Apply
    UI->>Core: roleHeaderPatch(current monster, role, draft)
    Core-->>UI: Patch preserving current memberships/config
    UI->>Store: Apply patch through existing persistence
    Store-->>View: Recompute tokens and sanitized rendering
  else Cancel
    UI-->>Author: Close without store mutation
  end
```

### Build 145 preparation record (superseded by Build 146 gate ledger)

1. Inventory every actual field in all seven source models and conversion factories; map each to editor, renderer, export and persistence ownership. Include IDs, role arrays, costs, CR inclusion/manual overrides, recharge/stage data, trait grouping and legacy values.
2. Build table-driven conversion cases for every allowed source/destination. Explicitly preserve or disclose incompatible data; do not silently discard fields. Retain source objects and stable references where the workflow requires them.
3. Exercise normalized old-save fixtures, unchanged save/reload, reorder, role movement, deletion and keyboard paths. Add format-level Markdown/Homebrewery/LaTeX lair export cases; source review alone is insufficient export proof.
4. Retain core and browser Steps 35–38; verify default/custom initiative semantics, Apply/Cancel, membership preservation and real narrow layout. Check stacking also in character mode and with maximum-width stat blocks before calling responsive coverage comprehensive.
5. Before A7.8, reconcile evidence against CMP-009…011. If any field lacks a verified home, keep A7 open. A8 removal follows verified capability parity; A9 provenance remains downstream.

Preparation: load executing-plans, verification-before-completion, relevant model/functional-core guidance, code review and UX-copy skills; read this contract, A7 ownership map, the conversion factory call sites, and current handoff. Research external APIs only if this slice introduces one. Close with measured diff, exact code/tag/archive, test boundaries, preservation evidence and synchronized status in all three documents. Never claim infinite scalability, zero defects or future-proofing as an established property.

### Build 145 closing packet — A7 stays active

- Base `a716973` → code `d70cc01`; tag `rc-2.4.3-build-145-a7-role-context`. 13 files, +347/−18.
- Completed A7.3. Current audit: 68 done, 1 active (A7.7b), 124 pending, 7/28 loops shipped. A7.8 and A8 remain gated.
- Production build passed; core 165/165; final browser Steps 1–38 passed with zero runtime/console errors; lair header form 313px width/313px scroll width at 375px viewport; reload and memberships preserved. Theme smoke: five spellcasting, twelve help. Source review verified web-only lair markup and scoped mobile selectors. Export-format runtime proof and full character/mobile coverage remain explicit boundaries.
- Review found modern lair HTML leaking into text projections: fixed with explicit web opt-in. Narrow check exposed fixed preview width squeezing editor: fixed with screen-only stacking below 600px. Browser fixture now opens the studio after reload and re-focuses the trait chip after viewport-induced scroll before keyboard activation.
- Candidate archive has 98 verified hashes. Build 144 archive remains unchanged with its 98 hashes verified. Latest 9106 serves frozen 145 on IPv4/IPv6, exact 145 at 9109, previous 144 at 9107. Existing browser storage on 9106 is retained; isolated test profiles never overwrite it.
- Next bounded packet was the field/conversion/export matrix in A7.7b; see Build 146 packet for the newer continuation. Capture incompatibilities before conversion, close them without silent data loss, and only then perform A7.8 and prepare A8 panel retirement. Do not add schema migrations or remove legacy editors opportunistically.

### Build 146 closing packet and next prepared slice

| Item | Evidence / handoff |
|---|---|
| Base → result | `e0130a4` → code `10f7aa0`; tag `rc-2.4.3-build-146-a7-safe-role-transitions` |
| Delivered | Reviewed action-family moves retain full record/position/references; cross-model copy retains source, clones compatible fields, starts CR-excluded. Explicit action deletion clears mythic references |
| Impact and pacing | 7 files, +240/−97; 51 new core tests, 1 new integrated browser step. Removed destructive conversion implementation rather than appending missing-field exceptions |
| Verification | 216 core checks; production build; focused lint 0 errors/1 pre-existing store warning; full 39 browser steps, 0 errors; 5-theme spellcasting, 12-theme help. Fresh read-only review: no actionable findings |
| Browser boundary | Initial full run failed on a fixture querying the lair row too early; bounded DOM readiness polling added. Isolated Steps 38–39 then full Steps 1–39 passed; only the full final run supports the 39-step claim |
| Preservation | Build 145 tag and 98-hash archive unchanged, exact origin 9109. Build 146 has 98 verified hashes, exact origin 9110; latest 9106 serves the frozen candidate on both loopback families. Same origin retains browser state |
| Status | 68 done, 1 active A7.7b, 124 pending; 7/28 loops shipped. No top-level completion claimed for partial acceptance work |

**Next bounded group: field ownership/old-save/order audit.** Open all four source interfaces, import normalization, `role-transition.ts`, existing action/reaction/trait adapters, renderer exports and the A7 inventory. Map every field to its editing and projection owner. Add normalized old-save fixtures, unchanged save/reload and field-preserving edits, then audit all seven displayed cell orders. Report gaps as precise capability rows; do not delete old panels before parity.

**Following bounded group: exports.** Read Markdown/Homebrewery/LaTeX projection paths and their sanitizers; add format-level modern lair tests, token/prose expectations and non-action-role cases. Reject raw web-card markup through the export boundary. Only after those proofs pass may A7.8 close and A8 preparation begin.

Preparation skills: executing-plans, verification-before-completion, archetypes functional-core, engineering code review, UX copy, and the relevant import/export guidance. Keep cross-model creation labeled **Create copy**: unsupported fields stay on the retained original, not invisibly active on the new model. No further compatibility issue authorizes silent deletion or fabricated model fields.

## Build 147–148 closing packet and next prepared slice

| Item | Evidence / handoff |
|---|---|
| Base → result | `8d40537` → `7f1e4ea` (147, tag `rc-2.4.3-build-147-a7-old-save-preservation`) → `49edfdf` (148, tag `rc-2.4.3-build-148-a7-prose-exports`) |
| Inherited work | An uncommitted Codex build-147 working tree (export boundary, migration fixes, preservation tests, browser Step 40) was backed up to `%LOCALAPPDATA%\Temp\dndsheet-a7-backup\codex-wip-147\`, split into the two slices and finished; its unverified staging folder `rc-2.4.3-build-147-a7-preservation-closeout` is left on disk and on 9111 untouched |
| Delivered 147 | Shared migration on file import; existing values kept by pre-v9 upgrades; spellcasting policies and legacy language names survive; reaction chain usage → name; preview computed-style parity check |
| Delivered 148 | Prose projection for Markdown, Homebrewery, LaTeX, Tarrasque and Improved Initiative; one export boundary; LaTeX/II legendary and mythic mechanics; II mythic crash; multiattack, mythic-lead and default-text defects |
| Verification | Core 222 → 231; production builds; lint 0 errors; full e2e 40 → 41 steps with zero errors; help 12 themes; spellcasting 5 themes; RED runs recorded for the migration tests and the misnested mythic lead |
| Status | 70 done, 0 active, 134 pending (204 tasks); 8/28 loops shipped; A7 closed |

**Next bounded group: A8.0 capability matrix.** Open every surviving legacy panel in `MonsterBuilder.vue` and list each field with its studio home, its renderer owner and its export owner. Mark A8.1 and A8.4 done if the studio already covers them (role headers, reaction trigger, trait cadence/display). Decide BS-26/27. Do not unmount a panel until every one of its fields has a verified home.

**Following group: A8.9–A8.12 composer polish.** One typed usage editor (recharge, uses per day or rest, none); head chips in the plate's word order; classic prose parity for structured school/level/components/duration/qualifiers; two-item list grammar.

## Build 149 packet — A8 opened with composer polish

| Item | Evidence / handoff |
|---|---|
| Base → result | `6f68051` → `0dbcd23`; tag `rc-2.4.3-build-149-a8-plate-word-order` |
| Delivered | A8.10: head chips read "2nd Level Evocation" / "Evocation Cantrip" in the plate's order. A8.12: `listJoin` moved to the pure `rendering/list-join.ts`; two items read "a and b", three or more keep the serial comma |
| Impact | 6 files, +44/−9; 3 new core tests written red first |
| Verification | Core 234/234; production build; focused lint 0 errors; 41 browser steps with zero errors; help 12 themes; spellcasting 5 themes; 97 verified hashes |
| Release | 149 on 9100 (Seraphic Herald storage hash unchanged) and 9106; exact 149 at 9115; 148 kept at 9113 |
| Status | 72/204 done, 0 active, 132 pending; A8 ◐ |

**Next bounded group: A8.0 capability matrix**, as staged in the Build 147–148 packet. Then A8.9 (one typed usage editor) and A8.11 (classic prose parity) before any panel retirement.

## Build 150 packet — restored continuity, audited A8, delivered typed usage

| Item | Evidence / handoff |
|---|---|
| Restored base | Actual HEAD `2eea8ae`, code `0dbcd23`, build 149; stale SESSION_LOG still said 146 and was corrected before continuing. A7 was already closed; no 147 work was replayed |
| Closed | A8.0 capability inventory/BS-26/27 decisions; A8.1 role headers and A8.4 reaction/trait controls verified from prior A7 evidence; A8.9 typed action usage delivered |
| Verification | Core 239/239 (+5); production build; focused lint 0 errors/1 existing warning; full 42 browser steps (+1) with zero errors; five-theme spellcasting and twelve-theme help; read-only usage review no blockers |
| Browser evidence | Step 42 reads 3/Day, rejects zero, verifies Cancel/focus, applies per-rest use, 6–12 recharge and custom text, clears hidden cadence, preserves metadata/CR, fits 375px and persists after reload. Test selectors handle Quasar's native input attribute forwarding |
| Preservation | New immutable 150 on 9116; 149 remains on 9115 with its sealed hashes unchanged. Configured/latest origins 9100/9106 promoted only after checks. Browser storage and sample records never overwritten by isolated fixtures |
| Status | 76/204 complete (37.25%), 0 active tasks, 128 pending; 8/28 loops shipped, A8 active. Four task closures and no new top-level scope |

**Next prepared packet: A8.11 classic metadata parity.** Read the specification's current A8 capability map, action grammar and both web/prose render targets. Write failing tests for school/tier, components, duration and target qualifiers in classic structured abilities; choose readable placement consistent with the existing workflow. Verify the same authored facts across modern/classic and exports. Keep the typed usage and prior export/old-save regression suites.

Then implement A8.2 attack and A8.3 multiattack adapters as separate bounded packets. Treat A8.5 as a capability completion gate: action phase/custom-heading/CR, lair CR/reset, trait global sort, and existing-reference association operations must have studio homes before unmounting. Keep the dedicated Villain/Bloodied panel (BS-26), keep per-entry CR cards (BS-27), and re-count 21 → 14 modules. A8.6 requires three unchanged saved-monster fixtures and byte-identical plate output before/after retirement; A8.7/8 close only after behavior checks pass.

Preparation: executing-plans; archetypes functional core; design UX copy/accessibility; engineering review; verification-before-completion. Use relevant existing skills already loaded; do not recreate a broad redesign or duplicate core renderers. Close each packet with code/tag/archive, measured file/line delta, test boundaries, all three documents and a current session log.

Build 150 code `fc21bc1`: 8 files, +216/−23 lines. New core `action-usage.ts` and UI `ActionUsageEditor.vue`; shared cell/renderer integration, five tests and one browser scenario. Both 149 and 150 archives have 97 verified hashes. Final read-only review of the shared resolver found no regression.

## Build 151 packet — classic metadata parity delivered

| Item | Evidence / handoff |
|---|---|
| Base | `a874871` / protected build 150; new code and tag recorded on the cover and in backlog timeline |
| Closed | A8.11, one existing task; 77/204 complete, 127 pending, no new top-level tasks; A8 remains active |
| Delivered | Shared pure header facts, readable classic metadata after the name/usage/cost lead, complete attack-only/utility targeting, primary text-export parity. Authored values/models unchanged |
| Verification | 244 core tests (+5), production build, focused lint 0 errors/1 existing warning, full 43 browser steps (+1), zero errors; Step 43 adds 16 parity comparisons and 6 captured exports; five-theme spellcasting/twelve-theme help pass. Read-only review: no actionable findings |
| Test reconciliation | Old Step 34 strings asserted missing target text; updated to require the actual creature/visibility qualifier and to inspect the named template entry, keeping the regression meaningful |
| Preservation | Immutable 150 at 9116; exact 151 at 9117. Configured/latest origins 9100/9106 promote only after verification; browser storage and the configured sample are not replaced by fixtures |
| Boundary | No compiled-LaTeX claim; no portable-format breadth expansion, new rules, data migration or panel retirement |

**Next prepared packet: A8.2 attack adapter.** Read A8.0's field/operation map, the complete `DndAttack` interface and `widgets/AttackPanel.vue`, source getters/token rendering, attack references in legendary/mythic/multiattack collections and existing range model boundaries. Inventory reach versus normal/long range, attack proficiency/stat/manual overrides, primary/alternate/additional damage, save/effects, phase/custom prose and create/delete/order/templates before editing. Preserve IDs and source ownership; reuse existing getters/renderers. Write failing cases for field patches and reference preservation first; land a complete usable adapter before A8.3 references or A8.5 retirement.

Retain Steps 35–43, including typed cadence and metadata/export cases. Then A8.3 must keep repeated IDs/order, dangling-ID visibility, custom multiattack prose and postscript. A8.5 remains blocked on all audited missing controls and association workflows; A8.6 still needs three within-candidate before/after retirement fixtures. Keep Villain/Bloodied separate and CR cards with entries per BS-26/27.

Preparation: existing execution/verification skills, functional core, engineering review, relevant attack-model and TTRPG terminology guidance. Treat current authored data as authority; retrieve rules sources only if proposing actual mechanics. Close with measured diff, code/tag/archive, evidence boundaries, synchronized three documents and session checkpoint.

Build 151 code `d4f1e73`: 7 files, +141/−21 lines. Both protected 150 and sealed 151 archives have 97 verified hashes. Code/tag and complete validation precede promotion; final origin/index/entry-asset checks agree on IPv4 and IPv6.

## Build 152 closing packet → A8.3 preparation

Delivered A8.2: distinct attack studio, full original attack-field coverage and shared preview styles. Read specification “A8.2 implementation contract” and backlog “Build 152 backlog grooming” before starting the next slice. The source of truth is the canonical roadmap directory; output copies are evaluation mirrors.

Start sources: `src/core/domain/attack-composer.ts`, `src/components/editor/composer/AttackComposer.vue`, `composer-chain.css`, existing `AttackPanel.vue`, `ActionsEditor.vue`, `monster-store.ts`, `useProcessTokens.ts`, `useTextRenderer.ts`, `test/core/AttackComposer.test.ts`, browser Step 44. Keep the immutable 151 archive and exact-origin listener at 9117. New exact 152 lives at 9119; latest/configured 9100 and 9106 serve the sealed candidate and retain browser storage.

A8.3 preparation groups: inspect both Multiattack arrays and renderer/custom/postscript ownership; map stable-ID chips with repeats/order and missing-target status; use existing store operations; define interaction/parity/persistence regression assertions before implementation. Reuse attack leaf ownership and shared CSS where appropriate; do not copy the entire record over a live edit or create replacement IDs during rename. Fixture factories must create valid source models, including `actions[]` as well as `attacks[]`.

Skill routing: executing-plans for bounded implementation and final fresh review; verification-before-completion for release evidence; functional-core for pure reference mapping; impeccable and ux-copy for chips/empty/missing-target states; TTRPG craft only for terminology or authored domain content, with rules-source research if new rules claims are introduced. Do not load unrelated plugin workflows merely because they were tagged.

Closing evidence: 250 core tests (+6); production build; focused source lint 0 errors/16 pre-existing warnings; full 44 browser scenarios (+1) with zero console/runtime errors; four new attack markup/typography comparisons, invalid/cancel/custom/special-only/mobile/reload/reference/deletion checks; 5-theme spellcasting and 12-theme help. Review identified missing scoped styles, fixed via shared CSS and a reproduced failing layout assertion. Exported LaTeX is not compiled; B4 breadth remains pending. A8.5 must retain Villain/Bloodied, CR card homes, phase controls and association operations before retiring seven panels; A8.6 compares three fixtures within the candidate.

Progress: 78/204 complete (38.24%), 126 pending; one existing task closed, zero new top-level tasks. A8 remains active and no loop is falsely marked shipped.

## Build 153 closing packet → A8.5 preparation

Delivered A8.3. Read specification “A8.3 implementation contract”, updated A8.0 capability matrix, and backlog “Build 153 backlog grooming” before A8.5. The three roadmap files remain the reference, execution order and handoff respectively; output copies are byte-matched evaluation mirrors.

Start sources: `src/core/domain/multiattack-composer.ts`, `MultiattackComposer.vue`, `MultiattackReferencePicker.vue`, `ActionsEditor.vue`, shared `composer-chain.css`, `processMultiattackTokens`/`processMultiattack`, existing `MultiattackEditor.vue`, store reference cleanup, `MultiattackComposer.test.ts`, browser Step 45. Existing custom text/postscript are global; do not move them onto individual groups. Preserve repeated arrays and source IDs. Do not infer combined action/attack execution order from the UI: existing prose prints actions first and totals by first appearance.

Skills: executing-plans for bounded delivery and one final review; functional-core for field/reference ownership; impeccable Operate and UX-copy for association/missing-target states; verification-before-completion for retirement gates; roadmap-update for evidence-based task counts. TTRPG craft guides domain terminology; research primary rules sources only if new rules claims are introduced. Keep unrelated plugin workflows out of this slice.

A8.5 concrete integration notes: reuse `CrAnnotationCard.vue` with `field="actions"` / `field="lairActions"` and an index resolved from the live source ID, never a filtered studio index. Keep `useAutoUpdateCr` automatic/manual behavior. `TraitsEditor.vue` currently hides reorder under `monster.alphaTraits`; the studio must expose and honor that ordering policy. Existing legendary/mythic selectors operate on membership arrays independently of the source records; do not reuse destructive Delete Entry for unlink. An action can participate in both arrays, so the inferred single studio role must not be treated as the complete membership model.

Next preparation: preserve Build 153, capture three within-candidate fixtures, enumerate every pending A8.5 field/operation, finish action/lair CR and phase/custom-heading controls, trait alpha-sort, and legendary/mythic association operations. Verify removing membership differs from source deletion. Keep Villain/Bloodied per BS-26. Retire exactly seven panels only when the source capability matrix and replacement browser checks agree, then execute A8.6/A8.7/A8.8 closeout. No release may depend on future test replacements or missing CR controls.

Evidence: seven new pure cases, 257 total pass; production build; focused lint zero errors/one pre-existing warning; final read-only review no actionable findings; 45 browser scenarios zero console/runtime errors; Step 45 four markup/computed-type comparisons, three text exports, reference interactions/repair, custom text retention, narrow/reload/deletion/empty-state gates; 5-theme spellcasting and 12-theme help. Earlier focused harness failures were control-selector mismatches and were corrected in the test helper; no production behavior was bypassed. Source change also corrects the All-category empty message when multiattack is the only content.

Release: code `1f57bab`, tag `rc-2.4.3-build-153-a8-multiattack-studio`; latest/configured 9100/9106, exact 153 at 9121, protected 152 at 9119. Both loopback families serve sealed archives; no user data reset. 79/204 complete (38.73%), 125 pending; one existing task closed, no new top-level scope; 8/28 loops shipped and A8 active.

## CR-154 preparation packet

Read Specification “CR-154 — Screenshot-driven authoring and projection revision” and Backlog “CR-154 additions and revised execution order”. The request supersedes local previews and old head order; historical completed proofs must not dictate a rejected UI. Preserve Build 153/archive/tag before editing. Do not reset user storage or silently substitute a different monster sample.

First slice A8.13/A8.14: remove local render computations/DOM from all three composers, keep one sheet; plain role selection with existing move/copy review; canonical cadence data with aliases, distinct event/interval/rest help and compact one-use rest formatting. Retain unknown rates and all authored fields. Numeric formula counts are explicitly deferred to the existing binding foundation, not emulated by accepting strings in numeric models.

Test preparation: replace duplicated-preview equality assertions in browser Steps 35–45 with direct expected sheet content, actual control→model→sheet edits and theme/visibility checks; add an absence-of-duplicate-DOM assertion. Never replace comparisons with sheet-against-itself equality. Core tests cover cadence groups/order/aliases, unknown values, one versus multiple uses, clocks/events and preserved trait overrides. Browser tests cover select role semantics, cadence menu breadth, one-use Short Rest on both templates, reload and exports. Add failures first where practical; run full core/browser/theme/build/lint before sealing/promoting.

Skill routing: executing-plans, verification-before-completion, functional-core, Impeccable Operate, UX-copy, roadmap-update; TTRPG craft for provenance and terminology. A quick debate-council audit independently identified reaction parity, scaling provenance and source-owned casting gaps. One independent pass plus inspected source and official rules pages suffices for this bounded decision; no model-provider diversity claim. Future rules presets require edition-specific evidence before implementation.

Next handoff must include: code/tag/archive and preserved predecessor; tasks done versus scope added; measured file changes; regression outcomes and remaining validation boundaries; all three documents/mirrors synchronized. No implementation claims for A9.13/A11.5–8/A12.8–9 until their models, migrations, UI and supported exports are materialized.

### Build 154 closing packet → A8.15

Read the CR-154 requirement table first; nineteen concerns are mapped to existing and twelve new task IDs. A8.13/A8.14 are complete; everything else keeps its explicit task/dependency. Progress: 79/204 original → +12 scope → 81/216 after two deliveries, 135 pending. No legacy panel retired; A8 remains active.

Current code `0ce61c7`, tag `rc-2.4.3-build-154-authoring-foundation`; independent evaluation 154 at 9123; main 9100/9106 and exact 9121 retain protected Build 153. Existing same-origin browser data was retained. Core 264/264 (+7), production build, focused lint 0 errors/16 existing warnings; full 46 browser scenarios (+1) zero console/runtime errors, five-theme spellcasting and twelve-theme help; read-only implementation review no findings. A stale hard-coded fixture name in the revised sheet test was corrected to validate the currently authored name/count; no production bypass. Earlier preview-parity assertions were intentionally replaced under the new requirement, not silently dropped.

Next A8.15: inspect shared heading construction and `ROLE_CHAINS` alongside the actual sheet; derive usage → name/components → tier/school for editor and projections. Keep quantity semantics independent of typography. Add expected-order/core/web/export cases, then preserve154 before another candidate. A9.13 later owns roll count/scaling policy, so the header task must not invent that schema or reinterpret targetCount.

A8.5 capability homes/association operations and three-fixture retirement checks follow; keep existing handoff details about live ID-derived CR indexes, dual legendary/mythic membership and non-destructive unlinking. Future A9/A11 work must use safe parser/bindings and stable result links; A12 source engine must separate class spell selections from shared/Pact/innate resource pools and cite edition-specific progression evidence. Do not substitute fallback counters when metrics are unavailable.

All three canonical documents and output evaluation mirrors are synchronized. Re-run numeric/select semantic inventories during their owning task: the static 83/187 marker snapshot is a baseline, not proof of universal formula or catalog coverage.

### Build 154 evaluation-address boundary

Build 154 is sealed/tagged and available at **http://localhost:9123/index.html#/**. The main evaluation addresses 9100/9106 remain on protected Build 153, as does its exact address 9121. Automatic approval review rejected the attempted running-server replacement with a generic “blocked by policy” response and no detailed reason; no replacement was performed. The safe delivery is the separately served candidate. Its browser origin has separate local storage; existing main-origin monster data was not reset or overwritten. Do not claim the candidate automatically shares that browser storage or that the main address already serves 154.

### Build 155 closing packet -> A8.5

Delivered A8.15, code `46785a0`, tag `rc-2.4.3-build-155-heading-grammar`, independent evaluator http://localhost:9125/index.html#/. Build154 at9123 and configured Build153 at9100/9106 remain preserved. Prior automatic approval review rejected replacement of running evaluation servers with generic blocked-by-policy; no detailed reason returned. Do not retry/bypass that operation. This independent origin has separate storage; no configured monster data was copied, reset or overwritten. Actual initial in-app selection is My New Monster, not a claimed preloaded Herald.

Pre-flight interface ruling: A8.15 supersedes A8.10's head placement, while retaining `abilityHeader` factual metadata and standalone `text2024` compatibility. Components move into full-entry identity exactly once; numeric semantics and A9.13 remain separate. Cost if wrong: misread metadata or lost output; direct expected-order/quantity tests cover the change. Core2014 legacy exports and authored custom-preamble paths retain existing behavior; broad export convergence stays B4.

Final review corrections: custom components moved out of escaped metadata into an unescaped lead; added a failing core test, HTML identity escaping, then browser cases for all four roles. Encoding introduced invalid punctuation; restored UTF-8 and exercised real browser/download strings. Both findings fixed,267/267 core suite green. No deferred reviewer minors. One interim full run failed the old cost-order assertion, intentionally updated; another mutable-staging run was invalidated during rebuild. Final regression ran against the frozen candidate, not mutable dist.

Evidence: production build;267core tests(+3);47browser scenarios zero console/runtime errors;5-theme spellcasting and12-theme help; focusedlint0errors/5existingwarnings. New Step47 checks16 role/style/template projections,3downloads,Cantrip phrasing,once-only components,literal component escaping and no authored model mutations. Existing Step34 intentionally expects cost before name. Served index/entry bytes verified across localhost/IPv4/IPv6; protected153/154 each97hashes verified. LaTeX was not compiled.

Next packet A8.5: load execution/verification, functional-core, Impeccable/UX copy and TTRPG guidance as relevant. Read Spec CR154 dependencies, Backlog A8.0 capability matrix and A8.5-8; inspect MonsterBuilder and every retiring panel against current ActionsEditor adapters. First list exact controls/associations not yet owned by the studio, then implement complete homes with preservation fixtures. Do not delete or unmount a panel on feature-count assumptions. Phase controls already present must survive; multi-pool expansion remains A11.6. Use Build155 as pre-retirement rendering baseline for A8.6. Retain VillainActionsEditor. Final closure requires fixture equality, actual browser lifecycle, docs and a preserved successor RC.

Process adjustment: run candidate regression on a frozen build root after builds finish; never rebuild its serving directory mid-run. Use explicit UTF-8 byte writes for source/document edits and inspect diff size before build. These prevent validation noise and encoding churn from consuming another delivery loop.

## Recovery sync — working tree after Build 157

Build157/A8 closure supersedes the interrupted retirement checkpoint. Repository HEAD is `9a37339` (documentation), with implementation `b4eef8e` and byte-neutral cleanup `38c4738`. The release tag exists. Current roadmap remains **86/216 complete (39.81%),9/28 loops shipped,130 remaining**; this sync awards no additional completion.

Uncommitted work is preserved separately from the release:
- `ability-grammar.ts`: target-count noun agreement, including coordinated target nouns and qualifiers.
- `AbilityGrammar.test.ts` and `ExportStatblock.test.ts`: added wording/export assertions.
- New `structured-attack.ts` and `StructuredAttack.test.ts`: proposed shared attack-bonus policy and cases. The helper is **not consumed by production rendering or exports yet**; current callers still compute bonuses separately.

Resume in this order:
1. Review the existing uncommitted diff and settle its intended scope; retain authored/custom wording and explicit values. Do not restart completed panel retirement or overwrite these files.
2. Complete the attack-bonus consumer map: shared web/prose rendering, ComposerChain context and core exports. Review reach/ability defaults, explicit overrides, formula compatibility and custom/homebrew exceptions before adopting the proposed helper.
3. Validate wording and attack-bonus work together with focused regressions, full core suite, production build and actual sheet/export/browser checks. No fresh pass or release claim is made for these edits by this recovery sync.
4. If independently complete, preserve157 and publish a successor with evidence and aligned docs. Then begin A9.0 numeric-field/source/constraint inventory and A9.1 bindings/cycle behavior in roadmap order.

Release routing in the latest handoff records157 at9100/9106 and frozen156 at9127; the old candidate157 subpath is superseded. Those endpoint/storage claims were not revalidated during this read-only recovery audit. Do not use the older failing scratch smoke log as the final157 result; the committed handoff records its corrected portable parity and49-scenario closeout. Build future candidates outside the serving output. No code changes,tests or deployments performed in this sync.

## CR-158 preparation and successor handoff

Read the Specification CR-158 mapping and Backlog CR-158 scope delta together. New tasks are A11.9,A12.10,B3.7;all other requested details expand their existing owners. Progress is86/219,133remaining;A8/R2 stay closed. Do not restart panel retirement or declare the expanded mechanics implemented because their specification exists.

Before each loop:
- Load only relevant execution/verification,functional-core,TTRPG,UX-copy and catalog/design guidance. For casting/species calculations,verify the selected edition/source before adopting formulas;record provenance and unsupported/custom cases.
- Inventory actual numeric/select/source consumers and saved extension fields. List writes,dependency IDs,validation,invalid-draft behavior,undo/reload and output adapters before editing.
- Keep recovery events,availability predicates and reaction triggers separate. “While bloodied” is not “when bloodied”;HP0/1 are explicit thresholds. Hidden spell cadence changes presentation only.
- For outcomes,resolve recipient/result semantics before choosing region layout;support N containers but at most4regions per container. Random tables are declarative and never roll because a preview rerendered.
- For casting/species,use source/grant/resource identities. Separate list eligibility,granted/always-prepared spells,known/prepared limits and shared/Pact/innate pools. Species changes are proposals with selective reversible Apply,not silent replacement.

Resumption:complete inherited consistency code before A9.0. The shared resolver is now integrated through structuredRenderContext (also used by ComposerChain),modern legacy mechanics and core2024action exports. Finite explicit bonuses including0 retain priority;spell overrides and current ability/proficiency are shared. Ranged-only defaults use DEX,melee/both defaults STR;finesse/thrown/homebrew exceptions require authored bonuses pending A9.11 provenance. Target noun agreement preserves quantities and qualifier prose;it does not turn targets into attack rolls or implement cantrip beam counts.

Verification gates for the successor include focused comparisons across four source/override cases,two styles/two templates,three toolbar downloads,live DEX changes and explicit zero preservation. Keep production Build157 frozen and build outside served output;candidate158 is a versioned subpath of the existing preview server,sharing that origin's configured data rather than resetting it. Do not reconfigure running servers as a workaround.

Fresh source review reported no blocking bonus regressions. Deferred minors:comma-separated custom noun heads only partly inflect;nonfinite authored/spell-override fallback paths need dedicated tests when the resolver contract expands. Do not claim these were fixed. No new task IDs were added for them. Review used the available Sol lane after the prior Astra reviewer hit its usage limit;independent review remains source-level evidence,not browser proof.

## Build158 closing evidence

Delivered `f958cd4`,9files +174/-20. Inherited WIP is integrated rather than abandoned.279core tests(+5),productionbuild,50browser scenarios(+1) zero console/runtime errors,5spell themes,12help themes;focusedlint0errors/5existingwarnings. Step50 covers16role/style/template cases,composer parity,liveDEX changes,explicit0override and3toolbar downloads. Final import cleanup rebuild matches all97build files byte-for-byte;candidate output was not rebuilt during browser validation. LaTeX content checked,not compiled.

Release158 uses http://localhost:9124/candidate158/index.html#/ on the existing preview server with a versioned asset base;root/predecessor files are preserved. It shares9124browser storage,so the configured evaluation copy remains available;no main-origin monster data reset or transfer occurred. Source defaults are not a universal finesse/thrown inference;explicit overrides retain priority. A9.11 remains pending. No beam-count/outcome-grid/casting-source/species UI is claimed delivered.

Final independent source review found no blocking regressions. Deferred minors remain the comma-separated custom-noun edge and dedicated nonfinite fallback test cases,recorded in CR158. Next execute A9.0 inventory and its pre-flight contract;retain the new outcome/casting/species tasks under their specified dependencies. Progress86/219,133remaining;three added scope items and zero prematurely closed tasks.

## Build159 closing packet → A9.2

A9.0 source inventory and stable-identity decisions are recorded in the Specification's Build159 section. A9.1 adds literal binding support and bounded deterministic dependency diagnostics. No store binding overlay or replacement smart-dropdown UI ships yet. A9.0/A9.1 are the only new completed tasks;88/219 complete,131remaining,9/28loops shipped,A9active.

Prepare A9.2 from actual studio consumers,not deleted panels or historical18-field counts. Load execution/verification,functional-core and UX-copy/catalog guidance as relevant. Keep numeric domain types distinct:count,bonus,DC,distance,die catalog,score,resource and symbolic dice. Preserve CR fractions/manual multipliers/presentation exceptions. Do not use array indices as persistent addresses. Phase/outcome/membership records without stable occurrence IDs require their planned migration;tool/class/attack IDs and semantic ability/skill/slot-level keys are available.

API ruling:dependencyOrder/detectCycles require a pure referenceSources callback supplying complete canonical-reference source paths,including derived/transitive dependencies under the current mode. The earlier one-argument forecast could not safely infer those sources. Cost if incomplete:missed cycles/incorrect source order;A9.2 source-map invariants and A9.3 live resolver tests must prove completeness. External unbound paths are roots,not missing-bound-node errors. Cycles are SCC groups,not all simple cycle paths.

Fresh review found two important boundary cases,now covered:literal scientific notation must bypass expression lexing,and ref mode must reject expressions/numeric text. Tests failed first then passed with both fixes. No deferred new review minors. Earlier158 custom comma-noun and nonfinite attack-bonus coverage minors remain recorded;they were not silently fixed in this slice.

Continue with field descriptors,then overlay/history,then the shared UI adapter/control. Invalid/cyclic/nonfinite/out-of-bounds drafts retain committed values and show actionable errors;derived outputs do not become a second editable authority. Preserve159 and sample storage while building successors outside served output;new candidate paths use the existing server without replacing processes.

### Build159 verified closeout

Code2b45cff:3files,+164/-4. A9.0 andA9.1 close;88/219(40.18%),131remaining,9/28loops shipped,no scope growth.286coretests(+7),productionbuild,50browser scenarios zero console/runtime errors,5spell/12help themes;5saved fixtures/20byte-identical plates versus158,reloads/dangling references stable. Focusedlint0errors/5existingwarnings. No LaTeX compilation. Two fresh-review findings fixed red-to-green;no new deferred minors.

Frozen159 and protected158 each have verified hash manifests. Evaluator http://localhost:9124/candidate159/index.html#/ uses existingserver/versioned assets and retains its configured VeilofRadiance sample storage;main-origin data untouched. No serverprocess replacement. A9.2 next;do not mark store bindings,live source propagation,history or smart-dropdown rollout complete from these pure foundation tests. The required source-map callback is an explicit dependency,not a hidden default that silently ignores cycles.


### Build160 verified closeout

Code `656c164`:9files,+663/-1. Pure registry/path/inspection/source safety;28new core tests,314total passing. Production build succeeds;50browser scenarios pass with zero console/runtime errors;5spell themes and12help themes pass. Five saved monsters produce20byte-identical plates versus159;reload round trips and dangling references remain stable. Focused lint is clean:0errors/0warnings. Production build retains pre-existing warnings elsewhere. LaTeX not compiled.

Six concrete source-review findings corrected with failing-then-passing regressions;no new minor review findings deferred. Complex mode applicability remains an explicit blocked gate under A9.2,not completed functionality. Earlier158 minor follow-ups remain in their existing owners. No whole task closes,no scope added:88/219(40.18%),A9.2active,130pending,131remaining,9/28loops shipped.

Evaluate http://localhost:9124/candidate160/index.html#/. Frozen tag `rc-2.4.3-build-160-field-registry`;new160 and protected159 each97verified hashes. Served index and entry assets match localhost/IPv4/IPv6 bytes. Existing server preserved;no process replacement. In-app browser confirms Build160,My New Monster and its Veil of Radiance sample. Origin storage retained,not reset or transferred. This successor has no new visible dropdown controls;finish A9.2 complex mode/coverage reconciliation before A9.3 overlay adoption.


### Build161 verified closeout

Implementation `6049127`:30files,+814/-714,including removal of the619-line flattening selector. Seven tasks close:A9.2,A9.3,A9.4,A9.5,A9.6,A9.8,A9.9. Progress **95/219(43.38%),A9.7active,123pending,124remaining;9/28loops shipped**. Delta **+7completed,-7remaining,zero new scope**. A9 is9/14;R3 is9/33. A9.7 and the mechanics/closeout tasks keep the loop open.

Evidence:327core tests(+13);productionbuild;50exhaustive browser scenarios with zero runtime/console errors;5spell themes;12help themes;five saved monsters/20byte-identical plates versus160,reload and dangling-reference parity. Focused browser flow passes actual Apply/Cancel,live DC propagation,rejected fractional/dice/cyclic drafts,detach,keyboard undo/redo,reload,attack edit matrix,narrow input layout and visible HP synchronization. It holds the remote-font request stalled throughout. Changed binding-code lint is clean;existing warnings elsewhere remain. No LaTeX compilation.

The first provisional browser attempts were rejected,not counted as successful evidence. Failing regressions corrected integer rounding,overlay-key merging,nested computed invalidation and record replacement;popup tests now wait for the previous cell menu to close rather than racing transitions. Final tests ran on frozen output. Independent source review found no blockers;two minor disabled-detach/history-boundary follow-ups remain under A9closeout.

Evaluate http://localhost:9124/candidate161/index.html#/. Tag `rc-2.4.3-build-161-live-bindings`;new161 and protected160 each97verified hashes. Index/entry assets match across localhost/IPv4/IPv6. Existing server unchanged. In-app verification shows Build161 with the configured My New Monster/Veil of Radiance sample retained;headless test witnesses never replaced that origin data. No broader outcome/casting/species implementation is claimed. Resume the grouped A9.7 migration packet above.

---

## Build 183 Handoff Packet — Inline Trait Flow, Hardware Luminance-to-Alpha, Interactive Curved Gradient Bar, Parallel Radial-Crop Knob Sliders, Indented Vitals Riders & Hierarchical Plate Grammar

| Item | Evidence / Handoff |
|---|---|
| **Build & Tag** | Build `183`, candidate `.codex-temp/release-candidates/rc-2.4.3-build-183-radial-crop-knobs-curved-gradient-bar-and-hierarchical-plates` (with `rc-2.4.3-build-182-gradient-overlays-indented-vitals-and-trait-flow` preserved untouched). |
| **Delivered Scope** | (1) Streamlined trait text wrapping directly beneath `.sb-head` (`x = 0`); (2) A4 layer normal blend occlusion + SVG `<feColorMatrix>` luminance-to-alpha (`grayscaleAsAlpha`) for opaque PNG/JPGs; (3) Interactive `GradientOverlayController.vue` with draggable color keys, double-click `%` stop editing, and draggable SVG falloff curve overlay (`gradient-curve.ts`); (4) `RadialOffsetController.vue` & `DualKnobCropSlider.vue` with X/Y values inside horizontal/vertical slider knobs, double-click inline editing, and parallel `Crop X` / `Crop Y` sliders; (5) Physical attacks (`Slam`) compact Row 1 (`name | scope | mechanics`) and spell-like traits/actions (`Exorcise`) hierarchical 3-row plate (`[Usage] Name, School/Level (Components) | Duration` on Row 1, `Scope | Mechanics` on Row 2, `Outcomes` on Row 3); (6) Indented `↳` rider rows for Speed (`splitSpeedRiderRows` + `Hide`), HP (`splitHpRiderRows` with separate `Bloodied`, `Temp HP`, `Regeneration`, `Death Prevention`, `DT`, `DR`), and AC (`splitAcRiderRows` with 1 row per rider); (7) Target count + noun grammar (`1 target which you can see 10 ft.`) + `FormulaField.vue` blur commit; (8) Category and item fold/unfold in `ActionsEditor.vue`. |
| **Verification** | Core unit tests: **361/361 passing** (`npm test`, including `test/core/Build183Features.test.ts`); Quasar production build (`npx quasar build` exit 0); 50-step live browser CDP fuzz suite (`node test/exhaustive-ui-fuzz.js` 50/50 green, 0 console/runtime errors). |
| **Live Evaluation** | Served at `http://localhost:8080/#/` and archived in `.codex-temp/release-candidates/rc-2.4.3-build-183-radial-crop-knobs-curved-gradient-bar-and-hierarchical-plates/spa`. |


## Handoff — after Build 208 (2026-11-08)

- **Branch** `build185-repairs` at `d2c418e`; tags `rc-2.4.3-build-204…208-*`; gh-pages at `d35c659` (live).
- **Mode change:** Builds 204–208 were no-tests. **Next agent starts in safe mode** with Backlog H1 (gate + vue-tsc) — read `DNDSheet-GoHorse-Audit-204-208.md` first.
- **RC folders:** last one is RC203; `make-rc.mjs` failed on 204 and was skipped after. Port 9106 still serves RC203. Fix in H10.
- **Work tree trap:** Pages output is `dist-pages/` (not `dist-pages/spa/`). Publishing `spa/` ships an empty site.
- **New modules:** `core/domain/random-table.ts`, `core/domain/outcome-graph.ts`, `components/editor/RandomTablesEditor.vue`.
- **Workload:** 115 done / 113 open top-level (unchanged since Build203), plus 12 new H items → 115 / 125.

## Handoff — after Build 209 (2026-11-08), safe mode

- **Branch** `build185-repairs`; tag `rc-2.4.3-build-209-safe-mode-repairs`; RC folder under `.codex-temp/release-candidates/`; port 9106 serves RC209.
- **Gate:** `npm run gate` 9/9 PASS on the committed tree. Typecheck is *not* in the gate: run `npx vue-tsc --noEmit --ignoreDeprecations 6.0`; the baseline is 682 errors (per file identical to Build203). Any count above the baseline per file is a regression until H14 lands a real gate step.
- **Edits on Windows:** never patch TypeScript with PowerShell double-quoted strings — `${...}` is expanded by PowerShell and silently deletes template-literal code (root cause of the Build208 bug). Use a Node script with exact anchors that asserts each anchor matches once and keeps CRLF.
- **Fuzz invariants that move with features:** Step 49 counts top-level editor panels (now 15). Adding a panel means updating that count *and* its label check in the same build.
- **RC script:** `make-rc.mjs <dist/spa> <rcDir> <path-to-json>` — the third argument is a file path, not JSON text.
- **Next, in order:** H5 smoke (save/reload/import/export/undo for random tables) → H6 rest (themes, print, A4 layer, legacy migration) → H13 → H10 publish script → H11 (close A11.5, then A11.9) → H9 tip rewrite → H14/H15 typecheck baseline.
- **Workload:** 121 done / 123 open top-level.

## Handoff — after Build 210 (2026-11-08)

- **Gate:** 9/9 PASS; fuzz now has **52** steps (Step 52: random tables through reset, undo, export, reload and 12 themes).
- **Never run two fuzz instances at once** on the build machine: Step 38 failed under parallel load (H17).
- **Random tables** are styled only through theme tokens (`--sb-*`) in `statblock-grammar.scss`; do not add colours in components.
- **Next, in order:** H17 → H18 → H6 rest (A4 layer) → H10 publish script → H11 (close A11.5 then A11.9) → H9 tips → H14/H15.

## Handoff — after Build 211 (2026-11-08)

- **Publishing is one command now:** after `npm run gate` passes in the build tree, commit, then `node tools/publish.mjs --build N --slug short-name --base <previous commit> --push`. It refuses stale, empty or wrong-root output. `tools/make-rc.mjs` is now in the repo (no more temp-folder copy).
- **Fuzz Step 38** waits for its panels and buttons; a missing one fails with its name.
- **Next, in order:** H6 rest (A4 layer) → H11 (close A11.5, then A11.9) → H9 tips → H14/H15 typecheck → H16 (owner).

## Handoff — after Build 215 (2026-11-09)

- **One tree:** `%TEMP%\dnd-tip` is the only build tree (all `dnd-b2xx` trees removed). Re-create it from the branch tip with `git archive`, link `node_modules` to the main checkout, then run `npm run typecheck:setup` before `npm run gate`.
- **Never overlap runs.** Check `Get-CimInstance Win32_Process` for `gate.mjs`/`exhaustive-ui-fuzz` before starting one.
- **Interruption safety:** commit unverified work to `refs/wip/current` (not a branch) in `F:\AI_Resources\DNDSheet`; replace it with the real commit once the gate passes.
- **Two writers:** Builds 212–214 were landed by another session while this one was paused. Always `git ls-remote` before building on a remembered tip.
- **Next, in order:** A11.5 remainder per the Build214 note (container ownership, typed predicates) → A11.9 → H9 tips → H14 baseline burn-down → B4.7/B4 rest of the export boundary → H16 (owner).

## Handoff — after Build 216 (2026-11-09)

- **The build machine runs with Windows animation effects off**, so headless Chrome reports `prefers-reduced-motion: reduce` in every fuzz and smoke run. A global reduce rule broke Quasar focus and tooltip tracking; it was removed (B7.6 tracks the safe version).
- **QA tools are in the repo:** `tools/qa/` (see its README). Count the workload with `node tools/qa/count-tasks.mjs`.
- **Gate fingerprint covers `tools/`:** adding a tool after the gate ran forces a re-run; docs are not covered.
- **Exports:** see `docs/roadmap/DNDSheet-Export-Inventory.md` before touching any exporter; every file name now goes through `safeFileName`.
- **Next, in order:** B4.12/B4.13 goldens → B4.14 notice → B7.6 → A11.5 remainder → A11.9 → H9 tips → H14 baseline.

## Handoff — after Build 217 (2026-11-09)

- **Inventories:** `docs/roadmap/DNDSheet-Domain-Inventories.md` (storage keys and writers, Auto-Tune field map, lint codes) and `DNDSheet-Export-Inventory.md` are the ground truth for B2, B3, B4 and B5; keep them in step with code.
- **The storage adapters are dead code**; persistence is `pinia-plugin-persistedstate` only.
- **Use full commit ids** in every script (`git rev-parse <short>` first); a short id became ambiguous and broke a control silently.
- **Never run anything heavy while a fuzz runs**, not even `npm test`: Step 38 failed under that load.
- **Next, in order:** B4.17 → B5.8 → B4.7 → B7.6 → A11.5 remainder → A11.9 → H9 → H14.

## Handoff — after Build 218 (2026-11-09)

- **Saving:** every persisted store writes through `createGuardedStorage` (`src/core/domain/guarded-storage.ts`); do not register `piniaPluginPersistedstate` directly again or failed saves go silent.
- **Loading:** the Load file button accepts both `.5emm.json` monsters and `.character.json` characters (`importCharacter`).
- **Reduced motion:** add any new `transition:` selector to the B7.6 list at the end of `app.scss`; Step 56 checks both motion modes explicitly.
- **Golden fixture** now includes a trait, an action and a triggered reaction; expect golden diffs when touching any exporter's entry sections, and review them line by line.
- **Next, in order:** B4.20 → A11.5 remainder → A11.9 → H9 → H14 → B5.7/B10.1 (owner decisions).
