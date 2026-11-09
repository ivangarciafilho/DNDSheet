# Export target inventory (B4.1)

Every way data leaves the app, read from `src/components/file/DownloadButton.vue` at Build216. File names pass through `safeFileName` (`src/core/domain/file-name.ts`) since Build216; the PNG path calls it directly.

## Monster mode

| # | Menu label | Function | Source → transform | MIME | File name | Known omissions / notes | Golden |
|---|---|---|---|---|---|---|---|
| 1 | Export JSON (5emm format) | `save5emm` | `monster.$state` → `JSON.stringify` | application/json | `<name>.5emm.json` | none; reload path = `loadMonster` → `migrateMonsterSchema` (round-trip test `ExportBoundary.test.ts`) | — |
| 2 | Export Markdown (Homebrewery Legacy) | `saveMd` | `useMdRenderer.renderMarkdown(twoCol)` | text/markdown | `<name>.md` | empty header lines omitted (B4.10) | ✅ |
| 3 | Export Markdown (Homebrewery v3) | `saveMd3` | `useHomebrewery3Renderer.renderMarkdownV3(twoCol)` | text/markdown | `<name>.md` | random tables included (A11.9) | ✅ |
| 4 | Export JSON (Improved Initiative) | `saveImprovedInit` | `useImprovedInitRenderer.renderImprovedInitJson()` | application/json | `<name>.improved-initiative.json` | actions/traits not yet from the shared prose projection (B4.7) | ✅ |
| 5 | Export LaTeX (rpgtex) | `saveLatex` | `useLatexRenderer.renderLatex(twoCol)` | text/latex | `<name>.tex` | no custom CR values; raw strings escaped (B4.9) | ✅ |
| 6 | Export JSON (Tarrasque.io) | `saveTio` | `useTarrasqueRenderer.renderTarrasqueJson()` | application/json | `<name>.tio.json` | headers plain text (B4.8); actions not from the prose projection (B4.7) | ✅ |
| 7 | Export Foundry | `exportFoundry` | `ExportStatblock.exportToFoundryJson` | application/json | `<name>.foundry.json` | no golden yet | — |
| 8 | Export plain text | `exportPlainText` | `ExportStatblock.exportToPlainText` | text/plain | `<name>.txt` | no golden yet | — |
| 9 | Export HTML | `exportHtml` | `ExportStatblock.exportToHtml` | text/html | `<name>.html` | grammar CSS embedding is B4.4 | — |
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

- Foundry, plain text and HTML have no golden (B4.12).
- Character exports have no golden or round-trip test (B4.13).
- Copy link sends the whole monster to a third-party shortener; there is no notice in the UI (B4.14).
