# Local DNDSheet Stack State

- **DNDSheet — Master Release Candidate v2.18.0-RC: Actions & Traits Studio Non-Collapsing Parameters, IDE Intellisense Macros, Level-Folded Spellcasting Studio with Tri-Class Multiclassing, Structured 3-Row Cellular Plate, Clean Typography & Redundant Skill Omission (100% COMPLETE & GREEN - 69/69 Core Unit Tests, 33/33 Live Browser CDP Fuzz Steps Passed with 0 Errors, Quasar Build Exit Code 0) — `DNDSheet` (2026-10-29)**:
  * **What changed**:
    * **Actions & Traits Studio Ergonomic Overhaul (`ActionsEditor.vue`, `MonsterTextEditor.vue`, `ProcessTokens.ts`)**:
      * Eliminated collapsing "toggle advanced parameters" drawer button; execution parameters (Reach, Range, Shape, Cost, etc.) are directly visible and persistent while typing.
      * Fixed category tab truncation (`Actio...`, `Bonus Actio...`) via flexible wrapping and inline counter badges.
      * Replaced redundant external macro chips row with rich IDE-style Intellisense autocomplete directly inside `MonsterTextEditor.vue`, showing token keys and live evaluated values against the monster store.
      * Expanded token engine supporting `{CANTRIP_TIER}`, `{TIER}`, shorthand stats (`{STR_MOD}`, `{CHA_MOD}`, `{PROF}`, `{AC}`, `{HP}`), dynamic dice formulas with modifiers (`{1d10 + CHA_MOD}`, `{2d6 + STR_MOD}`), and quick attack/action composer presets.
      * Concise input labels augmented with insightful `<q-tooltip>` overlays.
    * **Folded Level Spellcasting Studio & Multiclassing (`ClassCastingEditor.vue`, `AutoSyncSpellcasting.ts`)**:
      * Eliminated single monolithic "All known spells" dropdown in favor of folded level thresholds (Cantrips, 1st Level through 9th Level).
      * Per-level slot inputs, cadence dropdowns (explicitly supporting `Long Rest`), Bonus Action switches, and dedicated per-level spell search pickers with individual cadences.
      * Arbitrary multi-class and subclass engine calculating combined spell slots, individual save DCs, and spell attacks (e.g. Fiend Warlock, Evocation Wizard, Draconic Sorcerer).
    * **Structured 3-Row Cellular Plate & Clean Typography (`WebRenderer.vue`, `app.scss`)**:
      * Implemented 3-row structured cellular plate for Spellcasting & Metamagic:
        * Row 1: Caster level & primary stat | Spell save DC & attack bonus | Spell slots & cadence | Prepared spells & interval.
        * Row 2: Metamagic header (Sorcery Points, refresh rate) | Flexible casting summary.
        * Row 3: Active metamagic options with Sorcery Point costs.
      * Synchronized `(Bonus Action)` display across traits and bottom spellcasting blocks.
      * Completely eliminated pill boxes and bulky borders around AC, HP, Speed, Senses, Languages, and individual spell entries.
    * **Skills Omission & Advantage Highlighting (`useTextRenderer.ts`)**:
      * Redundant skills already covered by Search, Study, Influence, or Hide are cleanly omitted from the `Skills` list to avoid duplicate clutter.
      * Whole advantage phrases (number, label, arrow) rendered in semantic green (`text-positive`) and disadvantage in semantic red (`text-negative`), prioritizing bold numbers over normal text weight.
    * **Verification & Test Proof**:
      * **Core Unit Tests (`npm test`)**: **69 / 69 passed (100% green)** in 385ms.
      * **Production Build (`npx quasar build`)**: Compiled cleanly to `dist/spa` with **exit code 0**.
      * **In-Browser Live CDP Fuzz Suite (`node test/exhaustive-ui-fuzz.js`)**: All **33 consecutive phases passed with 0 console errors and 0 runtime exceptions**.
      * **PWA Server**: Live on port 8080 (`http://localhost:8080/#/`).
  * **What was attempted and failed**: None.
  * **Current blockers**: None.
  * **Next safe command or experiment**: Direct user verification on [http://localhost:8080/#/](http://localhost:8080/#/).
