# Build 266 — C1b round 1: domain and use-case modules split (11 → 5 files of 900+ lines)

Base `773a4fd` (Build 265).

## Mechanism (`split-module`, scratch tool, TypeScript AST)

1. Move a contiguous run of top-level statements, chosen by first and last declaration name, verbatim into a sibling module.
2. Work out the module's imports from the AST:
   - it imports what it uses from the original's own imports, keeping `type` modifiers;
   - it imports what it uses from the original itself;
   - the original re-exports the new module (`export * from './x.ts'`), so **no importer anywhere changes**, and imports back only what it still uses.
3. Specifiers carry the `.ts` extension, because core tests run under Node's `--experimental-strip-types`, which needs it.
4. A second AST pass (`prune-ts`) removes import specifiers left unused, by exact span.

| Module | Before | After | New modules |
|---|---|---|---|
| `types.ts` | 1,783 | 803 | `monster-defaults.ts` (factories), `ability-types.ts`, `encounter-types.ts` (all type-only, so no runtime cycle) |
| `species-and-heuristics.ts` | 2,765 | ~660 | `species-catalog-1/2/3.ts` (73 entries in catalog order, joined by spread; the parts import only the `SpeciesEntry` type) |
| `defense-and-traits-utils.ts` | 1,855 | 835 | `ac-and-defenses.ts`, `regen-and-invulnerability.ts` |
| `ExportStatblock.ts` | 1,558 | ~600 | `export-markdown.ts`, `export-html.ts` |
| `AutoSyncSpellcasting.ts` | 1,437 | ~710 | `spell-slot-tables.ts`, `spellcasting-metrics.ts` (both **leaf** modules: they import nothing back from the original) |
| `formula.ts` | 1,173 | 810 | `formula-parser.ts` |

Ratchet `filesOver900Lines` went 11 → 5 and is recorded.

## Traps found and disarmed

| Trap | Evidence | Disarm |
|---|---|---|
| **Module-init cycle (TDZ):** the first AutoSync split moved the later half, which reads original constants while its own module is initialising | 31 core tests: `Cannot access 'SRD_SUBCLASSES_BY_CLASS' / 'CLASS_DEFAULT_STAT' before initialization` | Rule: move the **earlier, dependency-free** block into a leaf module (`fromOrig` must be empty). The other splits only reference original *functions* at call time, which is safe in ESM and proven by tests |
| Moved code referenced original locals that weren't exported | typecheck TS2459 | The referenced declarations are now exported (and so reachable through the re-export) |
| A regex-based import pruner deleted an interface and the `export *` lines between imports | typecheck: `MonsterSenseItem` missing | Discarded. Everything was redone from backups and pruned with the AST tool, which edits exact spans only |
| Missing `.ts` extensions | core tests `ERR_MODULE_NOT_FOUND` | The tool now emits `.ts` |

Core 691/691, typecheck 0, ESLint 0/0, gate 11/11, visual 104/104 identical.

## Still over 900 lines (next loop)

- `monster-store.ts` (1,752): Pinia option-store getters and actions use `this` typing (65 and 148 uses), so moving them needs a typed setup-store pattern, not a verbatim move.
- `useProcessTokens.ts` (1,410) and `useBasicsContext.ts` (1,012): single closure composables, so they need sub-composables that are passed their dependencies (the Build 256 pattern).
- `app.scss` (1,295) and `statblock-grammar.scss` (1,107): split into partials in place, preserving cascade order (the Build 262 pattern).

**Limit of the evidence:** `export *` makes formerly module-private helpers importable. No importer was changed to use them.
