# Build 243 — Unified text field: closure

This build closes H24 by finishing the three items Build 242 left open.

## Delivered

| Item | Result |
|---|---|
| Caret autocomplete in rich text | `useRichMacroAutocomplete` reads the text node at the caret in any QEditor and offers scoped suggestions at the caret rectangle. The list flips above the caret near the bottom of the viewport. Arrow keys, Enter, Tab and Esc work, and the editor's own Enter is suppressed while the list is open. Insertion goes through `execCommand('insertText')`, so undo and the model update behave normally. It is active in rich-mode fields and in every description editor. |
| Export resolution | `ResolveMonsterText.ts` resolves each field value, never the finished output, because LaTeX and JSON use braces of their own. Markdown, plain text, HTML and Foundry exports start from a resolved copy. The Homebrewery, LaTeX, Tarrasque, Improved Initiative and Markdown renderers read through a read-only resolving view of the store. Variable and macro definitions, bindings and ids are never resolved. Context tokens survive for the per-entry pass. Native JSON saves stay raw. |
| Character fields | A `character` scope offers ability, proficiency, save DC, attack, hit point, AC and spellcasting references; monster-only data such as CR, XP, legendary budget and saves table is excluded. Armor Class and Speed notes, spell notes and feature descriptions use the standard field. The sheet prints them formatted and resolved, and character Markdown and text exports resolve them. |

## Evidence

- `test/core/ResolveMonsterText.test.ts` (6 tests) covers: authored values with variables while context tokens are kept; a resolved copy that keeps definitions; a live view that resolves reads and refuses writes; Markdown export; character resolution and export; and the character scope. Core: 612 tests pass. Typecheck: 505 diagnostics, 0 new.
- Headless browser on the built SPA:
  - Description editor: `DC {dc:c` offered Constitution and Charisma save DC at the caret, and Enter inserted `{DC:CON}` without adding a line.
  - Rich-mode field: `aura {spell_d` offered Spell save DC, and Tab inserted it. The preview read "Prints: aura 10".

## Workload

H24, A10.1, A10.2, A10.4 and A10.5 are closed. A10.3 stays open: the ARIA combobox wiring (`aria-activedescendant`) is not implemented. A10.6 (formula-mode completion in `FormulaField`) and A10.8 (the close-out item) also stay open.
