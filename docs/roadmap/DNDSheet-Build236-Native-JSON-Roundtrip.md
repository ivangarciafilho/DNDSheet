# Build 236 — Native JSON round-trip

The native monster export includes complete monster data, sheet presentation, A4 composition and artwork transforms, and referenced custom spell definitions. Older native files still migrate. Missing spell definitions in legacy files no longer delete assignments. Externally hosted artwork remains a URL.

The browser regression downloads from the toolbar and imports through Open File after clearing the relevant stores. It compares the restored monster data, presentation, custom spell and rendered sheet. It also checks legacy imports with missing spells.

The final release gate passed all 10 stages.
