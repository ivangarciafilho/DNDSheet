# Build 221 — Attack Sign Normalization, Prose Punctuation & Action Grammar

## Refreshed Source and Release Scope

Official base commit `ed91feb` (`docs: add Build 220 publication receipt`).
Build 221 advances branch `build185-repairs` to Build 221, continuing the rigorous per-build delivery doctrine.

This release addresses the visual statblock defects observed in complex construct/spellcasting statblocks (e.g. Light Iosan Warjack, Astral Binding, Exorcise):
1. Attack roll bonuses evaluated at 0 were displaying as bare `0` (e.g. `Melee Weapon Attack 0`) rather than canonical D&D 5e signed `+0`.
2. Action targeting lacking an explicit noun but containing relative clauses (`which you can see`) was dropping the target noun.
3. Nested parentheses in action-oriented passive skills created double parens `Search (8/-2, (10/+0, Perception))`.
4. Prose punctuation and distance notation contained artifacts like `10ft`, `0ft`, and whitespace before colons `On Success :`.

---

## Acceptance Packet (22 Tasks Across 5 Domains)

### Domain 1: Attack & Action Bonus Typography & Grammar
- **Task 1**: Attack bonus `+0` sign enforcement: `formatNumber(value, 'bonus')` in `src/core/domain/ability-grammar.ts` updated to check `value >= 0` so zero displays as signed `+0`.
- **Task 2**: Composer chain `signed(value)` in `src/core/domain/composer-chain.ts` updated to `value >= 0 ? `+${value}` : String(value)`.
- **Task 3**: Unit test in `test/core/AbilityGrammar.test.ts` verifying attack bonus of 0 renders as signed `+0` and not bare `0` (454/454 tests green).
- **Task 4**: Automated target noun fallback in `parseTargets` / `scopePhrase`: When target text begins with a relative clause (`which you can see`), defaults noun to `target` (singular) or `targets` (plural) based on count.

### Domain 2: Action Prose & Outcome Grammar Sanitization
- **Task 5**: Wired `sanitizeProsePunctuation` into `useProcessTokens.ts` for structured action descriptions and outcomes.
- **Task 6**: Elimination of colon leading whitespace: `On Success :` normalized to canonical `On Success:`.
- **Task 7**: Canonical distance formatting in action bodies: `10ft` normalized to `10 ft.` and `0ft` normalized to `0 ft.`.
- **Task 8**: Stripping of trailing punctuation artifacts (`.,`, `;,`) in action descriptions.
- **Task 9**: Elimination of redundant period preceding open parentheses in AC and descriptions (`14. (` -> `14 (`).

### Domain 3: Skill Action Group Parentheses & Notation Cleanup
- **Task 10**: Elimination of nested double parentheses in `formatGroupRow` (`src/components/rendering/useTextRenderer.ts`): Changed `${baseHtml}, (${parts.join('; ')})` to `${baseHtml}, ${parts.join('; ')}` so wrapping outer parentheses never nest `((...))`.
- **Task 11**: Clean display of passive skill combinations: e.g. `Search (8/-2, 10/+0, Perception)` instead of `Search (8/-2, (10/+0, Perception))`.
- **Task 12**: Insight / Perception skill bonus tag formatting with unicode advantage arrows.

### Domain 4: Speed Locomotion & Senses Distance Typography
- **Task 13**: Senses list distance unit normalization in `useTextRenderer.ts`: Normalizing `darkvision (60ft)` to `darkvision (60 ft.)`.
- **Task 14**: Speed rider distance unit normalization: Normalizing `5ft` and `40ft` in speed and locomotion riders.
- **Task 15**: Trait outcome distance normalization: Ensuring area of effect notations in traits adhere to `X ft.`.

### Domain 5: Documentation & Provenance Ledger
- **Task 16**: Update `build.json` to `"221"`.
- **Task 17**: Author `docs/roadmap/DNDSheet-Build221-Attack-Sign-and-Prose-Grammar.md`.
- **Task 18**: Update `docs/roadmap/DNDSheet-Implementation-Backlog.md` with Build 221 ledger.
- **Task 19**: Update `docs/roadmap/DNDSheet-Development-Handoffs.md` with Build 221 handoff.
- **Task 20**: Update `STACK_STATE.md` with Build 221 status.
- **Task 21**: Update `C:\Users\Administrador\.agents\local-ai-pipeline\AGENT_HANDOFF.md`.
- **Task 22**: 10-step per-build gate (`npm run gate`) passed on frozen source and verified across SPA and Pages.
