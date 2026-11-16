# Build 265 — C1a: editor panels split into sections (18 → 11 files of 900+ lines)

Base `082c2e2` (Build 264).

## Mechanism

`split-editor` (a scratch transform, not committed) moves bytes verbatim:

1. The editor's `setup()` body becomes `use<Editor>State()` in a sibling folder. Imports are re-pathed, and the same file holds a typed `InjectionKey` with `provide…` and `inject…` helpers (ADR-0003 pattern).
2. Each chosen template section becomes a child SFC whose `setup()` returns the injected state, so every template identifier resolves exactly as before. Each child registers only the components it uses.
3. The parent provides the state and still returns it for its remaining toolbar.

| File | Before | After | New files |
|---|---|---|---|
| `SkillsEditor.vue` | 1,414 | 41 | `skills/` (state + 3 sections) |
| `ResistancesEditor.vue` | 1,146 | ~60 | `defenses/` (state + 7 sections) |
| `ActionsEditor.vue` | 1,047 | ~140 | `actions/` (state + entry groups) |
| `A4LayerStudio.vue` | 1,546 | ~240 | `a4-layers/` (state + layer list; scoped `.q-slider` style moved with the sliders) |
| `LoreSection.vue` | 914 | ~110 | `lore/LanguageEntryList.vue` (same `<script setup>` context, unused names pruned per file) |
| `RadialOffsetController.vue` | 972 | 721 | scoped style moved to `RadialOffsetController.css` via `<style scoped src>` (same scoping) |
| `ChangelogContent.vue` | 952 | ~490 | `ChangelogArchive.vue` (older releases, as a fragment inside the same `q-timeline`) |

Ratchet `filesOver900Lines` went 18 → 11 and is recorded.

## Defects caught before the gate

| Defect | Caught by | Fix |
|---|---|---|
| Template type assertion `as MonsterToolProficiency['stat']` lost its import | typecheck | Moved into the state as `setToolStat()`, so no template-only type import (which would also have raised a lint warning) |
| Parent toolbars use state (`filteredEntries`…) | typecheck | Parent returns the provided state |
| A dialog component used from script (`NewTemplateDialog`) | typecheck | Re-imported in the state file |
| Parent toolbars use components the transform didn't re-register (`MultiattackComposer`, `RoleHeaderEditor`, `ActionAssociations`, `CatalogSelect`) | tag-vs-registration scan (lint doesn't catch this) | Registered in the parents |
| Scoped `.q-slider` rule didn't reach sliders moved into a child | review | Rule moved with the sliders |
| Generated tag `a4layer-list` (Vue expects `a4-layer-list`) | lint `no-unused-components` | Tag fixed |

The browser probe expanded every editor section with no Vue warnings or errors, and all sections rendered. Gate 11/11; visual 104/104 identical to production (the stat block is unchanged).

## Limits of the evidence

- The browser suites drive the editors through the fuzz and help scripts, not every control in every new section.
- `useBasicsContext.ts` (1,012 lines) is not split here. It moves with the C1b domain-type split.

**Gate note:** the first gate run failed on `core`. The C2 inventory guard flagged 5 A4 layer number inputs as unclassified, because they had moved to `a4-layers/A4LayerList.vue` and the presentation rule matched only `A4LayerStudio`. The rule now matches the new folder too. This is the guard working as intended.
