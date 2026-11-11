# Build 229 — Shared spellcasting and A4 print

Build 229 follows the Build 228 deployment and keeps the existing saved monster format compatible. The first source and additional sources now use one editor. The statblock and text export consume one anonymous spellcasting projection.

## Acceptance changes

1. Use the same editable, collapsible card for each spellcasting source.
2. Put rules edition and automatic-grant controls at the top of each source.
3. Put custom shared-resource contribution and recovery controls inside Spell-learning calculation.
4. Enter decimal progression multipliers and continue reading saved numerator/denominator ratios.
5. Calculate the highest castable spell level independently from learning capacity and resource budgets.
6. Calculate the level that unlocks always-known and always-prepared grants independently.
7. Author class, subclass, and species spell grants with a minimum level and an always-known or always-prepared designation.
8. Toggle automatic grants without deleting manually assigned spells.
9. Merge equivalent spell rows and deduplicate equivalent spells without exposing source names.
10. Keep mechanically distinct rows and budgets readable through their effective cadence, action cost, DC, and attack modifier.
11. Show live preparation counts and intervals in anonymous prose. The preview omits class names per the consolidated statblock requirement.
12. Keep above-ceiling assignments in saved data so they can return when progression changes.
13. Keep spellcasting source attribution out of the default text export.
14. Prevent transformed horizontal overflow from shrinking the whole native A4 page. Vertical content still paginates.
15. Round the overflow measurement and report when the content exceeds one A4 page.

## Verification and remaining work

Earlier focused checks passed 586 core tests, the casting source lifecycle, five spell themes, and A4 print checks. The print regression uses a landscape sheet with 1202 px of horizontal content in a 1123 px page and verifies that the portrait still prints and vertical content continues across three pages. The print change clips content outside the horizontal page boundary. Refit content in the A4 editor when every edge must appear.

Class and species grants can be authored. Complete automatic class and species coverage still depends on verified catalogues. Older saves still use a compatibility adapter for the first source. The A12.8–A12.10 parent work remains open.

The attempted release gate passed 6 of 10 stages, including 586 core tests, lint, typecheck, both production builds and Pages assets. Four browser stages stopped at startup or initial rendering. The export fixtures and final reload checks still need verification. Build 229 is being published by request with those checks outstanding. The standard release gate remains in place for future builds.
