# ADR-0001: Hexagonal Architecture and Headless Core Decoupling

## Status
Accepted

## Date
2026-10-24

## Context
The upstream reference application (`5e-monster-maker`) tightly coupled core D&D 5e computational rules (7-stage DMG CR arithmetic, 3-round offensive DPR simulations, defensive effective HP/AC scaling, schema migrations across 11 versions, and token parsing) inside Vue 3 composition functions (`useCr.ts`, `useProcessTokens.ts`) and Pinia stores (`monster-store.ts`).

This tight coupling introduced several significant challenges:
1. **Testing Friction**: Core game logic could not be tested without spinning up full browser/DOM mocks, Vue reactivity contexts, and Vue I18n instances.
2. **Reusability Limitations**: The calculation engine could not be utilized in serverless functions, background Web Workers, headless CLI tools, or alternative client frontends (e.g., native apps or character sheet viewers).
3. **Fragility During Refactoring**: UI visual changes frequently risked inadvertently altering mathematical formulas or schema migration sequencing.

## Decision
We decouple all domain models, reference lookup tables, calculation engines, schema migrations, and token processing into a framework-agnostic headless core under `src/core/`:

1. **Domain Layer (`src/core/domain/`)**:
   - `types.ts`: Pure TypeScript domain contracts, entities, and factories (`Monster`, `DndAttack`, `MonsterAction`, `CrDamageInfo`).
   - `cr-tables.ts`: Pure DMG reference data tables and range lookup functions (`CR`, `getCrByDamage`, `getCrByHp`, `getCrByAc`, `getCrByAttack`, `getCrByDc`, `getCrByNumber`, `getCrByString`).
   - `math-utils.ts`: Pure D&D 5e dice mechanics, stat modifiers, proficiency bonuses, and bonus string rendering (`avgHP`, `avgRoll`, `statModifier`, `renderBonus`).

2. **Use Case Layer (`src/core/usecases/`)**:
   - `CalculateCr.ts`: Framework-agnostic DMG CR solver executing the 3-round DPR simulation, legendary combo maximization, offensive/defensive steps, and composite CR determination.
   - `MigrateMonsterSchema.ts`: Zero-dependency sequential schema migration pipeline (v1 through v11) with data sanitization.
   - `ProcessTokens.ts`: Headless token substitution engine parsing `{monster.hp}`, `{#d#+mod}`, `{DC:STAT}`, `{A:STAT}`, `{NAME}`, `{XP:CR}`, and generic monster properties.

3. **Presentation Adapters (`src/components/cr/useCr.ts`, `src/components/rendering/useProcessTokens.ts`)**:
   - The UI composition functions act as thin reactive adapters delegating directly to pure use cases, binding Vue reactivity (`computed`), Pinia stores (`useMonsterStore`, `useSpellsStore`), and internationalization (`vue-i18n`) without duplicating logic.

## Consequences

### Positive
- **Instant Headless Testing**: Core logic is verified using Node 22 native test runner (`node --experimental-strip-types --test`) in ~200ms with zero heavy runner dependencies.
- **100% Backward Compatibility**: Full compatibility is preserved with existing `.5emm.json` file schemas (v1–v11) and Quasar UI components.
- **Portability**: Headless core can be run in Web Workers or server-side without modification.
- **Maintainability**: Reduced `src/components/cr/useCr.ts` from 829 lines to ~100 lines of pure adapter glue code.

### Negative / Trade-offs
- Requires passing state snapshots (`monsterStore.$state`) into core use cases instead of mutating reactive store properties directly within calculation routines.
