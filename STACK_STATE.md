# Local DNDSheet Stack State

- **Build185 (2026-11-08), branch `build185-repairs`**: Builds 162–184 committed as baseline `a7cc729`; repairs `68e18bd` (counted spell cadences, metamagic punctuation, dark-theme vitals contrast, vitals help values). Gate on the final source: 362/362 core, build, 50/50 fuzz, spell-plate smoke (5 themes), help smoke (12 themes, 4.5:1 contrast). Release candidate `rc-2.4.3-build-185-baseline-and-repairs`. The roadmap state is in `docs/roadmap/DNDSheet-Implementation-Backlog.md` §Build185; entries below are historical.

- **DNDSheet - Master Release Candidate v2.4.3-RC (Build 181): A4 Layer Occlusion, Transparent CR, Top-Aligned Traits, Streamlined Actions & Unified Spellcasting (100% COMPLETE & GREEN - 357/357 Core Unit Tests, 50/50 Live Browser CDP Fuzz Steps Passed with 0 Errors, Quasar Build Exit Code 0) - `DNDSheet` (2026-11-02)**:
  * **What changed**:
    * **A4 Composition Layer Stack Precedence & Normal Blend Occlusion (`WebRenderer.vue`, `app.scss`)**:
      * Dynamic descending `zIndex = (editorStore.a4Layers.length - idx) * 10 + 10` applied across statblock, portrait, and custom layers.
      * Removed hardcoded CSS `z-index: 1`, `z-index: 10`, `z-index: 3` and set `.statblock-wrapper` to `z-index: auto` so that layers placed above the statblock in `A4LayerStudio.vue` with `blendMode: 'normal'` and 100% opacity properly occlude the elements beneath them using their alpha channel.
    * **Transparent Nameplate CR Badge (`app.scss`, `statblock-grammar.scss`)**:
      * Made `.cr-main-region` and `.compact-nameplate-row-1 .cn-cr` background transparent (`background: transparent !important; color: #58180d !important;`) rather than opaque crimson, allowing the parchment background to show through and giving the creature name prominent visual pop.
    * **Top-Aligned Multi-Line Trait Labels (`statblock-grammar.scss`)**:
      * Applied `align-items: flex-start !important; padding-top: 5px !important;` to `.sb-plate.sb-trait-streamlined .sb-row > .sb-cell.sb-head` so that traits like Arcane Condenser and Cortex stay cleanly aligned with the top of multi-line descriptions rather than vertically centering.
    * **Streamlined Single-Row Action Plates (`useProcessTokens.ts`)**:
      * In `processAction` and `processMultiattack`, actions without secondary mechanics or scope cells (such as Multiattack 'Make 2 Attacks.') collapse into a single-row plate `[Multiattack] [Make 2 Attacks.]` without reserving an unnecessary separate row.
    * **Single Unified Monster Spellcasting Cell (`WebRenderer.vue`, `statblock-grammar.scss`)**:
      * Consolidated all standard spell levels (Cantrips, Level 1, Level 2, Level 3...) into a single unified cell (`.sb-spells-unified-cell`) with alternating line striping (`.spell-level-line`) and removed horizontal cell divider borders between spell levels.
    * **Decoupled Regeneration & Temporary Hit Points (`defense-and-traits-utils.ts`)**:
      * Updated `defense-and-traits-utils.ts` so `recoveryType === 'temp_hp'` with `conditionModifier === 'not_bloodied'` formats as "Gains X of Temporary Hit Points while not Bloodied", strictly decoupled from hit point regaining.
    * **Defensive CR Calculations (`monster-store.ts`, `CalculateCr.ts`)**:
      * Added optional chaining and safe fallback arrays for `crAnnotation` and `atWill` to guard against malformed action imports.
    * **Release Candidate Increment**:
      * Incremented `build.json` to `{"build":"181"}`.
      * Created immutable release candidate ledger `.codex-temp/release-candidates/rc-2.4.3-build-181-occlusion-streamlined-actions-and-unified-spells/release-candidate.json`.
  * **Verification & Test Proof**:
    * **Core Unit Tests (`npm test`)**: **357 / 357 passed (100% green)** in 1.40s across 50 test suites.
    * **In-Browser Live CDP Fuzz Suite (`node test/exhaustive-ui-fuzz.js`)**: All **50 consecutive phases passed with 0 console errors and 0 runtime exceptions**.
    * **Production Build (`npx quasar build`)**: Compiled cleanly to `dist/spa` with **exit code 0**.
    * **Visual Proof Verification**: Captured high-resolution screenshot `candidate181-layers-traits-spells.png`.
    * **PWA Server**: Live on port 8080 (`http://localhost:8080/#/`).

- **DNDSheet - Master Release Candidate v2.4.3-RC (Build 180): Aligned Vitals, Streamlined Trait Plates & Composable Action Passives Architecture (100% COMPLETE & GREEN - 357/357 Core Unit Tests, 50/50 Live Browser CDP Fuzz Steps Passed with 0 Errors, Quasar Build Exit Code 0) - `DNDSheet` (2026-11-02)**:
  * **What changed**:
    * **Pixel-Perfect Vitals Label Alignment (`statblock-grammar.scss`, `app.scss`, `WebRenderer.vue`)**:
      * Standardized `.skill.dnd-cellular-row` and `.skill.dnd-cascade-panel` across striped and unstriped rows with `padding: 1px 0 !important; box-sizing: border-box !important;`.
      * Eliminated the 4px horizontal indentation jump caused by earlier striped rows having `padding: 1px 4px` while unstriped rows had `padding: 0`. AC, HP, Vulnerabilities, Resistances, Immunities, Speed, Senses, Languages, and Gear labels are now horizontally aligned flush to the pixel.
    * **Formula Field & HD Lock Icon Clickability (`FormulaField.vue`, `LockToggleButton.vue`, `app.scss`)**:
      * Restored clickability and pointer events on the lock toggle button for `HP.type` and `HP.modifier` even when the parent input field is disabled/bound (`pointer-events: auto !important` on `.q-field--disabled .q-field__append` and `.lock-toggle-btn`).
    * **Initiative Advantage / Disadvantage Roll Toggles (`BasicsEditor.vue`, `initiative-composer.ts`)**:
      * Added explicit segmented `q-btn-toggle` (`Normal` | `Advantage ▲▲` | `Disadvantage ▼▼`) to dictate if the creature rolls Initiative normally, with Advantage, or with Disadvantage.
      * Permutable chaining supports `<At Disadvantage>`, `<Choose Disadvantage>`, creature targeting rules (`Fiends and undead have Disadvantage on Initiative Roll`), decoupled `<Cast Spell>`, `<Hide>`, `<Influence>`, `<Regains X Hit Points>`, `<Gains X Temporary Hit Points>`, and `<Move up to speed / 10ft>`.
    * **Restored Passives Placement & Action Embedding (`SkillsEditor.vue`)**:
      * Integrated full Placement selector (`Vitals / Header`, `Actions`, `Bonus Actions`, `Legendary Actions`), action economy toggle, rider text input with clear button, and preset dropdowns for Search, Study, Influence, and Hide in `SkillsEditor.vue`, rendering action plates in `ACTIONS` or `BONUS ACTIONS` when relocated, without duplication in vitals.
    * **Movement Riders Composer Flexibility (`speeds-traversal.ts`, `SpeedsEditor.vue`)**:
      * Expanded `SPEED_ACTION_RIDER_PRESETS` to cover 15 presets including temporary HP on disengage, lightly obscured on dodge, saving throw advantages on dash, and teleportation variations.
    * **Streamlined Single-Row Trait Plates (`statblock-grammar.scss`, `useProcessTokens.ts`)**:
      * In modern visual templates, traits without secondary mechanics or tags format as single-row plates with `.sb-cell.sb-head` on the left and `.sb-cell.sb-body.sb-grow` on the right in the same `.sb-row`, eliminating wasted vertical space.
    * **A4 Composition Layer Occlusion under Normal Blend (`WebRenderer.vue`, `app.scss`)**:
      * Enforced `isolation: isolate` on `.a4-page-sheet` and explicit descending `zIndex` with background opacity in `getLayerStyle` to guarantee normal blend layers fully occlude layers beneath them.
    * **Release Candidate Increment**:
      * Incremented `build.json` to `{"build":"180"}`.
      * Created immutable release candidate ledger `.codex-temp/release-candidates/rc-2.4.3-build-180-aligned-vitals-streamlined-traits-and-action-passives/release-candidate.json`.
  * **Verification & Test Proof**:
    * **Core Unit Tests (`npm test`)**: **357 / 357 passed (100% green)** in 1.47s across 50 test suites.
    * **In-Browser Live CDP Fuzz Suite (`node test/exhaustive-ui-fuzz.js`)**: All **50 consecutive phases passed with 0 console errors and 0 runtime exceptions**.
    * **Production Build (`npx quasar build`)**: Compiled cleanly to `dist/spa` with **exit code 0**.
    * **Visual Proof Verification**: Captured high-resolution screenshot `candidate180-vitals-traits-actions.png`.
    * **PWA Server**: Live on port 8080 (`http://localhost:8080/#/`).

- **DNDSheet - Master Release Candidate v2.4.3-RC (Build 179): Composable Initiative Mechanics & HP/Temporary HP Riders Architecture (100% COMPLETE & GREEN - 356/356 Core Unit Tests, 50/50 Live Browser CDP Fuzz Steps Passed with 0 Errors, Quasar Build Exit Code 0) - `DNDSheet` (2026-11-02)**:
  * **What changed**:
    * **Initiative Composer Expansion (`initiative-composer.ts`, `types.ts`, `BasicsEditor.vue`, `useTextRenderer.ts`, `WebRenderer.vue`)**:
      * Engineered domain engine `src/core/domain/initiative-composer.ts` featuring `ComposableInitiativeRider`, `InitiativeAdvantageMode` (`none`, `advantage`, `disadvantage`, `at_disadvantage`, `choose_disadvantage`, `choose_lowest`), and `InitiativeActionType` (`cast_spell`, `hide`, `influence`, `search`, `study`, `regain_hp`, `gain_temp_hp`, `move_speed`, `move_distance`, `custom`).
      * Decoupled modular permutation blocks supporting:
        * `<<At> <Disadvantage>>` / `<<Choose> <Disadvantage>>`
        * `<Fiends>, and <undeads> have <Disadvantage> on <Initiative Roll>`
        * `<<At> <Disadvantage>>, <Cast> <Spell>`
        * `<<At> <Disadvantage>>, <Hide>`
        * `<<At> <Disadvantage>>, <Influence>`
        * `<Regains> <<X> <Hit Points>>` vs `<Gains> <<X> <Temporary Hit Points>>`
        * `<Move> <up to> <your speed>` / `<Move> <10ft>`
      * Surfaced interactive Composable Initiative Riders UI in `BasicsEditor.vue` under Initiative Tuning with live chips, dynamic action fields (Spell, HP amount, Distance, Custom text), and reactive preview.
      * Integrated riders into both `initiativeCells` and `compactInitiativeDisplay` in `WebRenderer.vue`.
    * **HP Riders Composer Fix (Regaining Hit Points vs Temporary Hit Points)**:
      * Fixed differentiation where temporary HP was previously printed under the trait "Regeneration" as "regains hit points".
      * When `recoveryType` is `temp_hp` or `absorb_temp_hp`, the auto-generated detailed trait is titled `Temporary Hit Points` / `Absorbing Vigor`, with prose strictly declaring `The [creature] gains X temporary hit points...`
      * When `recoveryType` is `regen` or `absorb_hp`, the trait is titled `Regeneration` and states `The [creature] regains X hit points...`
      * Updated minimalist badge output in `formatMinimalistRegen` to output `+X temp HP` clearly distinct from regular healing `+X/turn`.
    * **Release Candidate Increment**:
      * Incremented `build.json` to `{"build":"179"}`.
  * **Verification & Test Proof**:
    * **Core Unit Tests (`npm test`)**: **356 / 356 passed (100% green)** in 1.40s across 50 test suites (including 5 new tests in `test/core/InitiativeComposer.test.ts`).
    * **In-Browser Live CDP Fuzz Suite (`node test/exhaustive-ui-fuzz.js`)**: All **50 consecutive phases passed with 0 console errors and 0 runtime exceptions**.
    * **Production Build (`npx quasar build`)**: Compiled cleanly to `dist/spa` with **exit code 0**.
    * **Live Visual Verification**: Captured screenshot `candidate179-initiative-and-hp.png`.

- **DNDSheet — Master Release Candidate v2.4.3-RC (Build 178): High-Contrast Perceivable Interleaved Zebra Stripes Across Vitals & Spellcasting (100% COMPLETE & GREEN - 351/351 Core Unit Tests, 50/50 Live Browser CDP Fuzz Steps Passed with 0 Errors, Quasar Build Exit Code 0) — `DNDSheet` (2026-11-02)**:
  * **What changed**:
    * **Perceivable Stripe Contrast Tokens (`statblock-grammar.scss`)**:
      * Replaced the faint/invisible 4.5% opacity tint with a perceivable, accessible ~10-12% opacity contrast across all themes (`--sb-stripe: rgba(122, 31, 18, 0.12)`, theme mixin `rgba($frame, 0.10)`).
      * Configured `.skill.dnd-cascade-panel.sb-striped`, `.skill.dnd-cascade-panel.is-striped`, `.spell-level-line.is-striped`, and `.spell-level-line:nth-child(even)` to render with solid accessible tint `var(--sb-stripe)` and clean 1px dividers.
    * **Clean Alternating Row Vitals Striping (`WebRenderer.vue`)**:
      * Replaced character-length threshold heuristics with clean alternating row indexing across visible vital statistics rows: AC (0) -> HP (1, striped) -> Cascading Defenses (alternating) -> Speed (clean) -> Senses (striped) -> Languages (clean) -> Gear (striped).
      * Preserved `repeating-linear-gradient` for verbose multi-line entries via `.zebra-stripe-text`.
    * **Spellcasting Rows Interleaving**:
      * Unified spell cell and secondary restricted cell lines alternate cleanly between base parchment and perceivable stripe wash `rgba(88, 24, 13, 0.10)`.
    * **Release Candidate Increment**:
      * Incremented `build.json` to `{"build":"178"}`.
      * Created immutable release candidate ledger `.codex-temp/release-candidates/rc-2.4.3-build-178-perceivable-interleaved-stripes/release-candidate.json`.
  * **Verification & Test Proof**:
    * **Core Unit Tests (`npm test`)**: **351 / 351 passed (100% green)** in 1.45s across all 49 test suites.
    * **In-Browser Live CDP Fuzz Suite (`node test/exhaustive-ui-fuzz.js`)**: All **50 consecutive phases passed with 0 console errors and 0 runtime exceptions**.
    * **Production Build (`npx quasar build`)**: Compiled cleanly to `dist/spa` with **exit code 0**.
    * **PWA Server**: Live on port 8080 (`http://localhost:8080/#/`).

- **DNDSheet — Master Release Candidate v2.4.3-RC (Build 177): Spellcasting Interleaved Striped Lines Pattern (100% COMPLETE & GREEN - 351/351 Core Unit Tests, 50/50 Live Browser CDP Fuzz Steps Passed with 0 Errors, Quasar Build Exit Code 0) — `DNDSheet` (2026-11-02)**:
  * **What changed**:
    * **Spellcasting Interleaving Striped Lines Pattern (`WebRenderer.vue`, `statblock-grammar.scss`)**:
      * Added the existing interleaving stripped reading pattern (`--sb-stripe`, `.sb-striped`, and alternating row/cell backgrounds) across the whole spellcasting section rendered on the monster stats block.
      * **Continuous Row-to-Line Alternation**:
        * Header row rendered as dark crimson header cell + parchment DC/Attack cell.
        * Resource row (`Pact Magic`, spell slots, prepared count) when present formats as its own clean full-width plate row (`.sb-spell-resource-row`).
        * Metamagic row (`.sb-spell-metamagic-row`) and Resource row alternate cleanly with `.is-striped` and `.sb-striped` tokens.
        * Rendered spell level lines inside the unified cell (`.sb-spells-unified-cell .spell-level-line`) alternate cleanly between transparent/parchment background and tinted striped background (`var(--sb-stripe)`, resolving to `rgba(88, 24, 13, 0.043)` in WotC theme and respecting theme variables across all visual palettes).
      * **Secondary Restricted Cell Interleaving**:
        * Secondary restricted cadence spell levels (`.sb-spells-restricted-cell .spell-level-line`) inherit the identical alternating striping and subtle internal line dividers, maintaining visual parity with the primary spells block.
      * **Innate Spellcasting Group Alternation**:
        * Alternating striping is also applied across all cadence groups in Innate Spellcasting (`.innate-spellcasting .sb-row.sb-spell-row`: At Will, 3/Day, 1/Day, etc.), providing full section-wide consistency.
      * **Per-Line Repeating Gradient for Verbose Spell Lines**:
        * When spell levels wrap across multiple lines of text, `.zebra-stripe-text` applies the per-line `repeating-linear-gradient` background, ensuring continuous horizontal reading stripes even for dense spell lists.
    * **Release Candidate Increment**:
      * Incremented `build.json` to `{"build":"177"}`.
      * Created immutable release candidate ledger `.codex-temp/release-candidates/rc-2.4.3-build-177-spellcasting-interleaved-striping/release-candidate.json`.
  * **Verification & Test Proof**:
    * **Core Unit Tests (`npm test`)**: **351 / 351 passed (100% green)** in 1.28s across all 49 test suites.
    * **In-Browser Live CDP Fuzz Suite (`node test/exhaustive-ui-fuzz.js`)**: All **50 consecutive phases passed with 0 console errors and 0 runtime exceptions**.
    * **Direct Headless Chrome Live DOM Verification**: Confirmed in live Chrome DOM that `.class-spellcasting` and `.innate-spellcasting` alternate rows and lines between `rgba(0, 0, 0, 0)` and `rgba(88, 24, 13, 0.043)` (`var(--sb-stripe)`).
    * **Production Build (`npx quasar build`)**: Compiled cleanly to `dist/spa` with **exit code 0**.
    * **PWA Server**: Live on port 8080 (`http://localhost:8080/#/`).
  * **What was attempted and failed**: None.
  * **Current blockers**: None.
  * **Next safe command or experiment**: Direct user verification on [http://localhost:8080/#/](http://localhost:8080/#/).

- **DNDSheet — Master Release Candidate v2.4.3-RC (Build 176): Speeds Movement Rider Composer, Spellcasting Consolidation Engine & Subclass Coverage (100% COMPLETE & GREEN - 351/351 Core Unit Tests, 50/50 Live Browser CDP Fuzz Steps Passed with 0 Errors, Quasar Build Exit Code 0) — `DNDSheet` (2026-11-02)**:
  * **What changed**:
    * **Speeds Movement Action Riders Composer (`SpeedsEditor.vue`, `speeds-traversal.ts`)**:
      * Implemented full compoundable composer for all 9 movement action rider archetypes:
        * `Dash can Shove as a Bonus Action`
        * `Dash or Disengage: Teleport as a Bonus Action up to 10ft of a point you can see / familiar to you`
        * `Dash or Disengage: Creatures 5ft of you takes 1d8 of fire damage aura`
        * `Once per round (per creature): when a creature enters or leaves 5ft of you, it takes 1d10 of fire damage`
        * `Teleport to a point visited this turn`
        * `Dodge or Disengage: can Hide as a Bonus Action`
        * `Disengage: shift to the Ethereal Plane`
      * Wired rich UI composer with live preview chips, action economy selectors (Action vs Bonus Action), and custom rule formulas.
    * **Master Spellcasting Consolidation Engine (`SpellcastingEditor.vue`, `ClassCastingEditor.vue`, `monster-store.ts`)**:
      * Eliminated redundant top ability strip and separated accordions, consolidating all spellcasting into a single stackable architecture.
      * Unified `SpellcastingClass` instances where each class independently manages its own stored spells, level cadences, and Action vs Bonus Action casting economy.
      * Reactive `Combined Caster Level` calculation across all stacked full, half, third, and pact casters.
      * Pooled all stored spells in `monster.knownSpellsOfLevel` across primary and stacked classes seamlessly.
    * **Subclass Dropdown Instant Filtering & Complete 5e Coverage (`ClassCastingEditor.vue`, `AutoSyncSpellcasting.ts`)**:
      * Bound primary and stacked subclass selectors to `getSubclassesForClass` with `input-debounce="0"` and reactive `basicArrayFilter`.
      * Full official 5e subclass coverage across all 12 classes (e.g. Draconic Sorcerer, Fiend Warlock, Evocation Wizard, Arcane Trickster Rogue, Eldritch Knight Fighter, Four Elements Monk) without sticky state or clearing on typing.
    * **Spellcasting Unified Cell & High-Cadence Split (`WebRenderer.vue`, `spell-plate.ts`)**:
      * Consolidated spells per level into a single unified cell (`.sb-cell.sb-spells-unified-cell`) with zero table row splits between levels.
      * Appended secondary cell (`.sb-cell.sb-spells-restricted-cell`) when `splitHighCadence` is active, dedicated to restricted cadences (Short/Long Rest, Midnight, Dawn, Ritual, etc.) with interactive filter chip configuration.
    * **Redundant Cadence Suppression (`WebRenderer.vue`)**:
      * Suppressed individual cadence badges on spells when all spells on a level share the majority cadence or caster default, disclosing badges strictly on divergence or exceptions.
    * **Combat Actions Composer in Skills & Tools (`SkillsEditor.vue`)**:
      * Provided rich composer for `Search`, `Study`, `Influence`, `Hide`, and `Use Tool` with presets, quick-mix chips (`+ 60ft`, `+ Ethereal & Material`, `+ Touch`, `+ Bonus Action`, `+ DC 15`), and custom formulas with defensive reactive store initialization.
    * **Clearer 4-Cell Cellular Nameplate (`WebRenderer.vue`, `statblock-grammar.scss`, `monster-store.ts`)**:
      * Row 1 formatted with 4 distinct cells (`| Name | Identity | CR | PB | XP |`) with separate background tokens, vertical border splits, and left-aligned Name and Identity.
      * Row 2 formatted for composed initiative and dramatic triggers (e.g. `11/+1 initiative, at Disadvantage can cast Thaumaturgy`).
    * **Traits Multi-Description Containers & Table Parity (`ActionsEditor.vue`, `useProcessTokens.ts`)**:
      * Supported multiple description containers per trait/action with assignment to outcome triggers, quick toggle between text blocks and interactive dice tables, and seamless plain-text export parity.
    * **Release Candidate Increment**:
      * Incremented `build.json` to `{"build":"176"}`.
      * Created immutable release candidate ledger `.codex-temp/release-candidates/rc-2.4.3-build-176-speeds-rider-composer-and-spell-consolidation/release-candidate.json`.
  * **Verification & Test Proof**:
    * **Core Unit Tests (`npm test`)**: **351 / 351 passed (100% green)** in 1.38s across all 49 test suites.
    * **In-Browser Live CDP Fuzz Suite (`node test/exhaustive-ui-fuzz.js`)**: All **50 consecutive phases passed with 0 console errors and 0 runtime exceptions**.
    * **Production Build (`npx quasar build`)**: Compiled cleanly to `dist/spa` with **exit code 0**.
    * **PWA Server**: Live on port 8080 (`http://localhost:8080/#/`).
  * **What was attempted and failed**: None.
  * **Current blockers**: None.
  * **Next safe command or experiment**: Direct user verification on [http://localhost:8080/#/](http://localhost:8080/#/).
