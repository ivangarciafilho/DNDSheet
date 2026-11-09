> Historical recovery record from `a13-9-sheet-density`. Superseded by the current Development Handoffs and Implementation Backlog; not a current release claim.

# DNDSheet — Build163 Sheet Density Packet

> **Parked slice, ready to integrate.** Lives on branch `a13-9-sheet-density` (feature commit `922d6fc`, tag `rc-2.4.3-build-163-sheet-density`) cut from `1869921` (Build161, live numeric bindings). It is deliberately **not** on `statblock-overhaul`: when it was verified, Codex's working tree carried uncommitted Build162 work (`build.json` = 162), and merging a render change into that tree mid-loop would have broken its fixture-parity proof. Build162 stays reserved for that loop; git order is therefore 161 → 163 → 162.

| | |
|---|---|
| **Version** | Build163 - sheet density - `rc-2.4.3-build-163-sheet-density` - Build161 preserved |
| **Code** | `922d6fc` on `a13-9-sheet-density`, base `1869921`; 7 files, +115/-269 |
| **Evaluate** | `http://localhost:9100/` and `:9106` (frozen RC), `http://localhost:9124/candidate163/index.html#/` (same origin as the Codex evaluator, so the saved sample monster is kept) |
| **Roadmap** | No task closes. A13.9 is **partially delivered** (first slice); progress stays 95/219. CR154-13, CR154-14 and CR154-16 are delivered; the rest of A13.9 remains |

## What shipped

1. **Senses beside Languages (CR154-13).** Both rows sit directly under the ability scores, so telepathy and sense rules read together. One `data-help` anchor each; the Senses row is the Languages row's previous sibling in every style and template.
2. **Spacing-only region breaks (CR154-14).** The four `<hr />` between regions became `.sb-region-break` (a `0.45em` gap, no rule). Section headings and row plates already separate regions. Authored `hr` in prose and the export targets keep their native dividers.
3. **One rolled-value grammar for initiative (CR154-16).** The initiative pill is gone. Initiative is `<strong class="dnd-num">` plus the shared `advHtml` glyph (`▲▲` / `▼▼`), the same as passives and skills. The glyph is named for assistive tech (`role="img"`, `aria-label`) and prints as text where colour cannot carry the mode.
4. **Behaviour fix.** Advantage and Disadvantage now cancel on screen, matching the passive math. Before, the pill showed `▲▲` while the passive treated them as cancelling.
5. **Dead styling removed.** 168 lines of pill/badge CSS in `app.scss` and the matching scoped rules in `WebRenderer.vue` had no remaining consumer.

## Files

`src/components/rendering/WebRenderer.vue`, `useTextRenderer.ts`, `advFormat.ts`, `src/css/statblock-grammar.scss`, `src/css/app.scss`, `test/exhaustive-ui-fuzz.js` (Step 21 and Step 25 assertions rewritten; Step 21 now **throws** on failure instead of only logging; new Step 51), `build.json` (163).

## Evidence

| Check | Result |
|---|---|
| Core tests | 327/327, no tests added (render-only change) |
| Lint (4 touched files) | 0 errors, 65 warnings; identical multiset to the `1869921` baseline |
| Production build | green, 96 files |
| Full browser run | 51/51 steps, 0 runtime exceptions |
| Red before green | Steps 21, 25 and 51 fail against Build160 and pass here, including the accessibility glyph assertion |
| Theme smokes | help 12 themes, spell plate 5 themes pass |
| Fixture parity vs Build161 | 6 fixtures (Seraphic Herald snapshot, A7 witness, A8.6 edge witness, Knight, Archmage, Ancient Green Dragon) = 24 plates semantically identical with the A13.9 deltas normalised; reload round trips stable; reference integrity unchanged; 0 browser errors |
| Visual review | screen + print for wotc, printer and lovecraft_golden: no rules, Senses and Languages adjacent, initiative reads `+0 ▲▲`. Reviewed on the pre-rebase tree; the five rendering files are byte-identical between the two bases, and the rebased build was re-shot (see below) |
| Commit equals verified tree | `git archive 922d6fc` equals the verified tree file for file (352 files) |

**Not covered.** `bindings-browser-smoke.mjs` passed 3 of 4 clean runs here and 3 of 4 on the untouched Build161 (shared timing flake, two distinct failure messages in each). Spacing in the remaining nine themes was proven invisible by Step 51's rule check, not by eye. Self-review only; no independent reviewer pass.

## Traps

- Vue's production scoped-style hash (`data-v-*`) includes the SFC source, so byte parity is impossible after any `WebRenderer.vue` change. Parity must be **semantic**: normalise `data-v-*`, comment nodes (Vue `v-if` anchors travel with moved rows), region breaks, the Senses/Languages position, initiative cell text and glyph attributes.
- `git archive` with `core.autocrlf=true` yields CRLF trees; always `git -c core.autocrlf=false archive`. `useTextRenderer.ts` is LF in the index but CRLF in the working tree.
- A foreground shell call that times out **keeps its node/Chrome children alive**; they hold the CDP ports (9223, 9229, 9244) and make later runs fail at random. Launch browser runs detached and poll.
- `bindings-browser-smoke.mjs` writes `.codex-temp/rc161-bindings.png`; a clean verification tree needs that folder.
- The Build161 RC folder was built for the `/candidate161/` base; to serve it alone, wrap it in a folder named `candidate161`.
- `$env:TEMP` is `F:\temp` in the device shell. Use explicit paths.

## Integrating into `statblock-overhaul`

Do this when Codex's tree has no render-path edits in flight:

1. `git status` shows only Codex's own paths; `HEAD` is Codex's newest commit.
2. `git cherry-pick 922d6fc`. Only `test/exhaustive-ui-fuzz.js` and `build.json` can conflict: keep both sides (Step 51 goes after the last step) and set `build.json` above the highest build already used.
3. Re-run core tests, focused lint, the full browser run, both theme smokes and fixture parity against the newest RC with the A13.9 normaliser.
4. Fold this packet into the Backlog, Handoffs and Spec rows (CR154-13/14/16 and the CR-158 mapping), mark A13.9 active with the remaining list below, mirror the three documents with SHA checks, then delete this file.

## Remaining A13.9

1. Semantic typography roles: `pill-number` to `dnd-num` for AC, HP, bloodied and paragon values; heading, metadata and prose roles; per-theme line-height.
2. Export targets keep target-native dividers; add a proof that none gained a rule or lost one.
3. Classic/modern/12-theme/print and accessibility proofs for the typography roles, as in Step 51.
