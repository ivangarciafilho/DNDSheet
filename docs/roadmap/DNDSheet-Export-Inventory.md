# Export target inventory (B4.1)

Every way data leaves the app, read from `src/components/file/DownloadButton.vue` at Build219. File names pass through `safeFileName` (`src/core/domain/file-name.ts`) since Build216; the PNG path calls it directly.

## Monster mode

| # | Menu label | Function | Source → transform | MIME | File name | Known omissions / notes | Golden |
|---|---|---|---|---|---|---|---|
| 1 | Export JSON (5emm format) | `save5emm` | Complete monster state, sheet presentation, and referenced custom spell definitions | application/json | `<name>.5emm.json` | Toolbar round-trip checked by `native-monster-roundtrip-browser-smoke.mjs`. Legacy files use the existing presentation settings. | External artwork remains a URL. |
| 2 | Export Markdown (Homebrewery Legacy) | `saveMd` | `useMdRenderer.renderMarkdown(twoCol)` | text/markdown | `<name>.md` | empty header lines omitted (B4.10) | ✅ |
| 3 | Export Markdown (Homebrewery v3) | `saveMd3` | `useHomebrewery3Renderer.renderMarkdownV3(twoCol)` | text/markdown | `<name>.md` | random tables included (A11.9) | ✅ |
| 4 | Export JSON (Improved Initiative) | `saveImprovedInit` | `useImprovedInitRenderer.renderImprovedInitJson()` | application/json | `<name>.improved-initiative.json` | shared prose since218; target arrays may follow active sheet phase filtering (separate export-policy acceptance) | ✅ |
| 5 | Export LaTeX (rpgtex) | `saveLatex` | `useLatexRenderer.renderLatex(twoCol)` | text/latex | `<name>.tex` | no custom CR values; raw strings escaped (B4.9) | ✅ |
| 6 | Export JSON (Tarrasque.io) | `saveTio` | `useTarrasqueRenderer.renderTarrasqueJson()` | application/json | `<name>.tio.json` | shared per-record prose since219; every authored phase retained, numeric physical metadata preserved, bonus actions merged, mythic narrative in special_abilities | ✅ |
| 7 | Export Foundry | `exportFoundry` | `ExportStatblock.exportToFoundryJson` | application/json | `<name>.foundry.json` | golden since217 | ✅ |
| 8 | Export plain text | `exportPlainText` | `ExportStatblock.exportToPlainText` | text/plain | `<name>.txt` | golden since217 | ✅ |
| 9 | Export HTML | `exportHtml` | `ExportStatblock.exportToHtml` | text/html | `<name>.html` | grammar CSS embedding is B4.4 | ✅ |
| 10 | Export PNG | `savePng` | `snapdom.toBlob(#renderer, scale 2)` | image/png | `<name>.png` | Firefox multi-column warning | — |
| 11 | Copy Markdown to clipboard | `copyMd` | Homebrewery v3 text | clipboard | — | same text as #3 | — |
| 12 | Copy link | `copyLink` | `json-url` LZ of `monster.$state` → external shortener | clipboard | — | depends on an external shortener; falls back to the long link | — |

## Character mode

| # | Menu label | Function | Source → transform | MIME | File name |
|---|---|---|---|---|---|
| 13 | Export Character JSON | `saveCharJson` | `exportCharacterToJson(actor)` | application/json | `<name or Hero>.character.json` |
| 14 | Export Character Markdown | `saveCharMd` | `exportCharacterToMarkdown(actor)` | text/markdown | `<name or Hero>.md` |
| 15 | Export Character text | `saveCharTxt` | `exportCharacterToPlainText(actor)` | text/plain | `<name or Hero>.txt` |
| 16 | Export PNG | `savePng` | `snapdom` of `#char-sheet` | image/png | `<name or Hero>.png` |
| 17 | Copy Character Markdown | `copyCharMd` | `exportCharacterToMarkdown(actor)` | clipboard | — |

## Gaps this inventory exposes (groomed into the Backlog)

- Foundry, plain text and HTML goldens landed217 (B4.12). HTML grammar CSS embedding remains B4.4.
- Character Markdown/text goldens and JSON round-trip landed217; character import landed218 (B4.13/B4.17).
- Copy link names the third-party shortener and its storage behavior since217 (B4.14); the long-link fallback remains.


## Build219 target fidelity and phase policy

Tarrasque pairs each source record with shared prose independently of the current sheet phase filter; identical names cannot redirect attack_bonus, damage_dice or damage_bonus. Phased leads keep cadence in the name and phase annotation in description. Reactions retain triggers. Class/innate spell rows are plain text. Header/description markup is stripped before entity decoding, preserving encoded literal brackets and table cell separators. Mythic rules use a supported narrative special ability; target-native automation for those rules is not claimed.

The Improved Initiative adapter landed its shared arrays in218. Its arrays still inherit the sheet's active phase filtering. B4.7's prose-projection scope is complete after Tarrasque; a universal all-target phase/export-policy UI remains under B4.5/B4.2 and is not inferred from this release. Do not silently change those other target policies while fixing one adapter.
