> Historical recovery record from `a13-9-sheet-density`. Superseded by the current Development Handoffs and Implementation Backlog; not a current release claim.

# DNDSheet — Build164 Number Typography Packet

Parked slice (not on `statblock-overhaul`; Codex's Build162 work is uncommitted in that tree).
Branch `a13-9-sheet-density`, stacked on Build163 (`922d6fc`, packet `db7be42`).
Tag and release candidate: `rc-2.4.3-build-164-number-typography`.

## What shipped (A13.9, second slice)
- AC, HP, bloodied value, paragon phase HP and pool counts now use the one number role `.dnd-num` (`numHtml`), the same grammar as skills, saves and initiative.
- The legacy `.pill-number` role is deleted from renderers (`useTextRenderer.ts`, `defense-and-traits-utils.ts`) and from `app.scss` (global rule, bloodied badge and adv/disadv entry overrides). Its 1.06em size bump and `!important` weight are gone: a number inherits its host's font family and size.
- Pool counts render as numbers plus plain words ("3 Pools of 120 HP") instead of one bold phrase.
- The bloodied value keeps its red through `.dnd-num.text-red-7`; the badge colors only the number.

## Evidence
| Check | Result |
|---|---|
| Core tests | 327 / 327 (one export assertion added) |
| Lint | 0 errors; 77 warnings = 65 baseline + 12 in `defense-and-traits-utils.ts`, which Build163 did not lint |
| Browser fuzz | 52 steps pass; new Step 52 audits font family and size of AC/HP numbers across 4 themes x 2 templates |
| Help, spell-plate, bindings smokes | pass |

## Not covered
- Step 52 audits one matched number per layout (8 in total); phase and pool numbers appear only for paragon creatures and are not asserted.
- Heading, metadata and prose roles, per-theme line-height, export divider proof and print proofs remain in A13.9.
- No pixel comparison against Build163; only computed-style assertions.
- Fuzz Step 35 failed once ("missing sheet entry", fixture a6-soul-barrage, dwarves_forge) in 1 of 2 runs of the final build and passed in the 3 other runs; treated as a timing flake in the plate lookup, not investigated.

## Traps
- A fuzz step placed after `ws.close()` never runs and the harness still exits 0. Place new steps before the shutdown block and check the log for the "ALL NN STEPS" line.
- Never `Stop-Process -Name node`: it kills Codex's evaluator server. Select by command line.

## Integration recipe
Cherry-pick `922d6fc`, then the Build164 commit; resolve `build.json` and `exhaustive-ui-fuzz.js` by keeping both sides; rerun core, lint, fuzz and smokes; fold this packet into Backlog, Handoffs and Spec; delete it.