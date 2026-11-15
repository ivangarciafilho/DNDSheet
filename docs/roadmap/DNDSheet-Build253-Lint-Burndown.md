# DNDSheet Build 253 — C3 lint burn-down

Base `0f09ec5` (Build 252). Mechanical, behaviour-neutral clean-up.

## Delivered

| Measure | Before | After | Delta |
|---|---:|---:|---:|
| ESLint warnings (`src` + `test`) | 2,733 | 282 | −2,451 (−89.7 %) |
| `quotes` | 1,790 | 0 | −1,790 |
| `vue/attributes-order` + `vue/first-attribute-linebreak` | 625 | 1 | −624 |
| `@typescript-eslint/no-unused-vars` | 40 | 4 | −36 |
| ESLint errors | 0 | 0 | 0 |

- `eslint --fix` over `src` and `test`.
- Dead imports removed; dead duplicate computeds in `WebRenderer.vue` (already returned through `...textRenderer`) and an unused `saveStat` local removed.
- `.eslintrc.js`: `@typescript-eslint/no-unused-vars` with `ignoreRestSiblings` — `const { dropped, ...kept } = x` is the house idiom for omitting keys.

## Evidence

- Template invariance: for all 42 changed `.vue` files, the sorted token multiset of `<template>` is identical before/after (attribute reordering only).
- Typecheck caught two imports used only inside templates (`MacroEntry`, `StyleValue`); both restored. 48 diagnostics, 0 new.
- Core 682/682; full 10-step gate.

## Remaining warnings (not auto-fixable; owned elsewhere)

`no-explicit-any` 106 → C8 · `no-non-null-assertion` 78 → C8 · `vue/no-v-html` 70 (all sanitized through `mechanicRichHtml`/sanitizer; intentional) · `vue/require-explicit-emits` 14 (declaring emits changes listener fall-through; needs per-component review) · `vue/require-default-prop` 8 · unused 4 (callback/destructure params).
