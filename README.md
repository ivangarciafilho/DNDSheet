# DNDSheet

[Open the published application](https://ivangarciafilho.github.io/DNDSheet/#/)

DNDSheet is a Vue 3 / Quasar editor for D&D monster stat blocks, with a separate character reference sheet. This fork builds on [Falindrith's 5e Monster Maker](https://github.com/ebshimizu/5e-monster-maker).

Build225 hardens outcome editing: move/copy/delete, explicit identity repair, complete metadata retention on Apply and safe table/prose rendering. See the [delivery evidence and remaining scope](docs/roadmap/DNDSheet-Build225-Outcome-Lifecycle-and-Safe-Projections.md).

Build226 improves skill routing and persistence, source-owned spell editing, cadence rendering, shared action-family controls and safe rich mechanic text. See the [scope, verification and remaining roadmap](docs/roadmap/DNDSheet-Build226-Emergency-Editor-and-Spellcasting.md).

Build227 repairs additional-container ownership, brings Role into the compositor, adds safe numeric presentation and traversal formatting, and improves source-owned spell selection and explicit resource contributions. See the [verified scope and remaining work](docs/roadmap/DNDSheet-Build227-Composition-and-Casting-Candidate.md).

Build228 adds foldable and removable spellcasting sources, independent learning contributions, consistent spell reading order, and matching A4 print geometry. See the [release report](docs/roadmap/DNDSheet-Build228-Spellcasting-and-Print.md).

Build250 (`v2.5.0-statblock`) completes Track A & Track B engineering work (`267 / 269` `count-tasks` IDs, `311 / 313` raw checkboxes; only owner-gated decisions `B5.7` and `H16` remain): `BasicsEditor` decomposed into six domain panels under `src/components/editor/basics/`, site-wide `CatalogSelect` interaction kit & Exemption Registry, `100.0 %` (`554/554`) editor help coverage, `app.scss` `!important` debt cut from `505` to `44`, performance budgets, and live GitHub Pages deployment. See the [Build 250 delivery packet](docs/roadmap/DNDSheet-Build250-v250-Statblock-Overhaul-and-Workspace-Sweeps.md), [publication receipt](docs/roadmap/DNDSheet-Build250-Publication-Receipt.json), and [ADR-0003](docs/decisions/ADR-0003-Basics-Decomposition-Interaction-Kit-and-CSS-Grammar.md).

Build 273 (`v2.7.0`, source `4070237`, Pages `52c0656`) completes **all remaining `[ABH]` ledger items (`269 / 269` normalized IDs, `313 / 313` raw checkboxes), `42 / 42` Spec blindspots, Track C (`13 / 13`), Track D & E (`15 / 15`), and all `12 / 12` Track F sub-tasks + `5` interleaved guard checks**: adds the 2014/2024 Encounter XP Budget calculator & immutable Combat Tracker batch roster/export (`F1`), 2024 Character Sheet origin feats/weapon mastery & `100.0%` (`1,141 / 1,141`) `pt-BR` + Quasar localization (`F2`), guarded offline importers for Foundry VTT JSON, Homebrewery v3 Markdown & Improved Initiative JSON (`F3`), multi-page A4 print guides, Dark/Light Studio theme switching (`0` UI contrast violations), CSS `!important` burn-down (`308`), and production bundle budget enforcement (`tools/bundle-budget.mjs`) (`F4`). See the [Build 273 delivery packet](docs/roadmap/DNDSheet-Build273-Track-F-Complete.md) and [publication receipt](docs/roadmap/DNDSheet-Build273-Publication-Receipt.json).

## What is available

- One live monster sheet beside an editor for identity, defenses, checks, movement, senses, languages, spellcasting and structured combat abilities (`en-US` and `pt-BR`).
- A unified Actions & Traits Studio for attacks, traits, actions, bonus actions, reactions, legendary, mythic and lair mechanics, plus `2014 ↔ 2024` rules conversion with atomic undo. Reactions retain their triggers.
- Numeric references/formulas on supported monster fields, authored outcomes, random tables, phase configuration, templates and undo/redo.
- Twelve selectable visual themes, classic/modern presentations, Dark & Light Studio editor themes, an A4 composition studio with multi-page print guides, and an encounter XP budget + batch Combat Tracker drawer (`F1`).
- Monster `.5emm.json`, Homebrewery Markdown, LaTeX, plain text, HTML, PNG, Foundry, Improved Initiative and Tarrasque exports, plus guarded offline importers for `.5emm.json`, Foundry VTT JSON, Homebrewery v3 Markdown, Improved Initiative JSON and Open5e SRD (`F3`). See the [export inventory](docs/roadmap/DNDSheet-Export-Inventory.md).
- Character identity, scores, resources, inventory, features, spells, 2024 origin feats & weapon mastery properties (`character-2024.ts`); `.character.json` import/export and Markdown/plain text. Character class/species/equipment names are references, not a rules engine. AC and speed show explicit estimates unless you record totals and source notes.

## Saving and recovery

The current document is saved in browser storage (`createGuardedStorage` on `app.*` keys). Failed saves show a loud persistent throttled warning. Export a `.5emm.json` monster, `.character.json` character, or encounter JSON backup before clearing browser data. Local repository selection (`selectRepositoryBackend()`), verify-then-mark migration (`DNDSheetRepositoryMigrationV1`), quarantine/rollback backups (`DNDSheetRepositoryBackupV1`), and Creature Library live in [RepositoryStorage](src/core/domain/RepositoryStorage.ts). The [reset page](https://ivangarciafilho.github.io/DNDSheet/#/reset) contains destructive recovery controls: back up first.

Copy link may use an external shortener and can fall back to a long link; it is not guaranteed hosting for your document. Export formats are not equivalent backups.

## Developing and validating

Use a supported Node version from `package.json`, install application dependencies with `npm ci`, then install the separately pinned compiler runtime with `npm run typecheck:setup`.

| Command | Purpose |
|---|---|
| `npm run dev` | Local editor |
| `npm test` | Core tests, including five shared release fixtures (`733/733` passing) |
| `npm run typecheck` | Zero-tolerance TypeScript diagnostic check (`0` baseline diagnostics) |
| `npm run build` | Production SPA |
| `npm run gate` | Eleven named frozen-source release checks (`core`, `lint`, `typecheck`, `build`, `fuzz`, `help`, `spell`, `pages-build`, `pages-assets` bundle budgets, `pages-fuzz`, `visual` 104/104 screenshot parity) |
| `npm run audit:fit` | Five viewport widths × two effective viewport/raster scales; report clipping and explicit exemptions |
| `npm run test:e2e:matrix` | Five reusable monsters × twelve themes; 120 computed AC head/body contrast samples |

Browser probes require Chrome or Edge. Set `DNDSHEET_CHROME_PATH` for a nonstandard installation and `DNDSHEET_E2E_URL` for a served build. Probe profiles are disposable and separate from your browser data. [QA helpers](tools/qa/README.md) document step replay, reports and limitations.

Review intended golden-output changes before freezing source and running the final gate. Do not update golden files during a release gate. The publisher checks the exact input fingerprint and refuses missing or stale evidence. GitHub Pages uses the `/DNDSheet/` base and the `gh-pages` branch.

## Scope and roadmap

The [feature matrix](docs/roadmap/DNDSheet-Feature-Matrix.md) separates shipped behavior from remaining acceptance. Use the current [architecture specification](docs/roadmap/DNDSheet-Professional-Product-and-Architecture-Spec.md), [implementation backlog](docs/roadmap/DNDSheet-Implementation-Backlog.md) and [development handoffs](docs/roadmap/DNDSheet-Development-Handoffs.md) together. A passing diagnostic comparison does not mean the project is type-error-free. Character reference fields do not automatically apply class, species, armor or equipment rules.

Translations live in `src/i18n`; content catalogs and custom authoring remain separate from translated interface text.
