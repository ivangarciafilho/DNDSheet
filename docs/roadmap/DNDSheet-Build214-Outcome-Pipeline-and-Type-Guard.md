# Build214 — Outcome pipeline repair and reproducible compiler guard

## Scope and acceptance ruling

Base: official Build213 documentation commit `e19a624`. Work is isolated in `.codex-temp/build214`; previous candidates, protected checkout and user browser data are preserved.

Ruling: finish the defects exposed by tracing H11 before expanding its model, and pull the existing H15/H14 compiler safeguards forward. Normalization must retain authored filters, sectors and dice tables; web sectors must resolve the same formulas as prose, escape plain author input and preserve additional containers in action/reaction output. This is a repair of existing data paths, not completion of A11.5 or A11.9.

The full outcome model still requires N stable containers, up to four regions per container, explicit layout/ownership and recipient/type/attitude/plane predicates, stable reference validation, cycle/missing-reference diagnostics, migration and complete export/print acceptance. H11 remains open.

H15 can close when the pinned compiler runs without an ad-hoc command-line deprecation flag. H14's new-error safeguard is implemented separately from its outstanding per-file debt burn-down; H14 remains open until the full wording is satisfied.

## Compiler provenance and debt

The previously documented 682-error snapshot used an unrecorded compiler. Rechecking unchanged Build211 and Build213 with vue-tsc3.3.14 and TypeScript6.0.3 yields 683 diagnostics on each, with zero differences in normalized full-message multisets. No cause is invented for the historical one-diagnostic discrepancy.

The compiler runtime is pinned and locked in its own package. The legacy application dependency tree is retained. Gate fingerprints include source, tests, public assets, tools, build/configuration metadata, root HTML and environment files. This detects in-gate/post-gate input changes; it does not attest output bytes or automatically bind an arbitrary --commit to those bytes. Publication still requires the frozen-output/verified-commit procedure. The committed baseline comes from unchanged official Build213, not the new implementation. Comparison ignores positions and checkout location but preserves diagnostic messages and multiplicity; equal totals cannot hide a replacement or duplicate error. Missing tools, malformed compiler output and new diagnostics fail closed. Existing debt must be reduced in subsequent per-file packets rather than regenerated away.

## Implemented paths and known adapter limits

Normalization now clones the existing filter/sector/table fields. Modern actions and reactions share the outcome prose/formula resolver and escaped sector markup; structured modern traits use the same renderer. Plain container labels/text/table cells are escaped, scoped headers are emitted, and text2024 plus reaction paths retain containers. Original rich-text descriptions remain intentional rich text. Review caught and fixed an inline-clause separator regression, now covered by a focused test. Visual inspection then exposed generated tables printed as markup by the legacy web sanitizer: the renderer now protects its fixed table-tag vocabulary before sanitizing, without promoting escaped author table text. The browser proof requires actual tables, not merely their text. The provisional gate stopped during this discovery is discarded. A later compatibility probe caught incomplete legacy table headers/rows throwing in the new formatter; safe empty defaults and a regression test restore the former tolerance. That provisional run was also stopped before source edits and discarded.

Focused browser evidence checks eight action/reaction combinations across both rules styles and visual templates, projection without mutation, undo and reload. Observed legacy Markdown, Homebrewery v3 Markdown and LaTeX contain resolved outcomes and containers. Tarrasque and Improved Initiative capture successfully but omit these structured facts. Pure ExportStatblock adapters also retain raw-description-only legacy trait/reaction paths. These are recorded acceptance gaps for A11.5/B4, not universal export parity.

Compiler guard proof: pinned no-flag run reports613 existing diagnostics,0new and70resolved against683. The explicit.ts-import option accounts for the resolved module-import diagnostics; this is not a613-error code cleanup. A temporary new TS2322 raises the count to614 and is correctly rejected; the exact probe source is removed. Largest remaining files: BasicsEditor90, SkillsEditor54, SpeedsEditor49, useTextRenderer49, ResistancesEditor42 and SensesEditor41.

## Verification and publication

Final gate10/10 passed on fingerprint-identical source:410 core, lint0 errors (warnings remain),613 known type diagnostics/0new/70resolved, SPA/Pages builds,55 browser scenarios on each, help12 themes, spell5 and Pages assets. No console/runtime errors. Step55 exercises eight action/reaction/style/template cases, actual table elements, formula values, author literal table text, projection no-mutation, undo and reload.

Independent review identified the separator and root-HTML freshness defects, both repaired with tests. Visual inspection caught the table sanitizer issue; a compatibility probe caught missing legacy table arrays. Provisional runs were stopped before further edits and discarded; H13 is not closed. Four existing table-print regression PDFs were rechecked for A4 orientation, text and bounds. This is not full outcome-table pagination/theme/print acceptance.

Evidence lives in `docs/evidence/build214/`. Compiler baseline/schema and gate-contract unit tests also prove multiplicity, changed-message/global-error rejection, complete named steps and freshness including tools/rootHTML/environment metadata. The temporary real compiler-error control rejects exactly one added diagnostic.

## Continuation in dependency order

1. H11/A11.5: specify stable container/region ownership and typed predicates; migrate without loss; implement validation and a shared result graph before richer layouts. Prove undo/reload/import and each export independently.
2. H11/A11.9: connect validated tables to those containers and result identities; retain range diagnostics and print/prose parity.
3. H9: review purpose-led tooltip copy by panel, then refresh inventory. Coverage alone does not prove useful help.
4. H14 debt burn-down: reduce the pinned baseline per file while preserving runtime semantics. The guard rejects new signatures and extra occurrences, even when totals shrink.
5. H13: three consecutive full unchanged-source gates. H12 ownership cleanup and H16's recorded owner decision remain open.

## Workload rule

Before: canonical219 IDs106 complete/113 open; recovery18 IDs11 complete/7 open; combined237 IDs117 complete/120 open. Count only accepted whole-task closures. Repairs, tests and baseline tooling are reported as delivered deltas without manufacturing new roadmap IDs.

| Ledger | Before complete / open | After accepted H15 closure | Delta |
|---|---:|---:|---:|
| Canonical A/B (219) |106 /113|106 /113|0 /0|
| Recovery H (18) |11 /7|12 /6|+1 /−1|
| Combined (237) |117 /120|118 /119|+1 /−1|

New scope IDs0. H14 remains open: its safeguard is delivered, its debt burn-down is not. H11/A11.5/A11.9 remain open. Core400→410 (+10); exhaustive browser54→55 (+1 per SPA/Pages); gate9→10 named steps. H15 is the accepted closure; the publication receipt binds the candidate to its remote release.
