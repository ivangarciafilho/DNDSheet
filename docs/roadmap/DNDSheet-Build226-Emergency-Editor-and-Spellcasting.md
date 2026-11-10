# Build226 — Emergency editor and spellcasting candidate

## State and workload

Validated candidate based on Build225 receipt commit `43315ceda1677446b1b289ad969b2207dc2067ca`. Build225 remains the verified published release until a new publication receipt is recorded. Work is isolated in `.codex-temp/build226-work`; the original checkout, existing release candidates and user sample are protected.

Normalized ledger: **268 IDs, 174 complete / 94 open → 174 complete / 94 open**. Whole-ID delta **0**; added IDs **0**. Raw ledger: **277 IDs, 183 complete / 94 open**, unchanged. Implementation items below are separately measured acceptance changes, not new whole-task closures.

## Delivered implementation acceptance changes

| # | Candidate change | Acceptance boundary |
|---|---|---|
| 1 | Replace skill placement dropdowns with default-on Move To Action Group checkboxes | Keep Action/Bonus Action cost toggles and explicit legacy placement compatibility |
| 2 | Move Medicine into Search | Shared mapping serves editor and rendered skill group |
| 3 | Consolidate skill header/relocated row projection | Preserve override, condition, rider, advantage and cost facts |
| 4 | Canonical optional passive skill state in monster/store types | Skill overrides and routing must persist automatically through reload/import |
| 5 | Normal-weight italic spell names | Headers/cadences may remain bold; verify actual computed web styles |
| 6 | Suppress redundant per-spell cadence tags | Only exceptions to the owning row cadence are tagged |
| 7 | Apply cantrip row cadence and Bonus Action | Shared heading/projection no longer exits before reading overrides |
| 8 | Respect explicit cadence on lower pact rows | Do not suppress authored row settings based on resource context |
| 9 | Fold assigned spell levels inside each casting source | Primary standard list and extra-source selections stay separate |
| 10 | Filter choices by source class/subclass and own spell ceiling | Combined slots do not grant another class's learning ceiling |
| 11 | Retain unknown/off-list assigned spells during edits | Empty filtered catalogs must not silently become unrestricted catalogs |
| 12 | Show source-local capacity references and selection counts | Explicitly labelled Legacy 2014 base-class reference; no fabricated custom defaults |
| 13 | Author custom Focus/Points maximum and recovery | Render authored resources without inventing game-specific progression |
| 14 | Share Action/Trait/Reaction compositor fields | Reaction adds trigger; compatibility collection adapters remain |
| 15 | Preserve complete mechanics/extension data across reviewed role copy | Existing confirmation/new-identity contract retained; copied recharge stays visible and an authored reaction trigger survives the return copy |
| 16 | Register compatible trait/reaction numeric paths and copied bindings | Reference changes must update the destination instead of freezing a value |
| 17 | Add compact rich-text authoring to freeform mechanic fields | Attribute-free allowlist; existing number/formula/catalog fields retain their contracts |
| 18 | Carry safe mechanic formatting through web and plain projections | Outcomes, containers and random-table prose preserve meaning without literal HTML in plain text |

## Integration findings

- A browser persistence check found that skill passive preferences lived on a transient Pinia property. The candidate declares optional canonical state instead of introducing a competing second authority.
- Source-local pickers must keep unknown legacy selections and distinguish spell learning capacity from multiclass shared slot capacity.
- A custom or unavailable rule progression must remain explicit. Source-local reference hints do not implement every subclass grant, species grant, 2024 progression or Iron Kingdoms Focus system.
- Shared fields require shared numeric registration and commit behavior, as well as shared visible controls. Cross-family copy retains full authored records and compatible binding paths. Review also restored action-style recharge visibility on copied traits and preserves an already-authored trigger when copying back into Reaction; these facts must not disappear merely because the compatibility collection changes.
- Rich text is a data-path change: editor formatting alone is insufficient. HTML escaping, token processing, plain exports, disabled controls and reload are part of acceptance.

- Integrated browser runs exposed two obsolete expectations: the former Tools heading and deliberately shallow Reaction/Trait field lists. The assertions now require the intended Use Tool label and complete shared field sets; their transaction, rendered-data, focus and persistence assertions remain. Superseded failure logs are retained. Both interrupted gate processes were stopped only after their browser suites had exited, before changing test inputs. The final complete run supersedes them.

- Full-role export testing found that Improved Initiative retained generated strong number tags after rich-text support expanded. Its plain boundary now reuses the existing semantic export tokenizer in an explicit plain mode. Nested authored emphasis, generated number chrome, entities and comparison signs have a regression.
- Reviewed export snapshots now place the default-on skill groups under Actions. Canonical passive state also prevents a prior fixture's Hide Bonus Action setting from surviving a reset. Snapshot changes were limited to those facts.
- Reload tests now wait for a different document and its actual editor stores, covering both monster and character mode; this replaces timing assumptions without retrying failed assertions.

## Verification status

Current gate progress (not a completed gate): core539 passed; compiler comparison559 existing diagnostics/0 new; lint0 errors/2693 warnings; build and subsequent gates pending at this recording. The original checkout was inspected read-only on branch `build185-repairs` with5 dirty entries; historical83-file/statblock-branch snapshots do not describe its present state. This packet has not edited that checkout.

Preliminary development evidence: **540 core tests passed (+36 versus Build225's504)**. Focused browser suites passed skill routing/defaults/Medicine/details/reload (11 boolean checks), spell row cadence/economy, exception tags, computed italic styles, source filtering/isolation, authored Focus and reload (10 checks), and shared compositor/rich-text draft isolation/rendering/persistence/extension retention/reload (6 checks). These are preliminary runs; the final gate logs must independently confirm the frozen candidate.

The compiler comparison now normalizes only TypeScript's exact `... N more ...` display token, whose count changes when a shape gains an optional member. File, diagnostic code, visible message/type text and diagnostic multiplicity remain compared. This avoids treating a compiler display-count change as a new diagnostic while retaining the new-error safeguard; it does not refresh the approved debt baseline or suppress visible errors.

Final frozen-source gate **10/10** passed: **540 core tests (+36 versus Build225)**; **58 exhaustive browser scenarios on SPA and Pages**, plus the three emergency suites on each target (11 skill, 10 spellcasting and 6 rich-mechanic checks); 19 outcome lifecycle checks, 60 fixture/theme cases, 120 representative contrast samples and 10 fit views with no clipping observations. Zero runtime exceptions. Type guard: 559 existing diagnostics, zero new against the unchanged baseline; lint: zero errors, 2692 warnings. Existing debt remains. Publication/live verification follows.

## Groomed continuation

1. Publish the final tested source; record the immutable candidate, live footer, byte parity and receipt.
2. Resume A11.5: stable container/region ownership, typed recipient/attitude/type/plane predicates, lossless versioned migration and complete transaction/export/theme/print proof.
3. Finish dependent A11.9 explicit-roll interaction and adapter/print evidence; then H9 and H14.
4. Complete A12.8–A12.9 stable source/pool identities, migration, resource separation and ruleset-aware capacities/grants. This emergency packet advances authoring but does not close those architecture contracts.

## Evidence

[Final gate](../evidence/build226/summary.json), [measured workload](../evidence/build226/workload.json), [ledger](../evidence/build226/ledger-measured.json), [prior archives](../evidence/build226/prior-archives.log). The original checkout's four modified tracked files have recorded hashes and remain protected.
