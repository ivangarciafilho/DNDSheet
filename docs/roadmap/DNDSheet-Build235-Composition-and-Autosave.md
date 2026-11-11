# Build 235 — Composition and autosave

- Spellcasting joins slot recovery and spell preparation when their cadences match. Sorcery Points and costs use compact numbered badges.
- Senses and Languages offer the at-will Detect Magic and Speak with Dead rulings. Combat action groups consolidate equal scores, and generated targeting uses shorter wording.
- A4 composition offers overall text scaling and a statblock width that reflows the text. Artwork layers support replacement, independent axis scales, quarter-turn rotation, and mirrors. Radial controls have 50% more range.
- Browser autosave falls back to IndexedDB after localStorage rejects a write. Diagnostic recovery and reset include both storage locations. Export remains available if browser storage is unavailable.

This build addresses 13 reported requests across these four areas. Parent backlog totals remain 174 complete and 94 open. Core coverage increased from 589 to 594 passing tests.

Chromium verified image replacement on the existing layer, font growth from 100% to 125%, and statblock width reflow without a scale transform. Both 5.6 MB artwork snapshots survived reload. The browser sweep also verified that unfinished numerical input no longer throws in the offensive CR estimate.

The final release gate passed all 10 stages.
