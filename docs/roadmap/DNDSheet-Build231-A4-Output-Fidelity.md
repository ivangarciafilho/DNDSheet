# Build 231 — A4 output fidelity

A4 PNG export measures the bundled fonts in a separate copy and lets the panel rows and statblock columns reflow during rasterization. The long reaction fixture renders its full trigger and outcome inside the panel. OCR found the final line, and visual inspection confirmed the row boundaries and both columns.

Print keeps a fixed physical A4 paper box with the selected sheet background. Oversized content scales within that box and retains its proportions. The PDF fixture has one landscape page and paints the right and bottom edges even when the content needs to scale down.

[PNG witness](../evidence/build231/wrapped-reaction.png) · [PDF witness](../evidence/build231/full-paper.pdf)

The final release gate passed all 10 stages.
