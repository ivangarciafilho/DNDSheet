# Build 223: Container Regions, Dice Diagnostics, Senses Spacing & Condition Glossary

**Build**: 223 (v2.4.3)  
**Date**: 2026-11-09  
**Source Commit**: [`44a87af`](https://github.com/ivangarciafilho/DNDSheet/commit/44a87af)  
**Parent / Base Commit**: [`e766f8d`](https://github.com/ivangarciafilho/DNDSheet/commit/e766f8d)  
**Pages Commit**: `039b0f7`  
**Release Candidate Tag**: `rc-2.4.3-build-223-description-containers-regions-and-grammar-hygiene`  
**Production URL**: [https://ivangarciafilho.github.io/DNDSheet/#/](https://ivangarciafilho.github.io/DNDSheet/#/)  
**Verification Gate**: 10/10 PASS on frozen source (`core`, `lint`, `typecheck`, `build`, `fuzz`, `help`, `spell`, `pages-build`, `pages-assets`, `pages-fuzz`).  
**Core Unit Tests**: 472 / 472 passed (100% green, +16 tests vs baseline).  
**TypeScript Baseline**: Pinned at 613 diagnostics; 0 new diagnostics.

---

## 1. Executive Summary & Delivered Capabilities

Build 223 delivers **22 focused engineering tasks across 5 cohesive domains**, executing the scheduled roadmap milestone **A11.5 / A11.9 (Container & Region Ownership, Dice Table Overlap/Gap Diagnostics, and Audience/Plane Filters)** alongside critical typographical and grammatical normalizations across statblock vitals, speed riders, and conditions glossary:

### Domain 1: A11.5 Container & Region Ownership, Validation & Diagnostics
- **Typed Container Region Model**: Defined `ActionDescriptionRegion` in [`src/core/domain/types.ts`](file:///f:/AI_Resources/DNDSheet/src/core/domain/types.ts) and [`src/components/models.ts`](file:///f:/AI_Resources/DNDSheet/src/components/models.ts) with `id`, `title`, `kind: 'text' | 'table'`, `audience?: 'all' | 'target' | 'creatures' | 'caster'`, `plane?: string`, `text?: string`, and structured `table`. Added `regions?: ActionDescriptionRegion[]` to `ActionDescriptionContainer`.
- **Hard Cap of 4 Regions per Container**: Exported `MAX_REGIONS_PER_CONTAINER = 4` in [`src/core/domain/description-containers.ts`](file:///f:/AI_Resources/DNDSheet/src/core/domain/description-containers.ts), enforced by `normalizeContainer` and `addRegionToContainer`.
- **Dice Range Parser**: Implemented `parseDiceRange(cell: string)` supporting single values (`4`), hyphen/en-dash/to ranges (`1-4`, `1–6`, `7 to 10`), die notation (`d6`, `1d12`), and zero-padded percentiles (`01-20`).
- **Dice Table Overlap & Gap Diagnostics**: Implemented `diagnoseDiceTable(table)` providing deterministic validation of dice roll tables, detecting continuous sequences, gaps between rows, and overlapping numeric intervals.
- **Audience & Plane Filtering**: Implemented `filterContainerRegions(regions, filter)` to filter sub-regions by audience context and plane of existence.
- **Print & Prose Export Integration**: Updated `descriptionContainersText` and `descriptionContainersHtml` to render regions with semantic headings, metadata tokens, and HTML escaping.

### Domain 2: Vitals & Grammar Normalization
- **HP Rider English Grammar**: Corrected `Gains ${amt} of Temporary Hit Points while not Bloodied` to `Gains ${amt} Temporary Hit Points while not Bloodied` in [`src/core/domain/defense-and-traits-utils.ts`](file:///f:/AI_Resources/DNDSheet/src/core/domain/defense-and-traits-utils.ts).
- **Speed Editor Preset Grammar**: Updated `Gain 10 of Temporary Hit Points` to `Gain 10 Temporary Hit Points` in [`src/components/editor/SpeedsEditor.vue`](file:///f:/AI_Resources/DNDSheet/src/components/editor/SpeedsEditor.vue) and [`src/core/domain/speeds-traversal.ts`](file:///f:/AI_Resources/DNDSheet/src/core/domain/speeds-traversal.ts).
- **Speed Badge Punctuation Collision Prevention**: Sanitized speed rider text in [`src/components/rendering/useTextRenderer.ts`](file:///f:/AI_Resources/DNDSheet/src/components/rendering/useTextRenderer.ts) by trimming trailing periods before inline comma joining, resolving `Points., ` collisions.

### Domain 3: Punctuation & Distance Typography Across Vitals
- **HTML-Tag Aware Punctuation Cleaner**: Enhanced `cleanPunctuation` in [`src/core/domain/number-grammar.ts`](file:///f:/AI_Resources/DNDSheet/src/core/domain/number-grammar.ts) to match and strip stray periods and commas immediately preceding opening parentheses across closing HTML tags (resolving `14. (` and `14/+4. (`).
- **Trailing Punctuation Guard in `numHtml`**: Guarded `numHtml` in [`src/components/rendering/advFormat.ts`](file:///f:/AI_Resources/DNDSheet/src/components/rendering/advFormat.ts) against values carrying trailing punctuation.
- **Senses Spacing Normalization**: Eliminated unspaced `60ft` across darkvision, blindsight, life sense, divine sense, and ethereal sight in `useTextRenderer.ts`, guaranteeing standard `60 ft.` notation.
- **Speed Distance Unit Normalization**: Passed base speeds and rider entries through `formatDistanceUnit`, standardizing `(40ft,` to `(40 ft.,` and `5ft` to `5 ft.`.

### Domain 4: 2024 WCAG & Rules Glossary Expansion
- **Core 2024 Conditions Glossary**: Added standard plain-language glossary entries in [`src/components/rendering/statblock-help.ts`](file:///f:/AI_Resources/DNDSheet/src/components/rendering/statblock-help.ts) for:
  - `grappled`: Speed 0, Disadvantage against other targets, Advantage for the grappler.
  - `prone`: Crawling/standing movement cost, Advantage for melee attacks within 5 ft., Disadvantage for ranged attacks.
  - `incapacitated`: Can’t take Actions or Reactions, breaks Concentration.
  - `restrained`: Speed 0, Advantage against creature, Disadvantage on creature attacks and Dex saves.
  - `invisible`: Impossible to see without special senses, Advantage on creature attacks, Disadvantage on attacks against it.

### Domain 5: Verification Suite & Documentation
- **New Unit Test Suite**: Authored [`test/core/DescriptionContainers.test.ts`](file:///f:/AI_Resources/DNDSheet/test/core/DescriptionContainers.test.ts) covering region cap, dice parsing, diagnostics, filtering, and export.
- **Extended Test Suites**: Expanded [`test/core/NumberGrammar.test.ts`](file:///f:/AI_Resources/DNDSheet/test/core/NumberGrammar.test.ts) and [`test/core/StatblockHelp.test.ts`](file:///f:/AI_Resources/DNDSheet/test/core/StatblockHelp.test.ts).
- **10/10 Gate Pass**: 472/472 unit tests, 0 new typecheck diagnostics, 57 UI fuzz steps, 12 help themes, 5 spell themes, Pages subpath validation.
