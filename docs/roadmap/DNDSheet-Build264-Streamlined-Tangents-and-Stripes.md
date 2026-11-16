# Build 264 — streamlined plate tangents and line stripes

Base `a0d09bb` (Build 263). Owner-reported follow-up to the Build 263 fix.

| Report | Cause | Fix | Evidence |
|---|---|---|---|
| The name cell overlapped the line below it | The description is inline, so the row's own 16px strut (16 × 1.42 = 22.72px) sets the line pitch. The 13.6px description font doesn't, so the Build 263 calculation was based on the wrong line height | The row font is pinned and one line (`--sb-line`) is derived from it. The name cell is exactly one line plus the row's 3px top padding, with its top margin −3px | Probe: name cell bottom `522.5` = top of line 2 (`496.8 + 3 + 22.72`); line 2 starts at the plate's left edge |
| Long descriptions need alternating line stripes | — | Plates with two or more lines paint `--sb-stripe` (each theme's own tint) on every other line, using the same `--sb-line` height so stripes stay aligned with the text; one-line plates get none | Screenshot `build264-streamlined-plates.png` |

The ratchet caught 3 new `!important` declarations in the first version (365 → 368, gate failed). They were rewritten to inherit through custom properties, and the count is back to 365 with identical rendering.

Gate 11/11. The visual step was accepted as an intended change across the modern-template fixtures.

**Limits of the evidence:** stripes assume every line has the same pitch. An inline element taller than the row's strut (a large icon, say) would push the stripes out of line with the text from that line on.
