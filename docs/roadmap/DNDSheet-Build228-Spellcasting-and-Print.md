# Build228 — Spellcasting sources and A4 print

Build228 starts from Build227 receipt `1caab19` in an isolated checkout. Build228 is published; Build227 remains available for recovery. The original checkout and prior candidate archives are preserved.

## Acceptance scope

| Area | Acceptance changes |
|---|---|
| Source lifecycle | Fold each class independently; keep its configuration and spells together; remove any source, including the last; promote the next source without losing its assignments, maps, or bindings; preserve innate spellcasting when classes are removed. |
| Casting presentation | Show amount → cadence → level or spell → action; hide cadence without a positive amount; omit redundant inherited cadence; show explicit Action exceptions on Bonus Action rows; use the configured recovery in the Pact slot sentence. |
| Consolidation | Render the combined caster level; recalculate the combined cantrip and known/prepared limits; give each limit an independent level basis and ratio; retain each source’s own spell eligibility. |
| Editor and catalogue | Move Metamagic above source folds; filter by class and known subclass lists; show verified 2024 grants at their class thresholds without consuming selection budget; include Cleric choices for Divine Soul. |
| Rendering and print | Share the casting projection across the statblock and exports; preserve the composed A4 sheet’s physical size, padding, typography, colors, and artwork layers in print while removing editor controls and preview zoom. |

Combined learning is a homebrew capacity rule. Standard resource pooling still separates Pact Magic unless the author changes its contribution. Per-source native learning remains available. The grant catalogue covers verified entries for Fiend, Life and Devotion, and Divine Soul’s additional list access. Complete subclass, class-feature and species grant coverage remains open. Divine Soul’s alignment-based selection is not inferred.

Legacy cadence values that already contain a count retain that count when no separate amount was authored. A separate amount takes precedence; an explicit hidden amount suppresses the label. The browser and prose exporters use the same resolved spell entries. Eight export fixtures passed, including preservation of a saved `1/Day` row when the corresponding shared slot pool contains three slots.

Print verification covers fitting A4 portrait and landscape sheets in Chromium: matching page geometry, text styles and composition layers, and one PDF page with the expected physical dimensions in each orientation. Oversized layouts and printer-specific settings were outside those checks.

Rules references: [2024 Free Rules: Character Classes](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), [SRD resources](https://www.dndbeyond.com/srd), [Divine Soul list access](https://www.dndbeyond.com/posts/1080-druid-201-a-guide-to-multiclassing).

## Workload and follow-through

Baseline: 268 normalized IDs, 174 complete and 94 open; 562 core tests. This packet changes spellcasting and print acceptance criteria under the existing IDs. It does not imply closure of A12.8 or A12.9. **Workload:** 268 normalized IDs, 174 complete / 94 open before and after; delta 0. This packet implements 20 bounded acceptance changes without closing the broader source migration and catalogue parents.

Continue class and subclass catalogue coverage with edition and source provenance. Keep per-source spell access, shared slot pools and learning limits independently verifiable. Extend print coverage to oversized and multipage sheets separately from fitting A4 sheets.

## Release evidence

Frozen release gate **10/10** passed with **581 core tests (+19)**, exhaustive SPA and Pages browser scenarios, casting source lifecycle and learning checks, five spell themes, and A4 portrait and landscape PDF parity. Typecheck: 515 diagnostics; 0 new; 168 resolved (approved baseline 683, Build213 e19a624). Build227 and 480 files across five prior archives remain verified. Published and verified. Source `ef9f9f59eeb350fcd324f871d68e995b117dd2e1`, Pages `3b079efb6aa4b2ce2843a30c8a63b4b426ab88d8`, tag `rc-2.4.3-build-228-spellcasting-sources-and-print`. Live index and application assets match the tested Pages build. The fresh browser footer reads `v2.4.3 build 228`. All 96 archive checksums pass.

[Gate](../evidence/build228/summary.json), [workload](../evidence/build228/workload.json), [preservation](../evidence/build228/preservation.json).
