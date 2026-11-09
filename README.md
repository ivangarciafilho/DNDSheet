# DNDSheet

[Open the published application](https://ivangarciafilho.github.io/DNDSheet/#/)

DNDSheet is a Vue 3 / Quasar editor for D&D monster stat blocks, with a separate character reference sheet. This fork builds on [Falindrith's 5e Monster Maker](https://github.com/ebshimizu/5e-monster-maker).

## What is available

- One live monster sheet beside an editor for identity, defenses, checks, movement, senses, languages, spellcasting and structured combat abilities.
- A unified Actions & Traits Studio for attacks, traits, actions, bonus actions, reactions, legendary, mythic and lair mechanics. Reactions retain their triggers.
- Numeric references/formulas on supported monster fields, authored outcomes, random tables, phase configuration, templates and undo/redo. Remaining ownership and migration work is tracked explicitly in the roadmap.
- Twelve selectable visual themes, classic/modern presentations and an A4 composition studio. Fixed artwork canvases use scrolling; full mobile and print acceptance is still tracked by panel.
- Monster JSON round trips, Homebrewery Markdown, LaTeX, plain text, HTML, PNG, Foundry, Improved Initiative and Tarrasque exports. Target formats have different capabilities: see the [export inventory](docs/roadmap/DNDSheet-Export-Inventory.md).
- Character identity, scores, resources, inventory, features and spells; JSON import/export and Markdown/plain text. Character class/species/equipment names are references, not a rules engine. AC and speed show explicit estimates unless you record totals and source notes.

## Saving and recovery

The current document is saved in browser storage. Failed saves show a warning. Export a `.5emm.json` monster or `.character.json` character backup before clearing browser data. Storage backends and recovery semantics are inventoried; a fully migrated document library is not yet shipped. The [reset page](https://ivangarciafilho.github.io/DNDSheet/#/reset) contains destructive recovery controls: back up first.

Copy link may use an external shortener and can fall back to a long link; it is not guaranteed hosting for your document. Export formats are not equivalent backups.

## Developing and validating

Use a supported Node version from `package.json`, install application dependencies with `npm ci`, then install the separately pinned compiler runtime with `npm run typecheck:setup`.

| Command | Purpose |
|---|---|
| `npm run dev` | Local editor |
| `npm test` | Core tests, including five shared release fixtures |
| `npm run typecheck` | Reject new diagnostics against the approved baseline; existing debt remains |
| `npm run build` | Production SPA |
| `npm run gate` | Ten named frozen-source release checks, including SPA/Pages browser runs, theme/fixture matrix and fit inventory |
| `npm run audit:fit` | Five viewport widths × two effective viewport/raster scales; report clipping and explicit exemptions |
| `npm run test:e2e:matrix` | Five reusable monsters × twelve themes; 120 computed AC head/body contrast samples |

Browser probes require Chrome or Edge. Set `DNDSHEET_CHROME_PATH` for a nonstandard installation and `DNDSHEET_E2E_URL` for a served build. Probe profiles are disposable and separate from your browser data. [QA helpers](tools/qa/README.md) document step replay, reports and limitations.

Review intended golden-output changes before freezing source and running the final gate. Do not update golden files during a release gate. The publisher checks the exact input fingerprint and refuses missing or stale evidence. GitHub Pages uses the `/DNDSheet/` base and the `gh-pages` branch.

## Scope and roadmap

The [feature matrix](docs/roadmap/DNDSheet-Feature-Matrix.md) separates shipped behavior from remaining acceptance. Use the current [architecture specification](docs/roadmap/DNDSheet-Professional-Product-and-Architecture-Spec.md), [implementation backlog](docs/roadmap/DNDSheet-Implementation-Backlog.md) and [development handoffs](docs/roadmap/DNDSheet-Development-Handoffs.md) together. A passing diagnostic comparison does not mean the project is type-error-free. Character reference fields do not automatically apply class, species, armor or equipment rules.

Translations live in `src/i18n`; content catalogs and custom authoring remain separate from translated interface text.
