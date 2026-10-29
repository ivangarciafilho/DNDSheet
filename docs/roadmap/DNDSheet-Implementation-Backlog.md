# DNDSheet — Implementation Backlog

> **The checklist and the living timeline.** Every loop of the [Product & Architecture Specification](DNDSheet-Professional-Product-and-Architecture-Spec.md) broken into tasks you can tick, in the order they should ship, with the commit that proves each one. Preparation and closing rituals live in the [Development Handoffs](DNDSheet-Development-Handoffs.md).

| | |
|---|---|
| **Version** | v2.0 · 2026-10-29 · supersedes the v1 backlog (git `b83ee56`) |
| **Code HEAD** | `c543615` on `statblock-overhaul` · tests 103 / 103 green |
| **Progress** | **4 / 28 loops shipped** · **26 / 188 tasks done** (14 %) |
| **Now** | Documentation v2 (this commit) |
| **Next** | **A4 · Spellcasting plate** — card ready in Handoffs §6.2 |

---

## 0. How to use this backlog

📍 *Backlog › 0 Usage* — **Tick a box only when its proof exists; add a task the moment a blindspot turns into work.**

| Symbol | Meaning |
|:--:|---|
| `[x]` | Done — proof recorded (test, probe, screenshot or commit) |
| `[ ]` | Pending |
| `[~]` | In progress (only one loop at a time) |
| `[-]` | Dropped or deferred — reason in the line |
| ✅ ◐ ☐ ⛔ | Loop shipped · in progress · pending · blocked |
| **S / M / L** | Size: S < 1 h · M 1–3 h · L 3–6 h of focused work |

**Rules**
1. Task ids are stable (`A4.3`); never renumber — append (`A4.3b`) when a task splits.
2. A task lists its **target files** and its **proof**; the loop lists its **Done when** in requirement ids from the spec (§14).
3. When a loop closes: tick its tasks, update §1 dashboard and §2 timeline, paste the commit hash in the loop header, and append new tasks discovered during the loop to the right future loop (marked *added A4*).
4. If a fact contradicts the spec, fix the spec first (Handoffs §1.4).

---

## 1. Dashboard

📍 *Backlog › 1 Dashboard* — **Where the overhaul stands, release by release.**

| Release | Loops | Tasks done / total | Status |
|---|---|---:|:--:|
| R1 · Reads right | A0 ✅ · A1 ✅ · A2 ✅ · A3 ✅ · A4 · A5 | 26 / 46 | ◐ |
| R2 · Composes like sentences | A6 · A7 · A8 | 0 / 28 | ☐ |
| R3 · Numbers know their source | A9 · A10 · A11 | 0 / 25 | ☐ |
| R4 · Spellcasting you can trust | A12 | 0 / 8 | ☐ |
| R5 · Explains itself | A13 · A14 · A15 · A16 | 0 / 27 | ☐ |
| R6 · Overhaul release | A17 | 0 / 9 | ☐ |
| R7 · Creator confidence | B1 · B2 · B3 | 0 / 15 | ☐ |
| R8 · Portable output | B4 | 0 / 6 | ☐ |
| R9 · Keep and reuse | B5 · B6 | 0 / 10 | ☐ |
| R10 · Honest breadth | B7 · B8 · B9 · B10 | 0 / 14 | ☐ |
| **Total** | **28 loops** (Track A 143 tasks · Track B 45) | **26 / 188** | **14 %** |

```mermaid
pie showData
  title Loops by state
  "Shipped" : 4
  "Next (A4)" : 1
  "Pending Track A" : 13
  "Pending Track B" : 10
```

### 1.1 Defects and blindspots by closing loop

| Loop | Closes defects | Verifies blindspots |
|---|---|---|
| A4 | DEF-01, DEF-02, DEF-03 (data), DEF-04, DEF-15, DEF-16, DEF-17 | BS-04, BS-05, BS-08, BS-17, BS-18 |
| A5 | — | BS-12, BS-14, BS-19, BS-20 |
| A6 | DEF-05 | BS-06, BS-09, BS-10, BS-22, BS-23 |
| A7 | DEF-12 | — |
| A8 | DEF-08 | BS-26, BS-27 |
| A9 | DEF-09 | BS-06, BS-16, BS-24, BS-25 |
| A10 | — | BS-21, BS-28 |
| A12 | DEF-03 (ruleset), DEF-06, DEF-07 | BS-07, BS-29, BS-30 |
| A13–A16 | DEF-10, DEF-11 | BS-31…BS-35 |
| A17 | DEF-13, DEF-14 | BS-03, BS-15, BS-36, BS-37 |
| B1 | — | BS-38 |
| B4 | — | BS-11, BS-13 |

---

## 2. Living timeline

📍 *Backlog › 2 Timeline* — **The code's diary: every commit that moved the product, newest last.**

| Date · time | Commit | Loop | What changed for the user | Proof |
|---|---|---|---|---|
| 2026-10-29 06:36 | `52355c2` | A0 | Local working tree frozen before the overhaul (135 files) | git |
| 2026-10-29 07:09 | `574f196` | A1 | Search · Study · Influence · Hide rows; no duplicate Skills row; whole-label ▲▲/▼▼ colour; editor group cards | 10 tests; browser rows |
| 2026-10-29 07:18 | `be0cf3f` | A2 | Formula engine: references, custom formulas, `{…}` macros anywhere; `Function` eval removed | 19 tests; browser probes |
| 2026-10-29 12:42 | — | — | Owner: absorb the v1 plan, rewrite spec/backlog/handoffs to professional depth | message |
| 2026-10-29 12:53 | `c543615` | A3 | Traits/actions/attacks/reactions/legendary as framed plates; 13 theme palettes | 5 tests; theme probe |
| 2026-10-29 13:02 | `b83ee56` | docs | v1 documents versioned in `docs/roadmap/` | git |
| 2026-10-29 | *this commit* | docs | v2 documents: spec bible, this backlog, handoffs; 32 / 32 Mermaid diagrams parse (Mermaid 11.4.1); ids and tables cross-checked | doc check + consistency script |

---

## 3. Now · Next · Later

| Now | Next (in order) | Later |
|---|---|---|
| Docs v2 commit | **A4** Spellcasting plate → **A5** Row grammar → **A6** Composer model | A7…A17 (R2–R6), then Track B (R7–R10) |

---

## 4. Track A — Statblock & Authoring Overhaul

📍 *Backlog › 4 Track A* — **Eighteen loops; the first four are done, the fifth is armed.**

### R1 · Reads right

#### A0 · Baseline snapshot ✅ `52355c2`

> Freeze the local tree so every later change is reviewable.

| Release | Feature | Depends on | Effort | Actual |
|---|---|---|---|---|
| R1 | QA-01 | — | — | 135 files, +41 791 / −2 884 |

- [x] **A0.1** Commit the untouched local working tree as `snapshot local working tree before statblock overhaul` · S · *proof: `52355c2`*
- [x] **A0.2** Dev server on port 9100 without auto-opening a browser (`DNDSHEET_NO_OPEN=1`; `quasar.config.js` `open` flag, shipped in A1) · S · *proof: `Get-NetTCPConnection -LocalPort 9100`*
- [x] **A0.3** Load the Seraph fixture into the built-in browser (`dnd-fixture-seraph.js`) · S · *proof: stat block renders "SERAPH…"*
- [x] **A0.4** Run the core suite as baseline · S · *proof: `npm test` green*

**Done when:** QA-001 baseline recorded. ✅

---

#### A1 · Check rows + whole-label advantage ✅ `574f196`

> Skills read as the actions that use them; advantage colours the whole label.

| Release | Feature | Depends on | Effort | Actual |
|---|---|---|---|---|
| R1 | SB-02 | A0 | — | 9 files, +868 / −486 |

- [x] **A1.1** `core/domain/skill-action-groups.ts`: catalog `SKILL_ACTION_GROUPS`, `computeSkillGroupLayout`, `mergeIdenticalEntries` · L · *proof: tests*
- [x] **A1.2** `test/core/SkillActionGroups.test.ts` (10 tests) · M
- [x] **A1.3** `components/rendering/advFormat.ts`: `numHtml`, `advHtml`, `condHtml`, `escapeHtml`, `htmlToText` · S
- [x] **A1.4** `useTextRenderer.ts`: saves/skills/tools/defenses with advantage; `actionPassivesGroups` rebuilt on the layout; exports via `htmlToText` · L
- [x] **A1.5** `WebRenderer.vue`: defense prose via `v-html`; group-title tooltips (`dnd-tip`) · S
- [x] **A1.6** `css/statblock-grammar.scss` created (advantage inks per theme, `.dnd-num`, `.q-tooltip.dnd-tip`), imported last in `app.scss` · S
- [x] **A1.7** `SkillsEditor.vue`: group cards from the catalog; economy inheritance; `q-btn-Group` typo fixed · M
- [x] **A1.8** `quasar.config.js`: `open: !process.env.DNDSHEET_NO_OPEN` · S
- [x] **A1.9** Browser verification: rows `Search ACTION 13/+3, (15, +5 Insight)` … no Skills row · S · *proof: probe output*

**Done when:** CHK-001…004, SBG-003 (rows) proven. ✅

---

#### A2 · Formula engine, references and text macros ✅ `be0cf3f`

> One small, safe language for every number.

| Release | Feature | Depends on | Effort | Actual |
|---|---|---|---|---|
| R1 | SB-03 | A0 | — | 8 files, +1 409 / −106 |

- [x] **A2.1** `core/domain/formula.ts`: parser, symbolic dice, styles, traces, suggestions, aliases, 11-group catalog · L
- [x] **A2.2** `test/core/Formula.test.ts` (18 tests) · M
- [x] **A2.3** `core/domain/formula-context.ts`: `formulaContextForMonster(monster, derived)` · S
- [x] **A2.4** `defense-and-traits-utils.ts`: `evaluateSafeFormula` on `evaluateFormula` (no `Function`), `formulaContextFromDynamic`, `formulaDisplayText` · M
- [x] **A2.5** `core/usecases/ProcessTokens.ts`: final `renderFormulaMacros` pass + test · S
- [x] **A2.6** `useProcessTokens.ts`: spell tokens in any context; unknown properties left verbatim (no "undefined") · S
- [x] **A2.7** `MonsterTextEditor.vue`: macro preview argument order fixed · S
- [x] **A2.8** Browser probes: `{CANTRIP_DICE d10}` → `16 (3d10)`, `{spellcasting.attack}` → `+7`, `{8 + PB + CHA_MOD}` → `15` · S

**Done when:** REF-001, REF-003…006 proven. ✅

---

#### A3 · Plate grammar for abilities ✅ `c543615`

> Every ability entry is one framed plate.

| Release | Feature | Depends on | Effort | Actual |
|---|---|---|---|---|
| R1 | SB-01 | A2 | — | 4 files, +494 / −186 |

- [x] **A3.1** `components/rendering/plate.ts`: `plateHtml`, rows/cells/body, `boldNumbers`, `phaseLabel`, stripe threshold · M
- [x] **A3.2** `useProcessTokens.ts`: `buildPlateEntry`, `usageText`, `ATTACK_REACH_LABEL`; trait/action/reaction/attack/multiattack/legendary modern branches · L
- [x] **A3.3** `statblock-grammar.scss`: tokens, `plate-palette` mixin for 13 themes, plate/row/cell/body rules under `#render`, container step-back via `:has()` · M
- [x] **A3.4** `test/core/Plate.test.ts` (5 tests) · S
- [x] **A3.5** Browser: computed styles on WotC + 4 more themes; console clean after reload; lint fixes · S

**Done when:** SBG-001…005 proven (SBG-005 for 5 themes; all 13 at A17). ✅

---

#### A4 · Spellcasting plate ☐ **next**

> Spellcasting reads like one trait plate: who casts, DC and attack, slots and recovery, preparation, then one row per level.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R1 | SB-04 | A3 ✅ | 1–2 d | 6 files · +470 / −220 |

- [ ] **A4.0** Pre-flight baseline: `npx quasar build`, `npm run test:e2e`, console scan of the Seraph fixture; record results (BS-04, BS-05, BS-08) · M · *proof: closing packet*
- [ ] **A4.1** Fixtures `FX-SP-01` pact Warlock 15 · `FX-SP-02` Wizard 9 slots 4/3/3/3/1 · `FX-SP-03` metamagic Quickened + Distant · `FX-SP-04` innate At Will + 3/Day — as builders in `test/core/SpellPlate.test.ts` · M
- [ ] **A4.2** Render the four fixtures with the current template; confirm "((V, S))" (DEF-17), placeholder "x" row (DEF-15), stripped "to" (DEF-16), cadence and slot defects, "Level3" (BS-17) · S · *proof: probe text*
- [ ] **A4.3** `core/domain/catalogs/metamagic.ts`: 10 options `{ name, cost2014, cost2024, phrase, source }` + invariants test · S
- [ ] **A4.4** `core/domain/catalogs/cadence.ts`: `CADENCE_LABELS` (`long_rest` → "Long Rest", `1_day` → "1/Day", `always_available` → "Always Prepared", …) shared by renderer and editor · S
- [ ] **A4.5** `components/rendering/spellPlate.ts`: `buildSpellPlate(monster)` → `SpellPlateModel` → plate rows (summary · metamagic · cantrips · levels; spells as cells with components and cadence badges) · L
- [ ] **A4.6** `buildInnatePlate(monster)` (At Will, X/Day each) · M
- [ ] **A4.7** `test/core/SpellPlate.test.ts` ≈ 10 cases (pact vs full slots, ordinals, components formatter, cadence labels, metamagic costs 2024, no `undefined`) · M
- [ ] **A4.8** `WebRenderer.vue`: replace the `sc-plate` templates with two `v-html` plates in the trait region; remove `spellPlate`, `metamagicOptionDetails`, `getSpellCadenceBadge` · M
- [ ] **A4.9** `statblock-grammar.scss`: spell cell chips, cadence badge, wrap rules; neutralise `.spell-tag-badge::before/::after` parentheses (one formatter owns them, DEF-17); `i18n/en-US/index.ts` adds `monster.spellcasting.stat` · S
- [ ] **A4.10** Browser: Seraph + 4 fixtures; theme probe (WotC, Printer, Golden, Spooky, Nouveau); console clean · M
- [ ] **A4.11** Close: `npm test`, lint touched files, commit `spellcasting renders as plate rows: summary, metamagic, one row per level`, docs ritual · S

**Done when:** SBG-006…009, SPELL-002 (render half), SPELL-005 (2024 costs) proven; DEF-01, DEF-02, DEF-04, DEF-15, DEF-16, DEF-17 closed; DEF-03 data fixed.

---

#### A5 · Row grammar for the top block + head tooltips ☐

> AC, HP, Speed, checks, senses, languages and defenses read as head-and-data rows, and every head explains itself.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R1 | SB-05 | A3 ✅ | 1–2 d | 5 files · +350 / −450 |

- [ ] **A5.0** Pre-flight: count `dnd-cascade-*` lines per theme in `app.scss`; capture probe colours for 5 themes as the parity baseline; ask/record BS-12, BS-14, BS-20 · S
- [ ] **A5.1** `WebRenderer.vue`: top rows adopt `sb-row / sb-cell / sb-head / sb-qual` (keep Vue templates for real tooltips) · M
- [ ] **A5.2** `statblock-grammar.scss`: cascade colours as tokens; delete the equivalent per-theme blocks in `app.scss` after parity · M
- [ ] **A5.3** Delegated tooltip host (minimal HelpTip) for `data-help` attributes inside `#render`; plate cells emit `data-help` keys · M
- [ ] **A5.4** Seed help dictionary (≈ 25 entries: AC, HP, Speed, Initiative, Passive, Search, Study, Influence, Hide, Tools, Recharge, X/Day, Phase, school/tier, components, attack, save, scope) with live traces · M
- [ ] **A5.5** Recharge die semantics (D-09): `usageText` tip "roll 1d12 at the start of each turn; recharges on 4–12" + test · S
- [ ] **A5.6** Verify: theme probe parity, screenshot pairs, CSS line delta, focus opens tips · M
- [ ] **A5.7** Close: tests, lint, commit `top rows share the plate grammar; heads explain themselves`, docs ritual · S

**Done when:** SBG-010…012, HELP-002, TIP-006 (statblock part) proven.

---

### R2 · Composes like sentences

#### A6 · Ability composer model and render grammar ☐

> The designer's sentence becomes data; plates, previews and text exports read from it.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R2 | AU-01 | A3 ✅ | 2–4 d | 6 files · +800 / −150 |

- [ ] **A6.0** Pre-flight: run a throwaway inference script over `src/data/templates` and an AI-ingest sample (BS-09, BS-10); confirm `1d0` → `1d10` and the economy-chip question with the owner or record defaults (BS-22, BS-23) · M
- [ ] **A6.1** Types: `AttackReach`, `AttackSource`, `AbilityTargeting`, `RangeSpec`, `AbilityOutcome`, `EffectClause` (optional on `MonsterAction`) in `components/models.ts` and `core/domain/types.ts` · S
- [ ] **A6.2** `core/domain/ability-grammar.ts`: phrase tables (relations, count words, kind plurals) + `mechanicsPhrase`, `scopePhrase`, `outcomePhrase` · L
- [ ] **A6.3** `inferAbility(action, ctx)`: reach from range text, targets from `targetsText`/`range`, outcomes from `effects`; explicit fields win; never writes · M
- [ ] **A6.4** `text2024(spec)`: `Ranged Attack Roll: +7, range 120 ft. Hit: …` / `Charisma Saving Throw: DC 15, …` · M
- [ ] **A6.5** `useProcessTokens.ts`: action/attack branches consume the grammar; legacy output unchanged when fields are absent (fixture diff) · M
- [ ] **A6.6** `test/core/AbilityGrammar.test.ts` ≈ 20 cases incl. FX-AB-01…05 · M
- [ ] **A6.7** Hydration check: load an old `app.monster` payload, then a payload with the new fields (BS-06) · S
- [ ] **A6.8** Browser: Seraph shows `Ranged Spell Attack +7` and Veil's full scope phrase · S
- [ ] **A6.9** Close: commit `actions carry reach, targets and outcomes; plates and 2024 text read them`, docs ritual · S

**Done when:** CMP-001…008, COMP-001 (screen + text), COMP-003 proven; DEF-05 closed.

---

#### A7 · Composer chain and templates ☐

> Editing an ability is clicking chips in the same order the GM reads them.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R2 | AU-03 | A6 | 3–5 d | 5 files · +1 100 / −400 |

- [ ] **A7.0** Pre-flight: read `ActionsEditor.vue` end to end; table of every current field → future chain cell · M
- [ ] **A7.1** `ROLE_CHAINS` descriptors (data) per role · S
- [ ] **A7.2** `components/editor/composer/ChainCell.vue`: plate-like display; editors by kind (CatalogSelect-lite, number/formula input, text) · L
- [ ] **A7.3** `components/editor/composer/ComposerChain.vue`: head · mechanics · scope · outcome rows; Tab/Enter/Esc keyboard model · L
- [ ] **A7.4** Live preview under the chain via `plateHtml` · S
- [ ] **A7.5** `ACTION_TEMPLATES` catalog (presets + quick composer recipes, authored casing) and a Templates picker · M
- [ ] **A7.6** Remove the "Quick Attack Composer" strip and preset buttons (DEF-12) · S
- [ ] **A7.7** Tests: chain order = plate order per role; template application · M
- [ ] **A7.8** Browser + close: commit `actions studio edits abilities as a chain of plate cells`, docs ritual · S

**Done when:** CMP-009…011 proven; DEF-12 closed.

---

#### A8 · One Actions module ☐

> Every ability role lives in the studio; duplicate panels retire.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R2 | AU-03 | A7 | 3–5 d | 12 files · +650 / −1 400 |

- [ ] **A8.0** Capability matrix: for each legacy panel list every field and its studio home; decide villain actions and CR cards (BS-26, BS-27) · M
- [ ] **A8.1** Role headers: Legendary (pool, preamble), Mythic (trigger, pool), Lair (initiative, preamble) · M
- [ ] **A8.2** Attack role: `AttackPanel` structured fields as chain cells (reach/range, targets, damage dice/type/bonus, extra damage, effect DC) · L
- [ ] **A8.3** Multiattack role: reference chips by id with ⚠ for dangling targets · M
- [ ] **A8.4** Reaction trigger chip; trait limited-use, recharge-section and conditional-trigger chips · M
- [ ] **A8.5** `MonsterBuilder.vue`: unmount `TraitsEditor`, `AttacksEditor`, `MultiattackEditor`, `ReactionsEditor`, `LegendaryActionsEditor`, `MythicActionsEditor`, `LairActionsEditor` (+ `VillainActionsEditor` per A8.0); delete the components (git keeps history) · M
- [ ] **A8.6** Fixture diff: three saved monsters render byte-identical plates before/after · M
- [ ] **A8.7** e2e adjustments for removed panels · S
- [ ] **A8.8** Close: commit `one actions module: studio covers every role, duplicate panels retired`, docs ritual · S

**Done when:** CMP-012…015, UX-006, COMP-002 proven; DEF-08 closed; builder mounts ≤ 14 panels.

---

### R3 · Numbers know their source

#### A9 · NumericBinding fields ☐

> Pick `PB`, `CHA_MOD`, `HIT_DICE`… from grouped lists or write one formula — the value stays right.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R3 | AU-02 | A2 ✅ (A8 for studio cells) | 3–5 d | 9 files · +1 300 / −800 |

- [ ] **A9.0** Pre-flight: confirm Font Awesome 6 in `quasar.config.js` extras (BS-24); design stable-id field paths `attacks[id=…]` (BS-25); list the 18 current fields; decide decimals out of scope (BS-16) · M
- [ ] **A9.1** `formula.ts`: `literal` binding variant, `dependencyOrder`, `detectCycles` + tests · M
- [ ] **A9.2** `core/domain/catalogs/field-types.ts`: path → `{ type, style, groups, min, max }` + invariants test · M
- [ ] **A9.3** `monster-store.ts`: `bindings` state (optional), `setBinding`, `clearBinding`, `resolveBindings` (one pass, equality check, cycle report) · L
- [ ] **A9.4** History ledger skips patches flagged `historySilent` · S
- [ ] **A9.5** `components/kit/useBindings.ts`: read/write binding for a path, live value, trace, error · M
- [ ] **A9.6** `components/kit/FormulaField.vue`: states §8.1, grouped options with icons/colours/values, "ƒ Custom formula…" first, trace HelpTip, broken state · L
- [ ] **A9.7** Replace the 6 `BasicsEditor` tags and 7 `AttackPanel` tags; delete `DynamicReferenceSelect.vue` · M
- [ ] **A9.8** `test/core/Bindings.test.ts`: order, cycles, failure keeps value, no-op patch, unbind · M
- [ ] **A9.9** Browser sequence §8.5: CHA 20 → 22, DCs follow; undo once; reload keeps bindings · S
- [ ] **A9.10** Close: commit `numeric fields bind to references or formulas and stay in sync`, docs ritual · S

**Done when:** BND-001…008, REF-001 (fields), REF-002 (store revision) proven; DEF-09 closed.

---

#### A10 · Caret intellisense and macro menus ☐

> Type `{` anywhere: the catalog opens at the caret with live values; toolbar menus list the same catalog.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R3 | AU-04 | A9 | 3–4 d | 7 files · +1 150 / −440 |

- [ ] **A10.0** Pre-flight: locate the bottom strip (BS-21); confirm `QEditor` content element API (BS-28); inventory the 7 toolbar menus and `useTokens.ts` categories · S
- [ ] **A10.1** `MACRO_CATALOG` = `FORMULA_REFS` + `CONTEXT_TOKENS` (`{action.*}`, `{attack.*}`, `{spellcasting.*}`, `{multiattack.*}`) with tips and groups · M
- [ ] **A10.2** `components/kit/useCompletion.ts`: triggers, token boundary, ranking, caret rect (contenteditable + input mirror) · L
- [ ] **A10.3** `components/kit/CompletionMenu.vue`: listbox, ARIA combobox wiring, flip near viewport edge, keyboard · M
- [ ] **A10.4** `MonsterTextEditor.vue`: integrate completion; insert with `insertText`; caret restore · M
- [ ] **A10.5** Toolbar macro menus generated from the catalog (replace the 7 hand-written dropdowns) · M
- [ ] **A10.6** `FormulaField` formula mode uses the same completion · S
- [ ] **A10.7** Remove the bottom intellisense strip · S
- [ ] **A10.8** Tests (ranking, token boundary) + browser checks + close: commit `caret intellisense for macros and formulas; menus from one catalog` · M

**Done when:** ITL-001…008 proven.

---

#### A11 · Binding sweep ☐

> Every remaining number that has a source can be bound.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R3 | AU-02 | A9 | 1–3 d | ≈ 10 files · ±300 |

- [ ] **A11.0** Inventory script: all `type="number"` inputs (77) with file, model path and label · S
- [ ] **A11.1** Classify each: literal-only · binding-capable · derived (read-only) — table in the closing packet · M
- [ ] **A11.2** Register binding-capable paths in `field-types.ts` · S
- [ ] **A11.3** Migrate binding-capable inputs panel by panel to `FormulaField` · M
- [ ] **A11.4** Audit: no option array of bare integers remains; close: commit `remaining numeric fields accept references and formulas` · S

**Done when:** BND-009, BND-002 (global) proven.

---

### R4 · Spellcasting you can trust

#### A12 · Spellcasting authoring accuracy ☐

> Any casting class and subclass, legal candidates, honest counters, subclass spells always prepared.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R4 | AU-05 | A4, A9 | 4–6 d | 7 files · +1 400 / −300 |

- [ ] **A12.0** Pre-flight research and checks: SRD 5.2.1 class tables (cantrips, prepared, slots), expanded spell lists of the SRD subclasses, multiclass slot table (BS-29, BS-30); reproduce BS-07 (subclass lost on reload) · L
- [ ] **A12.1** Catalogs: `CASTER_PROGRESSIONS` (2014/2024), `SUBCLASS_CATALOG` (all casting classes, `source`), `SUBCLASS_SPELLS` (SRD only) + invariants tests · L
- [ ] **A12.2** `computeSpellMetrics(spellcasting, ruleset)` → `SpellMetricResult` (`ok/unavailable/error`) + tests · M
- [ ] **A12.3** Persist subclasses: `spellcasting.subclass?` and `classes[].subclass`; replace the component-local ref · S
- [ ] **A12.4** `ClassCastingEditor.vue`: subclass picker for every class; counters per §8.4; expanded spells auto-add/remove as an explicit plan; cadence pickers from `CADENCE_LABELS` (Long Rest everywhere); error state replaces 3/4/1 defaults · L
- [ ] **A12.5** Candidate filtering by class and subclass; custom spells allowed and labelled custom · M
- [ ] **A12.6** Ruleset-aware metamagic costs in editor and plate · S
- [ ] **A12.7** Tests + browser (reload, Fiend Patron, over-limit, metric failure) + close: commit `spellcasting: persisted subclasses, honest counters, subclass spells always prepared` · M

**Done when:** SPELL-001…008 proven; DEF-06, DEF-07 closed; BS-07 closed.

---

### R5 · Explains itself

#### A13 · Interaction kit: CatalogSelect, HelpTip, audits ☐

> One dropdown anatomy, one tooltip grammar, two audits that keep them honest.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R5 | UX-01, UX-02 | A9 | 3–4 d | 10 files · +1 700 |

- [ ] **A13.0** Pre-flight: export a control inventory (file, control, label, has tooltip?) — the coverage baseline (≈ 17 %) · S
- [ ] **A13.1** `components/kit/CatalogSelect.vue` (+ component tests: order law, custom first, search, keyboard, headers) · L
- [ ] **A13.2** Enumeration catalogs: sizes, creature types, alignments, damage types, conditions, languages, senses, skills, tools, schools, spell levels, recharge, roles · L
- [ ] **A13.3** `components/kit/HelpTip.vue`, `v-help` directive, generalised delegated host (from A5) · M
- [ ] **A13.4** `i18n/en-US/help.ts` skeleton with keys for every control; full copy for Identity, Defenses and Checks panels · M
- [ ] **A13.5** `tools/audit-help.mjs` + floor file + `npm run audit:help` · M
- [ ] **A13.6** `css/fit.scss` utilities + `tools/qa/overflow-probe.js` + `npm run audit:fit` · M
- [ ] **A13.7** Close: commit `interaction kit: catalog selects, help tips, coverage and fit audits`, docs ritual · S

**Done when:** SEL-002…008, TIP-002…005, TIP-007, QA-005 proven.

---

#### A14 · Sweep 1 — Basics split, kit, fit ☐

> The biggest panel becomes six readable ones, fully explained and never cropped.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R5 | UX-01…03 | A13 | 4–6 d | 8 files · +3 000 / −3 300 |

- [ ] **A14.1** Split `BasicsEditor.vue` (4 445 LOC) into `editor/basics/` Identity, Defenses, HitPoints, Paragon, Abilities, Lore — pure moves, fixture diff · L
- [ ] **A14.2** Replace its 71 `q-select` with `CatalogSelect` (or exemptions with reasons) · L
- [ ] **A14.3** HelpTips on every control; short labels (§4.7) · M
- [ ] **A14.4** Fit: responsive grids; overflow probe = 0 across the matrix · M
- [ ] **A14.5** Keyboard pass of the Basics flow · S
- [ ] **A14.6** Close: commit `basics editor split into six panels with catalog selects and help tips` · S

**Done when:** SEL-001, TIP-001, FIT-001…003 proven for Basics.

---

#### A15 · Sweep 2 — casting, checks, senses, defenses ☐

> The rules-heavy panels speak the kit.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R5 | UX-01…03 | A13, A12 | 3–4 d | 10 files · +900 / −600 |

- [ ] **A15.1** `ClassCastingEditor`, `SpellcastingEditor`, `AtWillCastingEditor`: kit adoption, tips, fit · L
- [ ] **A15.2** `SkillsEditor`, `SavesEditor`: kit adoption, tips, fit · M
- [ ] **A15.3** `SensesEditor`, `SpeedsEditor`, `ResistancesEditor`, `InventoryEditor`: kit adoption, tips, fit · M
- [ ] **A15.4** Audit: help coverage and overflow for these panels · S
- [ ] **A15.5** Keyboard pass · S
- [ ] **A15.6** Close: commit `casting, checks, senses and defenses panels adopt the interaction kit` · S

**Done when:** SEL-001, TIP-001, FIT-001…003 proven for these panels.

---

#### A16 · Sweep 3 — studio, A4, toolbar, CSS cleanup ☐

> The last surfaces join the kit; dead CSS leaves.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R5 | UX-01…03 | A13, A8 | 3–4 d | 12 files · +900 / −1 400 |

- [ ] **A16.1** Actions Studio and composer chips: kit adoption and tips · M
- [ ] **A16.2** `A4LayerStudio.vue` (fixed canvas exempt with scroll affordance, BS-35), `MainLayout.vue` toolbar tips · M
- [ ] **A16.3** Remaining panels (Regional, Anatomy, Encounter Dynamics, Villain if kept) · M
- [ ] **A16.4** Splitter minimum widths (FIT-004) · S
- [ ] **A16.5** `app.scss` cleanup: delete legacy `.action-composite-*`, `.zebra-stripe-text`, `.trait > div:first-of-type` and cascade blocks whose markup is gone; `!important` < 200 · L
- [ ] **A16.6** Global audits: help coverage = 1.00, overflow = 0 · S
- [ ] **A16.7** Close: commit `studio, layout and toolbar adopt the kit; legacy statblock css removed` · S

**Done when:** SEL-001, TIP-001, FIT-001…005 proven app-wide; DEF-10, DEF-11 closed.

---

### R6 · Overhaul release

#### A17 · Hardening and release ☐

> Prove it all at once, write down only what is proven, tag it.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R6 | QA-01 | A4…A16 | 2–3 d | 12 files · +1 300 / −400 |

- [ ] **A17.1** `test/fixtures/monsters/*.json` (Seraph, pact, full, innate, legacy actions) used by node tests and probes · M
- [ ] **A17.2** Move QA helpers from `%TEMP%` to `tools/qa/` (shot, splice, fixture loader, overflow probe, doc check) · S
- [ ] **A17.3** Update `test/exhaustive-ui-fuzz.js` to the plate grammar and the unified studio; locate headless Chrome (BS-36) · L
- [ ] **A17.4** Theme matrix: 13 themes × fixture, computed contrast table (SBG-005) · M
- [ ] **A17.5** Budgets: keystroke → preview, completion, select open, resolver pass (§15.4) · M
- [ ] **A17.6** `npx quasar build` clean · S
- [ ] **A17.7** Rewrite `STACK_STATE.md` and the README feature list from evidence (DEF-14, BS-03) · M
- [ ] **A17.8** Profile macro rendering on a 5 000-character description (BS-15); screenshot storage policy (BS-37) · S
- [ ] **A17.9** Release: annotated local tag `v2.5.0-statblock`, release notes, docs ritual · S

**Done when:** QA-001…006, SBG-005 (13 themes), NFR-001 (Track A paths) proven; DEF-13, DEF-14 closed.

---

## 5. Track B — Product Foundations

📍 *Backlog › 5 Track B* — **The v1 plan's ten packages, re-sequenced after the overhaul and wired to what it built.** Task lines cite their v1 ids (`TASK-0xx`) for continuity.

### R7 · Creator confidence

#### B1 · Document identity and revision ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R7 | F-00 | A17 | 5–10 d |

- [ ] **B1.1** Decision record: envelope, `MonsterId`, `envelopeVersion` vs `saveVersion`, `contentRevision`, provenance and presentation ownership (TASK-007) · M
- [ ] **B1.2** Session adapter around `monster-store` exposing id and revision; stores holding monster copies inventoried (BS-38) (TASK-008) · L
- [ ] **B1.3** Revision increments on edit/undo/redo; resolver patches excluded; no duplicate history entries (TASK-009) · M
- [ ] **B1.4** One canonical type owner (`core/domain/types.ts`), `components/models.ts` re-exports (TASK-010) · M
- [ ] **B1.5** Tests: same-name ids, monotonic revision, stale proposal rejected; close (TASK-011) · M

**Done when:** DOM-002, DOM-003 (contract), DATA-001 (envelope) proven.

#### B2 · Checks and safe repair ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R7 | F-05 | B1 | 5–10 d |

- [ ] **B2.1** Inventory lint codes, fixable flags and real operations; add Track A families: broken binding, prepared over limit, dangling multiattack reference, unknown macro (TASK-012) · M
- [ ] **B2.2** Issue-target registry: `fieldPath` → mounted control (scroll, expand, focus) (TASK-013) · L
- [ ] **B2.3** Checks states (current/stale/failed/empty) and honest copy (TASK-014) · M
- [ ] **B2.4** Repair preview → apply as one command and one undo (TASK-015) · L
- [ ] **B2.5** Recheck on the new revision; export policy for blocking errors; close (TASK-016) · M

**Done when:** UX-003, DOM-001, DOM-003 proven.

#### B3 · CR breakdown and preview-first tuner ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R7 | F-06 | B1 | 3–7 d |

- [ ] **B3.1** Map each recommendation to the fields it writes; confirm attack-bonus behaviour (TASK-017) · M
- [ ] **B3.2** Transient `AutoTuneSession` with selection (TASK-018) · M
- [ ] **B3.3** Before/after preview and stale guard (TASK-019) · M
- [ ] **B3.4** Apply selected changes as one undoable command (TASK-020) · M
- [ ] **B3.5** Prefer tuning **sources** (PB, ability scores) when fields are bound (AU-02); close · S

**Done when:** DOM-001, DOM-003 (tuner) proven.

### R8 · Portable output

#### B4 · Export preview and capability report ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R8 | F-08 | B1, A6 | 5–10 d |

- [ ] **B4.1** Inventory every export target: source, transforms, omissions, MIME, filename (TASK-021) · M
- [ ] **B4.2** `ExportCapability` / `ExportResult` contract with source revision (TASK-022) · M
- [ ] **B4.3** Fixtures across targets: Soul Barrage, Veil, spell plates, check rows (TASK-023) · M
- [ ] **B4.4** Text targets use `text2024` and check-row text; HTML/PNG embed the grammar CSS (BS-11, BS-13) (TASK-024) · L
- [ ] **B4.5** Preview dialog with omissions; Spellcasting placement option (D-02) (TASK-025) · M
- [ ] **B4.6** Round-trip `.5emm.json`; close · S

**Done when:** DATA-002, SEC-001, COMP-001…002 proven.

### R9 · Keep and reuse

#### B5 · Repository and recovery ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R9 | F-07 | B1 | 8–15 d |

- [ ] **B5.1** Inventory Pinia keys, `dndsheet_monster_` LocalStorage, IndexedDB and all writers (TASK-026) · M
- [ ] **B5.2** Decision: startup backend selection, migration, quota, rollback (TASK-027) · M
- [ ] **B5.3** Repository wiring and truthful save status (TASK-028) · L
- [ ] **B5.4** Migrate sources one by one with verify-then-mark (TASK-029) · L
- [ ] **B5.5** Backup, restore, failed-write recovery (TASK-030) · L
- [ ] **B5.6** Browser failure scenarios; close (TASK-031) · M

**Done when:** DATA-001, DATA-003, NFR-003, SEC-002, ARC-002 proven.

#### B6 · Local creature library ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R9 | F-02 | B5 | 3–6 d |

- [ ] **B6.1** Summary index and query model (TASK-032) · M
- [ ] **B6.2** Open, create, duplicate (new ids, remapped bindings), rename (TASK-033) · L
- [ ] **B6.3** Delete/archive with recovery (TASK-034) · M
- [ ] **B6.4** Empty/loading/error/large-list/keyboard states; close (TASK-035) · M

**Done when:** DOM-002, UX-004 proven.

### R10 · Honest breadth

#### B7 · Workspace: toolbar, navigator, narrow mode, presets ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R10 | F-01 · F-03 · F-12 | A16 | 4–8 d |

- [ ] **B7.1** Toolbar groups: document · editing · context · presentation menu (TASK-047) · M
- [ ] **B7.2** Section registry and sticky section strip with focus targets (TASK-045) · L
- [ ] **B7.3** Narrow Editor / Stat block tabs (TASK-046) · M
- [ ] **B7.4** Presets Screen · Ink saver · Art plate over existing settings (TASK-048) · M
- [ ] **B7.5** Keyboard, 200 % zoom, reduced motion spot checks; close · S

**Done when:** UX-001, UX-002, UX-005, NFR-004 proven.

#### B8 · Rules provenance ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R10 | F-09 | B1 | 2–4 d |

- [ ] **B8.1** Provenance on the envelope; legacy = unknown (TASK-055) · M
- [ ] **B8.2** `resolveRulesPolicy(document)` feeds ruleset-aware catalogs (metamagic, progressions) (TASK-056) · M
- [ ] **B8.3** Tests: style/theme switches leave rules untouched; close · S

**Done when:** DOM-004 proven.

#### B9 · Combat identity and snapshots ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R10 | F-10 | B1 | 2–5 d |

- [ ] **B9.1** Stable combatant ids; active-index migration; removal policy (TASK-057) · M
- [ ] **B9.2** Snapshot at add; encounter edits never touch the source (TASK-058) · M
- [ ] **B9.3** Sort/remove/turn/reload scenarios; close (TASK-059) · M

**Done when:** DOM-005 proven.

#### B10 · Character truth and final documentation ☐

| Release | Feature | Depends on | Effort |
|---|---|---|---|
| R10 | F-11 | all | 2–5 d |

- [ ] **B10.1** Decide reference-only scope or required inputs for derived values (TASK-060) · S
- [ ] **B10.2** AC/speed provenance or visible estimate labels (TASK-061) · M
- [ ] **B10.3** README, STACK_STATE and feature matrix regenerated from release evidence; close (TASK-062) · M

**Done when:** DOM-006, PRD-002…003, REL-002 proven.

---

## 6. Parking lot (unscheduled ideas)

| Idea | Why parked | Revisit when |
|---|---|---|
| Side help panel for the focused control (long rules text) | Complements HelpTip; not required for coverage | after A16 |
| Macro syntax highlighting inside the rich editor | contenteditable complexity | after A10 metrics |
| 2014 ↔ 2024 rules conversion with a loss report | Large rules surface; provenance first | after B8 |
| Pixel-diff visual regression automation | Probe + manual matrix sufficient for now | after A17 |
| Per-document presentation presets | Preference-scope decision pending | after B7 |
| CR annotation cards moved into Checks | Depends on BS-27 | after B2 |
| Help dictionary localisation | English only today (BS-33) | on request |

---

## 7. Crosswalk — v1 task ids

| v1 tasks | v2 tasks |
|---|---|
| TASK-001…006 (baseline, reproduction) | A0 ✅ · A4.0 · A4.2 · A17.3 · A17.7 |
| TASK-007…011 | B1.1…B1.5 |
| TASK-012…016 | B2.1…B2.5 |
| TASK-017…020 | B3.1…B3.4 |
| TASK-021…025 | B4.1…B4.5 (fixtures and semantic adapter partly in A6) |
| TASK-026…031 | B5.1…B5.6 |
| TASK-032…035 | B6.1…B6.4 |
| TASK-036…041 (spellcasting) | A4 · A12 |
| TASK-042…044 (visual tokens, overflow, tooltips) | A5 · A13…A16 |
| TASK-045…048 (navigator, narrow, toolbar, presets) | B7.1…B7.4 |
| TASK-049…054 (typed references, completion, ability grammar) | A6 · A9 · A10 · A11 |
| TASK-055…056 | B8.1…B8.2 |
| TASK-057…059 | B9.1…B9.3 |
| TASK-060…062 | B10.1…B10.3 |

