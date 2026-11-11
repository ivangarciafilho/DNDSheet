# Build 230 — Spell availability and A4 output

- Keep known-spell and cantrip limits in each casting source editor.
- Show a selectable preparation spell list with the amount and cadence.
- Present sorcery points and recovery on one line, followed by indented cost-and-effect bullets.
- Append restricted spells using the selected cadence filters, ritual tags and authored extended casting times. Explicit spell cadence overrides the row setting. Default slot recovery alone does not mark every spell as restricted.
- Mending has a catalogued one-minute casting time. Other spells with uncatalogued durations can use an extended casting time override. Preparation list names describe what can be prepared and do not reassign existing spells.
- Fit overflowing A4 compositions to one physical page in print. Export the A4 composition as PNG at full resolution regardless of preview zoom.

Focused verification produced a 1588 × 2246 PNG at 65% preview zoom and one landscape PDF page for the oversized artwork fixture with default and zero margin settings. The 587 core tests include preparation and restricted spell coverage. The initial gate passed 9 of 10 stages. The shared casting reload test needed to serialize a plain array across the browser debugger. The focused rerun and the Pages suite passed after that correction. The final release gate passed all 10 stages, including both production builds and both exhaustive browser runs.

The parent backlog remains at 174 complete and 94 open.
