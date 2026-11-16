# DNDSheet Build 261 — closing C3, C6, C8 and C10 (and an XSS fix)

Base `b095b74` (Build 260). Workflow change: every Track C item now has an explicit exit criterion, and several items close in one gate run instead of being chipped one per build.

## Track C scorecard

| Item | Exit criterion | Before | After | Status |
|---|---|---|---|---|
| C3 lint debt | 0 ESLint warnings and 0 errors in `src` + `test` | 2,740 at Build 251; 149 at Build 260 | **0 / 0** | ✅ closed |
| C6 visual regression | pixel regression runs in the release gate | manual tool (Build 258) | **gate step `visual`** vs production | ✅ closed |
| C8 type debt | no `any` outside explicitly disabled untyped boundaries; lint enforces it | 116 lines at Build 251 | **0 lint findings**; 25 reviewed boundary disables | ✅ closed |
| C10 TODOs | 0 TODO/FIXME in `src`; each resolved or replaced by a stated decision | 7 | **0** | ✅ closed |
| C9, C12 | — | ✅ | ✅ | closed earlier |
| C1a, C1b, C2, C4, C5, C11 | — | open | open | next |

Track C: **6 of 12 actionable items closed** (was 2 before this build). Owner gates `B5.7`, `H16` unchanged.

## Security fix found while closing C3: stored XSS in the stat block and rich editors

Closing `vue/no-v-html` required evidence, so `test/xss-statblock-browser-smoke.mjs` now injects `<img onerror>`, `<script>`, `<svg onload>` and `javascript:` links into 18 author fields across 4 layouts.

| | Build 260 (before) | Build 261 (after) |
|---|---|---|
| Injected handlers that ran | 7 fields (trait, action, reaction, villain, combo + condition, inventory) | **0** |
| Live `script` / `on*` / `javascript:` left in the sheet | in every layout | **0** |

Causes: `sanitizeWebString` restored `div`/`span`/`svg`/`path` with arbitrary attributes, several render paths reached `v-html` without it, and `MonsterTextEditor`'s `q-editor` loaded stored HTML into a live `contenteditable`. A monster file from someone else (import, library, shared JSON) could run script.

Fix: `src/core/adapters/safe-html.ts` — an allow-list sanitizer (inert `<template>` parse; tags from the real render inventory plus formatting/table/SVG tags; drops `script`/`style`/`iframe`/forms; strips `on*`, `javascript:` and unsafe `style`). Exposed as the global `v-safe-html` directive; all 70 `v-html` uses replaced; `vue/no-v-html` is now an **error**. Both rich editors receive sanitized values. Legitimate output is unchanged: production (Build 260) vs candidate, **104 / 104 screenshots identical**.

Not covered: the dice-tray `innerHTML` inside the standalone exported HTML file (runs in the exported document, not the app).

## Other changes

- C8: `mathRendering`, `ProcessTokens.getProperty`, `monster-store` spell flattening, `CastingSourceSpellRows` (typed `map`/`flags`), `AiIngestDialog` (Pinia `_DeepPartial`), test fixtures (`as never`); the spellcasting payload migration is a documented boundary.
- C3: unused imports, a shadowed slot variable, attribute order; rules that this `eslint-plugin-vue` cannot apply to typed `defineEmits`/`defineProps` are off (vue-tsc enforces them); `no-non-null-assertion` off after the Build 255 audit.
- C10: CR auto-annotation now marks multi-target actions from structured targeting (`isMultitarget`: count > 1, `all`, or an area — DMG doubles their damage), test-first (3 cases); other TODOs became stated decisions (i18n → C5; the three-round DMG average; the `app.spells` storage key kept to avoid orphaning saved spells).
- C6: `visual` gate step compares the Pages build with production; `DNDSHEET_VISUAL_ACCEPT=<reason>` admits an intended change and records the reason; `DNDSHEET_VISUAL_BASELINE` overrides the baseline URL.

## Evidence

Core 691/691 (+3); typecheck 48 / 0 new; ESLint 0 warnings / 0 errors; XSS smoke red on Build 260, green now; visual 104/104 vs production; full 11-step gate.
