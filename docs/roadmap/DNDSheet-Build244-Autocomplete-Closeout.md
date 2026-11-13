# Build 244 — Autocomplete close-out

This build closes the A10 completion family left open after Build 243.

| Item | Result |
|---|---|
| A10.3 | Every suggestion list (plain field, rich editor, custom formula) is a listbox with option ids. The owning input or contenteditable carries `aria-haspopup`, `aria-autocomplete`, `aria-expanded`, `aria-controls` and `aria-activedescendant` (`comboboxAria.ts`). The rich popup flips above the caret near the bottom of the viewport. |
| A10.6 | A `FormulaField` custom formula completes the identifier at the caret (`openIdentifierAt`) with the references that field accepts (`formulaReferences` + `isReferenceAllowedForField`), inserted bare: `PB + STR_M` → `PB + STR_MOD`. Arrow keys, Enter, Tab and Esc work; Enter applies the formula when no list is open. |
| A10.8 | `test/core/FormulaCompletion.test.ts`, plus `test/macro-autocomplete-browser-smoke.mjs` in the gate, which covers plain fields (suggest, keyboard insert, preview, combobox state), rich editors (caret suggest, Enter without a new line) and custom formulas (a trusted CDP click opens the select, then completion, inserted bare). |

The smoke uses a real CDP mouse event because Quasar does not open a select from a script click. It uses the AC field because ability scores correctly refuse ability-modifier references, which would be circular.
