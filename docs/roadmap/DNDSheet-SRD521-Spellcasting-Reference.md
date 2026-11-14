# SRD 5.1 (2014) vs SRD 5.2.1 (2024) Spellcasting Reference (`A12.0` / `BS-29` / `BS-30`)

- **Purpose:** Authoritative table audit and verification matrix backing `AutoSyncSpellcasting.ts`, `casting-source-selection.ts`, `casting-projection.ts`, and `ClassCastingEditor.vue`.
- **Related Tasks:** `A12.0`, `A12.9`, `A12.10`, `B8.2`
- **Last Verified:** Build 248 (2026-11-14)

## 1. Base-Class Cantrip & Prepared/Known Progressions (`BS-29`)

### 2014 Ruleset (`SRD 5.1` / `PHB 2014`)
- **Wizard:** Cantrips `[3..5]` (steps at L4 -> 4, L10 -> 5); Prepared `max(1, level + INT mod)`
- **Cleric:** Cantrips `[3..5]` (L4 -> 4, L10 -> 5); Prepared `max(1, level + WIS mod)`
- **Druid:** Cantrips `[2..4]` (L4 -> 3, L10 -> 4); Prepared `max(1, level + WIS mod)`
- **Bard (Known):** Cantrips `[2..4]` (L4 -> 3, L10 -> 4); Known `[4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22]`
- **Sorcerer (Known):** Cantrips `[4..6]` (L4 -> 5, L10 -> 6); Known `[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15]`
- **Warlock (Known, Pact Magic):** Cantrips `[2..4]` (L4 -> 3, L10 -> 4); Known `[2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]`
- **Paladin (Half Caster, onset L2):** Cantrips `0`; Prepared `level < 2 ? 0 : max(1, floor(level/2) + CHA mod)`
- **Ranger (Half Caster, Known, onset L2):** Cantrips `0`; Known `[0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11]`
- **Artificer (Special Half Caster):** Cantrips `[2..4]` (L10 -> 3, L14 -> 4); Prepared `max(1, floor(level/2) + INT mod)`; L1 slots `[2]`
- **Third Casters (`Eldritch Knight` / `Arcane Trickster`, onset L3):** Known `[0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13]`

### 2024 Ruleset (`SRD 5.2.1` / `PHB 2024`)
Key ruleset differences verified in code (`AutoSyncSpellcasting.ts`):
- **Wizard (Prepared table, L1):** Cantrips `[3..5]` (L4 -> 4, L10 -> 5); Prepared `[4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 25]`
- **Cleric (Prepared table, L1):** Cantrips `[3..5]` (L4 -> 4, L10 -> 5); Prepared `[4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 22]`
- **Druid (Prepared table, L1):** Cantrips `[2..4]` (L4 -> 3, L10 -> 4); Prepared `[4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 22]`
- **Bard (Prepared in 2024):** Cantrips `[2..4]` (L4 -> 3, L10 -> 4); Prepared `[4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 22]`
- **Sorcerer (Prepared in 2024):** Cantrips `[4..6]` (L4 -> 5, L10 -> 6); Prepared `[2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21, 22, 22]`
- **Warlock (Prepared in 2024):** Cantrips `[2..4]`; Prepared `[2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]`
- **Paladin (Prepared starting L1, `[2]` slots at L1):** Cantrips `0`; Prepared `[2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15]`; highest slot L1 = `1`
- **Ranger (Prepared starting L1, `[2]` slots at L1):** Cantrips `0`; Prepared `[2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15]`; highest slot L1 = `1`

> Note: When a document carries `provenance.ruleset === 'unknown'` and a source has no explicit `rulesEdition`, callers use the active policy fallback (`2014` for backward-compatible metric calculations unless `2024` is explicitly configured or requested via `resolveRulesPolicy`) and disclose provenance transparently (`legacy` vs `SRD 5.1 (2014)` vs `SRD 5.2.1 (2024)`).

## 2. Subclass Expanded Spell Lists (`BS-29`)
Verified in `src/core/domain/catalogs/subclass-spells.ts` and `AutoSyncSpellcasting.ts`:
- **Cleric (Life Domain):** Bless, Cure Wounds (1), Aid, Lesser Restoration (3), Mass Healing Word, Revivify (5), Aura of Life, Death Ward (7), Greater Restoration, Mass Cure Wounds (9).
- **Paladin (Oath of Devotion):** Protection from Evil and Good, Shield of Faith (3), Aid, Zone of Truth (5), Beacon of Hope, Dispel Magic (9), Freedom of Movement, Guardian of Faith (13), Commune, Flame Strike (17).
- **Warlock (Fiend Patron):** Burning Hands, Command (3), Scorching Ray, Suggestion (3/5), Fireball, Stinking Cloud (5), Fire Shield, Wall of Fire (7), Flame Strike, Hallow / Insect Plague (9).
- Plus Sorcerer / Druid / Wizard catalog entries checked via `getCatalogSubclassesForClass` and `planSubclassExpandedSpells`.
- **BS-07 Regression Check:** `spellcasting.subclass` and `spellcasting.classes[].subclass` are persisted on store state, preserved in `MigrateMonsterSchema`, and survive page reload (`test/shared-casting-editor-browser-smoke.js` + `AutoSyncSpellcasting.test.ts`).

## 3. Multiclass Slot Table (`BS-30`)
- Standard Shared Pool sums:
  - Full Casters (`Bard`, `Cleric`, `Druid`, `Sorcerer`, `Wizard`): `+1` per level
  - Half Casters (`Paladin`, `Ranger`):
    - **2014:** `Math.floor(level / 2)`
    - **2024:** `Math.ceil(level / 2)` (matching half-caster Level 1 spellcasting onset)
  - `Artificer`: `Math.ceil(level / 2)` in both editions
  - Third Casters (`Eldritch Knight`, `Arcane Trickster`): `Math.floor(level / 3)` (matching PHB/SRD multiclass table weighting); `FULL_CASTER_SLOTS[combinedCasterLevel]` looks up the combined slot array `[1st..9th]`.
- **Warlock Pact Magic Isolation:** Warlock levels NEVER add to `combinedCasterLevel`; `warlockSlots` stay separate in `pactPools` alongside `standardSlots` (`sharedPool`).
- **Custom Sources:** Non-SRD class names (`entry.contribution.mode !== 'custom'`) invent `0` automatic slots (`AutoSyncSpellcasting.ts` L482).
