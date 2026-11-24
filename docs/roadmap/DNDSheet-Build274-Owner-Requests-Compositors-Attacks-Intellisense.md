# Build 274 — Owner Requests: AC & HP Compositors, Attack Presets, Composing IntelliSense, Built-in Library, Guided Dropdowns

Base `d9a293f` (Build 273, `v2.7.0`). Nine owner requests from 2026-11-16, recovered after the original Build 270 working tree (a local Windows checkout) became unreachable, then re-applied on top of Builds 270–273 one anchored edit at a time. Every edit was checked against the current file; none was applied blind.

## 1. What changed, by request

| # | Request | Delivered | Evidence |
|---|---|---|---|
| 1 | Normal preview shows a black empty portrait column | Outside A4 preview the portrait (and footer banner) is parked off-screen with `portrait-offstage`; the stat block starts at the left edge. PNG export removes the class on its clone, so exported images still carry the portrait. | `build274` smoke: portrait at `x < -1000`, stat block at `x = 0` |
| 2 | "Add Attack" only adds a bare Action | The Add Entry menu offers **Melee Weapon / Ranged Weapon / Melee Spell / Ranged Spell Attack**. Each creates a composer Action already set: attack kind, reach or range (5 ft. / 80/320 ft. / 120 ft.), one target and a hit damage outcome. The old form stays as **Add Classic Attack**. | `AttackPresets.test.ts`; smoke adds a Ranged Weapon Attack and finds `Longbow` in the stat block |
| 3 | Suggestions stop once a formula is being composed | `openMacroAt` now recognises composition inside `{…}`: after any operator, bracket or comma it suggests for the identifier at the caret (or all references when nothing is typed yet) and inserts bare ids. The formula draft field does the same after an operator. | `MacroCompose.test.ts` |
| 4 | The suggestion list is shallow | Catalog `100 → 181` entries: weapon damage by die size, spell and computed rolls, every condition, ten area templates, 2024 outcome pairs, 13 damage-type riders and common trait bodies (Magic Resistance, Pack Tactics, Legendary Resistance, Undead Fortitude…). A test proves every braced insert resolves. | `MacroCompose.test.ts` |
| 5 | Short number fields waste space; the natural AC bonus could not be clicked | `FormulaField` gains a `compact` mode (fixed `11.5rem`). A mode-locked value now shows a lock icon and tooltip instead of a caption line. **Root cause of the unclickable bonus:** Build 269 never registered `acConfig.naturalBonus`, so the field was permanently locked; registered now, and a guard test fails on any unregistered `<formula-field path>`. | `FormulaFieldPaths.test.ts` (red on the old registry, green after) |
| 6 | AC, AC Type and AC riders sit outside the AC module | One **Armor Class** card: Printed value → Base → Modifiers → Defensive rule → Riders (AC riders + free-form riders, one split toggle) → "Prints as". | smoke: AC field and AC riders inside `[data-ac-compositor]` |
| 7 | Hit Dice and HP riders sit outside the HP module | One **Hit Points** card with a live `HP n (NdM ± k)` headline: Hit Dice (compact) → Survival & defenses (collapsible) → **On death riders (Death Throes)** inside Mortality → module-wide **Hit Point riders**: *When it takes damage*, new *When it regains hit points* (`onHeal`, prints `On Regain:`), and other riders. | `HpRegainRiders.test.ts`; smoke |
| 8 | Built-in macros and formulas are invisible in the Database Studio | **Built-in library** panel under Macros & Formulas: searchable, filter chips per kind, grouped then alphabetical, colour and icon per kind, click to copy. | smoke |
| 9 | Stat block tooltips are useless; dropdowns need guidance | Stat block hover/focus tooltips, their `title` attributes and their empty tab stops are removed. Rider **Cadence** and **Timing** lists are grouped by scope (Per round, Per rest, Per day, Recharge, Time of day, Hit point state, …), alphabetical inside each group, each option with an icon, colour and guiding tooltip. Every other dropdown option without its own colour now inherits a stable colour from its group, shown as a dot when it has no icon. | `DropdownGuidance.test.ts`; help smoke now asserts *no* tooltip |

## 2. Deltas

| Metric | Build 273 | Build 274 |
|---|---:|---:|
| Core tests | 733 | 743 |
| Browser suite scripts | 26 | 27 |
| Macro catalog entries | 100 | 181 |
| Snippets / rolls | 6 / 3 | 67 / 23 |
| Help coverage | 570/570 | 570/570 |
| `!important` total | 308 | 308 |
| Files ≥ 900 lines · explicit `any` | 0 · 0 | 0 · 0 |
| TypeScript diagnostics | 0 | 0 |

## 3. What the evidence does not cover

- The group-colour fallback applies to every `catalog-select`, but only the rider Cadence/Timing lists received hand-written icons and tooltips. Other catalogs (AC defensive mechanics, damage types, conditions…) still rely on their existing metadata plus the group colour.
- Two small native titles remain in the stat block: the advantage glyph's label and the XP value.
- The attack presets set sensible defaults (`1d8 + STR_MOD`, `1d8 + DEX_MOD`, `2d8 + SPELL_MOD`, `1d10`); they are starting points, not CR-tuned values.

## 4. Traps found on the way

- **Ligature text in options.** A first cut drew the group-colour dot as a `q-icon name="circle"`; its ligature text leaked into each option's `textContent` ("circleMythic Action") and broke the fuzz suite's exact-label lookups (Step 39). The dot is now a plain coloured `span`.
- **Side-tab accent.** The design check flagged a 3 px left border on each compositor step; steps now use a tinted band with a hairline top rule.
- **Light Studio contrast.** Opening *Survival & defenses* by default exposed four pre-existing Light Studio contrast failures in that panel (budget probe); it stays collapsed by default. Logged as **G274-5**.
- **Flaky preset menu (pre-existing).** `build249-workflow-browser-smoke` also failed 1 of 2 runs on the untouched Build 273 build in this environment; its preset lookups are now scoped to the open menu.
- **Code map.** `graphify-out/` (graph, report, HTML explorer, manifest; cache ignored) was regenerated from `src`, `test` and `tools` with the AST-only `graphify update`: 5,772 nodes, 11,606 edges, 253 communities.

## 5. Groomed follow-ups

- **G274-1** Hand-tune icons and tooltips for the AC defensive-mechanic, HP source and mortality catalogs (the group colour is in place).
- **G274-2** Apply `compact` to the remaining short numeric fields outside AC/HP (spell slots, legendary count, save DCs in composers).
- **G274-3** Offer the attack presets inside the composer's role switcher, so an existing Action can become an attack in one click.
- **G274-4** CR-aware attack presets (damage dice scaled to the creature's CR).
- **G274-5** Light Studio contrast for the HP survival panels (`text-red-2` toggles, inline `#34d399` DR title, chip remove icon), then open the panel by default.
