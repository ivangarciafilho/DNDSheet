# DNDSheet Build 257 — C1b: split WebRenderer.vue (styles + A4 composition)

Base `b8f725d` (Build 256). Pure move refactor.

## Deltas

| Measure | Before | After |
|---|---:|---:|
| `WebRenderer.vue` lines | 2,983 | 1,688 |
| — of which `<script>` | 1,350 | ~690 |
| — of which `<style>` | 635 | 2 (`src` references) |
| Files ≥ 900 lines in `src` | 19 | 19 (WebRenderer still has a 994-line template) |

## Changes

| New file | Lines | Content |
|---|---:|---|
| `web-renderer.global.scss` | 323 | the unscoped `<style>` block, referenced with `<style lang="scss" src>` |
| `web-renderer.scoped.scss` | 308 | the scoped block, referenced with `<style lang="scss" scoped src>` |
| `useA4Composition.ts` | ~690 | 41 bindings: A4 layer stacks and z-order, statblock/portrait/layer styles, fit-to-frame measurement (mutation + resize observers), overflow check, print fitting |

`columns` and `hasPortrait` (computeds over `editorStore`/`monster` only) were hoisted above the call so they can be passed in; computeds are lazy and nothing read them eagerly before their old position (that would already have thrown), so hoisting cannot change evaluation.

## Evidence

- **CSS identical:** the built SPA CSS (all chunks, 710,513 bytes) is byte-identical before/after once scoped `data-v-` ids are normalised; only the scope hash changes, consistently.
- Typecheck 48 / 0 new; lint clean; core 688/688.
- Watchers, observers and `onMounted`/`onBeforeUnmount` hooks register on the same component because the composable is called synchronously in `setup`, at the same position.
- Gate covers the moved behaviour directly: A4 print parity (portrait/landscape one page), statblock fit, overflow probe, 12-theme release matrix and help probes, SPA and Pages.

## Next

The template (994 lines) needs child components; scoped selectors that cross the parent/child boundary must be audited first, so it is its own build.
