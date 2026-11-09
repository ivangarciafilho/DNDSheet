# DNDSheet — current stack state

## Build 223

Published source 44a87af; Pages 039b0f7; live footer 223. Base e766f8d167f40cf613c242c1dcfd5c8087fc4eb4; source/tag/Pages identities and live parity recorded in docs/roadmap/DNDSheet-Build223-Publication-Receipt.json. The current production link is https://ivangarciafilho.github.io/DNDSheet/.

- Closed A11.5 (items a, b, c) and advanced H11: Action Description Region typed model (`ActionDescriptionRegion`), hard cap of 4 regions per container (`MAX_REGIONS_PER_CONTAINER = 4`), continuous dice roll range parsing and table overlap/gap diagnostics (`diagnoseDiceTable`), audience and plane sub-region filtering, semantic HTML/prose region exports with XSS escaping.
- Normalized vitals and speed grammar: `Gains ${amt} Temporary Hit Points while not Bloodied` (removed extraneous "of"), speed traversal preset grammar, speed badge trailing period stripping (preventing `., ` collisions).
- Normalization of typography and distance notation: HTML-tag aware punctuation cleaner in `cleanPunctuation` (preventing `14. (` and `14/+4. (`), `numHtml` trailing punctuation guard, universal senses spacing normalization (eliminated unspaced `60ft` -> `60 ft.`), and distance unit normalization (`40ft` -> `40 ft.`, `5ft` -> `5 ft.`).
- Expanded 2024 core rules conditions glossary: `grappled`, `prone`, `incapacitated`, `restrained`, `invisible` in `statblock-help.ts`.
- Ten-step final gate passed 10/10 on frozen inputs: 472 core tests (+3), 57 browser fuzz steps, 12 help themes, 5 spell themes.
- Pinned compiler comparison: 613 existing diagnostics, 0 new against approved baseline.
- Workload: 256 normalized IDs, 162 complete / 94 open → 164 complete / 92 open (+2 / -2).

## Build 222

Published source 8aa695e; Pages b65df80; live footer 222 and asset parity verified. Base 964f645fe5352b8cd7c9f8908a6ebd9cbd12133e; source/tag/Pages identities and live parity are recorded in docs/evidence/build222/publication-receipt.json.

- Character AC/speed: recorded totals with source notes, or labelled estimates.
- Ten-step final gate passed on frozen inputs: 469 core tests; 58 browser steps per SPA/Pages; 60 fixture/theme cases and 120 representative AC contrast samples; 10 viewport/scale fit views.
- Pinned compiler comparison: 613 existing diagnostics, 0 new against approved 683 baseline.
- Workload: 256 normalized IDs, 152 complete / 104 open → 162 complete / 94 open (+10 / -10).

## Continue in dependency order

A11.9 random-result integration → H9 purpose-led help → H14 per-file type debt burn-down.
