<template>
  <h3 class="section">{{ $t('editor.action.label') }}</h3>
  <div
    v-if="monster.multiattacks.length > 0"
    v-safe-html="multiattacks"
    class="multiattack"
  ></div>
  <div
    v-for="(attack, idx) in attacks"
    :key="idx"
    v-safe-html="attack"
    class="attack"
  ></div>
  <div
    v-for="(action, idx) in actions"
    :key="idx"
    v-safe-html="action"
    class="action"
    :class="{ 'sb-striped': action && action.length > 110 && !action.includes('sb-plate') }"
  ></div>
  <web-spell-plates
    v-if="resolvedSpellPlacement === 'after_actions'"
    v-bind="spellPlatesBind"
  />
  <div v-if="bonusActions.length > 0" class="bonus-actions">
    <h3 class="section">{{ $t('monster.bonusActions') }}</h3>
    <div
      v-for="(action, idx) in bonusActions"
      :key="idx"
      v-safe-html="action"
      class="action"
      :class="{ 'sb-striped': action && action.length > 110 && !action.includes('sb-plate') }"
    ></div>
  </div>
  <div
    v-if="blockStyle.mm2024 && monster.reactions.length > 0"
    class="reactions"
  >
    <h3 class="section">{{ $t('editor.reaction.label') }}</h3>
    <div
      v-for="(reaction, idx) in reactions"
      :key="idx"
      v-safe-html="reaction"
      class="action reaction"
      :class="{ 'sb-striped': reaction && reaction.length > 110 && !reaction.includes('sb-plate') }"
    ></div>
  </div>
  <div v-if="monster.legendaryActions.count > 0 || monster.legendaryActions.actions.length > 0" class="legendary-actions">
    <h3 class="section">{{ $t('editor.legendary.label') }}</h3>
    <div v-safe-html="legendaryPreamble" class="preamble"></div>
    <div
      v-for="(action, idx) in legendaryActions"
      :key="idx"
      v-safe-html="action"
      class="action legendary"
    ></div>
  </div>
  <div v-if="monster.mythicActions.actions.length > 0" class="mythic-actions">
    <h3 class="section">{{ $t('editor.mythic.label') }}</h3>
    <div v-safe-html="mythicPreamble" class="preamble"></div>
    <div
      v-for="(action, idx) in mythicActions"
      :key="idx"
      v-safe-html="action"
      class="action legendary"
    ></div>
  </div>
  <div
    v-if="blockStyle.mm2014 && monster.reactions.length > 0"
    class="reactions"
  >
    <h3 class="section">{{ $t('editor.reaction.label') }}</h3>
    <div
      v-for="(reaction, idx) in reactions"
      :key="idx"
      v-safe-html="reaction"
      class="action reaction"
      :class="{ 'sb-striped': reaction && reaction.length > 110 && !reaction.includes('sb-plate') }"
    ></div>
  </div>
  <div v-if="monster.lairActions.length > 0" class="lair-actions">
    <h3 class="section">{{ $t('editor.lair.label') }}</h3>
    <div v-safe-html="lairActionPreamble" class="preamble"></div>
    <ul>
      <li
        v-for="(lairAction, idx) in lairActions"
        :key="idx"
        v-safe-html="lairAction"
        class="action lair"
      ></li>
    </ul>
  </div>
  <div v-for="rt in randomTables" :key="rt.id" class="random-table" data-a4-owner="statblock">
        <h3 class="section">{{ rt.title || $t('editor.randomTables.defaultTitle') }}</h3>
        <table class="random-table-grid" :aria-label="rt.title || $t('editor.randomTables.defaultTitle')">
          <thead><tr><th scope="col">{{ rt.dice }}</th><th scope="col">{{ $t('editor.randomTables.result') }}</th></tr></thead>
          <tbody>
            <tr v-for="row in rt.sortedRows" :key="row.id">
              <td class="random-table-range">{{ row.min === row.max ? row.min : row.min + '–' + row.max }}</td><td v-safe-html="mechanicRichHtml(row.text)"></td>
            </tr>
            <tr v-if="rt.fallback"><td class="random-table-range">{{ $t('editor.randomTables.otherwise') }}</td><td>{{ rt.fallback }}</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="monster.regionalEffects.length > 0" class="regional-effects">
    <h3 class="section">{{ $t('editor.regional.label') }}</h3>
    <div v-safe-html="regionalEffectPreamble" class="preamble"></div>
    <ul>
      <li
        v-for="(effect, idx) in regionalEffects"
        :key="idx"
        v-safe-html="effect"
        class="action regional"
      ></li>
    </ul>
  </div>
  <div v-if="blockStyle.mm2014 && monster.inventory !== ''" class="inventory">
    <h3 class="section">{{ $t('editor.inventory.label') }}</h3>
    <div v-safe-html="inventory"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'
import WebSpellPlates from './WebSpellPlates.vue'
import { STATBLOCK_BODY } from './useStatblockBodyView'

// Actions through inventory as a fragment of the stat block (including the after-actions spell plate).
// Reads the view WebRenderer provides; styles come from the parent's namespaced sheet.
export default defineComponent({
  name: 'StatblockActions',
  components: { WebSpellPlates },
  setup() {
    const view = inject(STATBLOCK_BODY)
    if (!view) throw new Error('StatblockActions must render inside WebRenderer')
    return { ...view }
  },
})
</script>
