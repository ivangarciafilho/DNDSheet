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

    <!-- A4 Control Toolbar -->
    <div class="a4-preview-toolbar row items-center justify-between q-px-sm q-py-xs bg-grey-9 text-white rounded-borders q-mb-sm">
      <div class="row items-center q-gutter-xs">
        <q-btn
          :color="editorStore?.a4PreviewMode ? 'amber-5' : 'grey-7'"
          :text-color="editorStore?.a4PreviewMode ? 'black' : 'white'"
          dense
          no-caps
          icon="description"
          :label="editorStore?.a4PreviewMode ? 'A4 Sheet 1:1 Preview: ON' : 'A4 Sheet 1:1 Preview: OFF'"
          class="text-weight-bold"
          @click="editorStore.a4PreviewMode = !editorStore.a4PreviewMode"
        >
          <q-tooltip>Simulate true A4 physical sheet aspect ratio (210×297mm) with integrated creature artwork</q-tooltip>
        </q-btn>

        <q-btn flat dense no-caps icon="format_size" :label="`Text: ${editorStore.statblockFontScale}%`">
          <q-menu class="q-pa-sm bg-grey-10 text-white" style="min-width: 200px">
            <div class="text-caption">Statblock text size</div>
            <q-slider
              v-model="editorStore.statblockFontScale"
              v-help="'Scale overall typography size inside the stat block preview from 65% to 150%.'"
              aria-label="Statblock text size"
              :min="65"
              :max="150"
              :step="1"
              label
              dense
            />
            <q-btn flat dense no-caps label="Reset text size" @click="editorStore.statblockFontScale = 100" />
          </q-menu>
        </q-btn>

        <!-- A4 Controls (Visible when A4 preview is ON) -->
        <template v-if="editorStore?.a4PreviewMode">
          <q-separator vertical dark class="q-mx-xs" />
          <q-btn-toggle
            v-model="editorStore.a4Orientation"
            dense
            no-caps
            rounded
            toggle-color="primary"
            color="grey-8"
            :options="[
              { label: 'Portrait', value: 'portrait', icon: 'crop_portrait' },
              { label: 'Landscape', value: 'landscape', icon: 'crop_landscape' }
            ]"
          >
            <q-tooltip>A4 Page Orientation (210×297mm vs 297×210mm)</q-tooltip>
          </q-btn-toggle>

          <q-btn-toggle
            v-model="editorStore.a4Layout"
            dense
            no-caps
            rounded
            toggle-color="secondary"
            color="grey-8"
            :options="[
              { label: 'Auto', value: 'auto' },
              { label: 'Side-by-Side', value: 'side_by_side' },
              { label: 'Hero Top', value: 'stacked' },
              { label: 'Statblock Only', value: 'statblock_only' }
            ]"
          >
            <q-tooltip>Page Composition & Artwork Placement</q-tooltip>
          </q-btn-toggle>

          <q-btn-toggle
            v-model="editorStore.a4Zoom"
            dense
            no-caps
            rounded
            toggle-color="indigo"
            color="grey-8"
            :options="[
              { label: 'Fit', value: 'fit' },
              { label: '100%', value: 100 },
              { label: '75%', value: 75 }
            ]"
          >
            <q-tooltip>Preview Zoom Scale</q-tooltip>
          </q-btn-toggle>

          <q-btn
            :flat="!editorStore.a4CompactDensity"
            :color="editorStore.a4CompactDensity ? 'teal-4' : 'grey-5'"
            dense
            no-caps
            icon="compress"
            label="Compact"
            @click="editorStore.a4CompactDensity = !editorStore.a4CompactDensity"
          >
            <q-tooltip>Tighten line height and vertical margins to fit large statblocks on 1 page</q-tooltip>
          </q-btn>

          <!-- Occlusion Popover -->
          <q-btn
            flat
            dense
            no-caps
            icon="layers_clear"
            color="cyan-3"
            :label="`Cover: ${editorStore.a4PictureOcclusion || 0}%`"
          >
            <q-tooltip>Picture Occlusion: Decides how much the statblock covers/occludes the picture (0% = Side by Side, 50% = Covers Half, 100% = Full Cover)</q-tooltip>
            <q-menu class="q-pa-sm bg-grey-10 text-white" style="min-width: 220px;">
              <div class="text-caption text-weight-bold q-mb-xs text-cyan-3">
                Artwork Occlusion: {{ editorStore.a4PictureOcclusion || 0 }}%
              </div>
              <q-slider
                v-model="editorStore.a4PictureOcclusion"
                v-help="'Control how much the stat block frame overlaps portrait artwork (0% side-by-side to 100% full cover).'"
                :min="0"
                :max="100"
                color="cyan-4"
                label
                dense
              />
              <div class="text-caption text-grey-5" style="font-size: 0.7rem;">
                0% = Side-by-Side | 50% = 50% Overlap | 100% = Full Cover
              </div>
            </q-menu>
          </q-btn>

          <!-- Opacity Popover -->
          <q-btn
            flat
            dense
            no-caps
            icon="opacity"
            color="amber-3"
            :label="`Opacity: ${editorStore.a4StatblockOpacity ?? 100}%`"
          >
            <q-tooltip>Statblock background opacity to reveal underlying artwork and background textures</q-tooltip>
            <q-menu class="q-pa-sm bg-grey-10 text-white" style="min-width: 220px;">
              <div class="text-caption text-weight-bold q-mb-xs text-amber-3">
                Statblock Opacity: {{ editorStore.a4StatblockOpacity ?? 100 }}%
              </div>
              <q-slider
                v-model="editorStore.a4StatblockOpacity"
                v-help="'Adjust parchment backdrop opacity behind stat block text to reveal A4 page art underneath.'"
                :min="0"
                :max="100"
                color="amber-4"
                label
                dense
              />
              <div class="text-caption text-grey-5" style="font-size: 0.7rem;">
                Lower opacity to reveal artwork and page textures
              </div>
            </q-menu>
          </q-btn>

          <!-- Layer Studio Button -->
          <q-btn
            flat
            dense
            no-caps
            icon="layers"
            color="purple-3"
            label="Layers"
            @click="openLayerStudio"
          >
            <q-tooltip>Scroll to A4 Composition Layer Studio</q-tooltip>
          </q-btn>
        </template>
      </div>

      <div class="row items-center q-gutter-xs">
        <template v-if="editorStore?.a4PreviewMode">
          <q-badge
            :color="a4PageOverflowPx > 0 ? 'amber-4' : 'green-9'"
            :text-color="a4PageOverflowPx > 0 ? 'grey-10' : 'white'"
            class="text-weight-bold q-pa-xs"
          >
            <q-icon :name="a4PageOverflowPx > 0 ? 'warning' : 'check_circle'" class="q-mr-xs" />
            {{ a4PageOverflowPx > 0 ? 'Content exceeds one A4 page' : 'Fits on one A4 page' }}
          </q-badge>

          <q-btn
            flat
            dense
            color="white"
            icon="print"
            label="Print / PDF"
            @click="printA4Sheet"
          >
            <q-tooltip>Print or save as PDF. Stretch the artwork and statblock to fill one A4 page.</q-tooltip>
          </q-btn>
        </template>
      </div>
    </div>

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
          <div class="compact-col init" v-html="compactInitiativeDisplay"></div>
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
                class="top-plate-init-cell init-cell"
                v-html="initCell"
              ></div>
            </div>
          </div>
        </div>
      </div>
    <div class="skill ac dnd-cascade-panel dnd-cellular-row dnd-ac-cascade-row" :class="{ 'sb-striped': acStripe, 'is-striped': acStripe }">
      <span class="name dnd-cascade-title" data-help="armor-class" tabindex="0">{{ blockStyle.mm2024 ? 'AC' : 'Armor Class' }}</span>
      <div class="dnd-cascade-badges-wrap">
        <template v-if="monster?.splitAcRiderRows && sanitizedAcBadges.length > 1">
          <span class="dnd-cascade-badge" v-html="sanitizedAcBadges[0]"></span>
        </template>
        <template v-else>
          <template v-for="(acBadge, aIdx) in sanitizedAcBadges" :key="'ac-badge-' + aIdx">
            <span class="dnd-cascade-badge" v-html="acBadge"></span>
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
        <span class="dnd-subrow-content" v-html="acRider"></span>
      </div>
    </template>
    <div class="skill hp dnd-cascade-panel dnd-cellular-row dnd-hp-cascade-row" :class="{ 'sb-striped': hpStripe, 'is-striped': hpStripe }">
      <span class="name dnd-cascade-title" data-help="hit-points" tabindex="0">{{ blockStyle.mm2024 ? 'HP' : 'Hit Points' }}</span>
      <div class="dnd-cascade-badges-wrap">
        <template v-for="(badge, index) in hpInlineBadges" :key="index">
          <span class="dnd-cascade-badge" v-html="badge"></span>
          <span v-if="index < hpInlineBadges.length - 1" class="text-grey-7 q-mr-xs">; </span>
        </template>
      </div>
    </div>
    <div v-for="(rider, index) in hpSubrowBadges" :key="index" class="dnd-vitals-indented-subrow">
      <span class="dnd-subrow-bullet">↳</span>
      <span class="dnd-subrow-content" v-html="rider"></span>
    </div>
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
            <span class="dnd-defense-prose-text" v-html="defSec.formattedProse"></span>
          </div>
        </div>
      </template>

      <!-- Speed -->
      <div class="skill speed dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': speedStripe, 'is-striped': speedStripe }">
        <span class="name dnd-cascade-title" data-help="speed" tabindex="0">Speed</span>
        <div class="dnd-cascade-badges-wrap">
          <template v-if="(monster?.splitSpeedRiderRows || monster.speedTraversal?.splitRiderRows) && speedRiderBadges.length > 0">
            <template v-for="(spBadge, spIdx) in speedBaseBadges" :key="'sp-base-' + spIdx">
              <span class="dnd-cascade-badge" v-html="mechanicRichHtml(spBadge)"></span>
              <span v-if="spIdx < speedBaseBadges.length - 1" class="text-grey-7 q-mr-xs">, </span>
            </template>
          </template>
          <template v-else>
            <template v-for="(spBadge, spIdx) in speedBadges" :key="'speed-badge-' + spIdx">
              <span class="dnd-cascade-badge" v-html="mechanicRichHtml(spBadge)"></span>
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
          <span class="dnd-subrow-content" v-html="mechanicRichHtml(spRider)"></span>
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
          ><span v-html="mechanicRichHtml(sBadge)"></span><span v-if="sIdx < sensesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
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
          ><span v-html="mechanicRichHtml(lBadge)"></span><span v-if="lIdx < languagesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
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
          <div class="score one" v-html="statsAndSavesByKey.STR?.renderedScore ?? '10'"></div>
          <div class="mod one">{{ statsAndSavesByKey.STR?.renderedModifier ?? '+0' }}</div>
          <div class="save one" v-html="statsAndSavesByKey.STR?.renderedSave ?? '+0'"></div>
          <div class="stat two">
            {{ statsAndSavesByKey.INT?.stat?.toLowerCase() ?? 'int' }}
          </div>
          <div class="score two" v-html="statsAndSavesByKey.INT?.renderedScore ?? '10'"></div>
          <div class="mod two">{{ statsAndSavesByKey.INT?.renderedModifier ?? '+0' }}</div>
          <div class="save two" v-html="statsAndSavesByKey.INT?.renderedSave ?? '+0'"></div>
        </div>
        <div class="stat-table">
          <div class="header-label mod">{{ $t('editor.mod') }}</div>
          <div class="header-label save">{{ $t('editor.save') }}</div>
          <div class="stat one">
            {{ statsAndSavesByKey.DEX?.stat?.toLowerCase() ?? 'dex' }}
          </div>
          <div class="score one" v-html="statsAndSavesByKey.DEX?.renderedScore ?? '10'"></div>
          <div class="mod one">{{ statsAndSavesByKey.DEX?.renderedModifier ?? '+0' }}</div>
          <div class="save one" v-html="statsAndSavesByKey.DEX?.renderedSave ?? '+0'"></div>
          <div class="stat two">
            {{ statsAndSavesByKey.WIS?.stat?.toLowerCase() ?? 'wis' }}
          </div>
          <div class="score two" v-html="statsAndSavesByKey.WIS?.renderedScore ?? '10'"></div>
          <div class="mod two">{{ statsAndSavesByKey.WIS?.renderedModifier ?? '+0' }}</div>
          <div class="save two" v-html="statsAndSavesByKey.WIS?.renderedSave ?? '+0'"></div>
        </div>
        <div class="stat-table">
          <div class="header-label mod">{{ $t('editor.mod') }}</div>
          <div class="header-label save">{{ $t('editor.save') }}</div>
          <div class="stat one">
            {{ statsAndSavesByKey.CON?.stat?.toLowerCase() ?? 'con' }}
          </div>
          <div class="score one" v-html="statsAndSavesByKey.CON?.renderedScore ?? '10'"></div>
          <div class="mod one">{{ statsAndSavesByKey.CON?.renderedModifier ?? '+0' }}</div>
          <div class="save one" v-html="statsAndSavesByKey.CON?.renderedSave ?? '+0'"></div>
          <div class="stat two">
            {{ statsAndSavesByKey.CHA?.stat?.toLowerCase() ?? 'cha' }}
          </div>
          <div class="score two" v-html="statsAndSavesByKey.CHA?.renderedScore ?? '10'"></div>
          <div class="mod two">{{ statsAndSavesByKey.CHA?.renderedModifier ?? '+0' }}</div>
          <div class="save two" v-html="statsAndSavesByKey.CHA?.renderedSave ?? '+0'"></div>
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
        <div class="dnd-cascade-badges-wrap" v-html="inventory"></div>
      </div>

      <!-- Passives / Checks 2024 -->
      <template v-for="group in actionPassivesGroups" :key="group.name">
        <div class="skill dnd-cascade-panel dnd-cellular-row" :class="['cascade-skill-' + group.scopeLabel.toLowerCase(), { 'sb-striped': shouldStripeVital(group.scopeLabel, group.skills) }]">
          <span class="name dnd-cascade-title" :data-help="group.tip ? undefined : group.scopeLabel.toLowerCase()" tabindex="0">{{ group.scopeLabel }}<q-tooltip v-if="group.tip" class="dnd-tip" max-width="320px">{{ group.tip }}</q-tooltip></span>
          <span v-if="group.subTypeLabel && group.subTypeLabel !== 'Action'" class="dnd-cascade-subtitle">{{ group.subTypeLabel }}</span>
          <div class="dnd-cascade-badges-wrap" v-html="group.skills"></div>
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
              <span class="dnd-cascade-badge" v-html="mechanicRichHtml(spBadge)"></span>
              <span v-if="spIdx < speedBaseBadges.length - 1" class="text-grey-7 q-mr-xs">, </span>
            </template>
          </template>
          <template v-else>
            <template v-for="(spBadge, spIdx) in speedBadges" :key="'speed-badge-' + spIdx">
              <span class="dnd-cascade-badge" v-html="mechanicRichHtml(spBadge)"></span>
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
            <span class="dnd-cascade-badge" v-html="mechanicRichHtml(riderBadge)"></span>
          </div>
        </div>
      </template>
      <div class="row no-wrap" style="width: 100%">
        <div v-for="stat in stats" :key="stat.stat" class="stat-container">
          <div class="stat-name">{{ stat.stat }}</div>
          <div class="stat">
            <div class="score" v-html="stat.renderedScore"></div>
            <div class="modifier">({{ stat.renderedModifier }})</div>
          </div>
        </div>
      </div>
      <div v-if="editorStore?.visualTemplate !== 'modern' && saves !== ''" class="skill dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': shouldStripeVital('Saving Throws', saves) }">
        <span class="name dnd-cascade-title" data-help="saves" tabindex="0">{{ $t('monster.saves') }}</span>
        <div class="dnd-cascade-badges-wrap" v-html="saves"></div>
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
            <span class="dnd-defense-prose-text" v-html="defSec.formattedProse"></span>
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
          ><span v-html="mechanicRichHtml(sBadge)"></span><span v-if="sIdx < sensesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
        </div>
      </div>
      <div class="skill dnd-cascade-panel dnd-cellular-row" :class="{ 'sb-striped': languagesStripe }">
        <span class="name dnd-cascade-title" data-help="languages" tabindex="0">{{ $t('monster.languages') }}</span>
        <div v-if="languagesBadges.length > 0" class="dnd-cascade-badges-wrap">
          <span
            v-for="(lBadge, lIdx) in languagesBadges"
            :key="'lang-badge-' + lIdx"
            class="dnd-cascade-badge"
          ><span v-html="mechanicRichHtml(lBadge)"></span><span v-if="lIdx < languagesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
        </div>
        <span v-else class="dnd-cascade-badge">&mdash;</span>
      </div>
      <template v-for="group in actionPassivesGroups" :key="group.name">
        <div class="skill dnd-cascade-panel dnd-cellular-row" :class="['cascade-skill-' + group.scopeLabel.toLowerCase(), { 'sb-striped': shouldStripeVital(group.scopeLabel, group.skills) }]">
          <span class="name dnd-cascade-title" :data-help="group.tip ? undefined : group.scopeLabel.toLowerCase()" tabindex="0">{{ group.scopeLabel }}<q-tooltip v-if="group.tip" class="dnd-tip" max-width="320px">{{ group.tip }}</q-tooltip></span>
          <span v-if="group.subTypeLabel && group.subTypeLabel !== 'Action'" class="dnd-cascade-subtitle">{{ group.subTypeLabel }}</span>
          <div class="dnd-cascade-badges-wrap" v-html="group.skills"></div>
        </div>
      </template>
    </template>

    <div v-if="editorStore?.visualTemplate !== 'modern'" class="skill">
      <span class="name">{{ blockStyle.mm2014 ? 'Challenge' : 'CR' }}</span>
      {{ cr }}
      <span v-if="blockStyle.mm2014" style="float: right"
        ><b>Proficiency Bonus</b> +{{ monster.proficiency }}</span
      >
    </div>
    <h3 v-if="blockStyle.mm2024 && (hasGroupedTraits || monster.spellcasting?.standard?.length > 0 || monster.spellcasting?.atWill?.length > 0)" class="section first">
      {{ $t('editor.traits.label') }}
    </h3>
    <div class="traits">
      <!-- Standard Traits -->
      <div
        v-for="(trait, idx) in sanitizedGroupedTraits.standard"
        :key="'trait-std-' + idx"
        class="trait"
        :class="{ 'sb-striped': trait && trait.length > 110 && !trait.includes('sb-plate') }"
        v-html="trait"
      ></div>

      <!-- Dedicated Recharge Sections -->
      <template v-for="sec in sanitizedGroupedTraits.rechargeSections" :key="'sec-' + sec.section">
        <h4 class="sub-section-header">{{ sec.section }}</h4>
        <div
          v-for="(trait, idx) in sec.traits"
          :key="'trait-sec-' + idx"
          class="trait"
          :class="{ 'sb-striped': trait && trait.length > 110 && !trait.includes('sb-plate') }"
          v-html="trait"
        ></div>
      </template>

      <!-- Conditionals Sub-Sections -->
      <template v-for="cond in sanitizedGroupedTraits.conditionals" :key="'cond-' + cond.trigger">
        <h4 class="sub-section-header">Conditionals (<span v-html="mechanicRichHtml(cond.trigger)"></span>)</h4>
        <div
          v-for="(trait, idx) in cond.traits"
          :key="'trait-cond-' + idx"
          class="trait"
          :class="{ 'sb-striped': trait && trait.length > 110 && !trait.includes('sb-plate') }"
          v-html="trait"
        ></div>
      </template>

      <!-- Mythic Trait -->
      <div
        v-if="monster.mythicActions.actions.length > 0"
        class="trait"
        v-html="mythicTrait"
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
    <h3 class="section">{{ $t('editor.action.label') }}</h3>
    <div
      v-if="monster.multiattacks.length > 0"
      class="multiattack"
      v-html="multiattacks"
    ></div>
    <div
      v-for="(attack, idx) in attacks"
      :key="idx"
      class="attack"
      v-html="attack"
    ></div>
    <div
      v-for="(action, idx) in actions"
      :key="idx"
      class="action"
      :class="{ 'sb-striped': action && action.length > 110 && !action.includes('sb-plate') }"
      v-html="action"
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
        class="action"
        :class="{ 'sb-striped': action && action.length > 110 && !action.includes('sb-plate') }"
        v-html="action"
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
        class="action reaction"
        :class="{ 'sb-striped': reaction && reaction.length > 110 && !reaction.includes('sb-plate') }"
        v-html="reaction"
      ></div>
    </div>
    <div v-if="monster.legendaryActions.count > 0 || monster.legendaryActions.actions.length > 0" class="legendary-actions">
      <h3 class="section">{{ $t('editor.legendary.label') }}</h3>
      <div class="preamble" v-html="legendaryPreamble"></div>
      <div
        v-for="(action, idx) in legendaryActions"
        :key="idx"
        class="action legendary"
        v-html="action"
      ></div>
    </div>
    <div v-if="monster.mythicActions.actions.length > 0" class="mythic-actions">
      <h3 class="section">{{ $t('editor.mythic.label') }}</h3>
      <div class="preamble" v-html="mythicPreamble"></div>
      <div
        v-for="(action, idx) in mythicActions"
        :key="idx"
        class="action legendary"
        v-html="action"
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
        class="action reaction"
        :class="{ 'sb-striped': reaction && reaction.length > 110 && !reaction.includes('sb-plate') }"
        v-html="reaction"
      ></div>
    </div>
    <div v-if="monster.lairActions.length > 0" class="lair-actions">
      <h3 class="section">{{ $t('editor.lair.label') }}</h3>
      <div class="preamble" v-html="lairActionPreamble"></div>
      <ul>
        <li
          v-for="(lairAction, idx) in lairActions"
          :key="idx"
          class="action lair"
          v-html="lairAction"
        ></li>
      </ul>
    </div>
    <div v-for="rt in randomTables" :key="rt.id" class="random-table" data-a4-owner="statblock">
          <h3 class="section">{{ rt.title || $t('editor.randomTables.defaultTitle') }}</h3>
          <table class="random-table-grid" :aria-label="rt.title || $t('editor.randomTables.defaultTitle')">
            <thead><tr><th scope="col">{{ rt.dice }}</th><th scope="col">{{ $t('editor.randomTables.result') }}</th></tr></thead>
            <tbody>
              <tr v-for="row in rt.sortedRows" :key="row.id">
                <td class="random-table-range">{{ row.min === row.max ? row.min : row.min + '–' + row.max }}</td><td v-html="mechanicRichHtml(row.text)"></td>
              </tr>
              <tr v-if="rt.fallback"><td class="random-table-range">{{ $t('editor.randomTables.otherwise') }}</td><td>{{ rt.fallback }}</td></tr>
            </tbody>
          </table>
        </div>
        <div v-if="monster.regionalEffects.length > 0" class="regional-effects">
      <h3 class="section">{{ $t('editor.regional.label') }}</h3>
      <div class="preamble" v-html="regionalEffectPreamble"></div>
      <ul>
        <li
          v-for="(effect, idx) in regionalEffects"
          :key="idx"
          class="action regional"
          v-html="effect"
        ></li>
      </ul>
    </div>
    <div v-if="blockStyle.mm2014 && monster.inventory !== ''" class="inventory">
      <h3 class="section">{{ $t('editor.inventory.label') }}</h3>
      <div v-html="inventory"></div>
    </div>

    <!-- Villain Actions (MCDM Flee, Mortals!) -->
    <div v-if="villainActionsList && villainActionsList.length > 0" class="actions villain-actions">
      <h3 class="section">Villain Actions</h3>
      <div class="preamble">
        <i>{{ monster.name }} can take 3 villain actions, using one at the end of another creature's turn. Only one villain action can be used per round, in numbered order (1, 2, 3).</i>
      </div>
      <div
        v-for="va in villainActionsList"
        :key="va.id"
        class="action villain"
        v-html="va.rendered"
      ></div>
    </div>

    <!-- Bloodied Actions (Anne Gregersen / DMsGuild) -->
    <div v-if="bloodiedActionsList && bloodiedActionsList.length > 0" class="actions bloodied-actions">
      <h3 class="section">Bloodied Actions</h3>
      <div
        v-for="ba in bloodiedActionsList"
        :key="ba.id"
        class="action bloodied"
        v-html="ba.rendered"
      ></div>
    </div>

    <!-- Reactive Actions (Official WotC 2024 / Level Up A5e) -->
    <div v-if="reactiveActionsList && reactiveActionsList.length > 0" class="actions reactive-actions">
      <h3 class="section">Reactive Actions</h3>
      <div
        v-for="ra in reactiveActionsList"
        :key="ra.id"
        class="action reactive"
        v-html="ra.rendered"
      ></div>
    </div>

    <!-- Combo Actions (MCDM) -->
    <div v-if="comboActionsList && comboActionsList.length > 0" class="actions combo-actions">
      <h3 class="section">Combo Actions</h3>
      <div
        v-for="ca in comboActionsList"
        :key="ca.id"
        class="action combo"
        v-html="ca.rendered"
      ></div>
    </div>

    <!-- Draco Anatomy (Breakable Monster Limbs) -->
    <div v-if="anatomyPartsList && anatomyPartsList.length > 0" class="actions anatomy-actions">
      <h3 class="section">Targeted Anatomy & Breakable Parts</h3>
      <div
        v-for="ap in anatomyPartsList"
        :key="ap.id"
        class="action anatomy"
        v-html="ap.rendered"
      ></div>
    </div>

    <!-- Runehammer Track (Escalating Round Countdown) -->
    <div v-if="runehammerTrackData" class="actions runehammer-track">
      <h3 class="section">{{ runehammerTrackData.title }} (Timer: 1{{ runehammerTrackData.timerDie }} rounds)</h3>
      <div
        v-for="ev in runehammerTrackData.events"
        :key="ev.id"
        class="action track-event"
        v-html="ev.rendered"
      ></div>
    </div>


    </div>

    </div>

    <!-- Right Portrait -->
    <div
      v-if="hasPortrait && (!editorStore?.a4PreviewMode || (resolvedA4Layout !== 'stacked' && resolvedA4Layout !== 'statblock_only')) && monster.portrait?.position === 'right'"
      class="monster-portrait portrait-right"
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
import { computed, defineComponent, inject, nextTick, onBeforeUnmount, onMounted, ref, StyleValue, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { useA4Composition } from './useA4Composition'
import { useMonsterStore } from 'src/stores/monster-store'
import { useSpellsStore } from 'src/stores/spells-store'
import { buildCastingProjection } from 'src/core/domain/casting-projection'
import { innateCastingContext, resolveCastingAbility } from 'src/core/domain/casting-ability'
import { useTextRenderer } from './useTextRenderer'
import { useProcessTokens } from './useProcessTokens'
import { useEditorStore, type A4CompositionLayer } from 'src/stores/editor-store'
import { CR } from 'src/data/CR'
import { getSpellTagString } from 'src/core/domain/spell-metadata'
import { buildInnateSpellPlate, spellLevelLead } from 'src/core/domain/spell-plate'
import type { SpellPlateLevel } from 'src/core/domain/spell-plate'
import { effectiveAdvantage } from 'src/core/domain/skill-action-groups'
import { appAsset } from 'src/core/domain/asset-url'
import { formatInitiativeRiders } from 'src/core/domain/initiative-composer'
import { formatCurvedGradientCss } from 'src/core/domain/gradient-curve'
import { statblockHelpText } from './statblock-help'
import { resolveSpellcastingPlacement } from 'src/core/domain/export-contract'
import WebSpellPlates from './WebSpellPlates.vue'

export default defineComponent({
  name: 'WebRenderer',
  components: {
    WebSpellPlates,
  },
  setup() {
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
      const description = statblockHelpText(key)
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

    const { openLayerStudio, a4AllCustomLayers, a4BackgroundLayers, a4ForegroundLayers, a4PageRef, a4ViewportRef, a4TargetHeightPx, resolvedA4Layout, updateMeasuredHeight, a4ScaleStageStyle, ensureCoreLayers, portraitLayerObj, statblockLayerObj, getLayerZIndex, a4StatblockWrapperStyle, a4StatblockWidth, a4StatblockStyle, statblockFrame, statblockContent, fit, statblockFitActive, statblockFrameStyle, fittedStatblockStyle, measureStatblockFit, fitFrame, scheduleStatblockFit, fitObserver, lastFitContainerWidth, fitResizeObserver, a4PortraitStyle, portraitCropContainerStyle, imageShapeTransform, portraitImgStyle, formatGradient, getGradientOverlayStyle, getLayerStyle, getLayerTextStyle, a4PageOverflowPx, checkA4Overflow, fitA4ForPrint, printA4Sheet } = useA4Composition({ monster, editorStore, renderRoot, columns, hasPortrait })

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

    const shouldStripeVital = (label: string, content: unknown): boolean => {
      let raw = ''
      if (Array.isArray(content)) raw = content.join(' ')
      else if (content && typeof content === 'object') {
        if ('value' in content) raw = String(content.value || '')
        else raw = JSON.stringify(content)
      } else raw = String(content || '')
      const text = raw.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim()
      return (String(label || '').length + text.length) > 42
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
    const attacks = computed(() =>
      textRenderer.attacks.value.map((a) => sanitizeWebString(a))
    )

    const actions = computed(() =>
      textRenderer.actions.value.map((a) => sanitizeWebString(a))
    )

    const bonusActions = computed(() =>
      textRenderer.bonusActions.value.map((a) => sanitizeWebString(a))
    )

    const multiattacks = computed(() =>
      sanitizeWebString(textRenderer.multiattacks.value)
    )

    const legendaryPreamble = computed(() =>
      sanitizeWebString(textRenderer.legendaryPreamble.value)
    )

    const legendaryActions = computed(() =>
      textRenderer.legendaryActions.value.map((a) => sanitizeWebString(a))
    )

    const mythicTrait = computed(() =>
      sanitizeWebString(textRenderer.mythicTrait.value)
    )

    const mythicPreamble = computed(() =>
      sanitizeWebString(textRenderer.mythicPreamble.value)
    )

    const mythicActions = computed(() =>
      textRenderer.mythicActions.value.map((a) => sanitizeWebString(a))
    )

    const reactions = computed(() =>
      textRenderer.reactions.value.map((r) => sanitizeWebString(r))
    )

    const lairActionPreamble = computed(() =>
      sanitizeWebString(textRenderer.lairActionPreamble.value)
    )

    const lairActions = computed(() =>
      monster.lairActions.map((la) => sanitizeWebString(processLairAction(la, monster, true)))
    )

    const regionalEffectPreamble = computed(() =>
      sanitizeWebString(textRenderer.regionalEffectPreamble.value)
    )

    // A11.9: sorted copies so the template never mutates stored rows.
    const randomTables = computed(() =>
      (monster.randomTables ?? []).map((rt) => ({ ...rt, sortedRows: [...rt.rows].sort((a, b) => a.min - b.min) }))
    )

    const regionalEffects = computed(() =>
      textRenderer.regionalEffects.value.map((re) => sanitizeWebString(re))
    )

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

    const inventory = computed(() =>
      sanitizeWebString(textRenderer.inventory.value)
    )

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

    const actionPassivesGroups = computed(() => textRenderer.actionPassivesGroups.value)
    const senses = computed(() => sanitizeWebString(textRenderer.senses.value))
    const languages = computed(() => sanitizeWebString(textRenderer.languages.value))
    const sensesBadges = computed(() => textRenderer.sensesBadges?.value || [])
    const languagesBadges = computed(() => textRenderer.languagesBadges?.value || [])
    const speedBadges = computed(() => textRenderer.speedBadges?.value || [])
    const speedBaseBadges = computed(() => textRenderer.speedBaseBadges?.value || [])
    const speedRiderBadges = computed(() => textRenderer.speedRiderBadges?.value || [])

    const vitalsStripingMap = computed(() => {
      // Clean alternating row indexing across visible vital statistics rows
      // Order: AC (0) -> HP (1) -> cascadingDefenses (2, 3...) -> Speed -> Senses -> Languages -> Gear
      let rowCounter = 0
      const map: Record<string, boolean> = {}

      // AC
      map['ac'] = rowCounter % 2 === 1
      rowCounter++

      // HP
      map['hp'] = rowCounter % 2 === 1
      rowCounter++

      if (blockStyle.value.mm2024) {
        for (const defSec of cascadingDefenses.value) {
          map['def_' + defSec.key] = rowCounter % 2 === 1
          rowCounter++
        }
        map['speed'] = rowCounter % 2 === 1
        rowCounter++

        if (sensesBadges.value.length > 0) {
          map['senses'] = rowCounter % 2 === 1
          rowCounter++
        }
        map['languages'] = rowCounter % 2 === 1
        rowCounter++

        if (monster.inventory !== '' && monster.inventory !== '<br>') {
          map['gear'] = rowCounter % 2 === 1
          rowCounter++
        }
      } else {
        map['speed'] = rowCounter % 2 === 1
        rowCounter++
      }

      return map
    })

    const acStripe = computed(() => vitalsStripingMap.value['ac'] ?? false)
    const hpStripe = computed(() => vitalsStripingMap.value['hp'] ?? true)
    const speedStripe = computed(() => vitalsStripingMap.value['speed'] ?? false)
    const sensesStripe = computed(() => vitalsStripingMap.value['senses'] ?? true)
    const languagesStripe = computed(() => vitalsStripingMap.value['languages'] ?? false)
    const isDefenseStriped = (key: string) => vitalsStripingMap.value['def_' + key] ?? false
    const actionPassives = computed(() =>
      sanitizeWebString(textRenderer.actionPassives.value)
    )

    const sanitizedGroupedTraits = computed(() => {
      const raw = textRenderer.groupedTraits.value
      return {
        standard: raw.standard.map((t) => sanitizeWebString(t)),
        conditionals: raw.conditionals.map((c) => ({
          trigger: c.trigger,
          traits: c.traits.map((t) => sanitizeWebString(t)),
        })),
        rechargeSections: raw.rechargeSections.map((r) => ({
          section: r.section,
          traits: r.traits.map((t) => sanitizeWebString(t)),
        })),
      }
    })

    const hasGroupedTraits = computed(() => {
      const g = sanitizedGroupedTraits.value
      return (
        g.standard.length > 0 ||
        g.conditionals.length > 0 ||
        g.rechargeSections.length > 0 ||
        monster.mythicActions.actions.length > 0
      )
    })


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

<style lang="scss" scoped src="./web-renderer.scoped.scss"></style>
