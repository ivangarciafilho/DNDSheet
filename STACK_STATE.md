## Build228 — spellcasting and print

Frozen release gate **10/10** passed with **581 core tests (+19)**, exhaustive SPA and Pages browser scenarios, casting source lifecycle and learning checks, five spell themes, and A4 portrait and landscape PDF parity. Typecheck: 515 diagnostics; 0 new; 168 resolved (approved baseline 683, Build213 e19a624). Build227 and 480 files across five prior archives remain verified. Published and verified. Source `ef9f9f59eeb350fcd324f871d68e995b117dd2e1`, Pages `3b079efb6aa4b2ce2843a30c8a63b4b426ab88d8`, tag `rc-2.4.3-build-228-spellcasting-sources-and-print`. Live index and application assets match the tested Pages build. The fresh browser footer reads `v2.4.3 build 228`. All 96 archive checksums pass.

## Build227 published — 2026-11-10

Published source 750b65868ac4a7d3cedef372cea797b83a789950; Pages ad8f8f4dcdd6dfed4b3eb2f82972eaf8c99c17c8; tag rc-2.4.3-build-227-composition-casting-and-presentation. GitHub Pages reports built; live index and application asset bytes match the tested Pages output. Build227 archived with 96 verified checksums; previous223–226 candidates and original modified checkout remain intact. [Publication receipt](../evidence/build227/publication-receipt.json).

## Build227 verified implementation packet

16 implementation acceptance items; normalized ledger remains174 complete/94open; no whole-ID closures. Final frozen-source gate **10/10** passed: **562 core tests (+22 versus Build226)**, exhaustive SPA/Pages browser scenarios, container lifecycle, numeric presentation, source-owned spellcasting, rich mechanics, release matrix and fit checks. Typecheck: 531 diagnostics; 0 new; 152 resolved (approved baseline 683, Build213 e19a624). Lint: zero errors, 2721 warnings. Existing debt remains. Publication verification follows.

## Build226 published — 2026-11-10

Published source 2114f6ba40a31d680eebc7683c39ba91ffd50e92; Pages 61fee11f1772b95983d33233ff9a3e15a30db069; tag rc-2.4.3-build-226-emergency-editor-and-spellcasting. GitHub Pages reports built. Live index, entry JavaScript, CSS and MonsterBuilder bytes match the tested Pages output. Candidate226 archived and all96 checksums verified; prior223–225 archives preserved. Original modified tracked files remain unchanged. [Publication receipt](../evidence/build226/publication-receipt.json).

## Build226 final validation

Final frozen-source gate **10/10** passed: **540 core tests (+36 versus Build225)**; **58 exhaustive browser scenarios on SPA and Pages**, plus the three emergency suites on each target (11 skill, 10 spellcasting and 6 rich-mechanic checks); 19 outcome lifecycle checks, 60 fixture/theme cases, 120 representative contrast samples and 10 fit views with no clipping observations. Zero runtime exceptions. Type guard: 559 existing diagnostics, zero new against the unchanged baseline; lint: zero errors, 2692 warnings. Existing debt remains. Publication/live verification follows.

## Build226 candidate in final verification — 2026-11-10

Isolated candidate based on Build225 receipt43315ceda1677446b1b289ad969b2207dc2067ca. Eighteen implementation acceptance changes cover emergency skill routing/persistence, source-owned spell lists and row settings, spell typography, shared action-family fields/copies/bindings and safe mechanic rich text. Review retains copied recharge visibility and authored reaction triggers. Preliminary core539 (+35 versus504); focused skills11, spellcasting10 and rich mechanics6 boolean checks passed. Final frozen-source ten-step gate is running; publication/archive/live parity remain pending. Normalized268 IDs174 complete/94 open; raw277 IDs183/94; whole-ID delta0. See docs/roadmap/DNDSheet-Build226-Emergency-Editor-and-Spellcasting.md and docs/evidence/build226/workload.json. Build225 remains the verified production release until a new receipt proves otherwise.

## Build225 published — 2026-11-09

Twelve outcome lifecycle/projection implementation items completed in the isolated Build225 clone. Final frozen-source gate **10/10** passed: **504 core tests (+18 versus refreshed base486)**; **58 exhaustive browser steps on SPA and Pages**; **19 outcome lifecycle/Apply/Cancel/reload checks**;60 fixture/theme cases,120 representative AC contrast samples and10 fit views. No browser exceptions. Type guard613 existing diagnostics/0new; debt remains. Published source 84edd95b4cf946b82aa844fa15a0303a9a06476e; Pages 08bda4e9183b6658a0aeee6ea86925555f25ac10; tag rc-2.4.3-build-225-outcome-lifecycle-and-safe-projections. GitHub Pages reports built. Live footer225 and index/entry JavaScript/CSS/MonsterBuilder byte parity verified. Prior223/224 archives preserved; candidate225 archived with all96 checksums verified. A11.5/A11.9/H11 remain open: normalized174 complete/94 open, unchanged. Browser regression covers19 lifecycle/transaction/reload checks using an isolated temporary profile. Complete Apply metadata retention fixes a data-loss defect in the previous adapter. See docs/roadmap/DNDSheet-Build225-Outcome-Lifecycle-and-Safe-Projections.md.

# DNDSheet — current stack state

## Build 224

Published source f547958; Pages e04a539; tag rc-2.4.3-build-224-random-result-integration-and-outcome-typography. Production: https://ivangarciafilho.github.io/DNDSheet/#/

- A11.9 delivered: random tables linkable from description containers/regions and outcomes (`randomTableId`, `random_table` kind), accessible table HTML, missing/orphan/empty diagnostics, deterministic roll resolution.
- Typography: outcome lead colon spacing (`On Success :` -> `On Success:`), container distance units (`10ft` -> `10 ft.`), 2024 ability grid MOD/SAVE header alignment + region landmark.
- H9: purpose-led help copy for random tables, description containers, outcome layout, skill actions.
- Gate 10/10 on frozen source: 481 core tests (+9), typecheck 613 diagnostics / 0 new.
- Known open item: the user asked for `Attack +0`; the protected fuzz contract (Step 50, not editable) asserts `Attack 0` in the modern projection, so bonus 0 is kept unsigned. Needs an owner decision to amend the contract.
- Fuzz Step 40 had a transient reload-timing flake under parallel load; it passed on rerun.
## Build 223

Published source 44a87af; Pages 039b0f7; live footer 223. Base e766f8d167f40cf613c242c1dcfd5c8087fc4eb4; source/tag/Pages identities and live parity recorded in docs/roadmap/DNDSheet-Build223-Publication-Receipt.json. The current production link is https://ivangarciafilho.github.io/DNDSheet/.

- Closed A11.5 (items a, b, c) and advanced H11: Action Description Region typed model (`ActionDescriptionRegion`), hard cap of 4 regions per container (`MAX_REGIONS_PER_CONTAINER = 4`), continuous dice roll range parsing and table overlap/gap diagnostics (`diagnoseDiceTable`), audience and plane sub-region filtering, semantic HTML/prose region exports with XSS escaping.
- Normalized vitals and speed grammar: `Gains ${amt} Temporary Hit Points while not Bloodied` (removed extraneous "of"), speed traversal preset grammar, speed badge trailing period stripping (preventing `., ` collisions).
- Normalization of typography and distance notation: HTML-tag aware punctuation cleaner in `cleanPunctuation` (preventing `14. (` and `14/+4. (`), `numHtml` trailing punctuation guard, universal senses spacing normalization (eliminated unspaced `60ft` -> `60 ft.`), and distance unit normalization (`40ft` -> `40 ft.`, `5ft` -> `5 ft.`).
- Expanded 2024 core rules conditions glossary: `grappled`, `prone`, `incapacitated`, `restrained`, `invisible` in `statblock-help.ts`.
- Ten-step final gate passed 10/10 on frozen inputs: 472 core tests (+3), 57 browser fuzz steps, 12 help themes, 5 spell themes.
- Pinned compiler comparison: 613 existing diagnostics, 0 new against approved baseline.
- Workload: 256 normalized IDs, 162 complete / 94 open → 164 complete / 92 open (+2 / -2).

## Build 222

Published source 8aa695e; Pages b65df80; live footer 222 and asset parity verified. Base 964f645fe5352b8cd7c9f8908a6ebd9cbd12133e; source/tag/Pages identities and live parity are recorded in docs/evidence/build222/publication-receipt.json.

- Character AC/speed: recorded totals with source notes, or labelled estimates.
- Ten-step final gate passed on frozen inputs: 469 core tests; 58 browser steps per SPA/Pages; 60 fixture/theme cases and 120 representative AC contrast samples; 10 viewport/scale fit views.
- Pinned compiler comparison: 613 existing diagnostics, 0 new against approved 683 baseline.
- Workload: 256 normalized IDs, 152 complete / 104 open → 162 complete / 94 open (+10 / -10).

## Continue in dependency order

A11.9 random-result integration → H9 purpose-led help → H14 per-file type debt burn-down.

