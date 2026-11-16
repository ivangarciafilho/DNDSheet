<template>
  <!-- MM2024 Precedence: Defenses -> Speed -> Senses -> Languages -> Stats & Gear -> Passives/Checks -->
  <template v-if="blockStyle.mm2024">
    <!-- Unified Defense Panel per Scope (| Vulnerabilities | Resistances | Immunities) -->
    <template v-for="defSec in cascadingDefenses" :key="defSec.key">
      <div
        class="skill dnd-cascade-panel dnd-cellular-row dnd-defense-cascade-row"
        :class="['cascade-' + defSec.key, { 'zebra-stripe-text': defSec.isVerbose || isDefenseStriped(defSec.key), 'sb-striped': isDefenseStriped(defSec.key), 'is-striped': isDefenseStriped(defSec.key) }]"
        :data-defense-title="defSec.title"
      >
        <span class="name dnd-cascade-title" :data-help="defSec.key" tabindex="0">{{ defSec.scopeLabel }}</span>
        <span v-if="defSec.subTypeLabel" class="dnd-cascade-subtitle">{{ defSec.subTypeLabel }}</span>
        <div class="dnd-defense-unified-body">
          <span v-safe-html="defSec.formattedProse" class="dnd-defense-prose-text"></span>
        </div>
      </div>
    </template>

    <!-- Speed -->
    <div class="skill speed dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': speedStripe, 'is-striped': speedStripe }">
      <span class="name dnd-cascade-title" data-help="speed" tabindex="0">Speed</span>
      <div class="dnd-cascade-badges-wrap">
        <template v-if="(monster?.splitSpeedRiderRows || monster.speedTraversal?.splitRiderRows) && speedRiderBadges.length > 0">
          <template v-for="(spBadge, spIdx) in speedBaseBadges" :key="'sp-base-' + spIdx">
            <span v-safe-html="mechanicRichHtml(spBadge)" class="dnd-cascade-badge"></span>
            <span v-if="spIdx < speedBaseBadges.length - 1" class="text-grey-7 q-mr-xs">, </span>
          </template>
        </template>
        <template v-else>
          <template v-for="(spBadge, spIdx) in speedBadges" :key="'speed-badge-' + spIdx">
            <span v-safe-html="mechanicRichHtml(spBadge)" class="dnd-cascade-badge"></span>
            <span v-if="spIdx < speedBadges.length - 1" class="text-grey-7 q-mr-xs">, </span>
          </template>
        </template>
      </div>
    </div>
    <template v-if="(monster?.splitSpeedRiderRows || monster.speedTraversal?.splitRiderRows) && speedRiderBadges.length > 0">
      <div
        v-for="(spRider, srIdx) in speedRiderBadges"
        :key="'speed-sub-' + srIdx"
        class="dnd-vitals-indented-subrow"
      >
        <span class="dnd-subrow-bullet">↳</span>
        <span v-safe-html="mechanicRichHtml(spRider)" class="dnd-subrow-content"></span>
      </div>
    </template>

    <!-- Senses -->
    <div v-if="sensesBadges.length > 0" class="skill dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': sensesStripe, 'is-striped': sensesStripe }">
      <span class="name dnd-cascade-title" data-help="senses" tabindex="0">{{ $t('monster.senses') }}</span>
      <div class="dnd-cascade-badges-wrap">
        <span
          v-for="(sBadge, sIdx) in sensesBadges"
          :key="'sense-badge-' + sIdx"
          class="dnd-cascade-badge"
        ><span v-safe-html="mechanicRichHtml(sBadge)"></span><span v-if="sIdx < sensesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
      </div>
    </div>

    <!-- Languages placed directly adjacent to Senses -->
    <div class="skill dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': languagesStripe, 'is-striped': languagesStripe }">
      <span class="name dnd-cascade-title" data-help="languages" tabindex="0">{{ $t('monster.languages') }}</span>
      <div v-if="languagesBadges.length > 0" class="dnd-cascade-badges-wrap">
        <span
          v-for="(lBadge, lIdx) in languagesBadges"
          :key="'lang-badge-' + lIdx"
          class="dnd-cascade-badge"
        ><span v-safe-html="mechanicRichHtml(lBadge)"></span><span v-if="lIdx < languagesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
      </div>
      <span v-else class="dnd-cascade-badge">&mdash;</span>
    </div>

    <!-- Ability Scores 2024 -->
    <div
      class="stats dnd-stats-2024"
      role="region"
      aria-label="Ability Scores and Saving Throws"
      style="width: 100%; max-width: 100%; box-sizing: border-box;"
    >
      <div class="stat-table">
        <div class="header-label mod">{{ $t('editor.mod') }}</div>
        <div class="header-label save">{{ $t('editor.save') }}</div>
        <div class="stat one">
          {{ statsAndSavesByKey.STR?.stat?.toLowerCase() ?? 'str' }}
        </div>
        <div v-safe-html="statsAndSavesByKey.STR?.renderedScore ?? '10'" class="score one"></div>
        <div class="mod one">{{ statsAndSavesByKey.STR?.renderedModifier ?? '+0' }}</div>
        <div v-safe-html="statsAndSavesByKey.STR?.renderedSave ?? '+0'" class="save one"></div>
        <div class="stat two">
          {{ statsAndSavesByKey.INT?.stat?.toLowerCase() ?? 'int' }}
        </div>
        <div v-safe-html="statsAndSavesByKey.INT?.renderedScore ?? '10'" class="score two"></div>
        <div class="mod two">{{ statsAndSavesByKey.INT?.renderedModifier ?? '+0' }}</div>
        <div v-safe-html="statsAndSavesByKey.INT?.renderedSave ?? '+0'" class="save two"></div>
      </div>
      <div class="stat-table">
        <div class="header-label mod">{{ $t('editor.mod') }}</div>
        <div class="header-label save">{{ $t('editor.save') }}</div>
        <div class="stat one">
          {{ statsAndSavesByKey.DEX?.stat?.toLowerCase() ?? 'dex' }}
        </div>
        <div v-safe-html="statsAndSavesByKey.DEX?.renderedScore ?? '10'" class="score one"></div>
        <div class="mod one">{{ statsAndSavesByKey.DEX?.renderedModifier ?? '+0' }}</div>
        <div v-safe-html="statsAndSavesByKey.DEX?.renderedSave ?? '+0'" class="save one"></div>
        <div class="stat two">
          {{ statsAndSavesByKey.WIS?.stat?.toLowerCase() ?? 'wis' }}
        </div>
        <div v-safe-html="statsAndSavesByKey.WIS?.renderedScore ?? '10'" class="score two"></div>
        <div class="mod two">{{ statsAndSavesByKey.WIS?.renderedModifier ?? '+0' }}</div>
        <div v-safe-html="statsAndSavesByKey.WIS?.renderedSave ?? '+0'" class="save two"></div>
      </div>
      <div class="stat-table">
        <div class="header-label mod">{{ $t('editor.mod') }}</div>
        <div class="header-label save">{{ $t('editor.save') }}</div>
        <div class="stat one">
          {{ statsAndSavesByKey.CON?.stat?.toLowerCase() ?? 'con' }}
        </div>
        <div v-safe-html="statsAndSavesByKey.CON?.renderedScore ?? '10'" class="score one"></div>
        <div class="mod one">{{ statsAndSavesByKey.CON?.renderedModifier ?? '+0' }}</div>
        <div v-safe-html="statsAndSavesByKey.CON?.renderedSave ?? '+0'" class="save one"></div>
        <div class="stat two">
          {{ statsAndSavesByKey.CHA?.stat?.toLowerCase() ?? 'cha' }}
        </div>
        <div v-safe-html="statsAndSavesByKey.CHA?.renderedScore ?? '10'" class="score two"></div>
        <div class="mod two">{{ statsAndSavesByKey.CHA?.renderedModifier ?? '+0' }}</div>
        <div v-safe-html="statsAndSavesByKey.CHA?.renderedSave ?? '+0'" class="save two"></div>
      </div>
    </div>

    <!-- Gear 2024 -->
    <div
      v-if="
        monster.inventory !== '' &&
        monster.inventory !== '<br>'
      "
      class="skill dnd-cascade-panel dnd-cellular-row"
      :class="{ 'sb-striped': vitalsStripingMap['gear'], 'is-striped': vitalsStripingMap['gear'] }"
    >
      <span class="name dnd-cascade-title" data-help="gear" tabindex="0">{{ $t('monster.gear') }}</span>
      <div v-safe-html="inventory" class="dnd-cascade-badges-wrap"></div>
    </div>

    <!-- Passives / Checks 2024 -->
    <template v-for="group in actionPassivesGroups" :key="group.name">
      <div class="skill dnd-cascade-panel dnd-cellular-row" :class="['cascade-skill-' + group.scopeLabel.toLowerCase(), { 'sb-striped': shouldStripeVital(group.scopeLabel, group.skills) }]">
        <span class="name dnd-cascade-title" :data-help="group.tip ? undefined : group.scopeLabel.toLowerCase()" tabindex="0">{{ group.scopeLabel }}<q-tooltip v-if="group.tip" class="dnd-tip" max-width="320px">{{ group.tip }}</q-tooltip></span>
        <span v-if="group.subTypeLabel && group.subTypeLabel !== 'Action'" class="dnd-cascade-subtitle">{{ group.subTypeLabel }}</span>
        <div v-safe-html="group.skills" class="dnd-cascade-badges-wrap"></div>
      </div>
    </template>
  </template>

  <!-- MM2014 Classic Order -->
  <template v-else>
    <div class="skill speed dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': speedStripe }">
      <span class="name dnd-cascade-title" data-help="speed" tabindex="0">Speed</span>
      <div class="dnd-cascade-badges-wrap">
        <template v-if="monster.splitSpeedRiderRows && speedRiderBadges.length > 0">
          <template v-for="(spBadge, spIdx) in speedBaseBadges" :key="'speed-base-14-' + spIdx">
            <span v-safe-html="mechanicRichHtml(spBadge)" class="dnd-cascade-badge"></span>
            <span v-if="spIdx < speedBaseBadges.length - 1" class="text-grey-7 q-mr-xs">, </span>
          </template>
        </template>
        <template v-else>
          <template v-for="(spBadge, spIdx) in speedBadges" :key="'speed-badge-' + spIdx">
            <span v-safe-html="mechanicRichHtml(spBadge)" class="dnd-cascade-badge"></span>
            <span v-if="spIdx < speedBadges.length - 1" class="text-grey-7 q-mr-xs">, </span>
          </template>
        </template>
      </div>
    </div>
    <template v-if="monster.splitSpeedRiderRows && speedRiderBadges.length > 0">
      <div
        v-for="(riderBadge, rIdx) in speedRiderBadges"
        :key="'speed-rider-subrow-14-' + rIdx"
        class="skill speed dnd-cascade-panel dnd-cellular-row dnd-vitals-indented-subrow"
        :class="{ 'sb-striped': speedStripe }"
      >
        <span class="dnd-subrow-bullet" aria-hidden="true">↳</span>
        <div class="dnd-cascade-badges-wrap">
          <span v-safe-html="mechanicRichHtml(riderBadge)" class="dnd-cascade-badge"></span>
        </div>
      </div>
    </template>
    <div class="row no-wrap" style="width: 100%">
      <div v-for="stat in stats" :key="stat.stat" class="stat-container">
        <div class="stat-name">{{ stat.stat }}</div>
        <div class="stat">
          <div v-safe-html="stat.renderedScore" class="score"></div>
          <div class="modifier">({{ stat.renderedModifier }})</div>
        </div>
      </div>
    </div>
    <div v-if="editorStore?.visualTemplate !== 'modern' && saves !== ''" class="skill dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': shouldStripeVital('Saving Throws', saves) }">
      <span class="name dnd-cascade-title" data-help="saves" tabindex="0">{{ $t('monster.saves') }}</span>
      <div v-safe-html="saves" class="dnd-cascade-badges-wrap"></div>
    </div>
    <template v-for="defSec in cascadingDefenses" :key="defSec.key">
      <div
        class="skill dnd-cascade-panel dnd-cellular-row dnd-defense-cascade-row"
        :class="['cascade-' + defSec.key, { 'zebra-stripe-text': defSec.isVerbose || shouldStripeVital(defSec.scopeLabel, defSec.formattedProse), 'sb-striped': shouldStripeVital(defSec.scopeLabel, defSec.formattedProse) }]"
        :data-defense-title="defSec.title"
      >
        <span class="name dnd-cascade-title" :data-help="defSec.key" tabindex="0">{{ defSec.scopeLabel }}</span>
        <span v-if="defSec.subTypeLabel" class="dnd-cascade-subtitle">{{ defSec.subTypeLabel }}</span>
        <div class="dnd-defense-unified-body">
          <span v-safe-html="defSec.formattedProse" class="dnd-defense-prose-text"></span>
        </div>
      </div>
    </template>
    <div v-if="sensesBadges.length > 0" class="skill dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': sensesStripe }">
      <span class="name dnd-cascade-title" data-help="senses" tabindex="0">{{ $t('monster.senses') }}</span>
      <div class="dnd-cascade-badges-wrap">
        <span
          v-for="(sBadge, sIdx) in sensesBadges"
          :key="'sense-badge-' + sIdx"
          class="dnd-cascade-badge"
        ><span v-safe-html="mechanicRichHtml(sBadge)"></span><span v-if="sIdx < sensesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
      </div>
    </div>
    <div class="skill dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': languagesStripe }">
      <span class="name dnd-cascade-title" data-help="languages" tabindex="0">{{ $t('monster.languages') }}</span>
      <div v-if="languagesBadges.length > 0" class="dnd-cascade-badges-wrap">
        <span
          v-for="(lBadge, lIdx) in languagesBadges"
          :key="'lang-badge-' + lIdx"
          class="dnd-cascade-badge"
        ><span v-safe-html="mechanicRichHtml(lBadge)"></span><span v-if="lIdx < languagesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
      </div>
      <span v-else class="dnd-cascade-badge">&mdash;</span>
    </div>
    <template v-for="group in actionPassivesGroups" :key="group.name">
      <div class="skill dnd-cascade-panel dnd-cellular-row" :class="['cascade-skill-' + group.scopeLabel.toLowerCase(), { 'sb-striped': shouldStripeVital(group.scopeLabel, group.skills) }]">
        <span class="name dnd-cascade-title" :data-help="group.tip ? undefined : group.scopeLabel.toLowerCase()" tabindex="0">{{ group.scopeLabel }}<q-tooltip v-if="group.tip" class="dnd-tip" max-width="320px">{{ group.tip }}</q-tooltip></span>
        <span v-if="group.subTypeLabel && group.subTypeLabel !== 'Action'" class="dnd-cascade-subtitle">{{ group.subTypeLabel }}</span>
        <div v-safe-html="group.skills" class="dnd-cascade-badges-wrap"></div>
      </div>
    </template>
  </template>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'
import { STATBLOCK_VITALS } from './useStatblockVitalsView'

// Vitals rows for both layouts (2024 precedence and 2014 classic order) as a fragment of the stat block.
// Reads the view WebRenderer provides; styles come from the parent's namespaced sheet.
export default defineComponent({
  name: 'StatblockVitals',
  setup() {
    const view = inject(STATBLOCK_VITALS)
    if (!view) throw new Error('StatblockVitals must render inside WebRenderer')
    return { ...view }
  },
})
</script>
