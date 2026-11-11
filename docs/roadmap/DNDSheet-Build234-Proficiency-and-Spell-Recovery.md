# Build 234 — Proficiency scale and shared spell recovery

Basics offers Monster (CR) and Character (HD). Character scale treats Hit Dice as character levels for proficiency, with the same level 1–20 bounds as the character editor. Manual proficiency takes precedence. The selected scale persists with the monster.

Spellcasting rows omit a recovery label when multiple sources use the same resource type and recovery and the resource summary supplies that cadence. An inherited Pact slot count stays in the pool summary. Authored row amounts and different recovery rules remain visible.

The browser exercised the scale selector, live Hit Dice changes, CR changes, and reload. The core tests exercise shared Pact recovery and resolved Hit Dice feeding PB formulas, including cycle detection.

The final release gate passed all 10 stages.
