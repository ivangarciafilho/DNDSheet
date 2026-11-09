<template>
  <div id="char-sheet" class="character-sheet-card q-pa-md parchment-bg shadow-4">
    <!-- Top Portrait Banner (if top position selected) -->
    <div
      v-if="actor.portrait?.url && actor.portrait?.position === 'top'"
      class="text-center q-mb-md"
    >
      <img
        :src="actor.portrait.url"
        :alt="actor.portrait.caption || actor.name"
        class="portrait-banner shadow-2 rounded-borders"
      />
      <div v-if="actor.portrait.caption" class="text-caption text-italic text-grey-8 q-mt-xs">
        {{ actor.portrait.caption }}
      </div>
    </div>

    <!-- Header identity block -->
    <div class="char-header q-pb-sm q-mb-md border-bottom-heavy">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h4 text-weight-bolder text-red-10 font-nodesto">
            {{ actor.name || 'Unnamed Adventurer' }}
          </div>
          <div class="text-subtitle1 text-grey-9">
            Level {{ actor.level }} {{ actor.subclass ? actor.subclass + ' ' : '' }}{{ actor.class }} • {{ actor.race }}
          </div>
        </div>
        <div class="text-right">
          <q-badge color="red-9" class="text-subtitle2 q-pa-xs">
            Proficiency +{{ actor.proficiency }}
          </q-badge>
          <div class="text-caption text-grey-8 q-mt-xs">
            {{ actor.background }} • {{ actor.alignment }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main 3-column Layout -->
    <div class="row q-col-gutter-md">
      <!-- Left Column: Ability Scores, Saving Throws, Passives, Left Portrait -->
      <div class="col-12 col-md-3">
        <!-- Left Portrait (if left position selected) -->
        <div
          v-if="actor.portrait?.url && actor.portrait?.position === 'left'"
          class="text-center q-mb-sm"
        >
          <img
            :src="actor.portrait.url"
            :alt="actor.portrait.caption || actor.name"
            class="portrait-side shadow-2 rounded-borders full-width"
          />
          <div v-if="actor.portrait.caption" class="text-caption text-italic text-grey-8 q-mt-xs">
            {{ actor.portrait.caption }}
          </div>
        </div>

        <!-- Ability Scores Grid -->
        <div class="row q-col-gutter-xs q-mb-sm">
          <div
            v-for="stat in abilityKeys"
            :key="stat"
            class="col-4 col-md-6 text-center"
          >
            <div class="stat-box parchment-inner q-pa-xs q-mb-xs">
              <div class="text-overline text-weight-bold text-red-10">{{ stat }}</div>
              <div class="text-h5 text-weight-bolder">
                {{ formatMod(charStore.getModifier(stat)) }}
              </div>
              <div class="stat-score-bubble bg-grey-3 text-caption text-weight-bold">
                {{ actor.stats[stat] }}
              </div>
            </div>
          </div>
        </div>

        <!-- Saving Throws Box -->
        <div class="parchment-inner q-pa-xs q-mb-sm">
          <div class="text-overline text-weight-bold text-red-10 border-bottom-subtle q-mb-xs text-center">
            SAVING THROWS
          </div>
          <div
            v-for="stat in abilityKeys"
            :key="`sheet-save-${stat}`"
            class="row items-center justify-between q-px-xs text-caption"
          >
            <div class="row items-center q-gutter-xs">
              <span
                class="save-dot"
                :class="{ 'save-dot-active': actor.savingThrows && actor.savingThrows[stat] }"
              />
              <span :class="{ 'text-weight-bold': actor.savingThrows && actor.savingThrows[stat] }">
                {{ stat }}
              </span>
            </div>
            <span class="text-weight-bold">
              {{ formatMod(charStore.getSaveModifier(stat)) }}
            </span>
          </div>
        </div>

        <!-- Passive Senses -->
        <div class="parchment-inner q-pa-xs text-center">
          <div class="text-overline text-weight-bold text-red-10 border-bottom-subtle q-mb-xs">
            PASSIVE SENSES
          </div>
          <div class="row items-center justify-between q-px-xs text-caption">
            <span>Passive Perception</span>
            <span class="text-weight-bold">{{ 10 + charStore.getSkillModifier('Perception', 'WIS') }}</span>
          </div>
          <div class="row items-center justify-between q-px-xs text-caption">
            <span>Passive Investigation</span>
            <span class="text-weight-bold">{{ 10 + charStore.getSkillModifier('Investigation', 'INT') }}</span>
          </div>
          <div class="row items-center justify-between q-px-xs text-caption">
            <span>Passive Insight</span>
            <span class="text-weight-bold">{{ 10 + charStore.getSkillModifier('Insight', 'WIS') }}</span>
          </div>
        </div>
      </div>

      <!-- Center Column: Vitals, HP, Skills, Features -->
      <div class="col-12 col-md-5">
        <!-- Vitals Grid -->
        <div class="row q-col-gutter-xs text-center q-mb-sm">
          <div class="col-4">
            <div class="vital-box parchment-inner q-pa-xs">
              <div class="text-caption text-weight-bold text-grey-8">ARMOR CLASS</div>
              <div class="text-h5 text-weight-bold character-vital-value">
                {{ vitals.armorClass.value }}
              </div>
              <div class="text-caption text-grey-8" data-character-ac-provenance>{{ vitals.armorClass.kind === 'recorded' ? 'Recorded' : 'Estimate' }}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="vital-box parchment-inner q-pa-xs">
              <div class="text-caption text-weight-bold text-grey-8">INITIATIVE</div>
              <div class="text-h5 text-weight-bold character-vital-value">
                {{ formatMod(charStore.getModifier('DEX')) }}
              </div>
            </div>
          </div>
          <div class="col-4">
            <div class="vital-box parchment-inner q-pa-xs">
              <div class="text-caption text-weight-bold text-grey-8">SPEED</div>
              <div class="text-h5 text-weight-bold character-vital-value">{{ vitals.speed.value }} ft.</div>
              <div class="text-caption text-grey-8" data-character-speed-provenance>{{ vitals.speed.kind === 'recorded' ? 'Recorded' : 'Estimate' }}</div>
            </div>
          </div>
        </div>

        <div class="character-vital-sources text-caption q-mb-sm">
          <div>AC — {{ vitals.armorClass.label }}: {{ vitals.armorClass.provenance }}</div>
          <div>Speed — {{ vitals.speed.label }}: {{ vitals.speed.provenance }}</div>
        </div>

        <!-- HP Box -->
        <div class="parchment-inner q-pa-sm q-mb-sm">
          <div class="row justify-between text-caption text-weight-bold text-grey-8">
            <span>HIT POINTS</span>
            <span>Max: {{ actor.hp.max }}</span>
          </div>
          <div class="text-center text-h4 text-weight-bolder text-green-10 q-my-xs">
            {{ actor.hp.current }}
            <span v-if="actor.hp.temp > 0" class="text-body1 text-blue-9">
              (+{{ actor.hp.temp }} temp)
            </span>
          </div>
          <q-linear-progress
            :value="Math.max(0, Math.min(1, actor.hp.current / (actor.hp.max || 1)))"
            color="positive"
            track-color="grey-4"
            size="6px"
            rounded
          />
        </div>

        <!-- Hit Dice & Death Saves -->
        <div class="row q-col-gutter-xs q-mb-sm">
          <div class="col-6">
            <div class="parchment-inner q-pa-xs text-center">
              <div class="text-caption text-weight-bold text-grey-8">HIT DICE</div>
              <div class="text-subtitle1 text-weight-bold">
                {{ actor.hitDice.total - actor.hitDice.spent }} / {{ actor.hitDice.total }}d{{ actor.hitDice.die || 10 }}
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="parchment-inner q-pa-xs text-center">
              <div class="text-caption text-weight-bold text-grey-8">DEATH SAVES</div>
              <div class="text-caption q-mt-xs">
                <div>
                  <span class="text-positive text-weight-bold">
                    <span v-for="i in 3" :key="`ds-s-${i}`" :class="actor.deathSaves.successes >= i ? 'text-positive' : 'text-grey-5'">● </span>
                  </span>
                  Succ
                </div>
                <div>
                  <span class="text-negative text-weight-bold">
                    <span v-for="i in 3" :key="`ds-f-${i}`" :class="actor.deathSaves.failures >= i ? 'text-negative' : 'text-grey-5'">✕ </span>
                  </span>
                  Fail
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Skills List -->
        <div class="parchment-inner q-pa-xs q-mb-sm">
          <div class="text-overline text-weight-bold text-red-10 border-bottom-subtle q-mb-xs text-center">
            SKILLS
          </div>
          <div class="row q-col-gutter-none">
            <div
              v-for="skill in dndSkills"
              :key="`sheet-skill-${skill.name}`"
              class="col-6 q-px-xs"
            >
              <div class="row items-center justify-between text-caption py-1">
                <div class="row items-center q-gutter-xs">
                  <span
                    class="save-dot"
                    :class="{
                      'save-dot-active': actor.skills && actor.skills[skill.name]?.proficient,
                      'save-dot-expert': actor.skills && actor.skills[skill.name]?.expertise,
                    }"
                  />
                  <span :class="{ 'text-weight-bold': actor.skills && actor.skills[skill.name]?.proficient }">
                    {{ skill.name }}
                  </span>
                  <span class="text-grey-6 text-2xs">({{ skill.stat }})</span>
                </div>
                <span class="text-weight-bold">
                  {{ formatMod(charStore.getSkillModifier(skill.name, skill.stat)) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Features list -->
        <div class="parchment-inner q-pa-sm">
          <div class="text-overline text-weight-bold text-red-10 border-bottom-subtle q-mb-xs">
            FEATURES & TRAITS
          </div>
          <div v-if="actor.features.length === 0" class="text-caption text-grey-6 text-italic">
            No features added yet.
          </div>
          <div
            v-for="feat in actor.features"
            :key="feat.id"
            class="q-mb-xs"
          >
            <span class="text-weight-bold text-body2">{{ feat.name }}:</span>
            <span class="text-body2 text-grey-9 q-ml-xs">{{ feat.description }}</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Spellcasting, Spell Slots, Equipment, Right Portrait -->
      <div class="col-12 col-md-4">
        <!-- Right Portrait (if right position selected) -->
        <div
          v-if="actor.portrait?.url && actor.portrait?.position === 'right'"
          class="text-center q-mb-sm"
        >
          <img
            :src="actor.portrait.url"
            :alt="actor.portrait.caption || actor.name"
            class="portrait-side shadow-2 rounded-borders full-width"
          />
          <div v-if="actor.portrait.caption" class="text-caption text-italic text-grey-8 q-mt-xs">
            {{ actor.portrait.caption }}
          </div>
        </div>

        <!-- Spellcasting & Slots Box -->
        <div class="parchment-inner q-pa-xs q-mb-sm">
          <div class="text-overline text-weight-bold text-red-10 border-bottom-subtle q-mb-xs text-center">
            SPELLCASTING
          </div>
          <div class="row q-col-gutter-xs text-center q-mb-xs">
            <div class="col-4">
              <div class="text-2xs text-grey-7">ABILITY</div>
              <div class="text-caption text-weight-bolder">{{ actor.spellcasting?.ability || 'INT' }}</div>
            </div>
            <div class="col-4">
              <div class="text-2xs text-grey-7">SAVE DC</div>
              <div class="text-caption text-weight-bolder text-red-10">{{ computedSpellSaveDc }}</div>
            </div>
            <div class="col-4">
              <div class="text-2xs text-grey-7">ATTACK</div>
              <div class="text-caption text-weight-bolder text-red-10">{{ formatMod(computedSpellAttackBonus) }}</div>
            </div>
          </div>

          <!-- Spell Slots Grid -->
          <div v-if="hasSpellSlots" class="border-top-subtle q-pt-xs q-mt-xs">
            <div class="text-2xs text-weight-bold text-grey-8 text-center q-mb-xs">SPELL SLOTS</div>
            <div class="row q-col-gutter-xs text-center">
              <template v-for="lvl in 9" :key="`sheet-slot-${lvl}`">
                <div
                  v-if="actor.spellSlots?.max && actor.spellSlots.max[lvl - 1] > 0"
                  class="col-4 q-mb-xs"
                >
                  <div class="q-pa-2xs bg-grey-3 rounded-borders">
                    <div class="text-2xs text-weight-bold">Lvl {{ lvl }}</div>
                    <div class="text-caption text-weight-bolder">
                      {{ actor.spellSlots.current[lvl - 1] }} / {{ actor.spellSlots.max[lvl - 1] }}
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Spells List -->
          <div v-if="actor.spells && actor.spells.length > 0" class="border-top-subtle q-pt-xs q-mt-xs">
            <div class="text-2xs text-weight-bold text-grey-8 q-mb-xs">SPELLS</div>
            <div
              v-for="sp in actor.spells"
              :key="sp.id"
              class="row items-center justify-between text-caption q-py-2xs"
            >
              <div>
                <span v-if="sp.prepared" class="text-teal-9 text-weight-bold">★ </span>
                <span class="text-weight-bold">{{ sp.name }}</span>
                <span class="text-grey-7 text-2xs q-ml-xs">
                  ({{ sp.level === 0 ? 'Cantrip' : `Lvl ${sp.level}` }})
                </span>
              </div>
              <div v-if="sp.notes" class="text-2xs text-grey-6 text-italic">
                {{ sp.notes }}
              </div>
            </div>
          </div>
        </div>

        <!-- Equipment & Inventory -->
        <div class="parchment-inner q-pa-sm q-mb-sm">
          <div class="row items-center justify-between border-bottom-subtle q-mb-xs">
            <div class="text-overline text-weight-bold text-red-10">
              EQUIPMENT
            </div>
            <div class="text-caption text-grey-7">
              {{ totalWeight }} / {{ actor.stats.STR * 15 }} lb
            </div>
          </div>
          <div v-if="actor.inventory.length === 0" class="text-caption text-grey-6 text-italic">
            No items in inventory.
          </div>
          <q-list dense>
            <q-item
              v-for="item in actor.inventory"
              :key="item.id"
              class="q-px-none"
            >
              <q-item-section>
                <q-item-label class="text-body2">
                  <span v-if="item.equipped" class="text-teal-9 text-weight-bold">✓ </span>
                  {{ item.name }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="grey-6">x{{ item.quantity }}</q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { characterVitals } from 'src/core/domain/character-truth'
import { computed, defineComponent } from 'vue'
import { useCharacterStore } from 'src/stores/character-store'
import { DndStat, DND_SKILLS } from 'src/core/domain/types'

export default defineComponent({
  name: 'CharacterSheet',
  setup() {
    const charStore = useCharacterStore()
    const abilityKeys: DndStat[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

    const formatMod = (mod: number): string => {
      return mod >= 0 ? `+${mod}` : `${mod}`
    }

    const computedSpellSaveDc = computed(() => {
      const ability = charStore.actor.spellcasting?.ability || 'INT'
      return 8 + charStore.actor.proficiency + charStore.getModifier(ability)
    })

    const computedSpellAttackBonus = computed(() => {
      const ability = charStore.actor.spellcasting?.ability || 'INT'
      return charStore.actor.proficiency + charStore.getModifier(ability)
    })

    const hasSpellSlots = computed(() => {
      const maxSlots = charStore.actor.spellSlots?.max || []
      return maxSlots.some((s) => s > 0)
    })

    const totalWeight = computed(() => {
      return (charStore.actor.inventory || []).reduce(
        (sum, i) => sum + (i.quantity || 1) * (i.weight || 0),
        0
      )
    })

    return {
      actor: charStore.actor,
      vitals: computed(() => characterVitals(charStore.actor)),
      charStore,
      abilityKeys,
      dndSkills: DND_SKILLS,
      formatMod,
      computedSpellSaveDc,
      computedSpellAttackBonus,
      hasSpellSlots,
      totalWeight,
    }
  },
})
</script>

<style scoped>
.parchment-bg {
  background-color: #fdf6e2;
  border: 1px solid #d4c5a9;
  border-radius: 4px;
}
.parchment-inner {
  background-color: #f7ecd2;
  border: 1px solid #d9caa7;
  border-radius: 3px;
}
.border-bottom-heavy {
  border-bottom: 2px solid #58180d;
}
.border-bottom-subtle {
  border-bottom: 1px solid #a37b58;
}
.border-top-subtle {
  border-top: 1px solid #a37b58;
}
.stat-box {
  position: relative;
}
.stat-score-bubble {
  border-radius: 12px;
  width: 32px;
  margin: 0 auto;
  border: 1px solid #bbb;
}
.font-nodesto {
  font-family: 'Modesto Condensed', Georgia, serif;
}
.save-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid #777;
  background: #fff;
}
.save-dot-active {
  background: #58180d;
  border-color: #58180d;
}
.save-dot-expert {
  background: #e65100;
  border-color: #e65100;
  box-shadow: 0 0 2px #e65100;
}
.portrait-banner {
  max-height: 220px;
  max-width: 100%;
  object-fit: cover;
}
.portrait-side {
  max-height: 280px;
  object-fit: cover;
}
.text-2xs {
  font-size: 0.65rem;
  line-height: 0.85rem;
}
.q-pa-2xs {
  padding: 2px 4px;
}
.character-vital-value { color: #58180d; font-size: clamp(1rem, 2vw, 1.4rem); line-height: 1.25; white-space: nowrap; }
.character-vital-sources { color: #58180d; overflow-wrap: anywhere; line-height: 1.35; }
</style>
