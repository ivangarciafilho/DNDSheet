# DNDSheet Build 252 — Track C close-outs: paired range, gate parity, version

Base `916bfd2` (Build 251). Adopts the uncommitted Track C edits left in the main checkout (reviewed; owner approved adoption) and finishes what they started.

## Delivered

| ID | Change |
|---|---|
| BS-39 | `RangeSpec.longDistance` (optional, additive — no schema migration). Composer **Long** field beside Distance, hidden for reach. Legacy text `range 80/320 ft.` parses into the pair. Plate, scope and `text2024` print `80/320 ft.` for ranged; reach never pairs. Numeric field registry covers `targeting.range.longDistance` for actions, traits and reactions. |
| C9 | `package.json` / lock `2.5.0` (matches `v2.5.0-statblock`); footer reads it. `tools/publish.mjs` derives the RC tag prefix from `package.json` instead of a hard-coded `2.4.3`. Architecture spec statuses for shipped R2–R10, A8–B10, SB/AU/UX/QA and BS rows set from the build ledger (adopted). |
| C10 (partial) | Improved Initiative export reads `initiativeConfig.advantage`. Stale TODOs removed where the code already did the work (Open5e legendary actions, template search filter, changelog target). Typed storage adapters and `migrateMonsterSchema(raw: unknown)` remove 4 `any` sites (adopted). |
| C12 | `test/gate.mjs` runs one `BROWSER_SUITE` for both SPA (`help`) and Pages (`pages-fuzz`): Pages gains outcome-lifecycle, statblock-help, release-matrix and overflow probes; SPA gains macro-autocomplete and formatting smokes. Seven unreferenced legacy scripts removed from `test/` (`capture-candidate180..182`, `capture-candidate181-layers`, `verify-candidate182-dom`, `debug-statblock`, `test-clip`). |

## Tests

`test/core/AbilityGrammar.test.ts` +4 BS-39 cases (adopted rangePhrase case; legacy parse and reach-never-pairs written red first, then green).

## Not covered / still open

- C10 remainder: `spells-store.ts:123` custom spell location, `monster-store.ts:672/720`, `useAutoUpdateCr.ts:44`, `useProcessTokens.ts:358` are design notes, not defects; tracked under C5 (i18n) and C1b.
- Long range is not validated against normal range (a long smaller than normal prints as authored).
- C1a, C1b, C2, C3, C4, C5, C6, C8, C11 untouched in this build.
