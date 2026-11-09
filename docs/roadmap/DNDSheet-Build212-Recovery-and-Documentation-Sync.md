# Build212 recovery, publication and documentation reconciliation

Date: 2026-11-09. Governing source: `build185-repairs`; production: https://ivangarciafilho.github.io/DNDSheet/.

## Delivered and verified

- Source commit `fb73b1ad702057e28ef5080b8d0a7c6ddc541ab7`; Pages commit `7aff9883e9171ae3b8dd64cf02606a74f891358d`; tag `rc-2.4.3-build-212-recovery-and-release-sync`.
- Preserved checkout `F:/AI_Resources/DNDSheet` remains on `statblock-overhaul` at `1869921`. Its 83 preserved modified/untracked files were fingerprinted and rechecked unchanged. Their normalized contents already exist in committed baseline `a7cc729`; no wholesale old-code overlay was needed. Build138 is already in release ancestry.
- Side branch `a13-9-sheet-density` supplied two genuinely lost behaviors: accessible advantage/disadvantage glyph names and cancellation of simultaneous flags in standard and compact initiative. Other density, typography and spell-line changes were already incorporated or superseded. Four missing Build163–166 delivery packets were recovered with historical disclaimers.
- `build.json` now identifies 212, correcting the stale 203 label. README identifies the official source and Pages host while retaining upstream attribution.
- Final nine-step gate passed: 396 core tests, lint zero errors, SPA build, 53 browser steps, help smoke (12 themes), spell smoke (five themes), Pages build/assets and 53 Pages browser steps. Step53 checks 32 style/template/header/roll-mode combinations, all passing. No console/runtime errors. Existing lint warnings remain. Independent review found no blockers.
- Frozen candidate: 97 SPA files plus metadata, all 98 checksum entries verified. Existing candidates and configured user browser data were not replaced or reset. Official live footer212 confirmed; served index and both entry assets matched the tested Pages output.

## Documentation coverage and authority

All 16 project Markdown documents were read: README, SESSION_LOG, STACK_STATE, three ADRs, A5 evidence README, the three canonical roadmap documents, Control Inventory, GoHorse audit and four recovered historical packets. Source checks supplemented the requirements review. Versioned `docs/roadmap/` is canonical; output copies are evaluation mirrors.

The spec governs contracts; the backlog governs acceptance/status and delivery order; the handoff governs execution continuity. The fresh Build212 entry points supersede historical Build149–203 current labels and local-only publishing instructions. Build209 was the first complete gate since Build200: do not treat Builds201–208 reduced-validation records as equivalent evidence. ADR promises about offline operation, compatibility and export coverage are design contracts, not new Build212 runtime proof. LaTeX retains a distinct template path; no LaTeX compiler was run.

## Progress accounting

A unique-ID parse finds 219 canonical A/B tasks: 106 checked and 113 open. Nine additional checked B183 delivery rows are historical artifacts, not new roadmap scope. H1–H18 is a separate recovery ledger: 10 checked, eight open. These are document statuses, not a fresh revalidation of every historical closure. Older 95/103/115/121 headlines use inconsistent denominators. Do not combine them or claim increased delivery from recounting.

Build212 delta: two recovered behaviors, one new browser step with 32 configurations, four restored records, release identity fixed and current documentation reconciled. Zero additional canonical or H task closures are claimed.

## Ordered actionable continuation

| Order / owner | Small coherent work packet | Completion evidence |
|---|---|---|
| 1 · H6 | Register random-table ownership in A4 composition; preserve single-render behavior, ordering and persistence. Confirm whether a real saved free-text table source exists before wiring `parseLegacyTable`. | Actual A4 layer/order/print fixture; reload and export parity. Record the legacy-source search; do not invent a migration input. Existing theme checks need not be rebuilt. |
| 2 · H11 / A11.5 | Finish outcome container semantics before more tables: recipient filters, up to four regions, horizontal/vertical/inline layouts, stable references and invalid/cycle diagnostics. | Editor → store → domain → renderer → save/reload → all affected exports; intended goldens reviewed. H4 sector escaping and H5 import/database paths still need direct proof where prior acceptance was inferred. |
| 3 · H11 / A11.9 | Complete random outcome tables after A11.5 and H5/H6: dice/range diagnostics, container layout, persistence/migration, print and export coverage. | Deterministic/random-table fixtures, missing/overlapping range cases, undo/import/reload and format parity. |
| 4 · H9 | Rewrite generated placeholder tips in purposeful panel groups; inspect eight repaired compound tags and keyboard/focus behavior. | Copy review plus current audit report. Percent coverage alone does not establish useful help. |
| 5 · H15 then H14 | Deliberately resolve deprecated TS options, then add comparison against a committed per-file diagnostic baseline. Keep baseline burn-down a separate packet. | Typecheck runs without ad-hoc CLI flag; new diagnostics fail the gate. Historical 682-error baseline is not a clean-type claim and was not rerun in this recovery. |
| Cross-cutting · H13 | Gather three consecutive sequential gates on unchanged source; polling implementation already exists. | Three complete named run receipts. Two gates in this recovery used different sources, so they do not satisfy this closure. |
| Deferred housekeeping · H12/H16 | Attribute stray processes before stopping anything; retain the stray RC folder until the recorded owner decision. | Ownership evidence and explicit deletion decision. No process/folder purge in this recovery. |

Then resume existing owners rather than duplicating scope: A9.7 and A11.2–A11.4 stable identity migration before anatomy/phase/language numeric bindings; A9 closeout before A10 cadence predicates. Finish A11.7 routing and A11.8 traversal migration/undo/export proofs. B3.6/B3.7 need preview/Apply/Cancel/undo, provenance and stable grant ownership before species/generation writes. Casting needs A12 source/pool identity and rules metrics before A12.8/A12.9 closure; stacked class cards do not prove correct multiclass resources. A12.10 and A13.9 still need their real print/PDF fixtures; A13.9 g2 retains the owner design decision.

## Documentation corrections retained for subsequent acceptance

- Historical dashboard arithmetic and checked-state inconsistencies need acceptance reconciliation, not mass checkbox changes.
- A12.10 a3 and deployment d4 have later completion records; older open labels are historical. Subclass persistence has conflicting records requiring fixture-level reconciliation.
- Number-input inventory says53 while older scope says56; its literal subtotal40 conflicts with the stated41. Refresh the inventory from source before numeric migration.
- Help reports42.4% and72.6% describe different snapshots. Refresh before using either as a live metric; keep H9 quality review separate.
- Do not restart completed A7/A8 panel retirement or reapply Build163–166 integration recipes. Do not resurrect AttackPanel.
- Old CMP-010 duplicate-preview requirements are superseded by the sole authoritative sheet. Old per-spell cells are superseded by compact flowing spell lines. Stable identity and pure domain projections govern both rendering and exports.
- ADR core/storage/QoL contracts remain accepted: keep rules in the headless core, adapters at the boundaries, optional additive schema changes, and one undoable user intent per edit. Offline/PWA and complete Foundry compatibility were not reverified by this release.
- Species name-based deduplication and timestamp/random IDs do not establish stable grant ownership; immediate array/archetype writes do not establish the required proposal/preview workflow.

## Safe execution boundary

Use the isolated release tree or a fresh official clone; never edit the protected dirty checkout or an active-gate tree. One fuzz process at a time. Publish through `tools/publish.mjs` with an explicit `--repo` pointing to the intended release clone. Current clone: `F:/AI_Resources/DNDSheet/.codex-temp/recovery212`. Frozen Build212 evidence remains source-accurate after this documentation-only synchronization.
