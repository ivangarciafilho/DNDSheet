# DNDSheet — Build185 Baseline Capture and Repairs Packet

## Baseline
- Builds 162–184 (Codex, then Gemini) existed only as uncommitted files on `statblock-overhaul` (HEAD `1869921`). They are now committed as one baseline commit on branch `build185-repairs`, taken as final. Backup ref: `refs/backup/build184-wip`.
- Build artefacts under `.codex-temp` are not committed.
- `useProcessTokens.ts` was edited at 15:09 after RC184 was frozen at 15:06; the baseline includes that edit and is verified below.
- Release candidates 167–182 hold only `release-candidate.json` (no built app); only 183, 184 and now 185 are runnable.
- `a13-9-sheet-density` (Builds 163–166) is superseded and will not be merged.

## Repairs (Build185)
1. **Counted cadence doubled the count.** "(3/1/Day), Level 3" now reads "(1/Day), Level 3". New pure `spellLevelLead` in `spell-plate.ts`, test written failing first; the template's three-branch lead logic now calls it. Hidden keeps the baseline's "(N slots)"; At Will stands alone.
2. **Metamagic double punctuation.** Options ended ".,"; the trailing period of each effect is trimmed and options join with "; " and end with ".".
3. **Dark-theme vitals unreadable.** AC, HP, Speed, Senses, Languages and the skill-action rows used a hard-coded parchment ink (`#58180d`) on the eight dark themes, about 1.3:1 contrast. They now read each theme's `--sb-cell-ink` (16–18:1). Light themes are unchanged.
4. **Help tooltips lost their values on vitals.** Help tips end with "Values: …" built from plate cells only; Build170 vitals panels showed none. The lookup now also reads a panel's badges wrap.
5. **Stale browser checks.** The spell-plate smoke now asserts the Build181 unified spell frame plus guards for both defects; the help smoke now probes the Build170 vitals panels and measures contrast against the first painted ancestor, which is what exposed defect 3. The tooltip-follow check now moves the title's row (titles are forced-inline spans that ignore transforms) after centring it, so it measures repositioning instead of the viewport clamp; the detail line is asserted as "Values:", the baseline's wording.

## Evidence
| Check | Result |
|---|---|
| Core tests | 362 / 362 (one added) |
| Lint | 0 errors; 2,009 warnings = 2,006 in `src` + 3 pre-existing in the help smoke |
| Production build | passes |
| Browser fuzz | 50 / 50 |
| Spell-plate smoke | 5 themes, both defect guards |
| Help smoke | 12 themes, 4.5:1 contrast on the AC title and value, hover/focus, follow on scroll and resize |

## Not covered
- The 12-theme contrast probe checks the AC row only; other vitals share the same rule but are not each measured.
- Fuzz Step 49 failed once ("customTemplates" undefined) on CSS-only changes and passed on the other runs; recorded as a flake, not investigated.
- The Backlog dashboard still says 95/219 (Build161). Mapping Builds 162–184 to their tasks is the next documentation step.

## Process note
GPT is working in the live `statblock-overhaul` checkout. This branch was built in an exported copy and never touched that working tree or its index.