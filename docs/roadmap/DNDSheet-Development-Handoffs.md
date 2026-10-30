# DNDSheet — Development Handoffs

> **No loop starts unarmed, no loop ends undocumented.** For every loop of the [Implementation Backlog](DNDSheet-Implementation-Backlog.md): the goal, the exact sections of the [Specification](DNDSheet-Professional-Product-and-Architecture-Spec.md) to read, the files to open, the skills to load, the research to settle, the traps to disarm, the proofs to collect — and a closing packet that hands the next loop everything it needs.

| | |
|---|---|
| **Version** | v2.4.3 build 145 · 2026-10-29 · seven roles and section headers integrated; preservation/conversion matrix and A7 closeout remain open; earlier archives preserved |
| **State at hand-over** | Candidate `rc-2.4.3-build-145-a7-role-context`, code `d70cc01`. Latest: `http://localhost:9106/index.html#/`; exact candidate 9109; protected 144 at 9107, 143 at 9108, 142 at 9105, 139 at 9100. 68/193 done, 1 active, 124 pending; 7/28 loops shipped. 165 core tests, production build, focused lint (warnings, zero errors), 38 browser steps, five-theme spellcasting and twelve-theme help pass. No schema/sample edits; stable origin retains browser state. |
| **Shipped** | A0 · A1 · A2 · A3 · A4 · A5 · A6 (A4 closeout §6.2; A5 §6.3; A6 §6.4) |
| **Current loop** | Continue A7 from §6.5. Trait integration is complete for this slice; catalog/templates, four action-family roles, reaction/trait adapters and preview proofs remain green. All-role preservation/conversion matrix and A7 closeout remain open. |

---

## 0. How to use this file

📍 *Handoffs › 0 Usage* — **Read the card, run the start ritual, work in small green steps, run the close ritual, write the packet.**

**Card anatomy (every loop, same order):**

```text
Goal · Release/feature · Readiness light
Entry criteria          what must be true before touching code
Read in the spec        exact sections (§)
Backlog tasks           ids
Open first              files with line ranges
Skills                  exact skill names to load
Research                questions to settle, with sources
Traps & blindspots      known pitfalls, BS-ids to verify
Plan                    numbered steps (the micro-loops)
Verify                  commands, probes, acceptance → proof
Exit                    the Done-when of the backlog, restated
Closing packet          filled at the end (template §1.5)
Next-loop prep          what to stage for the successor
```

**Readiness lights:** 🟢 ready (all entry criteria met) · 🟡 ready with open questions (defaults recorded) · 🔴 blocked (named blocker).

---

## 1. Loop protocol

📍 *Handoffs › 1 Protocol* — **The same ritual every time, so nothing depends on memory.**

### 1.1 Start ritual

```powershell
Set-Location F:\AI_Resources\DNDSheet
git status --short                      # must be empty (or only the docs mirror you are about to commit)
git branch --show-current               # statblock-overhaul
git log --oneline -3                    # note the starting commit in the packet
npm test                                # must be green before any change
Get-NetTCPConnection -LocalPort 9106 -State Listen   # inspect every IPv4/IPv6 listener and its archive root (§2.2)
```

Then: read the card · open the spec sections · load the skills · run the card's pre-flight task (`Ax.0`) · turn every surprise into a task or a blindspot **before** writing feature code (§1.6).

### 1.2 Inside the loop — micro-cycles

1. **Smallest testable step first** — a catalog, a pure function, a builder; write its test (node:test) before or with it.
2. **Green, then visible** — run `npm test`; then probe the running app in the built-in browser (§2.3).
3. **Commit at green when a slice is meaningful** — short lowercase message (§2.5); never leave the tree red at a pause.
4. **One outcome per loop** — anything else goes to the backlog as a new task in the right loop (*added Ax*).
5. **Measure, don't guess** — LOC deltas from `git diff --shortstat`, counts from scripts, colours from computed styles.

### 1.3 Close ritual

```powershell
npm test                                               # green
npx eslint --ext .js,.ts,.vue <touched files>          # 0 errors
git diff --shortstat <start>..HEAD                      # for the packet
```

Browser: reload with an error marker (§2.3 probe P1), confirm no new console errors, run the loop's probes and theme probe if it touched the renderer. Then the documentation ritual (§1.4) and the packet (§1.5).

### 1.4 Documentation ritual (order matters)

1. **Spec** — status columns (§9 dossier header, §11.1 loop table), defect/blindspot registers (§2.3, §13.2), decisions (§13.3) if any were made.
2. **Backlog** — tick tasks, header of the loop (`✅ <commit>`), dashboard counts (§1), living timeline row (§2), Now/Next/Later (§3), new tasks appended to future loops.
3. **Handoffs** — paste the closing packet into the loop's card, flip the next card's readiness light, update the top table.
4. **Mirror and commit** — the canonical files live in the outputs folder; the repository keeps a versioned mirror:

```powershell
$out = 'C:\Users\Administrador\Documents\Codex\2026-10-29\ttrpg-gm-craft-c-users-administrador\outputs'
Copy-Item "$out\DNDSheet-*.md" F:\AI_Resources\DNDSheet\docs\roadmap\ -Force
Set-Location F:\AI_Resources\DNDSheet
git add docs/roadmap
git commit -m "roadmap: close <loop id> (<one-line outcome>)"
```

### 1.5 Closing packet template

```text
Loop / tasks ............ A? · A?.0–A?.n (ticked n / total)
Outcome for the user .... one sentence
Commits ................. <start> → <end> (code) · <docs commit>
Diff .................... files · +ins / −del (git diff --shortstat)
Tests ................... npm test n / n · new tests: …
Lint .................... eslint touched files: 0 errors
Browser proofs .......... probes run + key outputs (copy the JSON lines)
Themes .................. probed themes and result (render loops)
Requirements proven ..... ids
Defects closed .......... DEF-…
Blindspots resolved ..... BS-… (answer) · new BS-… (question)
Decisions ............... D-… added/changed
Deviations from plan .... what changed and why
Known limits ............ what is still not done or not proven
Rollback point .......... <start commit>
Next loop readiness ..... 🟢/🟡/🔴 + what to stage
```

### 1.6 Blindspot expansion — before the first line of feature code

For each card: (1) open every file listed in **Open first** and confirm the line ranges still match; (2) list every assumption the plan makes about that code; (3) test each assumption with a read, a probe or a tiny script; (4) every false assumption becomes a backlog task (*added Ax*) or a blindspot row; (5) only then start the plan. This is task `Ax.0` in every loop.

---

## 2. Environment and tooling

📍 *Handoffs › 2 Environment* — **Everything a fresh session needs to be productive in five minutes.**

### 2.1 Paths and identities

| What | Value |
|---|---|
| Repository | `F:\AI_Resources\DNDSheet` (branch `statblock-overhaul`) |
| Canonical documents (versioned) | `F:\AI_Resources\DNDSheet\docs\roadmap\` |
| Evaluation mirror | `C:\Users\Administrador\Documents\Codex\2026-10-29\ttrpg-gm-craft-c-users-administrador\outputs\` · copy from canonical docs and verify SHA-256 equality |
| v1 documents backup | `outputs\_previous-v1\*.v1-0819.md` and git `b83ee56` |
| QA evidence | `test/exhaustive-ui-fuzz.js`, `test/spell-plate-browser-smoke.js`, `test/statblock-help-browser-smoke.js`; current logs in `.codex-temp/build144-*.log` |
| Evaluation / development | latest archived RC at 9106; isolated 144 at 9107; predecessor 143 at 9108; use 9110 for mutable development; protected 139 remains at 9100 |
| Built-in browser | discover the current tab for `http://localhost:9106/index.html#/` each session; tab IDs are transient; doc check page `/__doccheck.html` is git-excluded |
| Persisted state keys | `app.monster`, `app.editor`, `app.spells`, `app.templates`, `app.combat`, `app.character` |
| Toolchain | Node 22.23 · Quasar ^2.16 · @quasar/app-vite ^1.9 · Pinia ^2 · TypeScript ^4.5 |

### 2.2 Commands

```powershell
# dev server (no auto-open)
$env:DNDSHEET_NO_OPEN = '1'; npx quasar dev --port 9110
# tests (node:test, strip-types; core imports use .ts extensions and `import type`)
npm test
node --experimental-strip-types --test test/core/Plate.test.ts      # one suite
# lint touched files
npx eslint --ext .js,.ts,.vue src/components/rendering/plate.ts
# e2e against the immutable candidate (headless Chrome CDP port 9223)
$env:DNDSHEET_E2E_URL = 'http://localhost:9107/index.html#/'
npm run test:e2e
# production build
npx quasar build
```

### 2.2.1 Candidate promotion and browser-state continuity

1. Build `dist/spa`, copy into a new `.codex-temp/release-candidates/<tag>/spa`, and validate that archive on an isolated port. Never point a protected/latest evaluation server at mutable `dist/spa`.
2. Commit/tag the code; record evidence in `release-candidate.json`; generate and verify `SHA256SUMS.txt` (excluding itself). Preserve the prior artifact/tag before promotion.
3. Inspect every IPv4/IPv6 listener and confirm identity/root before stopping one. Both addresses must serve the same frozen archive. Build 144 corrected a stale IPv6 server serving mutable dist while IPv4 served archived 143.
4. After proofs pass, promote the new archive to `localhost:9106`. Keep predecessor 143 at 9108 and exact 144 at 9107. Use a hidden persistent server process that outlives the tool call.
5. Compare served index/asset hashes on `127.0.0.1`, `[::1]` and `localhost`; verify the visible footer and predecessor checksums. Retaining the origin preserves configured `app.monster` state without storage migration or fixture overwrites.
6. Mutable development uses 9110. Browser tests use isolated temporary profiles. Inspect actual roots/processes each session; HTTP 200 and an open tab alone do not identify a release.

### 2.3 Built-in browser probes (run with the JavaScript tool on tab `seed`)

**P1 · reload with an error marker** — then read console errors; the marker must be the last error.

```js
console.error('MARK-' + Date.now()); setTimeout(() => location.reload(), 50); 'ok'
```

**P2 · load the Seraphic Herald fixture** — paste the content of `%TEMP%\dnd-fixture-seraph.js` (it patches the `monster` and `editor` Pinia stores through `#q-app.__vue_app__`).

**P3 · plates and rows**

```js
({
  plates: [...document.querySelectorAll('#render .sb-plate')].map(p => p.innerText.replace(/\s+/g, ' ').slice(0, 160)),
  rows: [...document.querySelectorAll('#render .dnd-cascade-panel, #render .sb-row')].map(r => r.innerText.replace(/\s+/g, ' ').slice(0, 100)),
})
```

**P4 · theme probe** (computed colours across themes; restores the class afterwards)

```js
(() => { const sb = document.querySelector('#render .statblock'), p = document.querySelector('#render .sb-plate'), orig = sb.className, out = {};
  for (const t of ['theme-wotc','theme-printer','theme-lovecraft_golden','theme-lovecraft_spooky','theme-art_nouveau']) {
    sb.className = orig.replace(/theme-[a-z_]+/, t);
    const h = getComputedStyle(p.querySelector('.sb-head')), c = getComputedStyle(p.querySelector('.sb-cell:not(.sb-head)'));
    out[t] = { head: h.backgroundColor + ' / ' + h.color, cell: c.backgroundColor + ' / ' + c.color, frame: getComputedStyle(p).borderTopColor };
  } sb.className = orig; return out })()
```

**P5 · quick overflow probe** (formal version arrives in A13)

```js
[...document.querySelectorAll('.q-page *')].filter(e => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible').slice(0, 20).map(e => e.className.toString().slice(0, 60))
```

**P6 · formula macros**

```js
const m = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster'); m.name
```

*(Use P6 as the entry point to inspect store values; render checks go through the stat block DOM.)*

### 2.4 QA helpers

| Script | Usage |
|---|---|
| `dnd-shot.mjs` | `node dnd-shot.mjs --url <url> --out <png> [--w 1600] [--h 1200] [--setup <js>] [--selector <css>] [--eval <js>] [--wait 600]` — headless Chrome screenshot + probe |
| `dnd-fixture-seraph.js` | Seraphic Herald fixture (CHA caster, advantage on Religion, Soul Barrage and Veil of Radiance) |
| `dnd-splice.mjs` | `node dnd-splice.mjs <file> <startMarker> <endMarker> <replacementFile> [--include-end]` — replace a marked block |
| `dnd-skills-editor.mjs` | One-off refactor script from A1 (reference only) |
| `public/__doccheck.html` | Mermaid parse check of `docs/roadmap/*.md` (`?files=a.md,b.md`); git-excluded |

### 2.5 Git conventions

- One branch: `statblock-overhaul`; commit at green; never rewrite pushed history (nothing is pushed — work is local).
- Messages: short lowercase phrase describing the user-visible change, matching the history (`formula engine for references, custom formulas and text macros`).
- **No AI-attribution trailers** (no `Co-Authored-By`, no session links, no "Generated with") — owner rule, overrides tooling defaults.
- Docs commits use the `roadmap:` prefix (`roadmap: close A4 (spellcasting plate)`).

### 2.6 Environment traps (learned the hard way)

| Trap | Effect | Do instead |
|---|---|---|
| `$env:TEMP` resolves to `F:\temp` in some shells | scripts written to `C:\…\AppData\Local\Temp` not found | use absolute paths |
| .NET `[IO.File]` with relative paths | resolves against the process cwd, not `Set-Location` | absolute paths |
| Reading screenshots as files (`read_media_file`) | dumps ~94 k tokens of base64 | use the browser `screenshot`/`zoom` actions at scale ≤ 0.7 |
| Puppeteer/Playwright MCP | detached frames, missing browsers | built-in browser + `dnd-shot.mjs` |
| Vite serving an `.html` outside `public/` | HTTP 500 | put ad-hoc pages in `public/` and git-exclude them |
| HMR after a half-applied edit | page blank, stale errors in console | reload with P1 and judge only errors after the marker |
| Legacy `!important` rules | new styles "do nothing" | scope under `#render .statblock`, use tokens (§4.1 of the spec) |
| Device bridge drops in long sessions | lost context | commit at green; write the packet before long steps |
| `public/__doccheck.html` is git-excluded but `quasar build` copies `public/` into `dist/` | a QA page in a release build | delete it before release builds; A17 moves it to `tools/qa/` |

---

## 3. Skills library

📍 *Handoffs › 3 Skills* — **Load the skill before the work it governs; every name below exists in this environment.**

| Skill (exact name) | Use it for | Loops |
|---|---|---|
| `superpowers:writing-plans` | Turning a card's plan into ordered micro-steps before coding | every loop with ≥ 6 tasks |
| `superpowers:executing-plans` | Working through the task list with checkpoints | every loop |
| `superpowers:test-driven-development` | Catalogs, builders, resolvers, grammars — test first | A4, A6, A9, A10, A12, B1–B5 |
| `superpowers:systematic-debugging` | Any probe output that contradicts the plan | as needed |
| `superpowers:verification-before-completion` | Close ritual — evidence before claims | every loop |
| `superpowers:brainstorming` | Open interaction design (chain UI, kit anatomy) | A7, A13 |
| `superpowers:requesting-code-review` | L-size loops before closing | A8, A9, A14, B5 |
| `engineering:architecture` | Boundaries, ADR-worthy choices | A6, A9, A12, B1, B5 |
| `backend-development:architecture-patterns` | Ports/adapters, repository, session adapter | B1, B5 |
| `documentation-generation:architecture-decision-records` | Writing D-records (D-11, D-13, B-track decisions) | A9, A12, B1, B5, B8 |
| `engineering:testing-strategy` | Fixture design, golden strings, test pyramid | A4, A6, A17 |
| `developer-essentials:e2e-testing-patterns` | CDP e2e update | A17 |
| `developer-essentials:error-handling-patterns` | Broken bindings, metric failures, save errors | A9, A12, B5 |
| `code-refactoring:refactor-clean` | Pure-move splits, panel retirement | A8, A14, A16 |
| `code-refactoring:tech-debt` | CSS `!important` paydown, debt table | A16 |
| `impeccable:impeccable` | Visual quality of plates, rows, chain, kit | A4, A5, A7, A13–A16 |
| `frontend-design` | Distinctive, intentional look for new UI | A7, A13 |
| `ui-design:visual-design-foundations` | Typography, hierarchy, colour roles of the grammar | A4, A5 |
| `ui-design:interaction-design` | Chain cells, completion, select behaviour | A7, A10, A13 |
| `ui-design:design-system-patterns` | Tokens, kit components, catalogs | A13 |
| `ui-design:responsive-design` | Fit contract, narrow mode | A14–A16, B7 |
| `ui-design:accessibility-compliance` | ARIA combobox/listbox/tooltip, WCAG 1.4.13 | A10, A13–A16 |
| `design:accessibility-review` | Close-ritual accessibility pass | A10, A13–A16, B7 |
| `design:ux-copy` | Short labels, HelpTip copy, error messages | A5, A13–A16, B2 |
| `design:design-critique` | Owner-facing review of visual loops | A4, A5, A7, A16 |
| `anthropic-skills:ttrpg-gm-craft` | Rules accuracy (2024 grammar, metamagic, spells, actions) | A4, A6, A12, B3 |
| `anthropic-skills:built-in-browser` | Every browser probe | every loop |
| `context7:docs` | Current Quasar/Vue/Pinia API details | A9, A10, A13 |
| `modern-web-guidance:modern-web-guidance` | Caret geometry, `:has()`, modern CSS/DOM APIs | A5, A10, A13 |
| `avoid-ai-writing:avoid-ai-writing` | Release notes, README, help dictionary copy | A13, A17, B10 |
| `skill-forge-essentials:ai-debt-detector` | Spotting generated-code debt during sweeps | A16, A17 |

---

## 4. Research library

📍 *Handoffs › 4 Research* — **Where facts come from, and the open questions each loop must settle before it builds.**

### 4.1 Sources

| Topic | Source | Extract |
|---|---|---|
| Search / Study / Influence / Hide | [Free Rules 2024 — Rules Glossary](https://www.dndbeyond.com/sources/dnd/free-rules/rules-glossary) | skill lists, DC 15 Hide |
| 2024 stat block grammar | [How to Use a Monster (2024)](https://www.dndbeyond.com/sources/dnd/br-2024/how-to-use-a-monster) | Attack Roll lines, Hit/Miss, Recharge X–Y, Spellcasting placement |
| Metamagic costs (2024) | [dnd2024.wikidot — Sorcerer Metamagic](http://dnd2024.wikidot.com/sorcerer:metamagic) | 10 options and costs |
| SRD subclasses | [Open 5e SRD explorer](https://dnd5esrd.vercel.app/explore/subclasses) · [D&D Beyond SRD page](https://www.dndbeyond.com/srd) | the 12 SRD subclasses; SRD licence (CC BY 4.0) |
| 2014 rules cross-check | [5e SRD (5esrd.com)](https://www.5esrd.com) · [dnd5e.wikidot](https://dnd5e.wikidot.com) | 2014 values for ruleset-aware catalogs |
| Quasar components | [QSelect](https://quasar.dev/vue-components/select) · [QTooltip](https://quasar.dev/vue-components/tooltip) · [QEditor](https://quasar.dev/vue-components/editor) · [QMenu](https://quasar.dev/vue-components/menu) · [QVirtualScroll](https://quasar.dev/vue-components/virtual-scroll) | slots, events, virtual scroll, caret helpers |
| Vue | [Custom directives](https://vuejs.org/guide/reusability/custom-directives.html) | `v-help` lifecycle |
| Pinia | [Pinia docs](https://pinia.vuejs.org/) · [persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) | `$patch`, `$subscribe`, hydration of new keys |
| Caret geometry | [MDN Range.getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Range/getBoundingClientRect) · [textarea-caret-position](https://github.com/component/textarea-caret-position) | contenteditable and input caret rectangles |
| Accessibility | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) · [APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) · [WCAG 1.4.13](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html) · [1.4.10 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html) | roles, keys, dismissal, reflow |
| CSS `:has()` | [MDN :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) | support matrix |
| Diagrams | [Mermaid](https://mermaid.js.org/intro/) | syntax for doc updates |

### 4.2 Standing research questions

| Loop | Question | Default if unresolved |
|---|---|---|
| A4 | Sorcerer *Font of Magic* conversion table (2024) for the Metamagic head tip | Tip omits numbers, links the class |
| A4 | Multiclass head title format (BS-18) | "Warlock 5 / Sorcerer 10 (CHA)" |
| A5 | Should the classic template change? (BS-12) | Untouched |
| A6 | `<1d0>` typo (BS-22); economy chip in plates (BS-23) | `1d10`; no chip inside sections |
| A8 | Villain actions and CR cards (BS-26, BS-27) | Villain stays a panel; CR cards stay in studio |
| A9 | Decimals in formulas (BS-16) | Integers only |
| A12 | PHB'24 prepared-spell table; SRD subclass expanded lists; multiclass slots (BS-29, BS-30) | SRD 5.2.1 values; others custom |
| A13 | Ordinal ordering (Q-1); localisation of help (BS-33) | Natural order for ordinals; English |

---

## 5. Release checklist (R1 … R10)

📍 *Handoffs › 5 Release* — **A release closes only when this list is green on one commit.**

- [ ] Every loop in the release is ✅ with a closing packet in §6.
- [ ] `npm test` green; ESLint 0 errors on every file touched by the release.
- [ ] Acceptance rows of every dossier in the release proven (tests, probes, screenshots listed in packets).
- [ ] Theme probe for render-affecting releases (R1, R5, R6): 5 themes minimum, 12 at R6.
- [ ] No open high-severity defect in the release's scope (spec §2.3).
- [ ] Spec status columns, backlog dashboard and timeline, handoff cards updated.
- [ ] Docs mirror committed (`roadmap: release Rn`).
- [ ] R6 only: `npx quasar build` clean; `npm run test:e2e` green; README and STACK_STATE rewritten from evidence; local tag `v2.5.0-statblock`.

---

## 6. Loop cards

📍 *Handoffs › 6 Cards* — **Shipped loops keep their closing packets; the next loop is fully armed; later loops carry everything known today and are re-armed at their pre-flight.**

### 6.1 Shipped — closing packets

#### A0 · Baseline snapshot ✅

```text
Loop / tasks ............ A0 · A0.1–A0.4 (4 / 4)
Outcome for the user .... the local work is frozen and reviewable; QA tooling (dev server, fixture) ready
Commits ................. 387f827 (upstream) → 52355c2
Diff .................... 135 files · +41 791 / −2 884 (pre-existing local work, not authored in this overhaul)
Tests ................... npm test 69 / 69 at baseline
Browser proofs .......... Seraphic Herald fixture renders on http://localhost:9100
Known limits ............ STACK_STATE.md claims not reproduced (BS-03)
Rollback point .......... 387f827
Next loop readiness ..... A1 🟢
```

#### A1 · Check rows + whole-label advantage ✅

```text
Loop / tasks ............ A1 · A1.1–A1.9 (9 / 9)
Outcome for the user .... skills read as Search / Study / Influence / Hide rows; no duplicate Skills row; advantage colours the whole label
Commits ................. 52355c2 → 574f196
Diff .................... 9 files · +868 / −486
Tests ................... 79 / 79 · new: SkillActionGroups.test.ts (10)
Browser proofs .......... "Search ACTION 13/+3, (15, +5 Insight)" · "Study ACTION 11/+1, (13, +3 Investigation; 15, +5 Medicine; 18, +3 Religion ▲▲)"
                          · "Influence ACTION 15/+5, (17, +7 Persuasion)" · "Hide BONUS ACTION 11/+1, (13, +3 Sleight of Hand)" · no Skills row
Requirements proven ..... CHK-001…004, SBG-003 (rows)
Decisions ............... D-01 (owner skill groups)
Known limits ............ text exports may still print a Skills line (BS-13)
Rollback point .......... 52355c2
Next loop readiness ..... A2 🟢
```

#### A2 · Formula engine, references and text macros ✅

```text
Loop / tasks ............ A2 · A2.1–A2.8 (8 / 8)
Outcome for the user .... {…} macros and formulas render correct numbers anywhere; no code execution from text
Commits ................. 574f196 → be0cf3f
Diff .................... 8 files · +1 409 / −106
Tests ................... 98 / 98 · new: Formula.test.ts (18) + ProcessTokens macro case (1)
Browser proofs .......... {CANTRIP_DICE d10} → "16 (3d10)" · {spellcasting.attack} → "+7" · {HIT_DIE} → "4 (1d8)"
                          · {8 + PB + CHA_MOD} → "15" · {spellcasting.nonsense} left verbatim
Requirements proven ..... REF-001, REF-003…006
Decisions ............... D-04 (small grammar, no eval)
Known limits ............ fields still store flat numbers (A9); no caret completion yet (A10)
Rollback point .......... 574f196
Next loop readiness ..... A3 🟢
```

#### A3 · Plate grammar for abilities ✅

```text
Loop / tasks ............ A3 · A3.1–A3.5 (5 / 5)
Outcome for the user .... traits, actions, attacks, reactions and legendary entries are framed plates with crimson heads and parchment cells
Commits ................. be0cf3f → c543615
Diff .................... 4 files · +494 / −186
Tests ................... 103 / 103 · new: Plate.test.ts (5)
Lint .................... 0 errors (two quote warnings fixed in useProcessTokens.ts)
Browser proofs .......... WotC: head rgb(88,24,13) / ink rgb(253,241,220); cells rgb(251,242,227); body stripes 24 px / 48 px at line-height 24 px;
                          container frame removed; console clean after a marked reload
Themes .................. wotc · printer · lovecraft_golden · lovecraft_spooky · art_nouveau — palettes applied
Requirements proven ..... SBG-001…004; SBG-005 for 5 themes
Blindspots resolved ..... BS-01 (plate WIP was this overhaul's own work) · BS-02 (app runs from the tree)
Decisions ............... D-03 (shared visual grammar; rendering follows content type; supersedes the initial one-builder hypothesis)
Deviations from plan .... the plate builder started before a context reset; CSS finished and committed in this loop
Known limits ............ spellcasting still legacy markup (A4); top rows legacy (A5); e2e expectations (A17)
Rollback point .......... be0cf3f
Next loop readiness ..... A4 🟢
```

---

### 6.2 A4 · Spellcasting plate — ✅ CLOSED `f35cd6d` · verified follow-up `ae16b86`

| | |
|---|---|
| **Goal** | Class and innate spellcasting render through shared plate grammar: summary, metamagic, cantrips, level rows and spell cells |
| **Backlog tasks** | A4.0–A4.12 · all complete |
| **Implementation** | Pure projections in `src/core/domain/spell-plate.ts`; shared cadence and metamagic catalogs; Vue text-bound rows in `WebRenderer.vue`; shared grammar SCSS; localized label |
| **Measured impact** | 12 files · +802 / −389 · commit `f35cd6d` |
| **Tests** | `npm test` 111 / 111 · `npm run build` passes · targeted browser smoke passes class and innate fixtures across five themes · targeted lint 0 errors (existing warnings remain) |
| **Closeout follow-up** | `ae16b86` hides the generic class preamble already represented by the plate while preserving enabled custom preambles; it aligns browser checks with semantic advantage wrappers and the no-duplicate Skills row contract. |
| **Verification** | `npm test` 111 / 111 · `npm run build` succeeds · focused spell smoke passes across 5 themes · full e2e passes all 23 groups with 0 runtime exceptions · touched-path lint 0 errors (existing warnings remain). |

**Decisions confirmed** — retain pure domain projections as the testable boundary; render typed spellcasting rows with Vue text nodes; do not manufacture missing slot/point values; keep innate casting separate; edition-specific Metamagic effect text is distinct; cadence catalog is shared with editor and text renderer. Spellcasting does not add another `v-html` surface.

**Closeout / next-loop preparation**

- A4 is complete and committed. Its acceptance includes the core suite, build, focused browser smoke, and the passing full UI suite stated above.
- A5 is closed at `8487335` and tagged as `rc-2.4.3-build-135-a5`; its final-state theme and A4 print evidence is retained in `docs/evidence/a5/`. The earlier build 134 candidate remains preserved at `a6c87e4`.
- The original A5 historical screenshot baseline was unavailable. Final screenshots and measured contrast are evidence of the delivered state only; do not claim historical pixel parity. Formula derivation remains scoped to A9.
- A15.7 aligned Step 25 with the no-duplicate Skills-row contract; grouped skill/tool content and row absence now pass.
- Full e2e passed 33 scenario steps with zero runtime exceptions on 2026-10-29; retain A17 as the regression gate after later rendering or interaction changes.

---
### 6.3 A5 · Row grammar + head tooltips — ✅ CLOSED `8487335` · `rc-2.4.3-build-135-a5`

| | |
|---|---|
| **Goal** | Top-block rows adopt the head/data grammar and tokens; every row head and plate head explains itself (delegated tooltip host) |
| **Release · feature** | R1 · SB-05 |
| **Entry criteria** | A4 ✅ · A5 implementation and verified behaviors closed; original dirty edits were preserved through this commit |
| **Read in the spec** | §9 SB-05 · §4.1, §4.5 · §6.4 · §13.2 BS-12, 14, 19, 20 · D-09 |
| **Backlog tasks** | A5.0 – A5.9 complete; e2e Steps 18/20 pass; A5.6 final evidence at `docs/evidence/a5/` |
| **Open first** | Closed packet: `WebRenderer.vue`, `statblock-help.ts`, `useProcessTokens.ts`, shared cascade styles and print CSS were reviewed. Twelve final-state theme screenshots, A4 preview screenshot and one-page A4 PDF are retained. Historical screenshots are absent; contrast/token probes and visual review support final-state claims, not historical pixel parity. Formula derivation remains A9 NumericBinding and is never inferred from renderer text. |
| **Skills** | `ui-design:visual-design-foundations` · `impeccable:impeccable` · `design:ux-copy` · `modern-web-guidance:modern-web-guidance` · `anthropic-skills:built-in-browser` · `superpowers:verification-before-completion` |
| **Research** | WCAG 1.4.13 behaviour for the host; event delegation with `mouseover/focusin` on `#render` |
| **Traps** | Do not claim historical pixel parity: baseline is absent · do not infer numeric provenance from rendered strings · retain delegated events because descendants can be replaced |
| **Plan** | Closed: print stage/shell sizing fix → capture theme/A4/PDF evidence in fresh browser profile → core/build/lint/help/spell/full UI checks → roadmap reconciliation; formula provenance remains A9 |
| **Verify** | 12 screenshots; `pdfinfo` confirms 1 A4 page; e2e Steps 18/20; `.sb-head`/row semantics; focus/ARIA/Escape/detach/scroll/resize; recharge wording; CSS delta; full e2e |
| **Exit** | ✅ SBG-010…012, HELP-002, TIP-006 (statblock), 12-theme contrast and one-page A4 print proven |
| **Defaults** | BS-12 classic template untouched · BS-14 row named "Other checks" · BS-20 ability grid unchanged |
| **Next-loop prep** | A6 is armed by §6.4: inspect real action entries in templates and AI ingest, preserve authored legacy prose, and derive ability grammar fixtures before changing the composer. |

---

### 6.4 A6 · Ability composer model — ✅ `rc-2.4.3-build-136-a6`

| | |
|---|---|
| **Goal** | Actions carry reach, source, targeting and outcomes (optional); plates and 2024 text read them through one grammar module |
| **Release · feature** | R2 · AU-01 · fixes DEF-05 |
| **Entry criteria** | A3 ✅ · inventory completed; bundled legacy data and AI-ingest fixture behavior recorded |
| **Read in the spec** | §9 AU-01 (grammar → fields → outputs table) · §6.5 · §7.5 · §8.6 · §13.2 BS-06, 09, 10, 22, 23 · D-10 |
| **Backlog tasks** | A6.0 – A6.9 |
| **Open first** | `components/models.ts` (`MonsterAction` L≈590) · `core/domain/types.ts` (mirror type) · `useProcessTokens.ts` modern branches (`processAction`, `processAttack`, `buildPlateEntry`) · `src/data/templates/*` · `core/usecases/IngestAiStatblock.ts` output shape |
| **Skills** | `superpowers:test-driven-development` · `engineering:architecture` · `anthropic-skills:ttrpg-gm-craft` · `engineering:testing-strategy` |
| **Research** | Repository inventory found no bundled structured-action example or committed Seraph fixture. This pass implements the product text-grammar contract; it does not claim official rules validation. |
| **Traps** | Inference never writes to the store · malformed optional data is sanitized · ambiguous legacy text remains visible · configured monster data remains unchanged · 2024-style export is opt-in |
| **Plan** | Completed: inventory → optional types → pure grammar/inference → 2024-style projection → modern plates/export → migration/ingest/core/browser verification |
| **Verify** | `AbilityGrammar.test.ts` (8 cases) · migration and ingestion round-trip tests · core 124/124 · production build 136 · exhaustive UI 33/33, zero runtime exceptions |
| **Exit** | CMP-001…008, COMP-001 (screen/text), COMP-003 proven for modeled/fixture cases; no native editor composer yet (A7) |
| **Defaults** | `1d0` → `1d10` · no economy chip inside its own section |
| **Next-loop prep** | A7 reads optional `MonsterAction` fields and uses the A6 phrase ordering. Map each existing Actions Studio field to a chain cell before moving UI; do not add required persisted fields unless A7 defines their migration first. |

---

### 6.5 A7 · Composer chain and templates — 🟡

| | |
|---|---|
| **Goal** | Each ability is edited as a chain of chips in plate order, with a live plate preview and a template picker |
| **Release · feature** | R2 · AU-03 (part 1) · fixes DEF-12 |
| **Entry criteria** | A6 ✅ (fields and phrases exist) |
| **Read in the spec** | §9 AU-03 (concept, W-05) · §6.7 `ComposerChain` · §8.3 · §4.2 precedence |
| **Backlog tasks** | A7.0 – A7.8, with A7.7 split into shipped A7.7a and pending A7.7b |
| **Completed slice** | Completed A7.0/1/2/4/5/6/7a scope retained. Build 144 adds typed trait cadence/drafts/validation, phase/grouping/conditional/custom-heading/CR settings, trait templates and exact renderer preview. Step 37 proves cancel/validation/focus, modern/classic parity, live multiword headings, grouping/custom heading, 375px popup fit, legacy partial-annotation automatic CR preserving inclusion, and reload persistence. Build 145 completes A7.3; A7.7b remains active for full all-role preservation/conversion proofs. |
| **Field inventory** | Template-owned: name/description/action type/attack mode/source/bonus/targets/save/stat/range/effects/spell metadata/duration/delivery/targeting/outcomes. Preserved: ID, collection membership/role, bonus-action and legendary/mythic association, uses, recharge, stage pool, custom preamble and CR annotation. Confirmed apply recomputes derived CR display. |
| **Open first** | `composer-chain.ts`, `reaction-composer.ts`, `trait-composer.ts`, `action-composer.ts`; composer UI including `TraitCadenceEditor.vue` and `TraitDisplaySettings.vue`; `ActionsEditor.vue`, `useProcessTokens.ts`, `useTextRenderer.ts`, `MonsterBuilder.vue` and surviving legacy panels. Preserve all seven routes plus `role-headers.ts` and `RoleHeaderEditor.vue`. Keep lair id/prose/CR separate from section initiative/preamble context. Audit conversion factories/data-loss handling before panel removal. Keep rich-text prose ownership and the existing renderer authority. |
| **Skills** | `build-web-apps:frontend-app-builder` · `design:accessibility-review` · `design:ux-copy` · `impeccable` · `superpowers:test-driven-development` · `engineering:testing-strategy` |
| **Research** | Keyboard model for chip rows (roving tabindex), menu/dialog focus return and Escape semantics (APG toolbar/grid/menu patterns); narrow viewport overflow; current range model cannot store a long-range pair (BS-39). |
| **Traps** | Do not lose fields from the editor inventory; keep authored casing; never auto-replace authored actions; template-owned missing optionals must clear stale values; preview must be pure; preserve arrays/schema; do not claim 80/320 ft. with a single-distance model; no sample fixture mutations. |
| **Plan** | A7.0/1/2 ✅ → A7.3 ✅ seven roles and section headers integrated → A7.4 ✅ shared renderer previews for seven roles → A7.5/6/7a ✅ → A7.7b ◐ trait/reaction matrix passing, all-role matrix open → A7.8 close only after full acceptance. |
| **Verify already passed** | 159 core tests; production build; changed-file lint; 37 browser steps with zero console errors/runtime exceptions; five-theme spellcasting; twelve-theme help/contrast; diff check. Step 37 proves trait draft cancel/validation, focus return, exact modern/classic HTML parity, grouping/custom heading, live spaces, 375px popup fit, legacy partial-annotation automatic CR with preserved inclusion, and reload persistence. Build 145 additionally proves lair/header interactions and narrow stacking in Step 38 with 165 core tests and all 38 steps passing. This still does not prove every field, every role transition, or every export format. |
| **Remaining proof** | Retain build 145 lair/header proofs; prove all seven descriptor-to-plate orders; complete field preservation, old-save, cross-role conversion, keyboard/narrow-view and edit→preview→sheet matrix; retain trait/reaction regressions; only then close A7 through A7.8. |
| **Next-loop prep** | Prepare A8's capability matrix from actual surviving panel fields only after A7 role adapters stabilize; preserve schema and arrays; decide BS-26/27 separately. Do not begin panel retirement before every capability has a verified studio home. |

### 6.5.1 Build 144 partial-slice closing packet

| Item | Evidence / decision |
|---|---|
| Base → code | `dffecb9` → `7f2e572`; tag `rc-2.4.3-build-144-a7-trait-chain` |
| Impact | 10 tracked files, +467/−103; seven source files and three test/build-support files |
| Outcome | Trait cadence, phase/grouping/conditional/custom-heading/CR policy, templates and the sheet's own preview are usable in the studio |
| Architecture | Pure adapter validates/patches; UI owns isolated drafts/focus; existing Pinia collections persist; `computeTraitTag` and `processTrait` remain projection authority |
| Review / fixes | Automatic CR recalculates from description while preserving inclusion; shared popup overflow and live-space trimming reproduced/fixed; imported phase options bounded while retaining a saved legacy choice |
| Verification | 159 core tests; production build; changed-file lint; 37 browser steps, zero errors; modern/classic parity; popup width=scroll width at 375px; reload persistence; five-theme spellcasting and twelve-theme help/contrast |
| Fixture boundary | A live trait requires CR annotation; test legacy data through the import shape. Step 37 uses its actual partial, excluded annotation and proves recalculation fills automatic estimates while keeping exclusion. New trait role conversion uses the existing default factory |
| Status audit | 67 done, 2 active (A7.3/A7.7b), 124 pending; task IDs unchanged; one active loop A7; six/seven role adapters integrated; loop remains open |
| Release | Prior archive/tag retained; latest serves frozen 144 on both loopback families; stable origin preserves configured browser data |
| Next grouped work | Lair entry/context → remaining role headers → complete preservation/conversion matrix → A7 closeout → A8 retirement after capability parity |

### 6.6 A8 · One Actions module — 🟡

| | |
|---|---|
| **Goal** | The studio covers every role; seven (or eight) duplicate panels retire; storage unchanged |
| **Release · feature** | R2 · AU-03 (part 2) · fixes DEF-08 |
| **Entry criteria** | A7 ✅ · capability matrix complete · BS-26/27 decided or defaulted |
| **Read in the spec** | §9 AU-03 capability table · §13.3 D-10 · §14 CMP-012…015 |
| **Backlog tasks** | A8.0 – A8.8 |
| **Open first** | `pages/MonsterBuilder.vue` L37–57 · `TraitsEditor.vue` (388) · `widgets/AttackPanel.vue` (586) · `MultiattackEditor.vue` (222) · `ReactionsEditor.vue` (152) · `LegendaryActionsEditor.vue` (243) · `MythicActionsEditor.vue` (150) · `LairActionsEditor.vue` (132) · `VillainActionsEditor.vue` |
| **Skills** | `code-refactoring:refactor-clean` · `superpowers:requesting-code-review` · `engineering:testing-strategy` · `ui-design:interaction-design` |
| **Research** | none beyond the matrix |
| **Traps** | Multiattack references by id survive reorder · legendary costs and pools live in different arrays · deleting components breaks imports elsewhere (grep before delete) · e2e steps that open removed panels |
| **Plan** | A8.0 matrix → A8.1 role headers → A8.2 attack role → A8.3 multiattack → A8.4 reaction/trait chips → A8.5 unmount + delete → A8.6 fixture diff → A8.7 e2e → A8.8 close |
| **Verify** | builder panel count ≤ 14 (DOM probe) · three saved monsters render byte-identical plates · every matrix row ticked |
| **Exit** | CMP-012…015, UX-006, COMP-002 proven; DEF-08 closed |
| **Defaults** | Villain actions stay a panel; CR annotation cards stay in the studio |
| **Next-loop prep** | List the numeric fields of the studio chips for A9's registry |

### 6.7 A9 · NumericBinding fields — 🟡

| | |
|---|---|
| **Goal** | Numeric fields bind to references or formulas through `FormulaField`; a resolver keeps values in sync |
| **Release · feature** | R3 · AU-02 · fixes DEF-09 |
| **Entry criteria** | A2 ✅ · BS-24/25 settled |
| **Read in the spec** | §9 AU-02 (W-06) · §6.2 · §7.4 · §8.1 · §8.5 · §13.1 R-04, R-06 · D-05, D-11 |
| **Backlog tasks** | A9.0 – A9.10 |
| **Open first** | `widgets/DynamicReferenceSelect.vue` (619) · `BasicsEditor.vue` L204, 305, 322, 927, 973, 1281 · `widgets/AttackPanel.vue` L52, 122, 135, 148, 161, 186, 213 · `core/domain/formula.ts` (`NumericBinding`, `resolveNumeric`, `describeBinding`) · `stores/monster-store.ts` · history store / `useHistoryShortcuts` |
| **Skills** | `engineering:architecture` · `documentation-generation:architecture-decision-records` (D-11) · `superpowers:test-driven-development` · `developer-essentials:error-handling-patterns` · `context7:docs` (QSelect) · `ui-design:accessibility-compliance` |
| **Research** | Pinia `$patch` + `$subscribe` ordering; how the history ledger detects changes (to flag resolver patches) |
| **Traps** | Resolver writing on every keystroke (equality check) · cycles · array paths by index break on reorder (use ids) · persisted payload size |
| **Plan** | A9.0 → A9.1 formula additions → A9.2 registry → A9.3 store → A9.4 history filter → A9.5 composable → A9.6 component → A9.7 migrate + delete old widget → A9.8 tests → A9.9 browser sequence → A9.10 close |
| **Verify** | `Bindings.test.ts` · §8.5 sequence in the browser (one undo step) · reload keeps bindings |
| **Exit** | BND-001…008, REF-001 (fields), REF-002 proven; DEF-09 closed |
| **Next-loop prep** | Formula-mode input element exposed for A10's completion |

### 6.8 A10 · Caret intellisense and macro menus — 🟡

| | |
|---|---|
| **Goal** | `{` opens the catalog at the caret with live values; toolbar menus come from the same catalog; the bottom strip is gone |
| **Release · feature** | R3 · AU-04 |
| **Entry criteria** | A9 ✅ · BS-21/28 checked |
| **Read in the spec** | §9 AU-04 (W-07) · §7.7 · §8.2 · §14 ITL-001…008 |
| **Backlog tasks** | A10.0 – A10.8 |
| **Open first** | `MonsterTextEditor.vue` (411: toolbar menus L20–160, `allIntellisenseTokens` L315) · `useTokens.ts` (251) · `ActionsEditor.vue` L408 · `formula.ts` `suggestFormulaRefs` |
| **Skills** | `ui-design:interaction-design` · `ui-design:accessibility-compliance` · `modern-web-guidance:modern-web-guidance` · `context7:docs` (QEditor) · `superpowers:test-driven-development` |
| **Research** | Range rect in contenteditable; textarea caret mirror; `execCommand('insertText')` support in Chromium |
| **Traps** | Focus stealing by the menu · caret lost after insert · IME composition events · menu clipped at the viewport bottom |
| **Plan** | A10.0 → A10.1 catalog → A10.2 composable → A10.3 menu → A10.4 editor → A10.5 toolbar → A10.6 formula mode → A10.7 remove strip → A10.8 close |
| **Verify** | type `{SPE` → three items with values; Enter inserts; Esc closes; narrow width; screen reader announcement |
| **Exit** | ITL-001…008 proven |

### 6.9 A11 · Binding sweep — 🟡

| | |
|---|---|
| **Goal** | Every remaining binding-capable numeric field accepts references and formulas |
| **Release · feature** | R3 · AU-02 |
| **Entry criteria** | A9 ✅ |
| **Read in the spec** | §9 AU-02 · §14 BND-009 |
| **Backlog tasks** | A11.0 – A11.4 |
| **Open first** | output of the A11.0 inventory script (77 numeric inputs) |
| **Skills** | `code-refactoring:refactor-clean` · `superpowers:verification-before-completion` |
| **Traps** | Some numbers are *derived* (read-only) — never bind them; slots tables are literal by nature |
| **Plan** | inventory → classify → register → migrate → audit + close |
| **Exit** | BND-009, BND-002 (global) proven |

### 6.10 A12 · Spellcasting authoring accuracy — 🟡

| | |
|---|---|
| **Goal** | Subclasses for every caster, persisted; honest counters; SRD subclass spells always prepared; complete cadence pickers |
| **Release · feature** | R4 · AU-05 · fixes DEF-06, DEF-07, BS-07 |
| **Entry criteria** | A4 ✅ · A9 ✅ · research BS-29/30 done |
| **Read in the spec** | §9 AU-05 (W-10, data governance) · §6.6 · §8.4 · §13.3 D-08, D-13 |
| **Backlog tasks** | A12.0 – A12.7 |
| **Open first** | `ClassCastingEditor.vue` (1 056: subclass L27–35, L256, `primarySubclass` L742, metrics `catch` L762, `spellOptionsByLevel` L593) · `AutoSyncSpellcasting.ts` (556: `SRD_SUBCLASSES_BY_CLASS` L273, `calculateSpellcastingMetrics`, multiclass) · `data/spells.json` · `components/spell/useSpellLevels.ts` |
| **Skills** | `anthropic-skills:ttrpg-gm-craft` · `superpowers:test-driven-development` · `documentation-generation:architecture-decision-records` (D-13) · `developer-essentials:error-handling-patterns` · `design:ux-copy` |
| **Research** | SRD 5.2.1 class tables and subclass spell lists; 2014 values for ruleset variants (§4.1 sources) |
| **Traps** | Licensing: only SRD content curated · granted spells must not count · removing a subclass must not silently delete authored spells · multiclass slot math unchanged unless researched |
| **Plan** | A12.0 research + BS-07 repro → A12.1 catalogs → A12.2 metrics → A12.3 persistence → A12.4 editor → A12.5 candidates → A12.6 metamagic by ruleset → A12.7 close |
| **Verify** | reload keeps subclass · Fiend Patron fixture adds its spells with badges · counters show over-limit · forced metric failure shows "limit unavailable" |
| **Exit** | SPELL-001…008 proven |

### 6.11 A13 · Interaction kit — 🟡

| | |
|---|---|
| **Goal** | `CatalogSelect`, `HelpTip`, `v-help`, delegated host, help dictionary, coverage and fit audits |
| **Release · feature** | R5 · UX-01, UX-02 |
| **Entry criteria** | A9 ✅ (FormulaField anatomy) · Q-1 ordinal ordering answered or defaulted |
| **Read in the spec** | §9 UX-01, UX-02, UX-03 · §4.3–4.7 · §6.7 · §14 SEL, TIP, QA-005 |
| **Backlog tasks** | A13.0 – A13.7 |
| **Open first** | three representative selects in `BasicsEditor.vue`, `ClassCastingEditor.vue`, `SkillsEditor.vue` · existing `q-tooltip` usages · `css/statblock-grammar.scss` `.q-tooltip.dnd-tip` |
| **Skills** | `ui-design:design-system-patterns` · `frontend-design` · `impeccable:impeccable` · `ui-design:accessibility-compliance` · `design:ux-copy` · `avoid-ai-writing:avoid-ai-writing` · `context7:docs` |
| **Traps** | Directive cost at scale (BS-32) · headers selectable by keyboard (must be skipped) · tooltips hiding errors |
| **Plan** | inventory → CatalogSelect → catalogs → HelpTip/directive/host → dictionary → audits → close |
| **Exit** | SEL-002…008, TIP-002…005, TIP-007, QA-005 proven |

### 6.12 A14 · Sweep 1 — Basics — 🟡

| | |
|---|---|
| **Goal** | Split `BasicsEditor.vue` into six panels, adopt the kit, 100 % tips, zero overflow |
| **Release · feature** | R5 · UX-01…03 |
| **Entry criteria** | A13 ✅ |
| **Read in the spec** | §9 UX-01…03 · §12.4 debt targets · §13.1 R-13 |
| **Backlog tasks** | A14.1 – A14.6 |
| **Open first** | `BasicsEditor.vue` (4 445 LOC) — map its sections before moving |
| **Skills** | `code-refactoring:refactor-clean` · `superpowers:requesting-code-review` · `ui-design:responsive-design` · `design:accessibility-review` |
| **Traps** | Moves and behaviour changes in the same commit (forbidden: move first, then adopt the kit) · shared local state across sections |
| **Exit** | SEL-001, TIP-001, FIT-001…003 proven for Basics |

### 6.13 A15 · Sweep 2 — casting, checks, senses, defenses — 🟡

| | |
|---|---|
| **Goal** | The rules-heavy panels adopt the kit, tips and fit |
| **Release · feature** | R5 · UX-01…03 |
| **Entry criteria** | A13 ✅ · A12 ✅ |
| **Backlog tasks** | A15.1 – A15.7 (A15.7 done; Step 25 verifies no redundant Skills row) |
| **Open first** | `ClassCastingEditor.vue`, `SpellcastingEditor.vue`, `AtWillCastingEditor.vue`, `SkillsEditor.vue`, `SavesEditor.vue`, `SensesEditor.vue`, `SpeedsEditor.vue`, `ResistancesEditor.vue`, `InventoryEditor.vue` |
| **Skills** | `ui-design:responsive-design` · `design:ux-copy` · `design:accessibility-review` |
| **Exit** | SEL-001, TIP-001, FIT-001…003 proven for these panels |

### 6.14 A16 · Sweep 3 — studio, A4, toolbar, CSS cleanup — 🟡

| | |
|---|---|
| **Goal** | Last surfaces adopt the kit; legacy statblock CSS removed; app-wide audits green |
| **Release · feature** | R5 · UX-01…03 · fixes DEF-10, DEF-11 |
| **Entry criteria** | A13 ✅ · A8 ✅ |
| **Backlog tasks** | A16.1 – A16.7 |
| **Open first** | Actions Studio + composer · `A4LayerStudio.vue` (1 416) · `MainLayout.vue` (378) · `css/app.scss` blocks: `.action-composite-*` (L804–905, L1354–1366), `.zebra-stripe-text` (L1104), cascade blocks |
| **Skills** | `code-refactoring:tech-debt` · `skill-forge-essentials:ai-debt-detector` · `impeccable:impeccable` · `design:accessibility-review` |
| **Traps** | CSS still used by the classic template or exports (grep markup before deleting) |
| **Exit** | SEL-001, TIP-001, FIT-001…005 app-wide; DEF-10, DEF-11 closed; `!important` < 200 |

### 6.15 A17 · Hardening and release — 🟡

| | |
|---|---|
| **Goal** | Prove everything once more, write only proven claims, tag the overhaul |
| **Release · feature** | R6 · QA-01 · fixes DEF-13, DEF-14 |
| **Entry criteria** | A4…A16 ✅ |
| **Read in the spec** | §9 QA-01 · §15 · §11.4 · §13.2 BS-03, 15, 36, 37 |
| **Backlog tasks** | A17.1 – A17.9 |
| **Open first** | `test/exhaustive-ui-fuzz.js` (2 416) · `README.md` · `STACK_STATE.md` · QA helpers in `%TEMP%` |
| **Skills** | `developer-essentials:e2e-testing-patterns` · `engineering:testing-strategy` · `superpowers:verification-before-completion` · `avoid-ai-writing:avoid-ai-writing` |
| **Exit** | QA-001…006, SBG-005 (12 selectable themes), NFR-001 (Track A) proven; tag `v2.5.0-statblock` |

---

### 6.16 Track B cards — 🔵 specified (re-arm at each pre-flight)

Every Track B card inherits the protocol of §1 and the v1 package notes; the rows below are what a fresh session needs to start.

| Loop | Goal | Read in the spec | Open first | Skills | Key traps | Exit |
|---|---|---|---|---|---|---|
| **B1** Identity & revision | Envelope with immutable id and monotonic revision around the current store | §10 F-00 · §6.8 · D-11 | `core/domain/types.ts` · `components/models.ts` · `MigrateMonsterSchema.ts` · history store · stores holding monster copies (BS-38) | `engineering:architecture` · `backend-development:architecture-patterns` · `documentation-generation:architecture-decision-records` · `superpowers:test-driven-development` | No schema bump without D-record; resolver patches excluded from revisions | DOM-002, DOM-003 (contract), DATA-001 |
| **B2** Checks & safe repair | Navigable, honest, undoable checks incl. Track A families | §10 F-05 · §8 (states) | `LintMonster.ts` · `MonsterLintDialog.vue` · `CrFooter.vue` · section/field targets | `design:ux-copy` · `design:accessibility-review` · `superpowers:test-driven-development` | "fixable" only when an operation exists; stale results never shown as current | UX-003, DOM-001, DOM-003 |
| **B3** CR tuner | Preview-first, selective, one-undo tuning | §10 F-06 | `AutoTuneCr.ts` · `AutoTuneDialog.vue` · `CalculateCr.ts` | `anthropic-skills:ttrpg-gm-craft` · `superpowers:test-driven-development` | Prefer tuning sources when fields are bound | DOM-001, DOM-003 |
| **B4** Exports | Capability report and preview for each target | §10 F-08 · AU-01 `text2024` | `ExportStatblock.ts` · `DownloadButton.vue` · renderer adapters | `engineering:testing-strategy` · `design:ux-copy` | Plates need grammar CSS in HTML/PNG (BS-11); Skills line (BS-13); Spellcasting placement (D-02) | DATA-002, SEC-001, COMP-001…002 |
| **B5** Repository & recovery | One startup-selected backend, truthful save, verified migration | §10 F-07 | `StoragePort.ts` · `LocalStorageAdapter.ts` · `IndexedDbStorageAdapter.ts` · Pinia persistence | `backend-development:architecture-patterns` · `developer-essentials:error-handling-patterns` · `documentation-generation:architecture-decision-records` | Never silent per-operation failover; keep sources until verified | DATA-001, DATA-003, NFR-003, SEC-002, ARC-002 |
| **B6** Library | Find/open/duplicate/rename/delete by id | §10 F-02 | repository from B5 · router/drawer | `ui-design:responsive-design` · `design:accessibility-review` | Duplicate must remap bindings and nested ids | DOM-002, UX-004 |
| **B7** Workspace | Toolbar groups, section strip, narrow tabs, presets | §10 F-01/F-03/F-12 · W-01, W-02 | `MainLayout.vue` · `MonsterBuilder.vue` · `editor-store.ts` | `ui-design:responsive-design` · `ui-design:interaction-design` · `design:accessibility-review` | Presets must not touch mechanics | UX-001, UX-002, UX-005, NFR-004 |
| **B8** Provenance | Explicit/unknown ruleset; ruleset-aware catalogs | §10 F-09 · D-08 | envelope from B1 · catalogs with `ruleset` | `anthropic-skills:ttrpg-gm-craft` · `engineering:architecture` | Style switch is not a rules switch | DOM-004 |
| **B9** Combat | Stable combatant ids, snapshots | §10 F-10 | `CombatTracker.ts` · `combat-store.ts` · `CombatTrackerDrawer.vue` | `superpowers:test-driven-development` | Active actor removal policy; legacy index migration | DOM-005 |
| **B10** Character & docs | Honest character values; final documentation from evidence | §10 F-11 · QA-01 | `CharacterSheet.vue` · `character-store.ts` · `README.md` · `STACK_STATE.md` | `design:ux-copy` · `avoid-ai-writing:avoid-ai-writing` | Claims only from release evidence | DOM-006, PRD-002…003, REL-002 |

---

## 7. Stop and escalate

📍 *Handoffs › 7 Stop* — **Stop the affected task — not the whole loop — and write down exactly what would unblock it.**

| Condition | Action |
|---|---|
| A change would alter saved data shape without a decision record | Stop; draft the D-record with migration and fixtures; ask the owner |
| A rules fact lacks a cited source | Label it custom/owner variant or stop the task; add a research row |
| The working tree contains changes you did not make | Do not reset or overwrite; inspect, record, ask |
| A probe contradicts a passing unit test | Treat the probe as truth; `superpowers:systematic-debugging`; add a failing test first |
| A loop needs a later loop to be useful | Split it; ship the independent slice (G-6) |
| The device bridge is unstable | Commit at the last green state; write the packet; resume from §8 |

---

## 8. Session hand-over note

📍 *Handoffs › 8 Hand-over* — **If you are a new session, start here.**

1. **State** — `statblock-overhaul`; code `7f2e572`, tag `rc-2.4.3-build-144-a7-trait-chain`; latest origin `http://localhost:9106/index.html#/`, exact candidate also at 9107. Preserved 143 is at 9108, 142 at 9105, protected 139 at 9100. Core 159/159; build, changed-file lint, 37 browser steps with zero errors, five-theme spellcasting and twelve-theme help/contrast pass. Six roles integrated; A7 remains open. Status: 67/193 done, 2 active, 124 pending.
2. **What exists** — A0–A6 shipped. Build 137 adds the pure `ACTION_TEMPLATES` catalog, grouped picker, explicit replacement warning, cancel/apply flow, and template field ownership rules. The temporary Soul Barrage browser fixture is changed only in an isolated test browser; the user's configured monster/sample data is untouched.
3. **What to do next** — Continue A7.7b/A7.8 using §6.5 and its closure packet. Preserve four `MonsterAction` routes plus reaction/trait adapters. Retain lair/context and section headers; prove all-role order, field/conversion preservation and persistence. Retain Steps 34–37 and live-space/popup/CR-inclusion regressions. Keep BS-39 normal/long range explicit; A8 retirement and A9 provenance stay downstream.
4. **Where truth lives** — Versioned canonical files are `docs/roadmap/`; `outputs/` is the evaluation mirror. Spec defines intent/contracts, backlog defines order/status, handoffs define preparation/evidence. Synchronize all three and verify mirrored hashes before closing a slice.
5. **House rules** — local-only work; short lowercase commit messages; no AI-attribution trailers; one outcome per loop; prove before you tick.


## Build 145 — section context and lair integration contract

This release completes adapter integration, not the A7 acceptance matrix. Use this section with the companion backlog task A7.7b and handoff preparation below.

| User workflow | Owner / function | Contract and alternatives |
|---|---|---|
| Read/edit a lair entry | `ComposerChain.vue`, `lairChainView`, existing description editor | Readonly “Lair Action” identity; persisted `LairAction` keeps ID/prose/CR only. Rejected alternative: fabricate a name/action schema that would break old data. |
| Edit legendary economy | `RoleHeaderEditor.vue` → `roleHeaderDraft/validateRoleHeader/roleHeaderPatch` | Whole pool 0–99; custom switch and preamble. Defaults remain defaults; no per-entry duplication. |
| Edit mythic context | Same section editor, mythic descriptor | Trait name/recharge/trigger description and preamble; optional prose stays optional. Existing action IDs/costs retained. |
| Edit lair context | Same section editor, lair descriptor | Whole initiative 0–40, default 20; preserve other initiative settings. `{LAIR_INITIATIVE}` drives default preamble, including 0. Custom text is never rewritten to match initiative. |
| Apply or cancel | Local primitive draft → validation → current-store patch | Invalid numbers disable Apply. Cancel writes nothing. Apply spreads current collections/configuration, retaining intervening membership changes. Old panels remain during A7; A8 must retire duplicates only after capability parity. |
| Preview/export | `processLairAction(context, monster, web=false)` | WebRenderer and composer explicitly opt into modern cards; classic and text projections retain processed prose. HTML export leakage found in review was removed before promotion; exhaustive export-format verification remains a named closeout gate. |
| Work at narrow widths | `MonsterBuilder.vue` scoped screen styles | At ≤599px, editor and preview stack; desktop splitter remains. Browser checks use 375px; print rules unaffected. |

```mermaid
sequenceDiagram
  actor Author
  participant UI as RoleHeaderEditor
  participant Core as role-headers pure functions
  participant Store as Existing Pinia monster
  participant View as Preview and sheet
  Author->>UI: Expand section
  UI->>Core: roleHeaderDraft(current monster)
  Core-->>UI: Primitive isolated draft
  Author->>UI: Edit fields
  UI->>Core: validateRoleHeader(role, draft)
  alt Invalid
    Core-->>UI: Visible error; Apply disabled
  else Apply
    UI->>Core: roleHeaderPatch(current monster, role, draft)
    Core-->>UI: Patch preserving current memberships/config
    UI->>Store: Apply patch through existing persistence
    Store-->>View: Recompute tokens and sanitized rendering
  else Cancel
    UI-->>Author: Close without store mutation
  end
```

### Prepared continuation: A7.7b, then A7.8

1. Inventory every actual field in all seven source models and conversion factories; map each to editor, renderer, export and persistence ownership. Include IDs, role arrays, costs, CR inclusion/manual overrides, recharge/stage data, trait grouping and legacy values.
2. Build table-driven conversion cases for every allowed source/destination. Explicitly preserve or disclose incompatible data; do not silently discard fields. Retain source objects and stable references where the workflow requires them.
3. Exercise normalized old-save fixtures, unchanged save/reload, reorder, role movement, deletion and keyboard paths. Add format-level Markdown/Homebrewery/LaTeX lair export cases; source review alone is insufficient export proof.
4. Retain core and browser Steps 35–38; verify default/custom initiative semantics, Apply/Cancel, membership preservation and real narrow layout. Check stacking also in character mode and with maximum-width stat blocks before calling responsive coverage comprehensive.
5. Before A7.8, reconcile evidence against CMP-009…011. If any field lacks a verified home, keep A7 open. A8 removal follows verified capability parity; A9 provenance remains downstream.

Preparation: load executing-plans, verification-before-completion, relevant model/functional-core guidance, code review and UX-copy skills; read this contract, A7 ownership map, the conversion factory call sites, and current handoff. Research external APIs only if this slice introduces one. Close with measured diff, exact code/tag/archive, test boundaries, preservation evidence and synchronized status in all three documents. Never claim infinite scalability, zero defects or future-proofing as an established property.

### Build 145 closing packet — A7 stays active

- Base `a716973` → code `d70cc01`; tag `rc-2.4.3-build-145-a7-role-context`. 13 files, +347/−18.
- Completed A7.3. Current audit: 68 done, 1 active (A7.7b), 124 pending, 7/28 loops shipped. A7.8 and A8 remain gated.
- Production build passed; core 165/165; final browser Steps 1–38 passed with zero runtime/console errors; lair header form 313px width/313px scroll width at 375px viewport; reload and memberships preserved. Theme smoke: five spellcasting, twelve help. Source review verified web-only lair markup and scoped mobile selectors. Export-format runtime proof and full character/mobile coverage remain explicit boundaries.
- Review found modern lair HTML leaking into text projections: fixed with explicit web opt-in. Narrow check exposed fixed preview width squeezing editor: fixed with screen-only stacking below 600px. Browser fixture now opens the studio after reload and re-focuses the trait chip after viewport-induced scroll before keyboard activation.
- Candidate archive has 98 verified hashes. Build 144 archive remains unchanged with its 98 hashes verified. Latest 9106 serves frozen 145 on IPv4/IPv6, exact 145 at 9109, previous 144 at 9107. Existing browser storage on 9106 is retained; isolated test profiles never overwrite it.
- Next bounded packet is the field/conversion/export matrix in A7.7b. Capture incompatibilities before conversion, close them without silent data loss, and only then perform A7.8 and prepare A8 panel retirement. Do not add schema migrations or remove legacy editors opportunistically.
