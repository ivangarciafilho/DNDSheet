<template>
  <div
    class="q-pa-xs rounded-borders bg-grey-9 text-white"
    style="border: 1px solid rgba(255, 255, 255, 0.15);"
  >
    <div class="row items-center justify-between q-px-xs q-pb-xs">
      <div class="text-caption text-weight-bold text-cyan-3 flex items-center">
        <q-icon name="view_headline" size="14px" class="q-mr-xs" />
        Category Row Splitting &amp; Disclose Order
      </div>
      <div class="row items-center q-gutter-x-sm">
        <q-checkbox
          v-model="monster.autoSortDefenses"
          v-help="'List short entries before long ones.'"
          dark
          dense
          size="xs" label="Auto-Sort Concise First"
          class="text-caption text-grey-4"
        >
          <q-tooltip>When checked, automatically sorts shorter/concise resistances first and complex conditions last. When unchecked, strictly preserves your authored order.</q-tooltip>
        </q-checkbox>
        <q-checkbox
          v-model="monster.autoSplitDefenses"
          v-help="'Break the defenses line automatically when it is too long.'"
          dark
          dense
          size="xs" label="Auto-Split on Line Overflow"
          class="text-caption text-grey-4"
        >
          <q-tooltip>Automatically splits Damage and Conditions into separate dedicated rows if the text exceeds the line</q-tooltip>
        </q-checkbox>
      </div>
    </div>

    <div class="row q-col-gutter-xs items-center q-px-xs">
      <div class="col-12 col-sm-4">
        <q-toggle
          v-model="monster.splitVulnRows"
          v-help="'Show vulnerabilities on their own lines.'"
          dark
          dense
          size="xs"
          color="negative" label="Split Vulnerabilities Row"
          class="text-caption"
        >
          <q-tooltip>Dedicated row for Damage Vulnerabilities and dedicated row for Condition Vulnerabilities</q-tooltip>
        </q-toggle>
      </div>
      <div class="col-12 col-sm-4">
        <q-toggle
          v-model="monster.splitResRows"
          v-help="'Show resistances on their own lines.'"
          dark
          dense
          size="xs"
          color="warning" label="Split Resistances Row"
          class="text-caption"
        >
          <q-tooltip>Dedicated row for Damage Resistances and dedicated row for Condition Resistances</q-tooltip>
        </q-toggle>
      </div>
      <div class="col-12 col-sm-4">
        <q-toggle
          v-model="monster.splitImmRows"
          v-help="'Show immunities on their own lines.'"
          dark
          dense
          size="xs"
          color="secondary" label="Split Immunities Row"
          class="text-caption"
        >
          <q-tooltip>Dedicated row for Damage Immunities and dedicated row for Condition Immunities</q-tooltip>
        </q-toggle>
      </div>
    </div>

    <!-- Category Order Chips -->
    <div class="row items-center q-gutter-x-xs q-mt-xs q-px-xs">
      <span class="text-caption text-grey-5">Category Precedence:</span>
      <q-chip
        v-for="(cat, cIdx) in currentCategoryOrder"
        :key="cat"
        dense
        size="sm"
        color="grey-8"
        text-color="white"
        class="text-capitalize"
      >
        <span class="q-mr-xs text-weight-bold">{{ cIdx + 1 }}.</span>
        {{ cat }}
        <q-btn flat round dense size="xs" icon="swap_horiz" class="q-ml-xs" @click.stop="swapCategory(cIdx)" />
      </q-chip>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { injectResistancesEditorState } from './useResistancesEditorState'

export default defineComponent({
  name: 'DefenseListControls',
  setup() {
    return injectResistancesEditorState()
  },
})
</script>
