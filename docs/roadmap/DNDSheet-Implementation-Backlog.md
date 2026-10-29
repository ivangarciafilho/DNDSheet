# DNDSheet — Implementation Backlog

> **The checklist and the living timeline.** Every loop of the [Product & Architecture Specification](DNDSheet-Professional-Product-and-Architecture-Spec.md) broken into tasks you can tick, in the order they should ship, with the commit that proves each one. Preparation and closing rituals live in the [Development Handoffs](DNDSheet-Development-Handoffs.md).

| | |
|---|---|
| **Version** | v2.4.3 build 138 · 2026-10-29 · A7 template catalog + deep isolation · `rc-2.4.3-build-138-a7-template-isolation` |
| **Code HEAD** | `761b41a` A7 template isolation · build 137 (`df95179`) and builds 136/135/134 remain preserved · core 130/130, production build succeeds, exhaustive UI 33 steps and zero runtime exceptions |
| **Progress** | **7 / 28 loops shipped** · **64 / 193 tasks done** (33.16 %) · **0 active** · **129 pending** |
| **Now** | A7 is in progress. Build 138 adds deep isolation so mutable nested template data is copied per action; replacement confirmation preserves role, uses, recharge, phase, CR policy, and ID. The chip chain and role-parity preview remain pending. |
| **Next** | Continue A7 with role descriptors and chain cells (A7.1–A7.4); do not begin A8 consolidation until the chain and A7 close criteria are proven |

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
| R1 · Reads right | A0 ✅ · A1 ✅ · A2 ✅ · A3 ✅ · A4 ✅ · A5 ✅ | 49 / 49 | ✅ |
| R2 · Composes like sentences | A6 ✅ · A7 ◐ · A8 | 14 / 29 | ◐ |
| R3 · Numbers know their source | A9 · A10 · A11 | 0 / 25 | ☐ |
| R4 · Spellcasting you can trust | A12 | 0 / 8 | ☐ |
| R5 · Explains itself | A13 · A14 · A15 · A16 | 1 / 28 | ☐ |
| R6 · Overhaul release | A17 | 0 / 9 | ☐ |
| R7 · Creator confidence | B1 · B2 · B3 | 0 / 15 | ☐ |
| R8 · Portable output | B4 | 0 / 6 | ☐ |
| R9 · Keep and reuse | B5 · B6 | 0 / 10 | ☐ |
| R10 · Honest breadth | B7 · B8 · B9 · B10 | 0 / 14 | ☐ |
| **Total** | **28 loops** (Track A 147 tasks · Track B 46) | **64 / 193 complete · 0 active · 129 pending** | **33.16 % complete · 66.84 % remaining** |

```mermaid
pie showData
  title Loops by state
  "Shipped" : 7
  "In progress" : 1
  "Pending Track A" : 10
  "Pending Track B" : 10
```

### 1.1 Defects and blindspots by closing loop

| Loop | Closes defects | Verifies blindspots |
|---|---|---|
| A4 | DEF-01, DEF-02, DEF-03 (data), DEF-04, DEF-15, DEF-16, DEF-17 | BS-04, BS-05, BS-08, BS-17, BS-18 |
| A5 | — | BS-12, BS-14, BS-19, BS-20 |
| A6 | DEF-05 | BS-06, BS-09, BS-10, BS-22, BS-23 |
| A7 | DEF-12 | BS-39 identified; design decision remains open |
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
| 2026-10-29 12:53 | `c543615` | A3 | Traits/actions/attacks/reactions/legendary as framed plates; theme palettes | 5 tests; theme probe |
| 2026-10-29 13:02 | `b83ee56` | docs | v1 documents versioned in `docs/roadmap/` | git |
| 2026-10-29 | `4c6c1cb` | docs | v2 documents: spec bible, this backlog, handoffs; 32 / 32 Mermaid diagrams parse (Mermaid 11.4.1); ids and tables cross-checked | doc check + consistency script |
| 2026-10-29 | `f35cd6d` | A4 | Class and innate spellcasting plates use shared visual grammar, edition-aware metamagic and cadence catalogs | 111 core tests; build; focused browser smoke across 5 themes |
| 2026-10-29 | `8487335` | A5 | AC/HP/Speed and related rows share the plate grammar; recharge help is accurate; A4 printing no longer emits a blank second page | 115 core tests; production build 135; focused 12-theme contrast/screenshots; 5-theme spell smoke; 33-scenario full UI; one-page A4 PDF |
| 2026-10-29 | `71a8c21` | A6 | Optional action targeting/outcome data, conservative inference, modern plate projection and opt-in 2024-style text export; sample monster data unchanged | Core 124/124; build 136; exhaustive UI 33/33 steps; 0 runtime exceptions |
| 2026-10-29 | `df95179` | A7 · partial build 137 | Added 9 catalog-backed action templates, grouped picker, explicit replacement confirmation, cancel/apply semantics and removed duplicate hard-coded preset/composer routes; configured sample data unchanged | Core 129/129; production build; exhaustive UI 33/33 including Step 32 cancel/apply; 0 runtime exceptions; focused lint 0 errors |
| 2026-10-29 | `761b41a` | A7 · partial build 138 | Deep-cloned nested template values per application; edits to one action cannot mutate the shared catalog or another action | Core 130/130 including catalog isolation regression; production build; exhaustive UI 33/33; 0 runtime exceptions |
| 2026-10-29 | `ae16b86` | A4 closeout | Hide generic class preamble already represented by the plate; preserve custom preamble; align e2e assertions to semantic badges and no redundant Skills row | Core 111/111; build; focused smoke; full e2e 23/23 groups, 0 runtime exceptions |
| 2026-10-29 | working tree at preserved checkpoint `a6c87e4` | A5 partial | Add shared top-row grammar, delegated help host and dictionary, recharge explanations, theme contrast coverage, and remove 11 repeated cascade style blocks | Core 115/115; production build; help browser smoke (12 themes); spellcasting browser smoke (5 themes); exhaustive e2e 33 scenario steps, 0 runtime exceptions (2026-10-29) |

### 2.1 A4 closing validation: tracked full-suite failures

The first post-A4 full run exposed three stale browser expectations and one real duplicate-preamble behavior. They are all closed at `ae16b86`; the passing rerun supersedes the earlier failing snapshot. Keep the exact contracts as regression coverage:

| E2E step | Observed failure | Owning backlog item | Exit evidence |
|---:|---|---|---|
| 18 | Old test searched for deprecated badge class names | A5.8 ✅ | Test queries `.dnd-adv` and `.dnd-disadv`; full UI suite passes |
| 20 | Old test searched old pill markup; assertion now targets Search row's semantic advantage wrapper and trailing glyph | A5.9 ✅ | Browser test confirms the check value is wrapped and glyph is present |
| 25 | Test required a separate Skills row although configured skills all belong to the four action groups | A15.7 ✅ | Test asserts grouped skills/tools and confirms no redundant Skills heading |
| 32 | Default spellcasting preamble duplicated the class plate's summary and spell list | A4.12 ✅ | Generic prose hidden in web plate; authored custom preamble retained; full e2e passes |

---

## 3. Now · Next · Later

| Now | Next (in order) | Later |
|---|---|---|
| A7 partial candidate build 138: reusable template catalog/picker and data isolation are usable; chip chain and preview parity remain pending | **A7.1–A7.4** role-aware composer chain and preview | A8…A17 (R2–R6), then Track B (R7–R10) |

---

## 4. Track A — Statblock & Authoring Overhaul

📍 *Backlog › 4 Track A* — **Eighteen loops; A0–A6 are done and A7 is actively shipping in bounded slices.**

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
- [x] **A3.3** `statblock-grammar.scss`: tokens, `plate-palette` mixin for 12 selectable themes, plate/row/cell/body rules under `#render`, container step-back via `:has()` · M
- [x] **A3.4** `test/core/Plate.test.ts` (5 tests) · S
- [x] **A3.5** Browser: computed styles on WotC + 4 more themes; console clean after reload; lint fixes · S

**Done when:** SBG-001…005 proven (SBG-005 for 5 themes; all 12 selectable themes at A17). ✅

---

#### A4 · Spellcasting plate ✅ `f35cd6d`

> Spellcasting reads like one trait plate: who casts, DC and attack, slots and recovery, preparation, then one row per level.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R1 | SB-04 | A3 ✅ | 1 day | 12 files · +802 / −389 |

- [x] **A4.0** Baseline captured: build succeeds; full e2e reaches steps 1–17 then fails at 18, 20 and 25; failures tracked in A5.8/A5.9/A15.7 · M · *proof: closing packet*
- [x] **A4.1** Spell model fixtures cover pact/full casting, metamagic and innate casting · M · *proof: `test/core/SpellPlate.test.ts`*
- [x] **A4.2** Historical defects reproduced from baseline and closed: duplicate component parentheses, placeholder `x`, stripped connective, cadence/slot labels and ordinal spacing · S · *proof: focused browser smoke*
- [x] **A4.3** `core/domain/catalogs/metamagic.ts`: edition-specific 2014/2024 costs and effect text/source labels · S
- [x] **A4.4** `core/domain/catalogs/cadence.ts`: shared cadence and resource refresh options used by editor/rendering/text renderer · S
- [x] **A4.5** `core/domain/spell-plate.ts`: pure class spellcasting projection and row models · L
- [x] **A4.6** `buildInnateSpellPlate`: separate innate projection · M
- [x] **A4.7** Seven domain test cases cover slot progressions, components, cadence, edition-specific effects and absent values · M
- [x] **A4.8** `WebRenderer.vue`: typed computed model rendered with Vue text bindings; no new `v-html` spell plate path · M
- [x] **A4.9** `statblock-grammar.scss`, `app.scss` and `i18n/en-US/index.ts`: shared plate styles, component punctuation ownership and localized label · S
- [x] **A4.10** Focused browser smoke verifies class + innate plates in five themes; full e2e later passes 23 groups with 0 runtime exceptions · M
- [x] **A4.11** `npm test` 111/111; build passes; targeted lint has 0 errors (existing warnings remain); commit `f35cd6d` · S
- [x] **A4.12** Close browser-discovered duplicate generic preamble: show class preamble only when authored custom text is enabled; preserve custom text; include regression in focused smoke and full fuzz suite · M · *proof: `ae16b86`, Step 32, all 23 e2e groups pass*

**Done when:** SBG-006…009, SPELL-002 (render half), SPELL-005 (2024 costs) proven; DEF-01, DEF-02, DEF-04, DEF-15, DEF-16, DEF-17 closed; DEF-03 data fixed.

---

#### A5 · Row grammar for the top block + head tooltips ✅

> AC, HP, Speed, checks, senses, languages and defenses read as head-and-data rows, and every head explains itself.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R1 | SB-05 | A3 ✅ | 1–2 d | 5 files · +350 / −450 |

- [x] **A5.0** Initial dirty edits preserved; help-key escaping, structural row conversion, CSS consolidation, 12-theme computed contrast, print and BS-12/14/20 regression paths are verified. The historical before-migration screenshot baseline is absent; current final-state screenshots are recorded without claiming before/after pixel parity · M · *proof: core 115/115, production build, focused help/spell browser smokes, exhaustive 33 steps with 0 runtime exceptions*
- [x] **A5.1** `WebRenderer.vue`: convert AC, HP, Speed, saves, defenses, senses, action checks, languages and inventory to `sb-row / sb-cell / sb-head / sb-qual`; retain Vue templates/QTooltips without duplicate help semantics · M · *proof: focused help smoke + full e2e*
- [x] **A5.2** Consolidate shared cascade styling; remove 11 repeated theme-specific `.dnd-cascade-panel` blocks from `app.scss` (15 → 4 matching blocks) · M · *proof: build + theme browser probe*
- [x] **A5.3** Delegated help host supports pointer/focus, Escape, ARIA, viewport clamp, scroll/resize and detach/unmount cleanup · M · *proof: `npm run test:e2e:help`*
- [x] **A5.4** Plain-language dictionary covers top labels, defenses, checks, languages, plate heads, spell fields, Passive, X/Day, Phase, school/tier, scope and recharge. Displayed-value context is shown; computed formula traces are explicitly deferred to A9 because this renderer does not expose reliable source/derivation data · M · *proof: `StatblockHelp` core tests + focused browser smoke*
- [x] **A5.5** Recharge die semantics (D-09): recharge help derives d6/d12/general wording from threshold and does not mutate authored display text · S · *proof: StatblockHelp tests + browser smoke*
- [x] **A5.6** Functional verification passes for 12 selectable themes, >=4.5:1 computed contrast, A4 preview, one-page A4 PDF and full e2e; 12 final-state theme screenshots and A4 preview/PDF evidence are stored in `docs/evidence/a5/`. The historical baseline is absent, so no before/after pixel-parity claim is made · M · *proof: `npm run test:e2e:help`, `pdfinfo` reports 1 A4 page, `npm run test:e2e:spellcasting`, `DNDSHEET_E2E_URL=http://localhost:9100/index.html#/ npm run test:e2e`*
- [x] **A5.7** Close: core tests, touched-file lint, production build, help/spell/full UI checks pass; print sizing fixed so viewport and scaled-stage heights no longer create a blank second A4 page; evidence and roadmap mirrors reconciled · S · *proof: closeout commit recorded in §2*
- [x] **A5.8** Align e2e Step 18 with the shipped semantic classes `.dnd-adv`/`.dnd-disadv`; no renderer change was needed · S · *added A4; proof: `ae16b86`, full e2e pass*
- [x] **A5.9** Align e2e Step 20 with the Search-row check wrapper and trailing glyph rather than deprecated pill classes · S · *added A4; proof: `ae16b86`, full e2e pass*

**Done when:** SBG-010…012, HELP-002, TIP-006 (statblock part) proven. ✅ A5 closed; formula trace work remains under A9 as specified.

---

### R2 · Composes like sentences

#### A6 · Ability composer model and render grammar ✅ `rc-2.4.3-build-136-a6`

> The designer's sentence becomes data; plates, previews and text exports read from it.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R2 | AU-01 | A3 ✅ | 2–4 d | 11 implementation/build files; 5 source files, 5 test files, +~920 / −~15 |

- [x] **A6.0** Inventory: 44 bundled structured attacks; 28 legacy action rows carry no `actionType`/targets/effects; AI ingest fixture previously contained a structured weapon attack only. No committed Seraph fixture existed. Defaults recorded: malformed `<1d0>` means `1d10`; economy remains in its section header · M
- [x] **A6.1** Optional shared domain/UI types added; existing schema version unchanged because optional keys are backward-compatible and migration tests preserve them · S
- [x] **A6.2** `core/domain/ability-grammar.ts`: pure builders, conservative range/target inference, safe sanitation of malformed imported values · L
- [x] **A6.3** Explicit values win; safe legacy inference fills absent fields; ambiguous text stays visible verbatim; no store writes · M
- [x] **A6.4** `text2024(action, context)` outputs attack/save, range, outcomes, and authored prose; exported as opt-in style; no official-rules compliance claim · M
- [x] **A6.5** Modern action plates consume the shared projection; actions without optional fields stay on the legacy render path · M
- [x] **A6.6** `AbilityGrammar.test.ts` 8 cases incl. explicit precedence, legacy preservation, malformed imports, formula-backed counts, and non-mutation; full core suite 124/124 · M
- [x] **A6.7** Old-schema migration and AI-ingest round-trip fixtures prove optional fields survive without schema bump · S
- [x] **A6.8** Built browser suite Step 32 injects a transient Soul Barrage fixture and verifies attack, target, outcome, and authored prose; all 33 scenario steps pass, 0 runtime exceptions · S
- [x] **A6.9** Build 136 created; prior build 135 preserved; code and roadmap state recorded in §2 · S

**Done when:** CMP-001…008, COMP-001 (screen + text), COMP-003 proven; DEF-05 closed. Evidence: focused/core tests, migration/ingest fixtures, production build 136, built-app exhaustive UI 33/33 and zero runtime exceptions. Structured rendering is tested with a temporary browser fixture because the bundled sample templates contain no authored structured actions.

---

#### A7 · Composer chain and templates ◐ `rc-2.4.3-build-138-a7-template-isolation` (partial)

> Editing an ability is clicking chips in the same order the GM reads them.

| Release | Feature | Depends on | Effort | Forecast |
|---|---|---|---|---|
| R2 | AU-03 | A6 | 3–5 d | Current slice from build 136: 4 implementation/test files, +425/−100; full chain remains forecast |

- [x] **A7.0** Pre-flight: map every current field to its future chain home and identify preservation boundaries · M · *proof: audit notes below + implementation diff*
- [ ] **A7.1** `ROLE_CHAINS` descriptors (data) per role · S
- [ ] **A7.2** `components/editor/composer/ChainCell.vue`: plate-like display; editors by kind (CatalogSelect-lite, number/formula input, text) · L
- [ ] **A7.3** `components/editor/composer/ComposerChain.vue`: head · mechanics · scope · outcome rows; Tab/Enter/Esc keyboard model · L
- [ ] **A7.4** Live preview under the chain via `plateHtml` · S
- [x] **A7.5** `ACTION_TEMPLATES` catalog and grouped picker: 9 structured templates, authored casing, template-owned stale-field clearing, stable ID/role/use/recharge/stage/custom-preamble/CR preservation · M · *proof: `test/core/ActionTemplates.test.ts`; browser Step 32*
- [x] **A7.6** Remove the "Quick Attack Composer" strip and hard-coded preset buttons (DEF-12); require explicit confirmation before replacing an existing action · S · *proof: browser Step 32 cancel + apply paths*
- [x] **A7.7a** Catalog unit + browser tests: known/unknown template behavior, reset semantics, original-object immutability, nested catalog isolation, preservation boundaries, replacement cancel/apply · M · *proof: core 130/130; exhaustive UI 33/33; 0 runtime exceptions*
- [ ] **A7.7b** Chain test matrix: role descriptor order equals plate order; edit-to-preview and preview-to-statblock parity; keyboard and narrow viewport behavior · M
- [ ] **A7.8** Browser + close: commit `actions studio edits abilities as a chain of plate cells`, docs ritual · S

**A7.0 field ownership map (observed in `ActionsEditor.vue`):**

| Existing editor data | Future chain / role home | Template behavior in builds 137–138 |
|---|---|---|
| action identity, role arrays, bonus action, legendary/mythic membership and cost | role/header adapter; storage collections stay unchanged | preserved |
| name, description, action type, source/reach/attack bonus, save/stat/DC, target count/kind/qualifier/range/area/planes, outcomes/riders, damage effects | head, mechanics, scope, outcomes, prose cells | replaced from catalog; fields owned by a template but unspecified are cleared |
| school, tier, components, duration, delivery | head / metadata cells | replaced from catalog |
| limited use, recharge, stage pool, custom preamble, CR annotation | role/header or policy controls | preserved; no template silently changes economy or CR policy |
| existing UI-only prose/presets and calculated CR synchronization | prose and template workflow; CR recomputed after confirmed application | replaced only after confirmation; CR annotation retained |

**A7.7a verification scope:** known template paths, unknown IDs, stale-field clearing, input immutability, nested template/catalog isolation, and shared data separation are unit tested. Browser evidence covers replacement cancel/apply. Template range strings and structured range data agree; the ranged weapon template is explicitly 80 ft. because the current model cannot represent a long-range pair. Do not describe it as 80/320 until the model and renderer support both values. No persisted schema or configured sample-data edits were made.

**Done when:** CMP-009…011 proven; DEF-12 closed; all A7.1–A7.7b proofs present; build/browser candidate published; handoff close packet reconciled. Build 137 is a deliberate partial slice and does not close A7.

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
- [x] **A15.7** Align e2e Step 25 with intentional grouping: skills in Search/Study/Influence/Hide do not create a duplicate Skills row; assert grouped skill/tool content and no redundant Skills heading · S · *added A4; proof: `ae16b86`, full e2e pass*

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
- [ ] **A17.4** Theme matrix: 12 selectable themes × fixture, computed contrast table (SBG-005) · M
- [ ] **A17.5** Budgets: keystroke → preview, completion, select open, resolver pass (§15.4) · M
- [ ] **A17.6** `npx quasar build` clean · S
- [ ] **A17.7** Rewrite `STACK_STATE.md` and the README feature list from evidence (DEF-14, BS-03) · M
- [ ] **A17.8** Profile macro rendering on a 5 000-character description (BS-15); screenshot storage policy (BS-37) · S
- [ ] **A17.9** Release: annotated local tag `v2.5.0-statblock`, release notes, docs ritual · S

**Done when:** QA-001…006, SBG-005 (12 selectable themes), NFR-001 (Track A paths) proven; DEF-13, DEF-14 closed.

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

