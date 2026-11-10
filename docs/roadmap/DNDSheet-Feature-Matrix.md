## Build226 verified implementation packet

Eighteen implementation changes; normalized ledger 174 complete / 94 open, unchanged. Final frozen-source gate **10/10** passed: **540 core tests (+36 versus Build225)**; **58 exhaustive browser scenarios on SPA and Pages**, plus the three emergency suites on each target (11 skill, 10 spellcasting and 6 rich-mechanic checks); 19 outcome lifecycle checks, 60 fixture/theme cases, 120 representative contrast samples and 10 fit views with no clipping observations. Zero runtime exceptions. Type guard: 559 existing diagnostics, zero new against the unchanged baseline; lint: zero errors, 2692 warnings. Existing debt remains. Published source 2114f6ba40a31d680eebc7683c39ba91ffd50e92; Pages 61fee11f1772b95983d33233ff9a3e15a30db069; tag rc-2.4.3-build-226-emergency-editor-and-spellcasting. GitHub Pages reports built. Live index, entry JavaScript, CSS and MonsterBuilder bytes match the tested Pages output. Candidate226 archived and all96 checksums verified; prior223–225 archives preserved. Original modified tracked files remain unchanged. [Publication receipt](../evidence/build226/publication-receipt.json).

## Build225 outcome hardening

Draft identities, move/copy/delete, identity repair and full outcome metadata on Apply are implemented. Shared prose/HTML accepts malformed optional legacy fields safely. Final frozen-source gate **10/10** passed: **504 core tests (+18 versus refreshed base486)**; **58 exhaustive browser steps on SPA and Pages**; **19 outcome lifecycle/Apply/Cancel/reload checks**;60 fixture/theme cases,120 representative AC contrast samples and10 fit views. No browser exceptions. Type guard613 existing diagnostics/0new; debt remains. Published source 84edd95b4cf946b82aa844fa15a0303a9a06476e; Pages 08bda4e9183b6658a0aeee6ea86925555f25ac10; tag rc-2.4.3-build-225-outcome-lifecycle-and-safe-projections. GitHub Pages reports built. Live footer225 and index/entry JavaScript/CSS/MonsterBuilder byte parity verified. Prior223/224 archives preserved; candidate225 archived with all96 checksums verified. Stable multi-container ownership, typed predicates and complete random-table integration remain deferred under A11.5/A11.9.

# Feature matrix — Build222 verification packet

This matrix describes implemented behavior, not completion of an entire roadmap track. Final release evidence is recorded in the Build222 report and publication receipt.

| Area | Implemented | Remaining acceptance / limitation |
|---|---|---|
| Monster authoring | One live sheet; shared studio; typed source records, formulas on registered fields | A9.7/A11.2–4 remaining numeric paths; A10 completion |
| Outcomes and tables | Authored clauses, result references, random tables, prose and rendering repairs | A11.5 stable container/region model; A11.9 full integration; H11 open |
| Spellcasting | Class/innate rows, existing slot and spell controls, compact projection work | A12 source-owned pools, full metrics/subclass provenance and migration are not complete |
| Templates/history | Existing template, reset and undo workflows tested by browser suite | New model changes must retain transactional ownership and recovery |
| Presentation | Twelve themes; classic/modern; A4 layers; 60 fixture/theme cases with computed AC head/body contrast | Matrix is representative contrast, not every pixel/text color. A13.9/A14–16 print/keyboard/fit acceptance remains |
| Fit tooling | Ten viewport/scale cases; clipped-overflow detection, scroll inventory, explicit Quasar field exemptions and negative control | Effective CSS viewport/raster scale is not browser UI zoom. Intentional ellipsis does not prove full label visibility. Per-panel keyboard and full zoom acceptance remains |
| Monster exports | JSON, text/Markdown, LaTeX, HTML/PNG and VTT adapters; goldens; Tarrasque shared prose and numeric metadata | Target omission/revision policy and previews B4.2–5 remain; no universal native homebrew support |
| Character references | Identity/resources/inventory/features/spells; character JSON import/export | Names do not establish rules, armor, movement or granted features |
| Character AC/speed | Shared projection: recorded numeric total plus source note, or explicit estimate; web/text/JSON/reload proof | No automatic class/species/equipment rules. Recorded values are user supplied, not verified by a rules engine |
| Saving | Browser persistence and failed-save warnings | B5 migration/library/recovery work remains |
| Quality | Named ten-step gate; pinned type comparison; shared fixtures; AST step replay; browser discovery | Existing type debt H14, purpose-led help H9 and unresolved product/ownership decisions remain |

## Character scope decision (B10.1)

Keep class, subclass, species, inventory labels and features as authored references. The existing record does not contain armor proficiency, shield state, armor type/rules, movement grants or feature precedence sufficient for reliable derivation. Add optional recorded AC/speed totals and source notes. Absent/invalid totals retain the previous numeric fallback, visibly labelled **Estimate**. Do not infer rules from name matching. This is a present product contract; no future code is required for its totals or labels to work.
