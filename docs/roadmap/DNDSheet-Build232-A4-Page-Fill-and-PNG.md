# Build 232 — A4 page fill and monster PNG

Print measures the artwork and statblock bounds and scales width and height separately to fill the physical A4 page. The page retains one pixel of clearance at each edge before browser rounding. Filling both axes can change the proportions of the artwork and text.

Both monster PNG commands use the bundled-font capture and flexible panel rows. Ordinary export uses at least 1120 CSS pixels before rasterization. A narrow statblock uses one column during capture to keep long cells visible.

The focused browser check measured the artwork and statblock gutters on both axes and verified a single A4 page. The ordinary PNG witness was inspected for wrapped text. OCR recovered the end of the trigger and outcome.

[Ordinary PNG witness](../evidence/build232/ordinary-monster.png) · [Stretched A4 witness](../evidence/build232/a4-stretched.pdf)
The typical landscape PDF fills the paper with the artwork and statblock frames. The intentionally overfull stress fixture retains a roughly 22 pt parchment strip at the bottom in Chromium native output.

The final release gate passed all 10 stages.
