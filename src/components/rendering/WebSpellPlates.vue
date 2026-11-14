<template>
  <div>
    <div v-if="innateSpellPlate.groups.length > 0" class="innate-spellcasting spellcasting-panel sb-plate">
      <div class="sb-row">
        <div class="sb-cell sb-head" data-help="entry-name" tabindex="0"><strong>Innate Spellcasting</strong> <span class="sb-qual">({{ innateSpellPlate.stat }})</span></div>
        <div class="sb-cell" data-help="spell-save-dc" tabindex="0">Spell Save DC <strong>{{ innateSpellPlate.save }}</strong></div>
        <div class="sb-cell" data-help="spell-attack" tabindex="0">Spell Attack <strong>{{ innateSpellPlate.attack }}</strong></div>
      </div>
      <div v-if="innateSpellPlate.processedNotes" class="sb-body sb-striped zebra-stripe-text" v-html="innateSpellPlate.processedNotes"></div>
      <div
        v-for="(group, groupIndex) in innateSpellPlate.groups"
        :key="'innate-level-' + groupIndex"
        class="sb-row sb-spell-row"
        :class="{ 'is-striped': groupIndex % 2 === 1, 'sb-striped': groupIndex % 2 === 1 }"
      >
        <div class="sb-cell sb-head sb-spell-head" data-help="spell-cadence" tabindex="0">{{ group.label }}:</div>
        <div class="sb-cell sb-spells-inline sb-grow">
          <span
            v-for="(spell, spellIndex) in group.spells"
            :key="'innate-spell-' + groupIndex + '-' + spellIndex"
            class="spell-inline-item"
          >
            <em class="spell-name">{{ spell.name }}</em>
            <span v-if="spell.tags" class="spell-tag-badge dnd-spell-comp" data-help="spell-components" tabindex="0"> ({{ spell.tags }})</span>
            <span v-if="spellIndex < group.spells.length - 1" class="spell-sep">, </span>
          </span>
        </div>
      </div>
    </div>

    <div v-if="spellPlate.levels.length > 0" class="class-spellcasting spellcasting sb-plate">
      <div class="sb-row sb-spell-header-row">
        <div class="sb-cell sb-head" data-help="entry-name" tabindex="0"><strong>{{ spellPlate.title }}</strong> <span class="sb-qual">({{ spellPlate.stat }})</span></div>
        <div class="sb-cell" data-help="spell-save-dc" tabindex="0">Spell Save DC <strong>{{ spellPlate.save }}</strong> · Spell Attack <strong>{{ spellPlate.attack }}</strong></div>
      </div>
      <div v-if="hasExplicitResourceRow" class="sb-row sb-spell-row sb-spell-resource-row" :class="{ 'sb-striped': isResourceRowStriped, 'is-striped': isResourceRowStriped }">
        <div class="sb-cell sb-spells-inline sb-grow" data-help="spell-slots" tabindex="0">
          <template v-for="(part, index) in spellRuleParts([spellPlate.resource, spellPlate.prepared].filter(Boolean).join('. ') + '.')" :key="index">
            <strong v-if="part.kind === 'number'">{{ part.text }}</strong><em v-else-if="part.kind === 'term'">{{ part.text }}</em><template v-else>{{ part.text }}</template>
          </template>
        </div>
      </div>
      <div v-if="spellPlate.consolidatedSummary" class="sb-row"><div class="sb-cell sb-grow">{{ spellPlate.consolidatedSummary }}</div></div>
      <div v-if="spellPlate.metamagic" class="sb-row sb-spell-row sb-spell-metamagic-row" :class="{ 'sb-striped': isMetamagicRowStriped, 'is-striped': isMetamagicRowStriped }">
        <div class="sb-cell sb-spells-inline sb-grow" style="border: none; padding: 2px 4px;" data-help="metamagic" tabindex="0">
          <strong>{{ spellPlate.metamagic.points }}</strong> Sorcery Points, regained on <em>{{ spellPlate.metamagic.refresh }}</em>.
          <div v-for="meta in spellPlate.metamagic.options" :key="meta.name" class="sb-metamagic-option">
            <strong v-if="meta.cost" :aria-label="meta.cost + ' Sorcery Points'">{{ meta.cost }}</strong>
            <span><template v-for="(part, index) in spellRuleParts(meta.effect || meta.name)" :key="index">
              <strong v-if="part.kind === 'number'">{{ part.text }}</strong><em v-else-if="part.kind === 'term'">{{ part.text }}</em><template v-else>{{ part.text }}</template>
            </template></span>
          </div>
        </div>
      </div>
      <div class="sb-row sb-spell-unified-row">
        <div class="sb-cell sb-spells-unified-cell sb-grow" style="border: none; padding: 0; width: 100%;">
          <div
            v-for="(row, rIdx) in primarySpellLevels"
            :key="'spell-level-' + row.sourceId + '-' + row.level"
            class="spell-level-line"
            :class="{ 'is-striped': isPrimarySpellLineStriped(rIdx), 'sb-striped': true, 'zebra-stripe-text': shouldStripeSpellLine(row) }"
          >
            <strong class="sb-spell-head" :data-help="row.level === 0 ? 'cantrips' : 'spell-slots'" tabindex="0">
              {{ row.heading }}
            </strong>
            <span
              v-for="(spell, spellIndex) in getPrimarySpells(row)"
              :key="'spell-' + row.level + '-' + spellIndex"
              class="spell-inline-item q-ml-xs"
            >
              <span v-if="spell.lead" class="spell-uses">{{ spell.lead }}</span><em class="spell-name">{{ spell.name }}</em><span v-if="spell.castingTime"> ({{ spell.castingTime }})</span><span v-if="spell.actionLabel" class="spell-action-label">{{ ' ' + spell.actionLabel }}</span>
              <span v-if="spell.tags" class="spell-tag-badge dnd-spell-comp" data-help="spell-components" tabindex="0"> ({{ spell.tags }})</span>
              <span v-if="spellIndex < getPrimarySpells(row).length - 1" class="spell-sep">, </span>
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="splitHighCadence && hasAnySecondarySpells"
        class="sb-row sb-spell-restricted-row"
        style="border-top: 1.5px solid var(--sb-border, #58180d);"
      >
        <div class="sb-cell sb-spells-restricted-cell sb-grow" style="border: none; padding: 0; width: 100%;">
          <div class="restricted-cell-header text-caption text-weight-bold text-italic text-grey-9 q-pa-xs">
            Restricted Spells
          </div>
          <div
            v-for="(row, secIdx) in secondarySpellLevels"
            :key="'sec-level-' + row.sourceId + '-' + row.level"
            class="spell-level-line"
            :class="{ 'is-striped': isSecondarySpellLineStriped(secIdx), 'sb-striped': true, 'zebra-stripe-text': shouldStripeSpellLine(row) }"
          >
            <strong class="sb-spell-head text-italic" tabindex="0">
              {{ row.heading }}
            </strong>
            <span
              v-for="(spell, spellIndex) in getSecondarySpells(row)"
              :key="'sec-spell-' + row.level + '-' + spellIndex"
              class="spell-inline-item q-ml-xs"
            >
              <span v-if="spell.lead" class="spell-uses">{{ spell.lead }}</span><em class="spell-name">{{ spell.name }}</em><span v-if="spell.castingTime"> ({{ spell.castingTime }})</span><span v-if="spell.actionLabel" class="spell-action-label">{{ ' ' + spell.actionLabel }}</span>
              <span v-if="!spell.lead && !row.heading.includes('/' + spell.restrictionCadence) && spell.restrictionCadence"> ({{ spell.restrictionCadence }})</span>
              <span v-if="spell.tags" class="spell-tag-badge dnd-spell-comp" data-help="spell-components" tabindex="0"> ({{ spell.tags }})</span>
              <span v-if="spellIndex < getSecondarySpells(row).length - 1" class="spell-sep">, </span>
            </span>
          </div>
        </div>
      </div>
      <div v-if="useCustomClassPreamble && sanitizedClassSpellcastingPreamble" class="sb-body sb-striped zebra-stripe-text" v-html="sanitizedClassSpellcastingPreamble"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { InnateSpellPlateModel, SpellPlateLevel, SpellPlateModel, SpellPlateSpell } from 'src/core/domain/spell-plate'

export default defineComponent({
  name: 'WebSpellPlates',
  props: {
    innateSpellPlate: { type: Object as PropType<InnateSpellPlateModel & { processedNotes?: string }>, required: true },
    spellPlate: { type: Object as PropType<SpellPlateModel>, required: true },
    primarySpellLevels: { type: Array as PropType<SpellPlateLevel[]>, required: true },
    secondarySpellLevels: { type: Array as PropType<SpellPlateLevel[]>, required: true },
    hasExplicitResourceRow: { type: Boolean, required: true },
    isResourceRowStriped: { type: Boolean, required: true },
    isMetamagicRowStriped: { type: Boolean, required: true },
    hasAnySecondarySpells: { type: Boolean, required: true },
    splitHighCadence: { type: Boolean, required: true },
    useCustomClassPreamble: { type: Boolean, required: true },
    sanitizedClassSpellcastingPreamble: { type: String, required: true },
    spellRuleParts: { type: Function as PropType<(text: string) => Array<{ kind: string; text: string }>>, required: true },
    getPrimarySpells: { type: Function as PropType<(row: SpellPlateLevel) => SpellPlateSpell[]>, required: true },
    getSecondarySpells: { type: Function as PropType<(row: SpellPlateLevel) => SpellPlateSpell[]>, required: true },
    isPrimarySpellLineStriped: { type: Function as PropType<(idx: number) => boolean>, required: true },
    isSecondarySpellLineStriped: { type: Function as PropType<(idx: number) => boolean>, required: true },
    shouldStripeSpellLine: { type: Function as PropType<(row: SpellPlateLevel) => boolean>, required: true },
  },
})
</script>
