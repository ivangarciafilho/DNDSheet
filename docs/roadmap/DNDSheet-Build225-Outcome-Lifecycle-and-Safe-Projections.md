# Build225 — Outcome lifecycle and safe projections

## Scope and measured workload

Base 4adb4be6b88e9f9f28fd0bd814cd4cf3a08f6cc2 (Build224 plus its saved-data tests). The interrupted local packet was preserved in a named Git stash, then integrated with the concurrent Build223/224 releases before revalidation. Work is isolated from the protected original checkout and previous release candidates. The existing sample is not reset or replaced on the published site; browser probes use a temporary profile.

This packet completes twelve concrete implementation items inside the still-open A11.5 work. It does **not** close A11.5, A11.9 or H11. Normalized ledger: **268 IDs, 174 complete / 94 open before and after**; delta **0 whole IDs**. Raw ledger:277 IDs,183 complete/94 open. No IDs added. Smaller acceptance items are reported separately from whole roadmap closures.

| # | Completed implementation item | Evidence boundary |
|---|---|---|
| 1 | Deterministic IDs prepared in temporary outcome drafts; authored IDs reserved before generation | Load and Cancel retain the saved representation; Apply records the draft IDs |
| 2 | Missing, shared, malformed, self, ambiguous, missing-target and cycle diagnostics scoped to occurrences | References are never guessed or silently redirected |
| 3 | Iterative graph validation and linear duplicate indexing | 20,000-node cycle and 20,000 duplicate occurrences tested |
| 4 | Immutable identity-based outcome/effect/table edits | Raw siblings and extension data retained |
| 5 | Move up/down controls preserve identity and references | Draft order changes independently of saved state |
| 6 | Duplicate creates a unique ID and detached nested data | One-clause copy keeps authored reference targets; whole-list helper remaps unique internal targets |
| 7 | Referenced deletion requires explicit confirmation | Dependents remain with missing-target diagnostics; Keep outcome cancels deletion |
| 8 | Explicit identity repair for shared or malformed IDs | Confirmation warns that references remain as authored |
| 9 | Malformed outer outcome-list recovery is explicit and draft-only | Replace/confirm/Cancel does not erase saved legacy data |
| 10 | Apply preserves complete authored outcome records | IDs, refs, recipients, filters, sectors, layout, dice tables and extensions survive the commit adapter |
| 11 | Shared safe prose/HTML projection preserves later clause alignment and numeric zero | String identity semantics match graph validation; numeric IDs never become reference targets |
| 12 | Contextual dice-table captions and scoped column headers; transactional browser regression | Escaping, legacy records, copy/delete/repair/Apply/Cancel and reload tested |

The refreshed remote ledger contains twelve checked IDs added by the concurrent Build223 release:268 normalized IDs,174 complete/94 open; raw277,183/94. The remote headline164/92 does not match its checkbox ledger. These upstream additions are not credited to Build225. Core baseline486 includes the five post-Build224 migration tests; this packet adds18 tests, reaching504.

## Integration findings

- Moving identity preparation into file migration initially broke lossless-record tests. That approach was removed. The versioned schema migration remains part of the next A11.5 model packet; this release prepares only an editor draft.
- Browser duplication exposed a pre-existing commit adapter that rebuilt outcomes using only trigger/effects/rider and silently discarded the rest. Apply now deep-copies the full authored list after validation. Projection normalization is confined to display paths.
- A numeric legacy ID must not become a valid string target during rendering. Only authored string IDs participate in reference resolution. Duplicate IDs remain visible errors.
- Empty invalid placeholders do not displace later prose/table content; valid bare labels such as Bloodied remain visible. Numeric formula zero remains meaningful.

- Final integration review restored the upstream null-entry guard for linked random tables. A dedicated regression preserves the inline fallback even when a legacy table list contains null. The earlier nine-step run was stopped before editing and is superseded by the final frozen-source run. Clean refreshed base independently reproduced486 passing core tests; candidate504 passes.

- Visual inspection caught caption tags rendered as literal text after token processing. Generated caption tags now pass through the same safe table boundary as headers/rows. The browser regression asserts a real caption in the final statblock DOM.

## Validation

Final frozen-source gate **10/10** passed: **504 core tests (+18 versus refreshed base486)**; **58 exhaustive browser steps on SPA and Pages**; **19 outcome lifecycle/Apply/Cancel/reload checks**;60 fixture/theme cases,120 representative AC contrast samples and10 fit views. No browser exceptions. Type guard613 existing diagnostics/0new; debt remains. Publication/live verification follows.

## Groomed continuation, in dependency order

1. A11.5: integrate the upstream region model into transactional editor controls and define versioned ownership for stable N description containers and at most four regions per container; explicit mapping from legacy sector fields, preserving untouched records and extension data.
2. A11.5: typed audience, attitude, creature-type and plane predicates; identity-scoped result graph and diagnostics that distinguish unresolved from malformed targets.
3. A11.5: transactional container/region add, move, duplicate and delete commands; region reflow independent of mechanics; no index-based durable bindings.
4. A11.5: full action/trait/reaction/attack adapter goldens and theme/print proof before closing the parent ID. The current lifecycle work is a prerequisite, not a replacement for those contracts.
5. A11.9: connect stable dice-row/range IDs and the existing random-table validator to the container model; gap/overlap/dice-expression checks, authored fallback and explicit-roll-only behavior.
6. H9: purpose-led help for the actual controls and consequences, then H14 per-file type debt. Keep current publication/evidence guards mandatory.
