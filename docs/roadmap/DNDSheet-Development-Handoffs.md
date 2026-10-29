# DNDSheet Development Handoffs

**Role:** Preparation and closure guide for the incremental loops in [Implementation Backlog](DNDSheet-Implementation-Backlog.md), grounded in the authoritative [Product and Architecture Specification](DNDSheet-Professional-Product-and-Architecture-Spec.md). A loop must not begin without its prerequisites and must not hand off without evidence and a written readiness packet.

**Current handoff state (2026-10-29):** Source is `statblock-overhaul` at `be0cf3f`; preserve modified `src/components/rendering/useProcessTokens.ts` and untracked `src/components/rendering/plate.ts`. TASK-001 has captured status; Loop 00 remains open. No app/build/tests were run in this documentation turn. Do not treat screenshots as proof of one runtime or one record.

## Handoff protocol for every loop

### Preparation gate — before code changes

1. Read the loop’s referenced sections in the plan and its exact tasks in the backlog.
2. Capture branch, commit, dirty paths and source state. Identify overlap with existing user work before touching any file.
3. Load the mandatory skills named for the loop. Read only directly relevant supporting references; do not load a large plugin catalog as a substitute for understanding the source.
4. Re-read source files and tests named by the task at the current commit. The previous source inventory is a map, not a guarantee that code has not changed.
5. Confirm acceptance evidence, non-goals, rollback point, and unresolved decisions. If an input changes an invariant or shared model, update the plan before continuing.
6. Keep one bounded vertical outcome. No task may depend on future code to become functional; incomplete work stays behind a disabled/unexposed control.

### Closure gate — before starting the next loop

Record: loop/task IDs; start/end revision; changed paths; preserved pre-existing diff; user outcome delivered; tests/build/browser scenarios actually run; results and environment; visual/data fixtures; migration/export compatibility; known limitations; rollback point; requirement/decision changes; backlog status; next-loop prerequisites and skills. `Done` requires evidence. If no code fix is justified, close the loop with reproducible evidence and an updated plan/backlog rationale rather than forcing a patch.

## Loop 00 — Evidence baseline and screenshot reproduction

**Backlog:** TASK-001–006. **Plan:** §§2, 24, 27, 29.1–29.4, 30.1–30.2, 30.8–30.9, 31.  
**Objective:** Establish exact runtime/data facts before diagnosing the screenshots. Protect renderer plate work.

**Load skills:** `superpowers:systematic-debugging`, `engineering:architecture`, `engineering:testing-strategy`, `design:design-critique`, `spec-kit:task-planning`. Use `anthropic-skills:ttrpg-gm-craft` only when checking rules semantics or rules-source claims, not to infer mechanics from visual formatting.

**Preparation/research:** Read `README.md`, `STACK_STATE.md`, `package.json`, route/shell, current diff, `skill-action-groups.ts`, `ActionsEditor.vue`, `MonsterTextEditor.vue`, `ClassCastingEditor.vue`, `useTextRenderer.ts`, `useProcessTokens.ts`, `WebRenderer.vue`, and relevant current tests. Capture browser/version/viewport/theme/renderer mode and source document IDs/revisions. No data fixture may be invented and called the screenshot source.

**Execution:** Reproduce skill display; recreate Soul Barrage and Veil of Radiance as distinct entries; compare editor model → normalized text → renderer → export. For every observation, classify source-data, domain, UI, renderer, adapter, stale-build, or unknown. Keep the two renderer WIP files unchanged pending review.

**Exit evidence:** Baseline packet; exact repro/no-repro result; active diff record; build/test outcomes; corrected impact estimate; open questions. Close plan assumptions before Loop 01. If runtime cannot be launched, document the environment blocker and continue only independent static inventory; do not claim screenshot root cause.

**Next handoff:** Loop 01 receives a stable evidence snapshot, paths, IDs, and unresolved version/identity decisions.

## Loop 01 — Identity and revision contract (WP-01)

**Backlog:** TASK-007–011. **Plan:** §§6, 20, 24.3, 25, 26.2, 29.5, 29.7–29.8.  
**Objective:** Add document identity and monotonic content revision around the current Monster workflow without a store/component flag day.

**Load skills:** `archetypes:architecture-paradigm-modular-monolith`, `archetypes:architecture-paradigm-functional-core`, `engineering:architecture`, `engineering:testing-strategy`, `superpowers:writing-plans`, `superpowers:test-driven-development`.

**Preparation/research:** Confirm every current Monster type and import path, history subscription semantics, schema version 11, Pinia persistence behavior and direct writer callsites. Close document envelope vs legacy payload version; decide local vs per-document presentation; do not conflate ID, name, hash and revision.

**Execution:** Define `MonsterDocumentId`, envelope, `contentRevision` and session adapter. Keep core pure use cases Monster-level until a real need requires a signature change. Adapt one revision boundary and history; reconcile duplicate model exports narrowly. Add legacy identity behavior only with fixture evidence.

**Exit evidence:** Same-name IDs, migration preservation, monotonic edit/undo/redo revisions, stale operation rejection, no duplicate history entries, current editor still operates. No repository migration in this loop.

**Next handoff:** Loop 02 consumes the ID/revision contract and can attach linter findings to stable fields.

## Loop 02 — Checks and safe repair (WP-02)

**Backlog:** TASK-012–016. **Plan:** F-05, §§5, 18, 20, 22, 25, 29.4, 30.8.  
**Objective:** Turn existing lint into truthful, navigable and reversible creator feedback.

**Load skills:** `engineering:testing-strategy`, `engineering:architecture`, `superpowers:test-driven-development`, `design:ux-copy`, `design:accessibility-review`. Load TTRPG rules review only for a rule-sensitive diagnostic.

**Preparation/research:** Read linter issue/result types, `autoFixMonster`, `MonsterLintDialog`, `CrFooter`, history behavior and target panels. Reproduce current fixable/action mismatch. Inventory every current issue code; do not infer a target from English issue prose.

**Execution:** Define stable issue IDs and entity/field target; add a registry to scroll/focus real controls; expose no-target reason. Map only safe operations to preview/apply. Bind result and operation to base revision; unsupported repairs remain informational. Recheck after apply and define if export blocks or warns.

**Exit evidence:** Each actionable issue has a real target; cancel is inert; safe fix is one undo step; stale result blocks; recheck reflects current revision; keyboard and empty/error states verified.

**Next handoff:** Loop 03 reuses semantic revision/history operations, not linter-specific UI logic.

## Loop 03 — Explainable CR tune (WP-03)

**Backlog:** TASK-017–020. **Plan:** F-06, §§5, 18, 20, 22, 25, 29.4.  
**Objective:** Let a creator inspect and selectively apply current CR planner recommendations without promising balance.

**Load skills:** `archetypes:architecture-paradigm-functional-core`, `engineering:testing-strategy`, `superpowers:test-driven-development`, `design:ux-copy`, `anthropic-skills:ttrpg-gm-craft` for mechanic-sensitive review.

**Preparation/research:** Trace `AutoTuneCr` output to every existing field write. Preserve current calculator and tests. Confirm whether attack-bonus recommendations are actually applied; record user overrides and assumptions.

**Execution:** Keep proposal/selection transient; compare source and preview; list exactly changed fields; guard with `baseRevision`; apply via one command/history operation. No repository dependency. Cancel writes nothing.

**Exit evidence:** Formula results unchanged unless separately authorized; output recommendation mapping complete; stale apply rejected; apply/undo/redo verified; limits and estimate copy clear.

**Next handoff:** Loop 04 gets revision-bound preview and the policy for semantic export snapshots.

## Loop 04 — Export parity and bounded semantic adapter (WP-06/F-04)

**Backlog:** TASK-021–025. **Plan:** F-04/F-08, §§6, 18, 21, 24, 29.1, 29.6, 30.3, 30.5, 30.8, 31.  
**Objective:** Prove that one authored ability keeps one meaning across editor, preview, print and supported export targets.

**Load skills:** `engineering:testing-strategy`, `engineering:architecture`, `design:design-handoff`, `superpowers:test-driven-development`, `anthropic-skills:ttrpg-gm-craft` for content grammar/source integrity. `design:accessibility-review` for output read order.

**Preparation/research:** Inventory `DownloadButton`, `ExportStatblock`, Markdown/HTML/LaTeX/Foundry/Tarrasque/Improved Initiative adapters and which consume renderer HTML. Review current plate diff first. Confirm which screenshot examples are independently authored fixtures.

**Execution:** Define capabilities and source revision on export result. Add semantic fixtures for each complex entry and target. Prototype a read-only adapter for one attack and one save/effect entry; preserve raw prose, IDs, role, unknown fields and order. Fix only the earliest failing layer.

**Exit evidence:** Same revision/fixture agrees at editor/semantic/renderer/export boundaries; omission/transform report matches; sanitation verified; no rules data mutation; no unreviewed change to plate files.

**Next handoff:** Loop 05 may now use stable document IDs for repository records; Loop 07 can reuse projection fixtures.

## Loop 05 — Repository, durable save and recovery (WP-04)

**Backlog:** TASK-026–031. **Plan:** F-07, §§20–21, 24–26, 29.5, 29.7, 29.9.  
**Objective:** Integrate existing adapters with a single explicit writer and truthful save/recovery states.

**Load skills:** `archetypes:architecture-paradigm-modular-monolith`, `engineering:architecture`, `engineering:testing-strategy`, `superpowers:test-driven-development`, `engineering:documentation`.

**Preparation/research:** Inventory all current Pinia persistence, `dndsheet_monster_` keys, IndexedDB records, adapter fallback behavior and callers. Confirm browser support, version and multi-tab expectations. Do not assume IndexedDB is active because an adapter exists.

**Execution:** Record backend/migration decision. Select backend at startup; operation errors must not switch writers. Add repository boundary and session save state. Migrate one source class at a time, validate/copy/compare, preserve source until verified. Make restore atomic and recovery usable without a successful save.

**Exit evidence:** Supported browser write/reopen/error/migration scenarios, source-preserving rollback, no silent “Saved,” clear recovery route; repository API and limits documented.

**Next handoff:** Loop 06 uses only repository summary/query operations and immutable IDs.

## Loop 06 — Local creature library (WP-05)

**Backlog:** TASK-032–035. **Plan:** F-02/F-07, §§19–21, 25–26, 29.2, 29.4.  
**Objective:** Help creators resume, find and reuse authored creatures without confusing identity or risking drafts.

**Load skills:** `design:design-system`, `design:accessibility-review`, `design:ux-copy`, `engineering:testing-strategy`, `engineering:architecture`.

**Preparation/research:** Confirm whether current `AppDrawer` can support a library or a route is needed. Recheck repository operations, summary schema, dirty-draft guard and delete recovery policy.

**Execution:** Implement search/filter/sort and summaries against repository queries; add open/create/duplicate/rename/archive/delete. Duplicate gets a new ID, rename retains ID. Provide empty/loading/error/large-list states and accessible controls.

**Exit evidence:** Two same-name records, rename, duplicate, dirty switch, archive/delete recovery and reopen; keyboard/narrow UI; no document loaded by name-only identity.

**Next handoff:** Loop 07 can preserve local custom spell catalogs separately from creature documents.

## Loop 07 — Spellcasting accuracy, provenance and compact projection (WP-11; F-14)

**Backlog:** TASK-036–041. **Plan:** F-14/F-12/F-13, §§2.2, 5, 6, 18, 29.4, 30.2, 30.6, 30.8, 31.  
**Objective:** Make spell limits, subclass choices, recovery and rendered layout truthful; preserve manual/homebrew authoring.

**Load skills:** `anthropic-skills:ttrpg-gm-craft`, `engineering:testing-strategy`, `archetypes:architecture-paradigm-functional-core`, `design:design-system`, `design:ux-copy`. Treat rules facts as source-backed only; audit dataset license/provenance.

**Preparation/research:** Review `ClassCastingEditor`, `SpellcastingEditor`, `useSpellLevels`, `AutoSyncSpellcasting`, spell data, `useTextRenderer`, `WebRenderer`, and existing spell tests. Confirm primary/subclass filter behavior and what `preparedSpells` means. Verify current Long Rest option; do not recreate existing controls.

**Execution:** Replace plausible error fallback with explicit unavailable state. Separate selected, allowed, granted, remaining and override values. Add subclass candidates only where source data verifies them; mark custom text. Build one compact semantic view model for editor/output; define duplicate policy and deterministic grouping.

**Exit evidence:** Primary/multiclass/subclass/custom-source fixtures, calculation failure state, counts/cadence provenance, narrow/print presentation and semantic parity. No unsupported official-content completeness claim.

**Next handoff:** Record compact output grammar and known data/overflow cases for reuse by Loop 08 where useful. Loop 09 depends on this loop only for a spell-reference field family.

## Loop 08 — Workspace navigation, visual grammar and accessibility (WP-09; F-01/F-03/F-12/F-13)

**Backlog:** TASK-042–048. **Plan:** F-01/F-03/F-12/F-13, §§4, 7–8, 18–19, 23, 29.2, 30.7–30.8, 31.  
**Objective:** Resolve repeating density, clipping and hierarchy defects through shared interaction/visual rules; make primary actions findable and presentation choices understandable without local cosmetic patches.

**Load skills:** `impeccable`, `design:design-system`, `design:design-handoff`, `design:accessibility-review`, `design:ux-copy`, `superpowers:verification-before-completion`.

**Preparation/research:** Inspect current identity/tokens in Quasar variables, `MainLayout`, app styles, A4 controls and statblock grammar; examine desktop/narrow screenshots and exact content from Loop 00. Review renderer plate changes before styling related paths. Establish viewport, zoom, theme and long-content matrix.

**Execution:** Define semantic tokens for panels/cells/labels/values/status/focus/advantage/disadvantage. Audit repeated patterns, implement wrapping/min-width/scroll behavior where needed, reorganize shell controls into primary and contextual groups, add navigation/focus targets and narrow editor/preview switch, then add Screen/Ink saver/Art plate presets over existing controls. Tooltips supplement visible labels; they do not blanket every element.

**Exit evidence:** No clipping/overlap/unreachable primary content across declared matrix; primary actions findable and appearance controls contextual; preset changes preserve Monster semantics and include reset/fallback; keyboard/touch/200% zoom and screen-reader spot check; print/theme contrast; no color-only meaning; screenshots and before/after linked to revision.

**Next handoff:** Loop 09 inherits token/API names, focus semantics and responsive constraints; expression autocomplete must conform to them.

## Loop 09 — Typed references, completion and ability grammar (WP-12; F-04 evolution)

**Backlog:** TASK-049–054. **Plan:** F-04, §§5–6, 18, 20, 25, 29.4–29.8, 30.3–30.5, 30.10, 31.  
**Objective:** Make one measured authoring workflow dynamic and composable without forcing every number into a dropdown or all prose into a DSL.

**Load skills:** `archetypes:architecture-paradigm-functional-core`, `engineering:architecture`, `engineering:testing-strategy`, `superpowers:test-driven-development`, `design:design-handoff`, `design:ux-copy`. Load TTRPG craft only where formula context changes a rules assertion.

**Preparation/research:** Inventory numeric/text fields and types; study existing `formula.ts`, `DynamicReferenceSelect`, `MonsterTextEditor`, token processing and legacy action shapes. Confirm the semantic adapter from Loop 04, the spell catalog limits from Loop 07 if relevant, and Loop 08 focus/label/responsive contracts for completion UI. Select one high-value field family and one attack/save effect fixture. Record exact supported types/units/context.

**Execution:** Specify small safe grammar and catalog; literal remains first-class. Add pure evaluator and dependency/cycle/missing-reference diagnostics. Add caret-aware completion with keyboard/accessibility. Normalize one ability subset read-only first; maintain prose as independent authored block. Do not persist new schema until adapter round-trip is proven and decision approved.

**Exit evidence:** Valid/invalid/cyclic/deleted/stale expression cases; no eval; preview reflects current revision; ordinary text intact; import/export/reload/undo preserve legacy role/order/raw text/unknown fields.

**Next handoff:** Future expansion can cover one adjacent field family only after metrics show faster authoring or fewer errors; update the plan with measured result before expansion.

## Loop 10 — Rules provenance and style separation (WP-07)

**Backlog:** TASK-055–056. **Plan:** F-09/F-12, §§6, 18, 20–21, 26, 30.6.  
**Objective:** Distinguish what edition/source is known from what the UI merely looks like.

**Load skills:** `anthropic-skills:ttrpg-gm-craft`, `engineering:architecture`, `engineering:testing-strategy`, `design:ux-copy`.

**Preparation/research:** Audit imports and current style/ruleset selectors; establish source provenance allowed by datasets. Separate explicit user assertion, imported claim, inferred value and unknown.

**Execution:** Add provenance only at declared document boundary; migrate legacy values to unknown; keep theme/style independent. Export labels only verified information and reports unsupported rules conversions.

**Exit evidence:** Legacy unknown remains unknown; style switch leaves rules payload and calculation unchanged; import/export roundtrip and copy reviewed.

**Next handoff:** Loop 11 uses stable source identities but must not require a ruleset migration unless encounter data needs it.

## Loop 11 — Combatant identity and source snapshots (WP-08)

**Backlog:** TASK-057–059. **Plan:** F-10, §§6, 18, 20, 25–26, 29.4.  
**Objective:** Keep initiative turn selection stable and encounter mutations out of authored sheets.

**Load skills:** `archetypes:architecture-paradigm-functional-core`, `engineering:testing-strategy`, `superpowers:test-driven-development`, `anthropic-skills:ttrpg-gm-craft` only if interpreting action economy/conditions.

**Preparation/research:** Read `CombatTracker.ts`, `combat-store.ts`, `CombatTrackerDrawer`, encounter persistence and existing tests. Decide active-actor removal/tie behavior and legacy index migration before editing.

**Execution:** Store active ID, migrate old index deterministically, snapshot Monster values when adding, define missing source behavior. Route damage/healing/conditions/turn commands to encounter state only.

**Exit evidence:** Sort, ties, remove active/non-active, advance/back, reload, deleted source and edit-source scenarios pass; source document semantic hash remains unchanged by encounter play.

**Next handoff:** Loop 12 closes the product truth boundary; no combat runtime code is needed for character documentation unless a link is added intentionally.

## Loop 12 — Character scope and final verified documentation (WP-10)

**Backlog:** TASK-060–062. **Plan:** F-11/F-13, §§1, 18, 19, 24–27, 31. TASK-062 closes only after its explicit dependency list is evidenced.  
**Objective:** Make character support useful within explicit limits and ensure docs describe only tested released behavior.

**Load skills:** `product-management:metrics-review`, `design:ux-copy`, `engineering:documentation`, `engineering:testing-strategy`, `anthropic-skills:ttrpg-gm-craft` for supported rule claims.

**Preparation/research:** Review `CharacterActor`, character store/editor/sheet, current AC/speed sources, release evidence for every documented claim. Decide whether feature stays reference-only or has required inputs/derivations.

**Execution:** Add sourced values or visible unknown/assumption states. Update README/STACK_STATE/feature matrix after code and UI evidence exists. Keep full character creation out of scope absent a separate product decision.

**Exit evidence:** Missing-input and override cases; character capability matrix; TASK-062 dependencies completed or the release claims narrowed to completed packages; docs tied to the exact release revision; handoff set reconciled.

**Next handoff:** Program closure, or create a new plan revision only when evidence/product direction changes. Do not keep looping cosmetic changes without measurable user value.

## Skill and research loading rules

The per-loop lists are the required core. Load an additional skill only when the work crosses its domain: `design:accessibility-review` for interaction/visual changes; `engineering:debug` for a reproduced fault; `engineering:code-review` and `superpowers:verification-before-completion` before closure; `anthropic-skills:ttrpg-gm-craft` for rules/content semantics; `spec-kit:task-planning` when scope/dependencies change. Do not load every named plugin or assume plugin presence means its method applies. Research claims about published rules, licensing or source catalogs from authoritative project files and documented sources; distinguish found evidence from inference.

## Loop closure record template

Copy once per completed loop into the project’s approved engineering log/PR description (not a new active roadmap file):

```text
Loop and task IDs:
Objective/user value:
Start revision / end revision:
Dirty paths preserved before work:
Changed paths:
Plan requirements/decision references:
Build/test/browser/visual evidence actually run:
Fixture IDs and outcomes:
Data migration/import/export compatibility:
Known limitations and deferred findings:
Rollback point and recovery procedure:
Backlog statuses updated:
Specification and ADR updates:
Next loop readiness (yes/no) and remaining prerequisites:
Next-loop task IDs and required skills/research:
```

## Stop and escalate conditions

Stop only the affected task if a working-tree change is unowned, a data migration lacks rollback, an acceptance criterion conflicts with a source invariant, a rules claim lacks authoritative evidence, or a renderer path cannot be determined. Record evidence, preserve unrelated progress, update the backlog with a named blocker, and state exactly what decision/evidence resolves it. Never “solve” uncertainty by silently narrowing user data or replacing authored prose.
