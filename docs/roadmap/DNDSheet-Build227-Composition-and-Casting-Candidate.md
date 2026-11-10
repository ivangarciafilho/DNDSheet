# Build227 — Composition, casting sources and presentation candidate

## Candidate state and preservation

**Validated candidate; publication pending.** Work is isolated in `.codex-temp/build227-work`, based on current remote commit `4128dde`. Build226 remains the published reference until a newly validated candidate is deliberately published. The protected original checkout, configured user sample and existing release-candidate archives must remain intact.

Final frozen-source gate **10/10** passed: **562 core tests (+22 versus Build226)**, exhaustive SPA/Pages browser scenarios, container lifecycle, numeric presentation, source-owned spellcasting, rich mechanics, release matrix and fit checks. Typecheck: 531 diagnostics; 0 new; 152 resolved (approved baseline 683, Build213 e19a624). Lint: zero errors, 2721 warnings. Existing debt remains. Publication verification follows.

## Measured workload

| Ledger | Before | Candidate accounting | Delta |
|---|---:|---:|---:|
| Normalized total IDs |268|268|0|
| Complete IDs |174|174|0|
| Open IDs |94|94|0|
| Raw total / complete / open |277 / 183 /94|277 /183 /94|0|

No whole roadmap ID is closed by this packet. The bounded implementation acceptance items below are measured separately; they are not new ledger tasks, invented closures or a claim that the larger casting/outcome architecture is complete.

## Bounded implementation acceptance items

| # | Candidate implementation | Acceptance boundary and required proof |
|---|---|---|
|1|Preserve additional description containers in Studio entry projections|Action, Trait, Reaction and Lair editors must show their saved source containers after each reactive recomputation; adding a second block must retain the first.|
|2|Repair additional text/table editing and persistence|Add text, add table, add table row and reload must retain IDs, contents and unknown extension data; controls explicitly use button semantics.|
|3|Carry Lair containers through existing render/export adapters|Lair uses the same safe container formatter; verify web and direct export paths rather than merely exposing controls.|
|4|Place Role first inside the compositor Head row|Card identity/commands remain above; existing reviewed move/copy policies and metadata preservation remain authoritative. Other chips follow the shared renderer order.|
|5|Extend rich mechanic editing to editable catalog/custom-text controls|Keep incumbent values and catalog selection while exposing safe emphasis for authored mechanics. Formatting must reach the final renderer and readable plain exports.|
|6|Separate eligible numeric presentation from formula evaluation|Presentation formatting decorates evaluated output; expression parsing/binding remains unchanged. Unsupported numeric contexts must not silently acquire presentation behavior. Usage/recharge fields are excluded because their current renderer paths do not consume numeric presentation metadata.|
|7|Format additional clauses and table effects safely|Supported emphasis survives; attributes and executable markup do not. Plain exports remain readable without literal formatting tags.|
|8|Use shared row cadence for editor and rendering|Saved row cadence is the comparison authority; per-spell tags appear only for genuine exceptions, including loaded legacy values.|
|9|Reduce spell-row spacing to the statblock grammar|Use incumbent row typography and compact line height; verify actual rendered rows and wrapping.|
|10|Infer multiclass state from authored sources|Remove the independent legacy checkbox authority; extra sources determine combined behavior without hiding saved lists.|
|11|Use class/subclass-filtered enriched source spell choices|Each source retains its own selections, ceiling and off-list legacy entries. Existing spell metadata enriches options without pretending missing catalog fields exist.|
|12|Explain source-local learning limits and native resources|Own-level ceilings, cantrip/known/prepared reference counts, selection counts and resource recovery are source-local; combined slots do not grant higher-level class learning.|
|13|Expose explicit custom resource-pool contribution configuration|Each source may author a rational level contribution into the selected slot/Pact/Points/Focus pool. Native behavior remains the default; native authored slot overrides remain authoritative.|
|14|Resolve custom pool contributions in the unified resource projection|Contributor configuration affects resources and rendered summaries; it does not rewrite native spell learning, cantrip limits or subclass grants.|
|15|Preserve contribution settings through schema/import/reload|Legacy saves gain compatible defaults without losing unknown settings; invalid custom fractions cannot create non-finite resource totals.|
|16|Add regressions across composition, presentation and contribution boundaries|Focused core/browser checks supplement the unchanged final gate; source/target coverage and actual final totals must be recorded after the freeze.|

## Root-cause and integration findings

The additional-container failure was not a missing click handler. `ActionsEditor` rebuilt a unified entry projection without `descriptionContainers` for every role. A click wrote a block into the persisted source, triggered recomputation and received a fresh projection with no blocks. The editor therefore hid the new block; a later add could replace the saved list. Carrying the source containers in each projection repairs the ownership path rather than adding another temporary UI store.

Lair controls previously advertised the same feature without a corresponding declared container field and complete rendering path. The candidate adds optional typed container ownership and connects the existing safe formatter to the Lair projections; final adapter/runtime proof remains required.

The previous rich-text pass covered many freeform fields but not every editable catalog/custom-mechanic or numeric presentation boundary. The candidate treats authored formatting and numeric calculation as separate data concerns: arithmetic/bindings retain their existing contracts; eligible presentation metadata controls output styling. This is not a claim that every integer field has a complete universal binding/presentation migration.

Cadence deduplication must compare a spell to its actual owning row after legacy values are normalized. A badge that matches some other source or a default cannot be considered a genuine exception merely because its stored spelling differs.

Multiclass consolidation is inferred from sources. Custom contribution controls are explicitly authored homebrew overrides, not official Warlock multiclass rules. A half-level contribution to a shared pool changes the configured resource pool; native per-class learning references remain independently derived from that class's level and ability.

Native saved/manual slot arrays remain authoritative. A computed consolidated resource summary must not contradict an authored source override; when overrides differ, the summary identifies the override and directs attention to source rows. Explicit custom contribution routing supersedes that native slot array for the configured custom pool. Pool count consolidation does not overwrite each source row's explicitly authored recovery cadence.

## Known limits and honest capacity boundaries

- Capacity hints remain **Legacy 2014 base-class references**. Complete 2024 progression, authoritative subclass/species grants, always-prepared grants and every third-party resource system are not implemented by these hints.
- The existing spell catalog does not supply complete authoritative duration/casting-time metadata for every spell. Enriched options can show only metadata actually available; this packet must not fabricate missing timing/duration facts.
- Custom Points/Focus contributions are explicit configuration, not an implementation of Iron Kingdoms progression rules.
- Native learning ceilings and cantrip/known/prepared limits do not automatically change when a source contributes differently to a custom shared resource pool. The UI must explain that distinction.
- Numeric presentation is offered only for paths with a consumer adapter; usage and recharge remain excluded from this packet.
- Stable source/pool identities, full typed outcome predicates, complete region/container transactions and complete export/theme/print closure remain roadmap work.
- Supplemental export proof confirms Lair description containers in Tarrasque plain prose. Its existing movement JSON still omits traversal riders; this is recorded under adapter completion, not counted as fixed or silently presented as universal export parity.

## Dependency-ordered continuation and grooming

1. Publish this frozen candidate and record live byte parity and the immutable release receipt; retain Build226 recovery material.
2. Continue **A11.5**: source-owned container/region transactions, stable identities, typed recipient/attitude/type/plane predicates, lossless versioned migration and adapter/theme/print proof. Keep the newly exposed projection-loss case in the regression fixtures.
3. Complete dependent **A11.9** explicit-roll interaction and random-result adapter/print evidence; then purpose-led help under **H9** and per-file type debt under **H14**.
4. Continue **A12.8–A12.9** with stable casting-source/pool identities and lossless migration before authoritative ruleset capacities/grants. Keep native learning, shared resources, source-local cadence and authored custom contribution as distinct concepts.
5. Enrich spell metadata only from documented catalog/rules sources, tracking absent duration/casting-time and subclass/species grant provenance explicitly. Do not replace absent data with attractive but ungrounded option labels.

## Final evidence to append

Final core total; lint errors/warnings; approved-baseline compiler comparison; production build; both target browser suites and focused emergency checks; export/print evidence; archive checksum preservation; remote source/Pages commits; release tag; live footer and byte-parity receipt. The linked final gate records observed results; complete print/all-adapter closure remains explicitly open above.

## Preservation and workload evidence

[Candidate workload](../evidence/build227/workload.json), [ledger measurement](../evidence/build227/ledger-measured.json), [prior candidate manifests and protected original verification](../evidence/build227/preservation-verification.json). Preservation verification is independent of final release qualification.

## Integration lessons and next-loop acceptance order

The integrated browser pass exposed two gaps that isolated helpers did not: production store actions detached literal presentation metadata, and traversal badges interpolated rich text as plain strings. Styled literals now retain their display metadata without changing arithmetic; clearing all styles restores ordinary literal detachment. Traversal rendering uses the shared attribute-free formatter, while prose exports strip supported markup. The regressions cover real controls and reload, not helper output alone.

Browser assertions must inspect the rendered component contract: Quasar forwards a select's marker to its native input container and puts disabled semantics on its header. The source picker is exercised through pointer events. Hidden expansion content must be opened before selecting text. These corrections retain the intended assertions instead of accepting invisible or programmatic-only changes.

Continue existing roadmap IDs with these acceptance substeps, without adding duplicate ledger IDs:

1. **A11.5 ownership:** cover source identity through add, reorder, copy, role change, delete and undo; retain unknown extension data in each transaction.
2. **A11.5 outcomes:** define recipient/attitude/type/plane predicates independently of layout; prove one, two and four-region rendering before expanding authoring controls.
3. **A11.9 adapters:** carry explicit random-roll outcomes and Lair containers through each export and print adapter, with no fabricated automatic roll result.
4. **A12.8 source/pool identity:** distinguish generated pool caches from intentional source slot overrides in versioned data; preserve this release's authored counts during migration.
5. **A12.9 rules provenance:** add ruleset-specific capacities, subclass/species grants and timing/duration metadata only with documented provenance; keep absent values visible as absent.
6. **H9/H14 completion:** explain only supported controls, reject dead formatting affordances, and reduce compiler debt by owned file without changing the approved baseline to hide new errors.

## Frozen release evidence

Final frozen-source gate **10/10** passed: **562 core tests (+22 versus Build226)**, exhaustive SPA/Pages browser scenarios, container lifecycle, numeric presentation, source-owned spellcasting, rich mechanics, release matrix and fit checks. Typecheck: 531 diagnostics; 0 new; 152 resolved (approved baseline 683, Build213 e19a624). Lint: zero errors, 2721 warnings. Existing debt remains. Publication verification follows.

[Gate](../evidence/build227/summary.json), [workload](../evidence/build227/workload.json), [preservation](../evidence/build227/preservation-verification.json).
