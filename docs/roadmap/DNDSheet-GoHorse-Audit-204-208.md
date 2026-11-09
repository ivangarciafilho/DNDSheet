# Build 204–208 audit — what the no-tests sprint left behind

Builds 204–208 were landed in **no-tests mode** at the owner's request: no gate, no typecheck, no browser checks. Each build only had to pass a production `quasar build` (Vite + esbuild), which **does not type-check**. This file lists the debt honestly so the next agent goes back to safe mode first.

## Evidence ledger

| Build | Commit | Tag | What landed | Proven by | Not proven |
|---|---|---|---|---|---|
| 204 | `7cd71fb` | `rc-2.4.3-build-204-help-tips-sweep` | 250 auto-written `v-help` tips in 12 editors; help floor 40 → 70 | SPA build, `audit:help` 72.6 % | gate, typecheck, tip wording, the tips render |
| 205 | `176bb69` | `rc-2.4.3-build-205-random-tables` | `core/domain/random-table.ts` | build (module had no importer) | everything |
| 206 | `d37dc50` | `rc-2.4.3-build-206-random-tables-editor` | `RandomTablesEditor.vue`, statblock section, Homebrewery export, `Monster.randomTables?` | SPA + Pages build | runtime, save/reload, undo, import/export JSON, print |
| 207 | `c76b077` | `rc-2.4.3-build-207-outcome-clauses` | `AbilityOutcome.id/recipient/refs/presentation`, `core/domain/outcome-graph.ts`, ChainOutcomesEditor fields | SPA + Pages build | runtime, goldens, typecheck |
| 208 | `d2c418e` | `rc-2.4.3-build-208-outcome-render` | grammar projection + `outcomePhrase` + sector HTML carry the new fields; `.outcome-vertical/horizontal` CSS | SPA + Pages build | goldens (Step 51 likely affected), print, 12 themes |

gh-pages: `7cd71fb` publish was **empty for minutes** (only `.nojekyll`) — fixed by `2d72f58`. Later publishes `82a9045`, `e37847a`, `d35c659`.

## Critique, ranked by risk

### Critical — fix before any new feature
1. **Typecheck never ran.** `ability-grammar.ts` adds `id/recipient/refs/presentation` to the outcome projection, and `useProcessTokens.ts` reads `o.presentation`, `o.recipient`, `o.refs` — the projection type almost certainly does not declare them. `RandomTablesEditor.vue` casts the store through `unknown`, and the WebRenderer template uses `(monster as any)`. Expect `vue-tsc` errors.
2. **Goldens probably drift.** `outcomePhrase` now `unshift`s the recipient and appends “(builds on …)”. Nothing current uses those fields, so goldens should hold, but the **order is wrong by design**: the recipient lands *before* the effects but *after* the trigger is formatted elsewhere, which can yield `On a hit: Each creature in the area: 2d6 fire damage.` (double colon). It needs a phrase-level design, not a string push.
3. **HTML injection surface.** The sector HTML in `useProcessTokens.ts` interpolates `o.recipient` and the referenced triggers straight into a `v-html` string. Check that `sanitizeWebString` runs on this path; otherwise escape.
4. **`randomTables` is not part of the store schema.** It is created lazily **inside a computed** (a side effect in a getter) and is not in the defaults, the migration chain, JSON import/export, undo snapshots, or the database studio. Data may survive persisted-state, but nothing guarantees it.
5. **The publish pipeline has no guard.** Pages output is `dist-pages/` (root, not `spa/`); a wrong `--work-tree` silently shipped an empty site. The RC script (`tools/make-rc.mjs`) failed for 204 and was skipped for 205–208, so **no RC folders exist after 203** and port 9106 still serves RC203.

### High
6. **The 250 tips are placeholders.** They were generated from labels with a fixed template (“Enter save dc for the actions editor.”, “Turn on or off … for the basics editor.”). They pass the coverage metric but fail the A16 intent of explaining *why*. Raising the floor to 70 % now **locks placeholders in**. The script also broke 8 compound tags (`q-btn-dropdown`, `q-btn-toggle` and similar); they were repaired by a second regex — re-verify that those 8 render.
7. **New UI is English-only.** RandomTablesEditor, the outcome fields and the statblock “otherwise”/“Result”/“builds on” strings bypass i18n.
8. **`v-model.number` on From/To** can store `''` or `NaN` when cleared; `diagnoseTable` then compares NaN silently.
9. **Statblock placement and print.** Random tables always render before Regional Effects, with inline styles and no theme, print or A4-layer integration (A4 layer studio does not know the section).
10. **Outcome editor cost.** `issuesFor` runs `validateOutcomes` over all clauses for each clause on every render (O(n²)), and the “Builds on” labels are ambiguous when two clauses share a trigger (two “On a hit”).

### Medium
11. `newOutcomeId` / table `uid` use time + random: fine for uniqueness, but ids change on duplicate/clone paths that copy outcomes without ids — duplication should regenerate them deliberately.
12. `parseLegacyTable` exists but nothing calls it — the A11.9 migration is not wired.
13. `outcomeProse` in `outcome-graph.ts` duplicates `outcomePhrase`; keep one owner.
14. Layout `vertical/horizontal` only affects the sector path (`hasSectors`); clauses without sectors ignore it.
15. About 163 stray `node` processes were alive on the build machine.

## What went right
- Every build passed the SPA build before it was pushed; the one broken publish was caught and fixed in the same turn.
- Domain logic (`random-table.ts`, `outcome-graph.ts`) is pure and side-effect free — easy to test now.
- No AI-attribution trailers; commit subjects follow the `feat:`/`fix:`/`docs:` shape.

## Return to safe mode — first session checklist
1. `npm run gate` on `d2c418e` and record every red step verbatim.
2. `npx vue-tsc --noEmit` and fix the type holes from items 1 and 4.
3. Re-run Step 51 goldens; if they drift, fix the phrase (item 2) instead of regenerating.
4. Repair `make-rc.mjs` invocation, create RC 208, point 9106 at it.
5. Only then pick up H-items below, in order.

## Follow-up — Build209 findings the audit missed

- **The worst defect was not on the list.** Build208's `outcomePhrase` edit was written through a PowerShell double-quoted string, so `${outcome.recipient...}` and `${refLeads...}` were expanded to empty strings. Every outcome with a recipient printed a bare `:` and every reference printed “builds on the  result”. The build still passed because the result is valid TypeScript. Caught by the new `OutcomeClauses` tests (4 of 6 fail on Build208).
- **Reset leak.** Without a store default, Pinia's `$reset` patches over the old state and keeps keys the fresh state lacks, so a new monster could inherit the previous monster's random tables. Fixed by adding the default.
- **A real gate regression.** Fuzz Step 49 asserts exactly 14 editor panels; the Random Tables panel made 15. The no-tests builds could not see it.
- **Not a regression.** vue-tsc's 682 errors are identical per file to Build203; the go-horse code added none.
- **Normaliser edge case found by test:** `Number(null)` is 0, so a missing `max` became 0; empty values now fall back.
