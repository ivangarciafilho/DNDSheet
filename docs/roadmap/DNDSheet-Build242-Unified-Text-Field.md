# Build 242 — Unified text field and macro catalog

First delivery of H24. It builds one text field and one catalog, then makes the printed text that uses them resolve on the stat block.

## Shape

| Layer | What it is |
|---|---|
| Catalog | `src/core/domain/macro-catalog.ts` is the single source for every insertable item: all formula references (`FORMULA_REFS`), monster, save and attack tokens, roll helpers, context tokens (trait, action, attack, spellcasting, legendary), prose snippets, and the monster's own variables and macros. `catalogFor({ scope, query })` filters by where the field lives and ranks typed matches. Context tokens and snippets are offered only to fields whose renderer resolves them. |
| Field | `MechanicTextEditor` is the standard field, registered globally (`boot/kit.ts`). It is plain text by default. Typing `{` opens ranked suggestions (arrow keys, Enter or Tab, Esc). The `{ }` button browses the scoped catalog by group, with live values. **Format** switches to rich text. A quiet line shows what the text prints, or warns about tokens it doesn't recognise. |
| Prose editor | `MonsterTextEditor` replaces its 8 hand-written token dropdowns with one **Insert** menu fed by the catalog, scoped by the entry type. It warns about unrecognised tokens. |
| Rendering | Stat-line rows (AC, HP, speed, senses, languages, defenses, skills, tools, inventory, initiative, CR line, grouped trait headings) resolve tokens through the same engine as prose. So do plate usage tags (custom recharge text, printed tag overrides). |

## Fields moved to the standard field (16)

AC type, lair CR note, at-will spellcasting notes, class spellcasting notes, multiattack postscript, printed tag override, recharge heading, conditional trigger, basic rider effect, custom recharge text, outcome recipient, and composer text cells. Together with the 55 fields already using the mechanic editor, every authored stat-line text now has formulas, suggestions and rich text.

## Deliberately left plain

Names and identifiers, URLs, colours, searches and filters, JSON and import boxes, layer names, variable keys and dice-only formula fields (these have their own evaluator). Rich text or macros there would print nothing, or would break the value.

## Also in this build

The type guard now sorts string-literal unions before comparing messages. TypeScript reorders those unions when unrelated types change, so an existing error was being reported as new.

## Evidence

- `test/core/MacroCatalog.test.ts` (5 tests) and one guard test. Core: 606 tests pass. Typecheck: 505 diagnostics, 0 new.
- In a browser on the built SPA: typing `natural armor {spe` offered Spell save DC; Arrow and Enter inserted `{SPELL_DC}`; the preview read "Prints: natural armor 10"; the stat block showed `AC 10 (natural armor 10)`. `{MYSTERY}` raised the warning. The browse menu lists groups and live values. Each description editor has one Insert button.

## Not covered

- Autocomplete on typing `{` works in plain mode. In rich mode and in description editors, insertion goes through the menu only: contenteditable caret tracking is not implemented.
- Markdown, Homebrewery, LaTeX, Tarrasque and Improved Initiative exports read some of these fields raw, so tokens there print unresolved. That belongs to the export contract (B4.2–B4.4).
- Character-sheet fields are untouched; their renderer has no monster context.
