# Build 239 — Statblock layer sizing

The statblock layer exposes overall font size, final width, and final height. The fit uses the natural size as its reference, reflows content, reduces the font to a 75% automatic floor, and compresses any remaining overflow along its own axis. An explicitly smaller font size is honored. Native JSON preserves both fit dimensions.

Browser checks cover font sizing, proportional fit, axis compression, reset, A4 PDF and PNG output, and native JSON round-trip.

The final release gate passed all 10 stages.
