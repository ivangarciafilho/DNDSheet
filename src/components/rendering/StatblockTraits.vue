<template>
  <h3 v-if="blockStyle.mm2024 && (hasGroupedTraits || monster.spellcasting?.standard?.length > 0 || monster.spellcasting?.atWill?.length > 0)" class="section first">
    {{ $t('editor.traits.label') }}
  </h3>
  <div class="traits">
    <!-- Standard Traits -->
    <div
      v-for="(trait, idx) in sanitizedGroupedTraits.standard"
      :key="'trait-std-' + idx"
      v-safe-html="trait"
      class="trait"
      :class="{ 'sb-striped': trait && trait.length > 110 && !trait.includes('sb-plate') }"
    ></div>

    <!-- Dedicated Recharge Sections -->
    <template v-for="sec in sanitizedGroupedTraits.rechargeSections" :key="'sec-' + sec.section">
      <h4 class="sub-section-header">{{ sec.section }}</h4>
      <div
        v-for="(trait, idx) in sec.traits"
        :key="'trait-sec-' + idx"
        v-safe-html="trait"
        class="trait"
        :class="{ 'sb-striped': trait && trait.length > 110 && !trait.includes('sb-plate') }"
      ></div>
    </template>

    <!-- Conditionals Sub-Sections -->
    <template v-for="cond in sanitizedGroupedTraits.conditionals" :key="'cond-' + cond.trigger">
      <h4 class="sub-section-header">Conditionals (<span v-safe-html="mechanicRichHtml(cond.trigger)"></span>)</h4>
      <div
        v-for="(trait, idx) in cond.traits"
        :key="'trait-cond-' + idx"
        v-safe-html="trait"
        class="trait"
        :class="{ 'sb-striped': trait && trait.length > 110 && !trait.includes('sb-plate') }"
      ></div>
    </template>

    <!-- Mythic Trait -->
    <div
      v-if="monster.mythicActions.actions.length > 0"
      v-safe-html="mythicTrait"
      class="trait"
    ></div>

    <!-- Innate and class casting share the plate grammar but retain separate resource semantics. -->
    <web-spell-plates
      v-if="resolvedSpellPlacement === 'with_traits'"
      v-bind="spellPlatesBind"
    />
  </div>
  <div
    v-if="monster.paragonConfig?.enabled || (monster.paragonConfig?.poolCount && monster.paragonConfig.poolCount > 1)"
    class="paragon-pool-filter-bar"
  >
    <span class="filter-label">Stage {{ monster.paragonConfig?.phaseName || 'Pool' }}:</span>
    <button
      type="button"
      class="pool-filter-btn"
      :class="{ active: !monster.paragonConfig.activePoolFilter || monster.paragonConfig.activePoolFilter === 'all' }"
      @click="monster.paragonConfig.activePoolFilter = 'all'"
    >
      All {{ monster.paragonConfig?.phaseName || 'Pool' }}s
    </button>
    <button
      v-for="p in (monster.paragonConfig.poolCount || 2)"
      :key="'pool-btn-' + p"
      type="button"
      class="pool-filter-btn"
      :class="{ active: monster.paragonConfig.activePoolFilter === `${p}` }"
      @click="monster.paragonConfig.activePoolFilter = `${p}`"
    >
      {{ monster.paragonConfig?.phaseName || 'Pool' }} {{ p }}
    </button>
  </div>
  <web-spell-plates
    v-if="resolvedSpellPlacement === 'before_actions'"
    v-bind="spellPlatesBind"
  />
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'
import WebSpellPlates from './WebSpellPlates.vue'
import { STATBLOCK_BODY } from './useStatblockBodyView'

// Traits (standard, recharge sections, conditionals, mythic), the with-traits and before-actions spell plates,
// and the paragon pool filter, as a fragment of the stat block. Styles come from the parent's namespaced sheet.
export default defineComponent({
  name: 'StatblockTraits',
  components: { WebSpellPlates },
  setup() {
    const view = inject(STATBLOCK_BODY)
    if (!view) throw new Error('StatblockTraits must render inside WebRenderer')
    return { ...view }
  },
})
</script>
