<template>
  <div class="web-renderer-root" :class="{ 'in-a4-mode': editorStore?.a4PreviewMode }">
    <!-- Hardware-Accelerated Luminance-to-Alpha SVG Filters for Grayscale Layer Masking (Works on Opaque PNG/JPG) -->
    <svg width="0" height="0" style="position: absolute; pointer-events: none; overflow: hidden;" aria-hidden="true">
      <defs>
        <filter id="a4-luminance-to-alpha" color-interpolation-filters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0.2126 0.7152 0.0722 0 0"
          />
        </filter>
        <filter id="a4-luminance-to-alpha-invert" color-interpolation-filters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    -0.2126 -0.7152 -0.0722 1 0"
          />
        </filter>
      </defs>
    </svg>

    <a4-preview-toolbar :a4-page-overflow-px="a4PageOverflowPx" :print-a4-sheet="printA4Sheet" :open-layer-studio="openLayerStudio" />

    <!-- Scaled A4 Page or Fluid Container -->
    <div
      ref="a4ViewportRef"
      :class="editorStore?.a4PreviewMode ? 'a4-preview-viewport' : 'standard-viewport'"
    >
      <div :class="editorStore?.a4PreviewMode ? 'a4-scale-stage' : ''" :style="editorStore?.a4PreviewMode ? a4ScaleStageStyle : undefined">
        <div
          ref="a4PageRef"
          :class="editorStore?.a4PreviewMode ? [
            'a4-page-sheet',
            'a4-' + editorStore.a4Orientation,
            'a4-layout-' + resolvedA4Layout,
            { 'a4-compact': editorStore.a4CompactDensity },
            'theme-' + (editorStore?.visualTheme || 'wotc')
          ] : 'statblock-container'"
        >
          <!-- A4 Composition Layers (Unified Stack with Dynamic Descending Z-Index) -->
          <template v-if="editorStore?.a4PreviewMode">
            <div
              v-for="layer in a4AllCustomLayers"
              :key="layer.id"
              class="a4-comp-layer"
              :class="['a4-layer-' + layer.id, layer.type === 'background' ? 'a4-bg-layer' : 'a4-fg-layer']"
              :style="getLayerStyle(layer)"
            >
              <div
                v-if="layer.gradientOverlay?.enabled"
                class="a4-layer-gradient-overlay"
                :style="getGradientOverlayStyle(layer.gradientOverlay)"
              ></div>
              <div
                v-if="layer.showTextOverlay && layer.overlayText"
                class="a4-layer-text-overlay"
                :style="getLayerTextStyle(layer)"
              >
                {{ layer.overlayText }}
              </div>
            </div>
          </template>

          <!-- Hero Artwork Banner (if A4 mode + stacked layout + hasPortrait) -->
          <div
            v-if="editorStore?.a4PreviewMode && hasPortrait && resolvedA4Layout === 'stacked'"
            class="a4-hero-banner"
            :style="a4PortraitStyle"
          >
            <div class="portrait-img-container relative-position" :style="portraitCropContainerStyle">
              <img :src="monster.portrait?.url" :alt="monster.name" class="a4-hero-img" :style="portraitImgStyle" />
              <div
                v-if="portraitLayerObj?.gradientOverlay?.enabled"
                class="a4-layer-gradient-overlay"
                :style="getGradientOverlayStyle(portraitLayerObj.gradientOverlay)"
              ></div>
            </div>
            <div v-if="monster.portrait?.caption" class="a4-portrait-caption">
              {{ monster.portrait?.caption }}
            </div>
          </div>

          <!-- Statblock Wrapper with Portrait (Retains #render for 100% test compatibility) -->
          <div
            id="render"
            ref="renderRoot"
            class="statblock-wrapper"
            :class="{
              'has-portrait': hasPortrait && (!editorStore?.a4PreviewMode || (resolvedA4Layout !== 'stacked' && resolvedA4Layout !== 'statblock_only')),
              'a4-statblock-wrapper': editorStore?.a4PreviewMode
            }"
            :style="editorStore?.a4PreviewMode ? a4StatblockWrapperStyle : undefined"
          >
            <!-- Left Portrait -->
            <div
              v-if="hasPortrait && (!editorStore?.a4PreviewMode || (resolvedA4Layout !== 'stacked' && resolvedA4Layout !== 'statblock_only')) && (monster.portrait?.position === 'left' || (!monster.portrait?.position && editorStore?.a4PreviewMode))"
              class="monster-portrait portrait-left"
              :class="{ 'portrait-frameless': monster.portrait?.frameless }"
              :style="editorStore?.a4PreviewMode ? a4PortraitStyle : portraitStyle"
            >
              <div class="portrait-img-container relative-position" :style="portraitCropContainerStyle">
                <img :src="monster.portrait?.url" :alt="monster.name" class="portrait-img" :style="portraitImgStyle" />
                <div
                  v-if="editorStore?.a4PreviewMode && portraitLayerObj?.gradientOverlay?.enabled"
                  class="a4-layer-gradient-overlay"
                  :style="getGradientOverlayStyle(portraitLayerObj.gradientOverlay)"
                ></div>
              </div>
              <div v-if="monster.portrait?.caption" class="portrait-caption">
                {{ monster.portrait?.caption }}
              </div>
            </div>

            <!-- Main Statblock -->
            <div ref="statblockFrame" :class="{ 'a4-fit-active': statblockFitActive }" :style="statblockFrameStyle">
            <div
              ref="statblockContent"
              class="statblock"
              :class="[
                blockStyle,
                {
                  'modern-modular': editorStore?.visualTemplate === 'modern',
                  'has-custom-bg-opacity': editorStore?.a4PreviewMode && (editorStore?.a4StatblockOpacity ?? 100) < 100
                },
                `theme-${editorStore?.visualTheme || 'wotc'}`
              ]"
              :style="editorStore?.a4PreviewMode ? fittedStatblockStyle : columns"
            >
      <div v-if="monster.compactNameplate" class="monster-nameplate-panel unified-top-plate compact-nameplate">
        <div class="compact-plate-row row-1 compact-nameplate-row-1">
          <div class="compact-col name cn-name"><b>{{ monster.name }}</b><span v-if="monster.nickname" class="monster-nickname"> "{{ monster.nickname }}"</span></div>
          <div class="compact-col meta cn-identity">{{ monster.alignment || 'Unaligned' }}, {{ monster.size }} {{ monster.type }}{{ monster.subtype ? ` (${monster.subtype})` : '' }}</div>
          <div class="compact-col cr cn-cr"><b>CR {{ crDisplay }}</b></div>
          <div class="compact-col pb cn-pb"><b>PB +{{ monster.proficiency }}</b></div>
          <div v-if="monster.showXp" class="compact-col xp cn-xp">{{ xpCompact }} XP</div>
        </div>
        <div class="compact-plate-row row-2 compact-nameplate-row-2">
          <div v-safe-html="compactInitiativeDisplay" class="compact-col init"></div>
        </div>
      </div>
      <div v-else class="monster-nameplate-panel unified-top-plate">
        <div class="top-plate-grid">
          <!-- Left Cluster: CR | PB | XP -->
          <div class="monster-cr-badge-cluster top-plate-cluster cr-cluster">
            <div class="cr-composite-pill top-plate-table">
              <div class="cr-region cr-main-region top-plate-col">
                <span class="region-label top-plate-header" data-help="challenge-rating" tabindex="0">CR</span>
                <span class="region-val top-plate-cell">{{ crDisplay }}</span>
              </div>
              <div class="region-divider"></div>
              <div class="cr-region cr-sub-region top-plate-col">
                <span class="region-label top-plate-header" data-help="proficiency-bonus" tabindex="0">PB</span>
                <span class="region-val top-plate-cell">+{{ monster.proficiency }}</span>
              </div>
              <template v-if="monster.showXp">
                <div class="region-divider"></div>
                <div class="cr-region cr-sub-region top-plate-col">
                  <span class="region-label top-plate-header" data-help="experience-points" tabindex="0">XP</span>
                  <span class="region-val top-plate-cell" :title="xpFormatted + ' XP'">{{ xpCompact }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Center Cluster: Monster Name (Row 1) & Size | Creature Type | Alignment (Row 2) -->
          <div class="top-plate-cluster name-cluster">
            <div class="monster-name-wrap top-plate-name-row">
              <h2 class="monster-name">{{ monster.name }}</h2>
              <span v-if="monster.nickname" class="monster-nickname">"{{ monster.nickname }}"</span>
            </div>
            <div class="monster-meta-badges top-plate-meta-row">
              <span class="dnd-meta-badge size-badge">{{ monster.size }}</span>
              <span class="dnd-meta-badge type-badge">{{ monster.type }}{{ monster.subtype ? ` (${monster.subtype})` : '' }}</span>
              <span class="dnd-meta-badge alignment-badge">{{ monster.alignment || 'Unaligned' }}</span>
            </div>
          </div>

          <!-- Right Cluster: Initiative Header (Row 1) & Dynamic Initiative Cells (Row 2) -->
          <div class="top-plate-cluster init-cluster">
            <div class="top-plate-init-header" data-help="initiative" tabindex="0">{{ $t('skill.INITIATIVE') }}</div>
            <div class="top-plate-init-cells">
              <div
                v-for="(initCell, iIdx) in sanitizedInitiativeCells"
                :key="'init-cell-' + iIdx"
                v-safe-html="initCell"
                class="top-plate-init-cell init-cell"
              ></div>
            </div>
          </div>
        </div>
      </div>
    <div class="skill ac dnd-cascade-panel dnd-cellular-row dnd-ac-cascade-row" :class="{ 'sb-striped': acStripe, 'is-striped': acStripe }">
      <span class="name dnd-cascade-title" data-help="armor-class" tabindex="0">{{ blockStyle.mm2024 ? 'AC' : 'Armor Class' }}</span>
      <div class="dnd-cascade-badges-wrap">
        <template v-if="monster?.splitAcRiderRows && sanitizedAcBadges.length > 1">
          <span v-safe-html="sanitizedAcBadges[0]" class="dnd-cascade-badge"></span>
        </template>
        <template v-else>
          <template v-for="(acBadge, aIdx) in sanitizedAcBadges" :key="'ac-badge-' + aIdx">
            <span v-safe-html="acBadge" class="dnd-cascade-badge"></span>
            <span v-if="aIdx < sanitizedAcBadges.length - 1" class="text-grey-7 q-mr-xs">, </span>
          </template>
        </template>
      </div>
    </div>
    <template v-if="monster?.splitAcRiderRows && sanitizedAcBadges.length > 1">
      <div
        v-for="(acRider, arIdx) in sanitizedAcBadges.slice(1)"
        :key="'ac-sub-' + arIdx"
        class="dnd-vitals-indented-subrow"
      >
        <span class="dnd-subrow-bullet">↳</span>
        <span v-safe-html="acRider" class="dnd-subrow-content"></span>
      </div>
    </template>
    <div class="skill hp dnd-cascade-panel dnd-cellular-row dnd-hp-cascade-row" :class="{ 'sb-striped': hpStripe, 'is-striped': hpStripe }">
      <span class="name dnd-cascade-title" data-help="hit-points" tabindex="0">{{ blockStyle.mm2024 ? 'HP' : 'Hit Points' }}</span>
      <div class="dnd-cascade-badges-wrap">
        <template v-for="(badge, index) in hpInlineBadges" :key="index">
          <span v-safe-html="badge" class="dnd-cascade-badge"></span>
          <span v-if="index < hpInlineBadges.length - 1" class="text-grey-7 q-mr-xs">; </span>
        </template>
      </div>
    </div>
    <div v-for="(rider, index) in hpSubrowBadges" :key="index" class="dnd-vitals-indented-subrow">
      <span class="dnd-subrow-bullet">↳</span>
      <span v-safe-html="rider" class="dnd-subrow-content"></span>
    </div>
    <statblock-vitals />

    <div v-if="editorStore?.visualTemplate !== 'modern'" class="skill">
      <span class="name">{{ blockStyle.mm2014 ? 'Challenge' : 'CR' }}</span>
      {{ cr }}
      <span v-if="blockStyle.mm2014" style="float: right"
        ><b>Proficiency Bonus</b> +{{ monster.proficiency }}</span
      >
    </div>
    <statblock-traits />
    <statblock-actions />

    <statblock-encounter-dynamics
      :villain-actions-list="villainActionsList"
      :bloodied-actions-list="bloodiedActionsList"
      :reactive-actions-list="reactiveActionsList"
      :combo-actions-list="comboActionsList"
      :anatomy-parts-list="anatomyPartsList"
      :runehammer-track-data="runehammerTrackData"
    />


    </div>

    </div>

    <!-- Right Portrait -->
    <div
      v-if="hasPortrait && (!editorStore?.a4PreviewMode || (resolvedA4Layout !== 'stacked' && resolvedA4Layout !== 'statblock_only')) && monster.portrait?.position === 'right'"
      class="monster-portrait portrait-right"
      :class="{ 'portrait-frameless': monster.portrait?.frameless }"
      :style="editorStore?.a4PreviewMode ? a4PortraitStyle : portraitStyle"
    >
      <div class="portrait-img-container relative-position" :style="portraitCropContainerStyle">
        <img :src="monster.portrait?.url" :alt="monster.name" class="portrait-img" :style="portraitImgStyle" />
        <div
          v-if="editorStore?.a4PreviewMode && portraitLayerObj?.gradientOverlay?.enabled"
          class="a4-layer-gradient-overlay"
          :style="getGradientOverlayStyle(portraitLayerObj.gradientOverlay)"
        ></div>
      </div>
      <div v-if="monster.portrait?.caption" class="portrait-caption">
        {{ monster.portrait?.caption }}
      </div>
    </div>
  </div>

  <!-- Bottom Footer Portrait Banner -->
  <div
    v-if="hasPortrait && monster.portrait?.position === 'bottom'"
    class="a4-hero-banner a4-footer-banner"
  >
    <div class="portrait-img-container" :style="portraitCropContainerStyle">
      <img :src="monster.portrait?.url" :alt="monster.name" class="a4-hero-img" :style="portraitImgStyle" />
    </div>
    <div v-if="monster.portrait?.caption" class="a4-portrait-caption">
      {{ monster.portrait?.caption }}
    </div>
  </div>
        </div>
      </div>
    </div>

  </div>
  <Teleport to="body">
    <div
      v-if="activeHelpTip"
      id="statblock-help-tip"
      ref="helpTipElement"
      class="statblock-help-tip"
      role="tooltip"
      :style="helpTipStyle"
    >
      <div v-if="activeHelpTip.title" class="tip-title">{{ activeHelpTip.title }}</div>
      <div class="tip-body">{{ activeHelpTip.text }}</div>
      <div v-if="activeHelpTip.detail" class="tip-detail">{{ activeHelpTip.detail }}</div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import type { HpRiderGroup } from 'src/core/domain/basic-riders'
import { mechanicRichHtml } from 'src/core/domain/mechanic-rich-text'
import { computed, defineComponent, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, StyleValue, watch } from 'vue'
import { useA4Composition } from './useA4Composition'
import StatblockEncounterDynamics from './StatblockEncounterDynamics.vue'
import A4PreviewToolbar from './A4PreviewToolbar.vue'
import StatblockVitals from './StatblockVitals.vue'
import StatblockActions from './StatblockActions.vue'
import StatblockTraits from './StatblockTraits.vue'
import { STATBLOCK_BODY, useStatblockBodyView } from './useStatblockBodyView'
import { shouldStripeVital, STATBLOCK_VITALS, useStatblockVitalsView } from './useStatblockVitalsView'
import { useMonsterStore } from 'src/stores/monster-store'
import { useSpellsStore } from 'src/stores/spells-store'
import { buildCastingProjection } from 'src/core/domain/casting-projection'
import { innateCastingContext, resolveCastingAbility } from 'src/core/domain/casting-ability'
import { useTextRenderer } from './useTextRenderer'
import { useProcessTokens } from './useProcessTokens'
import { useEditorStore } from 'src/stores/editor-store'
import { CR } from 'src/data/CR'
import { getSpellTagString } from 'src/core/domain/spell-metadata'
import { buildInnateSpellPlate, spellLevelLead } from 'src/core/domain/spell-plate'
import type { SpellPlateLevel } from 'src/core/domain/spell-plate'
import { effectiveAdvantage } from 'src/core/domain/skill-action-groups'
import { formatInitiativeRiders } from 'src/core/domain/initiative-composer'
import { statblockHelpText } from './statblock-help'
import { useI18n } from 'vue-i18n'
import { resolveSpellcastingPlacement } from 'src/core/domain/export-contract'

export default defineComponent({
  name: 'WebRenderer',
  components: {
    StatblockEncounterDynamics,
    A4PreviewToolbar,
    StatblockVitals,
    StatblockActions,
    StatblockTraits,
  },
  setup() {
    const { locale } = useI18n({ useScope: 'global' })
    const monster = useMonsterStore()
    const castingSpells = useSpellsStore()
    const editorStore = useEditorStore()
    const renderRoot = ref<HTMLElement | null>(null)
    const helpTipElement = ref<HTMLElement | null>(null)
    const activeHelpTip = ref<{ title?: string; text: string; detail?: string } | null>(null)
    const activeHelpTarget = ref<HTMLElement | null>(null)
    const helpTipStyle = ref<Record<string, string>>({ position: 'fixed', left: '12px', top: '12px' })
    let helpTipObserver: MutationObserver | null = null
    const spellRuleParts = (rule: string) => {
      const tokens = /\b(\d+(?:st|nd|rd|th)?|Short or Long Rest|Short Rest|Long Rest|Downtime|Bonus Action|Reaction|Cast|Artificer|Bard|Cleric|Druid|Paladin|Ranger|Sorcerer|Warlock|Wizard)\b/gi
      return rule.split(tokens).map((text, index) => ({ text, kind: index % 2 === 0 ? 'text' : /^\d/.test(text) ? 'number' : 'term' }))
    }
    const { sanitizeWebString, processLairAction } = useProcessTokens()
    const textRenderer = inject('textRenderer') as ReturnType<
      typeof useTextRenderer
    >

    const findHelpTarget = (eventTarget: EventTarget | null): HTMLElement | null => {
      if (!(eventTarget instanceof Element)) return null
      const target = eventTarget.closest<HTMLElement>('[data-help]')
      return target && renderRoot.value?.contains(target) ? target : null
    }

    const positionHelpTip = () => {
      const target = activeHelpTarget.value
      if (!target?.isConnected) return
      const rect = target.getBoundingClientRect()
      const margin = 10
      const width = helpTipElement.value?.offsetWidth || Math.min(320, window.innerWidth - margin * 2)
      const height = helpTipElement.value?.offsetHeight || 72
      const left = Math.max(margin, Math.min(rect.left + (rect.width - width) / 2, window.innerWidth - width - margin))
      let top = rect.top - height - 8
      if (top < margin) top = rect.bottom + 8
      top = Math.max(margin, Math.min(top, window.innerHeight - height - margin))
      helpTipStyle.value = { position: 'fixed', left: `${left}px`, top: `${top}px` }
    }

    const hideHelpTip = () => {
      const target = activeHelpTarget.value
      if (target?.getAttribute('aria-describedby') === 'statblock-help-tip') {
        target.removeAttribute('aria-describedby')
      }
      target?.removeAttribute('data-help-visible')
      activeHelpTarget.value = null
      activeHelpTip.value = null
    }

    const showHelpTip = (target: HTMLElement) => {
      const key = target.dataset.help
      const description = statblockHelpText(key, locale.value)
      if (!description) {
        if (activeHelpTarget.value !== target) hideHelpTip()
        return
      }
      // Plate rows keep values in sibling cells; Build170+ vitals panels keep them in one badges wrap.
      const row = target.matches('.sb-head') ? target.closest('.sb-row') : null
      const panel = !row && target.matches('.dnd-cascade-title') ? target.closest('.dnd-cellular-row') : null
      const valueCells = row
        ? [...row.querySelectorAll<HTMLElement>(':scope > .sb-cell:not(.sb-head)')]
        : panel
          ? [...panel.querySelectorAll<HTMLElement>(':scope > .dnd-cascade-badges-wrap')]
          : []
      const rowValues = valueCells
        .map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim())
        .filter((value): value is string => Boolean(value))
        .join(' · ')
        .slice(0, 180)
      const title = key ? key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''
      if (activeHelpTarget.value !== target) hideHelpTip()
      activeHelpTarget.value = target
      activeHelpTip.value = { title, text: description, detail: rowValues ? `Values: ${rowValues}` : undefined }
      target.setAttribute('aria-describedby', 'statblock-help-tip')
      target.setAttribute('data-help-visible', 'true')
      nextTick(positionHelpTip)
    }

    const handleHelpPointerOver = (event: Event) => {
      const target = findHelpTarget(event.target)
      if (target) showHelpTip(target)
    }

    const handleHelpPointerOut = (event: Event) => {
      const target = findHelpTarget(event.target)
      if (!target || target !== activeHelpTarget.value) return
      const nextTarget = findHelpTarget((event as PointerEvent).relatedTarget)
      if (nextTarget === target || document.activeElement === target) return
      hideHelpTip()
    }

    const handleHelpFocusIn = (event: FocusEvent) => {
      const target = findHelpTarget(event.target)
      if (target) showHelpTip(target)
    }

    const handleHelpFocusOut = (event: FocusEvent) => {
      const target = findHelpTarget(event.target)
      if (!target || target !== activeHelpTarget.value) return
      const nextTarget = findHelpTarget(event.relatedTarget)
      if (nextTarget === target || target.matches(':hover')) return
      hideHelpTip()
    }

    const handleHelpKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeHelpTip.value) hideHelpTip()
    }

    onMounted(() => {
      const root = renderRoot.value
      root?.addEventListener('pointerover', handleHelpPointerOver)
      root?.addEventListener('pointerout', handleHelpPointerOut)
      root?.addEventListener('focusin', handleHelpFocusIn)
      root?.addEventListener('focusout', handleHelpFocusOut)
      root?.addEventListener('keydown', handleHelpKeydown)
      if (root) {
        helpTipObserver = new MutationObserver(() => {
          if (activeHelpTarget.value && !activeHelpTarget.value.isConnected) hideHelpTip()
        })
        helpTipObserver.observe(root, { childList: true, subtree: true })
      }
      window.addEventListener('resize', positionHelpTip)
      document.addEventListener('scroll', positionHelpTip, true)
    })

    onBeforeUnmount(() => {
      const root = renderRoot.value
      root?.removeEventListener('pointerover', handleHelpPointerOver)
      root?.removeEventListener('pointerout', handleHelpPointerOut)
      root?.removeEventListener('focusin', handleHelpFocusIn)
      root?.removeEventListener('focusout', handleHelpFocusOut)
      root?.removeEventListener('keydown', handleHelpKeydown)
      helpTipObserver?.disconnect()
      helpTipObserver = null
      window.removeEventListener('resize', positionHelpTip)
      document.removeEventListener('scroll', positionHelpTip, true)
      hideHelpTip()
    })

    const columns = computed<StyleValue>(() => {
      return {
        columnCount: editorStore.statBlockColumns,
        '--statblock-font-scale': (editorStore.statblockFontScale ?? 100) / 100,
      }
    })

    const blockStyle = computed(() => ({
      mm2014: editorStore.style === '2014',
      mm2024: editorStore.style === '2024',
      condenseImmunities: editorStore.condenseImmunities,
    }))

    const hasPortrait = computed(() => {
      const portraitLayer = editorStore.a4Layers?.find(l => l.type === 'portrait')
      const layerVisible = portraitLayer ? portraitLayer.visible : true
      return (
        layerVisible &&
        !!monster.portrait?.url &&
        monster.portrait.position !== 'none'
      )
    })

    const { openLayerStudio, a4AllCustomLayers, a4BackgroundLayers, a4ForegroundLayers, a4PageRef, a4ViewportRef, a4TargetHeightPx, resolvedA4Layout, updateMeasuredHeight, a4ScaleStageStyle, portraitLayerObj, statblockLayerObj, a4StatblockWrapperStyle, a4StatblockStyle, statblockFrame, statblockContent, fit, statblockFitActive, statblockFrameStyle, fittedStatblockStyle, scheduleStatblockFit, a4PortraitStyle, portraitCropContainerStyle, portraitImgStyle, getGradientOverlayStyle, getLayerStyle, getLayerTextStyle, a4PageOverflowPx, checkA4Overflow, printA4Sheet } = useA4Composition({ monster, editorStore, renderRoot, columns, hasPortrait })

    const cascadingDefenses = computed(() => textRenderer.cascadingDefenses.value)

    const traits = computed(() =>
      textRenderer.traits.value.map((t) => sanitizeWebString(t))
    )

    const sanitizedClassSpellcastingPreamble = computed(() =>
      sanitizeWebString(textRenderer.classSpellcastingPreamble.value)
    )

    const sanitizedInnateSpellcastingPreamble = computed(() =>
      sanitizeWebString(textRenderer.innateSpellcastingPreamble.value)
    )



    const getPrimarySpells = (row: SpellPlateLevel): SpellPlateLevel['spells'] => {
      if (!monster.spellcasting?.splitHighCadence) return row.spells || []
      return (row.spells || []).filter((s) => !s.restricted)
    }

    const getSecondarySpells = (row: SpellPlateLevel): SpellPlateLevel['spells'] => {
      if (!monster.spellcasting?.splitHighCadence) return []
      return (row.spells || []).filter((s) => s.restricted)
    }

    const primarySpellLevels = computed(() => {
      return (spellPlate.value?.levels || []).filter((row) => getPrimarySpells(row).length > 0)
    })

    const secondarySpellLevels = computed(() => {
      return (spellPlate.value?.levels || []).filter((row) => getSecondarySpells(row).length > 0)
    })

    const hasAnySecondarySpells = computed(() => {
      if (!monster.spellcasting?.splitHighCadence) return false
      return secondarySpellLevels.value.length > 0
    })

    const hasExplicitResourceRow = computed(() => {
      return Boolean(spellPlate.value?.resource || spellPlate.value?.prepared)
    })

    const isResourceRowStriped = computed(() => {
      const hasResource = hasExplicitResourceRow.value
      const hasMeta = Boolean(spellPlate.value?.metamagic)
      return hasResource && !hasMeta
    })

    const isMetamagicRowStriped = computed(() => {
      return true
    })

    const isPrimarySpellLineStriped = (rIdx: number) => {
      return rIdx % 2 === 1
    }

    const isSecondarySpellLineStriped = (secIdx: number) => {
      return secIdx % 2 === 1
    }

    const shouldStripeSpellLine = (row: SpellPlateLevel): boolean => {
      const spells = getPrimarySpells(row)
      const textLength = spells.reduce((acc: number, s) => acc + (s.name?.length || 0) + (s.tags?.length || 0) + 4, 25)
      return textLength > 130
    }


    const compactInitiativeDisplay = computed(() => {
      const init = monster.initiative
      const score = 10 + (init.mod || 0)
      const modSign = (init.mod || 0) >= 0 ? '+' : ''
      const modStr = `${score}/${modSign}${init.mod || 0} initiative`
      const rollMode = effectiveAdvantage(init.advantage, init.disadvantage)
      const advDisadv = rollMode === 'advantage' ? 'with Advantage' : rollMode === 'disadvantage' ? 'at Disadvantage' : ''

      let spellTrigger = ''
      const cfg = monster.initiativeConfig
      if (cfg?.specialTrigger && cfg.specialTrigger !== 'none') {
        if (cfg.specialTrigger === 'choose_lowest_thaumaturgy' || (cfg.specialTrigger as string) === 'cast_thaumaturgy') {
          spellTrigger = 'can cast Thaumaturgy'
        } else if (cfg.specialTrigger === 'choose_lowest_compelled_duel' || (cfg.specialTrigger as string) === 'cast_compelled_duel') {
          spellTrigger = 'can cast Compelled Duel'
        } else if (cfg.specialTrigger === 'choose_lowest_custom' || (cfg.specialTrigger as string) === 'cast_custom') {
          spellTrigger = `can cast ${String(cfg.specialTriggerSpell || '').trim() || 'Spell'}`
        } else if (cfg.specialTrigger === 'at_end_of_every_turn') {
          spellTrigger = 'Acts at End of Every Turn'
        } else if (cfg.specialTrigger === 'at_end_and_start_lair') {
          spellTrigger = 'Acts at End & Start of Turn (Lair)'
        } else if (cfg.specialTrigger === 'within_1d6_rounds') {
          spellTrigger = 'Acts within 1d6 rounds'
        } else if (cfg.specialTrigger === 'no_temp_hp_remaining') {
          spellTrigger = 'Acts when no temp HP remaining'
        } else if (cfg.specialTrigger === 'hp_not_equal_max') {
          spellTrigger = 'Acts when HP not equal to Max'
        } else if (cfg.specialTrigger === 'custom' && cfg.customEffectNote) {
          spellTrigger = String(cfg.customEffectNote).trim()
        }
      }

      const notes: string[] = []
      if (advDisadv && spellTrigger) {
        notes.push(`${advDisadv} ${spellTrigger}`)
      } else {
        if (advDisadv) notes.push(advDisadv)
        if (spellTrigger) notes.push(spellTrigger)
      }
      if (init.cantBeSurprised) notes.push("can't be Surprised")

      // Include composable modular riders
      if (Array.isArray(cfg?.riders) && cfg.riders.length > 0) {
        const customRiders = formatInitiativeRiders(cfg.riders)
        notes.push(...customRiders)
      }

      return notes.length > 0 ? `<b>${modStr}</b>, ${notes.join(', ')}` : `<b>${modStr}</b>`
    })

    const spellPlate = computed(() => buildCastingProjection(monster.spellcasting, {
      stats: monster.stats, proficiency: monster.proficiency, save: monster.spellSave, attack: monster.spellAttackModifier,
      edition: editorStore.style === '2014' ? '2014' : '2024',
      spellLevel: name => castingSpells.allSpells[name]?.level,
      spellTags: getSpellTagString,
    }))

    const innateSpellPlate = computed(() => {
      const sc = innateCastingContext(monster.spellcasting)
      const ability = resolveCastingAbility(sc, monster.stats, monster.proficiency)
      const processedNotes = sc?.useCustomInnatePreamble
        ? sanitizedInnateSpellcastingPreamble.value
        : sanitizeWebString(sc?.atWillNotes || '')
      return buildInnateSpellPlate({
        stat: sc?.stat || 'INT',
        save: ability.save,
        attack: ability.attack,
        groups: textRenderer.innateSpellcastingLists.value.map((group) => ({
          label: group.renderedLabel,
          spells: group.spells.map((name: string) => ({ name, tags: getSpellTagString(name) })),
        })),
        processedNotes: processedNotes.trim() ? processedNotes : '',
      })
    })
    const actionsView = useStatblockBodyView({ monster, textRenderer, sanitizeWebString, processLairAction })
    const { sanitizedGroupedTraits, hasGroupedTraits, attacks, actions, bonusActions, multiattacks, legendaryPreamble, legendaryActions, mythicTrait, mythicPreamble, mythicActions, reactions, lairActionPreamble, lairActions, regionalEffectPreamble, randomTables, regionalEffects, inventory } = actionsView

    const xpFormatted = computed(() => {
      const crObj = CR[monster.CR] || CR[0]
      return (crObj?.xp ?? 0).toLocaleString()
    })
    const xpCompact = computed(() => {
      const crObj = CR[monster.CR] || CR[0]
      const xpVal = crObj?.xp ?? 0
      if (xpVal >= 1000) {
        const k = xpVal / 1000
        return Number.isInteger(k) ? `${k}k` : `${parseFloat(k.toFixed(1))}k`
      }
      return `${xpVal}`
    })
    const crDisplay = computed(() => {
      if (monster.useCrDisplayOverride) return monster.crOverride ?? ''
      return (CR[monster.CR] || CR[0])?.cr ?? `${monster.CR}`
    })
    const cr = computed(() => sanitizeWebString(textRenderer.cr.value))

    const initiative = computed(() =>
      sanitizeWebString(textRenderer.initiative.value)
    )

    const sanitizedInitiativeCells = computed(() =>
      (textRenderer.initiativeCells?.value || []).map((c) => sanitizeWebString(c))
    )

    const sanitizedAcBadges = computed(() =>
      (textRenderer.acBadges?.value || []).map((c) => sanitizeWebString(c))
    )

    const hpRiderIsSplit = (entry: { group?: HpRiderGroup }) => entry.group != null &&
      (monster.hpRiderSubrows?.[entry.group] ?? (monster.$state as { splitHpRiderRows?: boolean }).splitHpRiderRows)
    const hpInlineBadges = computed(() => textRenderer.hpBadgeEntries.value
      .filter(entry => !hpRiderIsSplit(entry)).map(entry => sanitizeWebString(entry.text)))
    const hpSubrowBadges = computed(() => textRenderer.hpBadgeEntries.value
      .filter(hpRiderIsSplit).map(entry => sanitizeWebString(entry.text)))


    const portraitStyle = computed(() => {
      const w =
        monster.portrait?.width && monster.portrait.width > 50
          ? monster.portrait.width
          : 220
      return {
        width: `${w}px`,
        maxWidth: `${w}px`,
      }
    })

    const vitalsView = useStatblockVitalsView({ monster, editorStore, textRenderer, sanitizeWebString, blockStyle, cascadingDefenses, inventory })
    provide(STATBLOCK_VITALS, vitalsView)
    const { actionPassivesGroups, senses, languages, sensesBadges, languagesBadges, speedBadges, speedBaseBadges, speedRiderBadges, vitalsStripingMap, acStripe, hpStripe, speedStripe, sensesStripe, languagesStripe, isDefenseStriped } = vitalsView
    const actionPassives = computed(() =>
      sanitizeWebString(textRenderer.actionPassives.value)
    )



    watch([
      a4StatblockStyle, statblockContent, () => editorStore.a4PreviewMode,
      () => editorStore.a4StatblockFinalWidth, () => editorStore.a4StatblockFinalHeight,
      () => editorStore.a4Orientation, () => editorStore.a4CompactDensity, () => editorStore.visualTheme,
      () => editorStore.visualTemplate, () => editorStore.style,
    ], scheduleStatblockFit, { flush: 'post' })
    watch(fit, () => {
      updateMeasuredHeight()
      checkA4Overflow()
    }, { flush: 'post' })

    const resolvedSpellPlacement = computed(() =>
      resolveSpellcastingPlacement(editorStore.spellcastingPlacement, 'web'),
    )
    const spellPlatesBind = computed(() => ({
      innateSpellPlate: innateSpellPlate.value,
      spellPlate: spellPlate.value,
      primarySpellLevels: primarySpellLevels.value,
      secondarySpellLevels: secondarySpellLevels.value,
      hasExplicitResourceRow: hasExplicitResourceRow.value,
      isResourceRowStriped: isResourceRowStriped.value,
      isMetamagicRowStriped: isMetamagicRowStriped.value,
      hasAnySecondarySpells: hasAnySecondarySpells.value,
      splitHighCadence: Boolean(monster.spellcasting?.splitHighCadence),
      useCustomClassPreamble: Boolean(monster.spellcasting?.useCustomClassPreamble),
      sanitizedClassSpellcastingPreamble: sanitizedClassSpellcastingPreamble.value || '',
      spellRuleParts,
      getPrimarySpells,
      getSecondarySpells,
      isPrimarySpellLineStriped,
      isSecondarySpellLineStriped,
      shouldStripeSpellLine,
    }))
    provide(STATBLOCK_BODY, { ...actionsView, monster, blockStyle, mechanicRichHtml, resolvedSpellPlacement, spellPlatesBind })

    return {
      renderRoot,
      resolvedSpellPlacement,
      spellPlatesBind,
      mechanicRichHtml,
      helpTipElement,
      activeHelpTip,
      helpTipStyle,
      monster,
      editorStore,
      xpFormatted,
      xpCompact,
      crDisplay,
      ...textRenderer,
      cr,
      spellPlate,
      spellLevelLead,
      hasAnySecondarySpells,
      shouldStripeVital,
      innateSpellPlate,
      sanitizeWebString,
      sanitizedClassSpellcastingPreamble,
      traits,
      attacks,
      actions,
      bonusActions,
      multiattacks,
      legendaryPreamble,
      legendaryActions,
      mythicTrait,
      mythicPreamble,
      mythicActions,
      reactions,
      lairActionPreamble,
      lairActions,
      regionalEffectPreamble,
      regionalEffects,
      randomTables,
      columns,
      inventory,
      blockStyle,
      initiative,
      sanitizedInitiativeCells,
      sanitizedAcBadges,
      hpInlineBadges,
      hpSubrowBadges,
      spellRuleParts,
      hasPortrait,
      portraitStyle,
      actionPassivesGroups,
      senses,
      languages,
      sensesBadges,
      languagesBadges,
      speedBadges,
      speedBaseBadges,
      speedRiderBadges,
      cascadingDefenses,
      isDefenseStriped,
      vitalsStripingMap,
      acStripe,
      hpStripe,
      speedStripe,
      sensesStripe,
      languagesStripe,
      compactInitiativeDisplay,
      getPrimarySpells,
      getSecondarySpells,
      primarySpellLevels,
      secondarySpellLevels,
      hasExplicitResourceRow,
      isResourceRowStriped,
      isMetamagicRowStriped,
      isPrimarySpellLineStriped,
      isSecondarySpellLineStriped,
      shouldStripeSpellLine,
      actionPassives,
      sanitizedGroupedTraits,
      hasGroupedTraits,
      a4PageRef,
      a4ViewportRef,
      a4TargetHeightPx,
      resolvedA4Layout,
      a4ScaleStageStyle,
      a4StatblockWrapperStyle,
      statblockFrame,
      statblockContent,
      statblockFrameStyle,
      statblockFitActive,
      fittedStatblockStyle,
      a4PortraitStyle,
      portraitCropContainerStyle,
      portraitImgStyle,
      getLayerStyle,
      getLayerTextStyle,
      a4PageOverflowPx,
      printA4Sheet,
      openLayerStudio,
      a4BackgroundLayers,
      a4ForegroundLayers,
      a4AllCustomLayers,
      getGradientOverlayStyle,
      portraitLayerObj,
      statblockLayerObj,
    }
  },
})
</script>

<style lang="scss" src="./web-renderer.global.scss"></style>

<style lang="scss" src="./web-renderer.namespaced.scss"></style>
