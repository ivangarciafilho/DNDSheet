# Build219 — Complete Tarrasque prose without losing mechanics

## Refreshed source and release scope

Official base `ac4bdaea5998e80df81d19285cc21465da16dcd3` includes the four intervening215–218 commits. They are retained, not replayed. Their appended handoffs supersede the stale214 headline; build.json still214 at this base means the footer alone cannot establish their presence. Build219 updates the embedded identity before verification.

Ruling: finish B4.20, the remaining Tarrasque half of B4.7, before extending the outcome model. Original records supply each numeric field and each prose call. Do not zip shared arrays or match titles: sorting, relocated combat groups and active phase filtering make those associations unsafe. Export all authored records regardless of the web's current phase filter. The existing target merges bonus actions into its actions list. Mythic material uses a readable special ability, not an invented target JSON field.

## Acceptance packet

These are independently observable delivery items under existing B4.7/B4.20, not new top-level roadmap IDs.

1. Structured trait targeting/outcomes/formulas survive prose export.
2. Legacy trait text and resource cadence survive.
3. Physical attack descriptions retain base and additional damage.
4. Physical attack bonus, damage dice and damage bonus retain exact source values.
5. Structured generic actions retain attack/save mechanics and outcomes.
6. Bonus actions occur exactly once in the supported target list.
7. Reactions retain triggers and resolve context tokens.
8. Custom-preamble entries retain nonempty fallback names and complete bodies.
9. Duplicate names cannot crosswire numeric metadata.
10. Selecting phase1 cannot erase phase2 export records.
11. Description containers, recipient labels and random-result prose survive.
12. Encoded literal angle text stays text; renderer HTML/chrome does not leak.
13. Templates do not alter the export within a rules style; intentional2014/2024 wording remains allowed.
14. Legendary membership/cost and structured legendary-only descriptions survive.
15. Innate spell rows retain spells and cadence rather than object stringification.
16. Cantrip text uses the shared heading, without Markdown formatting artifacts.
17. Repeat exports are deterministic and do not mutate source state.
18. Reload retains source records and exported facts.
19. Headers cross a complete plain-text boundary, including themed markup.
20. Mythic material survives in a supported narrative field.

## Before-work accounting

Current unique raw ledger:265 IDs,159 checked/106 open, including9 historical checked B183 rows. Normalized ledger excluding those historical rows:256 IDs,150 checked/106 open. This is a refreshed denominator, not a retroactive change to Build214's237-ID snapshot. Existing B4.7 and B4.20 overlap as parent scope and remaining target implementation; report those closures explicitly rather than calling the acceptance checks20 whole-task closures. No new scope IDs are needed.

## Review and focused proof

Independent review found a phase-prefix lead bug: the phase badge prevented anchored title extraction, losing cadence in the exported name and duplicating the title in description. The plain-text entry boundary now separates that generated prefix, preserves its phase annotation and extracts the actual lead. A pure regression proves Pulse (2/Day) and its phase text independently. The browser fixture covers phased cadence as well.

Focused Step57 passes22 boolean checks: four rules-style/template combinations, structured and legacy traits, exact physical metadata for duplicate names, actions, bonus actions, triggered reactions, custom preambles, off-phase retention, containers, cantrips, innate spells, mythic narrative, headers, repeated exports, source immutability and reload. The first probe exposed a test race with the closing download menu; bounded polling replaced it. The language fixture uses the current languagesList model, not a deprecated display-only field. Only the intended Tarrasque golden differs after regeneration: Trigger/Response is retained and cantrips lose Markdown artifacts; seven other format goldens are unchanged.

The pinned type guard caught a new reaction cast diagnostic before the full gate started. A typed partial projection with normalized phase shape resolves it;613 existing diagnostics/0new remain. The baseline was not rewritten.

A further review retained every physical attack definition, including legendary-only attacks: the old target stores their dice and bonuses in its actions definitions, and removing them would leave legendary references without mechanics. Step57 now has an explicit Hidden Claw (3d10+6, +13 attack) case. A provisional full run also failed reload equality; the fixture now authors proficiency3 with its override enabled and waits for both monster and editor hydration before comparing exact output. The full-context failure was traced to the fixture: synchronous mutations immediately after Pinia reset ran while reset temporarily suspended subscription listeners, so storage retained the reset state. The fixture now yields after reset before authoring records, and supplies complete additional-damage records (including ID and note). This preserves automatic persistence rather than forcing a manual save. Focused proof passes; final integration evidence below remains the acceptance authority. Failed/provisional runs are not release proof. H13 retains its recorded Build215 closure; this packet does not claim three consecutive unchanged-source runs.

## Workflow findings carried forward

- Refresh full remote commit IDs before selecting work; a remembered footer may lag source history. Version the release before building it.
- Source records own metadata. Shared visual arrays can sort, relocate and filter; prose reuse must not change record association or export coverage.
- Wait for menus to close and for expected rendered entries, not fixed elapsed delays. The provisional full gate exposed Step47 reading four missing heading entries on its first2014/modern switch. Bounded polling retains all16 heading assertions; focused Step47 then passes. The failed provisional run is discarded as release evidence.
- A provisional Pages run read zero editor panels immediately after reload in Step49. Poll for the expected15 panels before measuring; keep the exact count and all retirement/template/reset assertions. Discard that run as release evidence.
- Review golden diffs before the final gate; a broad regeneration is not approval of unrelated changes.
- Continue the pinned baseline comparison. It caught a real new diagnostic in this packet; reducing a total or adding a cast is not an excuse to absorb new diagnostic signatures.

## Verification and continuation

Final verification: frozen-source gate10/10;442 core tests;57 exhaustive scenarios on SPA and Pages with zero browser errors. All22 Step57 checks pass in both builds, including exact export equality after reload. Type guard613 existing/0new. Whole-task closures B4.7/B4.20 yield normalized152 complete/104 open (from150/106); raw161/104 (from159/106). Preserve the approved type baseline, previous release candidates and protected checkout. New parser/boundary tests plus browser Step57 must establish the acceptance packet. Update intended Tarrasque golden changes only after reviewing the actual output. Run the final ten-step gate on frozen source, then publish with full base/commit IDs and verify remote/live parity.

After this delivery: A11.5 stable container/region ownership and typed result/predicate validation → A11.9 → H9 purpose-led help → H14 per-file type debt. H22 isolated-step tooling and owner decisions remain separately open. H13 retains its recorded Build215 closure; historical214 headlines are superseded, not treated as current open work. Export shared prose does not imply native support for every homebrew mechanic in a target application.


## Groomed A11.5 execution packet (existing scope, still open)

1. Map every current outcome/container field from editor command through store, schema import, identity graph and each projection; list authored versus derived values explicitly.
2. Define stable container and region ownership, N containers with at most4 regions each, and explicit inline/vertical/horizontal/2x2 presentation. Keep mechanics independent of coordinates.
3. Define typed audience, creature-type, attitude and plane predicates using shared catalogs; preserve current free-text filters as legacy/custom data rather than guessing a conversion.
4. Validate result IDs and links for duplicate, missing, self, cyclic and cross-container cases; references must remain attached after reorder/copy/delete.
5. Implement a lossless versioned migration with unknown-field preservation and rollback/export fixtures before changing stored shapes.
6. Implement transactional editor commands and meaningful previews with Apply/Cancel/undo/redo, stable IDs and no render-time writes.
7. Resolve once into a common presentation model, then web and prose adapters. Specify each target's phase/omission policy instead of inheriting live-sheet filtering accidentally.
8. Prove the full fixture matrix: save/import/reload, web/prose/VTT outputs, 12 themes and compiled print including long tables. Close A11.5 only after its whole acceptance; then connect A11.9 random-result tables.


## Published release

Source `64066d666b2d0b55ed07c1793333e71a3e170db2`; Pages `d28f171e197cd2fa370615cb09a414804b783a66`; tag `rc-2.4.3-build-219-tarrasque-prose-and-mechanics`. GitHub Pages reports built; live footer219 verified without changing browser data. Live index, entry JavaScript/CSS and MonsterBuilder chunk match tested Pages bytes. Frozen candidate copied to central archive with all96 entries verified. [Publication receipt](../evidence/build219/publication-receipt.json).
