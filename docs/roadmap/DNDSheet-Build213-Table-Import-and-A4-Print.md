# Build213 — transactional table import and A4 print closeout

Date: 2026-11-09. Base: `2363765` (official Build212 plus documentation sync). Candidate tag: `rc-2.4.3-build-213-table-import-and-a4-print`.

## Delivered

1. **Paste rows** in Random Tables: explicit preview, line-level format errors, safe replacement and Cancel. Gaps remain visible warnings; invalid dice, overlaps, reversed/out-of-range/unsafe bounds and unreadable nonblank lines block Apply. Signed ranges are supported. No free text is silently dropped by the strict preview.
2. **Durable data:** applying revalidates the currently selected table, rejects missing targets, reserves every existing table/row ID, and preserves unchanged row identities plus title/dice/fallback. Undo/redo and reload are exercised through real editor controls and store history.
3. **Table semantics:** named tables and scoped column headers; header repetition and row break rules for print. Random tables remain in the statblock layer and render once; A4 movement, visibility and ordering are verified.
4. **Shared print fixes:** selected landscape orientation now selects an actual A4 landscape page; editor splitter panes and viewport clipping are removed from print; first-run notifications and other popup UI are excluded. Portrait remains A4 portrait. Authored scale and offsets are preserved; the regression fixture explicitly resets inherited transforms rather than overriding users’ designs.

## Acceptance and rulings

H6 is the completed item, proven by the final evidence receipt below. Its earlier i18n/theme/NaN work was already delivered and is not recounted as new implementation. No saved legacy free-text table field was found in the migration, templates or export fixtures. The existing parser is therefore wired to an explicit author-controlled import rather than guessing which description text to rewrite. Existing description content remains untouched. No second independently rendered A4 table layer was introduced; the existing statblock-layer ownership is explicit and tested.

No broader A11.5/A11.9 acceptance is claimed. Other export adapters, long-table pagination, source-aware outcomes, casting, species and the outstanding type baseline remain separate work. The print fixture is short and fits one page; this is not a universal one-page guarantee.

## Verification

Final gate9/9 passed on frozen source:400 core tests, lint0 errors, SPA and Pages builds,54 exhaustive browser steps on each, help across12 themes, spell smoke across5, and Pages asset checks. Zero browser console/runtime errors. Independent review found no blockers. Four focused import tests were added; red controls failed before the missing import function and global-ID fix.

All four compiled PDFs (SPA/Pages × portrait/landscape) have one A4 page with correct orientation, expected name/table/results/fallback text, no storage notice and words within page bounds. Portrait≈595×842pt; landscape≈842×595pt. Rasterized output was visually checked. Twelve Pages-theme screenshots, the import-dialog capture, PDFs, rasterized Pages and machine receipts are in `docs/evidence/h6-build213/`. The mechanical UI detector returned no findings.

The first provisional runs were discarded: review exposed a missing history signal and global ID reservation, a selector put the A4 page below rather than above the statblock, and actual PDF inspection revealed portrait-only output, printed notification UI and splitter clipping. A later run inherited a deliberate105% transform from a previous scenario; the fixture now resets it. These are not counted as three consecutive clean gates under H13. No active-gate source was edited; only the owned provisional gate process trees were stopped before fixes.

## Measured workload

Counts use unique canonical IDs, exclude the nine historical B183 delivery rows, and keep recovery IDs separate.

| Ledger | Before done / open | After done / open | Delta |
|---|---:|---:|---:|
| Canonical A/B (219) |106 /113|106 /113|0 /0|
| Recovery H (18) |10 /8|11 /7|+1 /−1|
| Combined tracked IDs (237) |116 /121|117 /120|+1 /−1|

New scope IDs:0. Closed:H6. Tests:396→400 core (+4);53→54 browser scenarios (+1), on each of SPA and Pages. Generated evidence and tests are not additional roadmap closures.

## Groomed continuation

1. **H11 / A11.5:** audit editor → stored clauses/containers → validation → canonical render → history/import/reload/export. Prove recipient filters, four-region limits, shared-result identity, cycle/missing-reference failure paths and all affected golden outputs. Do not infer export parity from a visible web plate.
2. **H11 / A11.9:** after A11.5, finish table/outcome links, range diagnostics, migration/source evidence and remaining export/long-print cases. H6 has removed its A4/explicit text-import prerequisite.
3. **H9:** replace generated placeholder tips with purpose-led copy in coherent editor groups; inspect the repaired compound controls. Refresh the live inventory; coverage percentage is not copy-quality evidence.
4. **H15 then H14:** resolve the deprecated compiler options deliberately, commit a per-file baseline, and fail new type diagnostics before a separate burn-down. The historical682 errors were not rerun in this packet.
5. **H13:** three consecutive full gates on unchanged source. This packet supplies one final qualifying run, not three. H12 process ownership and H16 owner-authorized stray-folder deletion remain open.
6. Resume A9/A11 stable-identity numeric migration and A10 cadence predicates, A11.7/8 lifecycle proofs, B3.6/7 proposals/provenance and A12 source/pool casting ownership in their existing dependency order. Preserve the A13.9 PDF/bloodied/design-decision boundaries; this short table fixture does not close those tasks.

## Preservation and execution

Build212 and the protected dirty checkout are retained. Work took place in `F:/AI_Resources/DNDSheet/.codex-temp/build213`, with one writer and one fuzz process. Publish only from this tree using an explicit `--repo`; Pages output is the root of `dist-pages`, not a nested spa folder. The official evaluation link remains https://ivangarciafilho.github.io/DNDSheet/.
