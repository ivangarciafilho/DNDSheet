<template>
  <div class="web-renderer-root" :class="{ 'in-a4-mode': editorStore?.a4PreviewMode }">
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
            :color="a4PageOverflowPx > 0 ? 'amber-9' : 'positive'"
            class="text-weight-bold q-pa-xs"
          >
            <q-icon :name="a4PageOverflowPx > 0 ? 'warning' : 'check_circle'" class="q-mr-xs" />
            {{ a4PageOverflowPx > 0 ? `Overflow (+${a4PageOverflowPx}px)` : 'Fits 1 A4 Page' }}
          </q-badge>

          <q-btn
            flat
            dense
            color="white"
            icon="print"
            label="Print / PDF"
            @click="printA4Sheet"
          >
            <q-tooltip>Print or Save as PDF (exact 1:1 A4 physical page)</q-tooltip>
          </q-btn>
        </template>
      </div>
    </div>

    <!-- Scaled A4 Page or Fluid Container -->
    <div
      :class="editorStore?.a4PreviewMode ? 'a4-preview-viewport' : 'standard-viewport'"
      ref="a4ViewportRef"
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
          <!-- A4 Composition Layers: Background Textures -->
          <template v-if="editorStore?.a4PreviewMode">
            <div
              v-for="layer in a4BackgroundLayers"
              :key="layer.id"
              class="a4-comp-layer a4-bg-layer"
              :style="getLayerStyle(layer)"
            >
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
          >
            <img :src="monster.portrait?.url" :alt="monster.name" class="a4-hero-img" />
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
          >
            <!-- Left Portrait -->
            <div
              v-if="hasPortrait && (!editorStore?.a4PreviewMode || (resolvedA4Layout !== 'stacked' && resolvedA4Layout !== 'statblock_only')) && (monster.portrait?.position === 'left' || (!monster.portrait?.position && editorStore?.a4PreviewMode))"
              class="monster-portrait portrait-left"
              :style="editorStore?.a4PreviewMode ? a4PortraitStyle : portraitStyle"
            >
              <div class="portrait-img-container" :style="portraitCropContainerStyle">
                <img :src="monster.portrait?.url" :alt="monster.name" class="portrait-img" :style="portraitImgStyle" />
              </div>
              <div v-if="monster.portrait?.caption" class="portrait-caption">
                {{ monster.portrait?.caption }}
              </div>
            </div>

            <!-- Main Statblock -->
            <div
              class="statblock"
              :class="[
                blockStyle,
                { 'modern-modular': editorStore?.visualTemplate === 'modern' },
                `theme-${editorStore?.visualTheme || 'wotc'}`
              ]"
              :style="editorStore?.a4PreviewMode ? a4StatblockStyle : columns"
            >
      <div class="monster-nameplate-panel unified-top-plate">
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
              <div class="region-divider"></div>
              <div class="cr-region cr-sub-region top-plate-col">
                <span class="region-label top-plate-header" data-help="experience-points" tabindex="0">XP</span>
                <span class="region-val top-plate-cell" :title="xpFormatted + ' XP'">{{ xpCompact }}</span>
              </div>
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
      <hr />
    <div class="skill ac dnd-cascade-panel dnd-cellular-row dnd-ac-cascade-row sb-row">
      <span class="name dnd-cascade-title sb-cell sb-head" data-help="armor-class" tabindex="0">{{ blockStyle.mm2024 ? 'AC' : 'Armor Class' }}</span>
      <div class="dnd-cascade-badges-wrap sb-cell">
        <span
          v-for="(acBadge, aIdx) in sanitizedAcBadges"
          :key="'ac-badge-' + aIdx"
          class="dnd-cascade-badge"
          v-html="acBadge"
        ></span>
      </div>
    </div>
    <div class="skill hp dnd-cascade-panel dnd-cellular-row dnd-hp-cascade-row sb-row">
      <span class="name dnd-cascade-title sb-cell sb-head" data-help="hit-points" tabindex="0">{{ blockStyle.mm2024 ? 'HP' : 'Hit Points' }}</span>
      <div class="dnd-cascade-badges-wrap sb-cell">
        <span
          v-for="(hBadge, hIdx) in sanitizedHpBadges"
          :key="'hp-badge-' + hIdx"
          class="dnd-cascade-badge"
          v-html="hBadge"
        ></span>
      </div>
    </div>
    <div class="skill speed dnd-cascade-panel dnd-cellular-row sb-row">
      <span class="name dnd-cascade-title sb-cell sb-head" data-help="speed" tabindex="0">Speed</span>
      <div class="dnd-cascade-badges-wrap sb-cell">
        <span
          v-for="(spBadge, spIdx) in speedBadges"
          :key="'speed-badge-' + spIdx"
          class="dnd-cascade-badge"
        >{{ spBadge }}</span>
      </div>
    </div>
    <hr />
    <div v-if="blockStyle.mm2014" class="row no-wrap" style="width: 100%">
      <div v-for="stat in stats" :key="stat.stat" class="stat-container">
        <div class="stat-name">{{ stat.stat }}</div>
        <div class="stat">
          <div class="score">{{ stat.score }}</div>
          <div class="modifier">({{ stat.renderedModifier }})</div>
        </div>
      </div>
    </div>
    <div
      v-else-if="blockStyle.mm2024"
      class="stats dnd-stats-2024"
      style="width: 100%; max-width: 100%; box-sizing: border-box;"
    >
      <div class="stat-table">
        <div class="header-label mod">{{ $t('editor.mod') }}</div>
        <div class="header-label save">{{ $t('editor.save') }}</div>
        <div class="stat one">
          {{ statsAndSavesByKey.STR?.stat?.toLowerCase() ?? 'str' }}
        </div>
        <div class="score one">{{ statsAndSavesByKey.STR?.score ?? 10 }}</div>
        <div class="mod one">{{ statsAndSavesByKey.STR?.renderedModifier ?? '+0' }}</div>
        <div class="save one" v-html="statsAndSavesByKey.STR?.renderedSave ?? '+0'"></div>
        <div class="stat two">
          {{ statsAndSavesByKey.INT?.stat?.toLowerCase() ?? 'int' }}
        </div>
        <div class="score two">{{ statsAndSavesByKey.INT?.score ?? 10 }}</div>
        <div class="mod two">{{ statsAndSavesByKey.INT?.renderedModifier ?? '+0' }}</div>
        <div class="save two" v-html="statsAndSavesByKey.INT?.renderedSave ?? '+0'"></div>
      </div>
      <div class="stat-table">
        <div class="header-label mod">{{ $t('editor.mod') }}</div>
        <div class="header-label save">{{ $t('editor.save') }}</div>
        <div class="stat one">
          {{ statsAndSavesByKey.DEX?.stat?.toLowerCase() ?? 'dex' }}
        </div>
        <div class="score one">{{ statsAndSavesByKey.DEX?.score ?? 10 }}</div>
        <div class="mod one">{{ statsAndSavesByKey.DEX?.renderedModifier ?? '+0' }}</div>
        <div class="save one" v-html="statsAndSavesByKey.DEX?.renderedSave ?? '+0'"></div>
        <div class="stat two">
          {{ statsAndSavesByKey.WIS?.stat?.toLowerCase() ?? 'wis' }}
        </div>
        <div class="score two">{{ statsAndSavesByKey.WIS?.score ?? 10 }}</div>
        <div class="mod two">{{ statsAndSavesByKey.WIS?.renderedModifier ?? '+0' }}</div>
        <div class="save two" v-html="statsAndSavesByKey.WIS?.renderedSave ?? '+0'"></div>
      </div>
      <div class="stat-table">
        <div class="header-label mod">{{ $t('editor.mod') }}</div>
        <div class="header-label save">{{ $t('editor.save') }}</div>
        <div class="stat one">
          {{ statsAndSavesByKey.CON?.stat?.toLowerCase() ?? 'con' }}
        </div>
        <div class="score one">{{ statsAndSavesByKey.CON?.score ?? 10 }}</div>
        <div class="mod one">{{ statsAndSavesByKey.CON?.renderedModifier ?? '+0' }}</div>
        <div class="save one" v-html="statsAndSavesByKey.CON?.renderedSave ?? '+0'"></div>
        <div class="stat two">
          {{ statsAndSavesByKey.CHA?.stat?.toLowerCase() ?? 'cha' }}
        </div>
        <div class="score two">{{ statsAndSavesByKey.CHA?.score ?? 10 }}</div>
        <div class="mod two">{{ statsAndSavesByKey.CHA?.renderedModifier ?? '+0' }}</div>
        <div class="save two" v-html="statsAndSavesByKey.CHA?.renderedSave ?? '+0'"></div>
      </div>
    </div>
    <hr />
    <div v-if="blockStyle.mm2014 && editorStore?.visualTemplate !== 'modern' && saves !== ''" class="skill dnd-cascade-panel dnd-cellular-row sb-row">
      <span class="name dnd-cascade-title sb-cell sb-head" data-help="saves" tabindex="0">{{ $t('monster.saves') }}</span>
      <div class="dnd-cascade-badges-wrap sb-cell" v-html="saves"></div>
    </div>
    <div
      v-if="
        blockStyle.mm2024 &&
        monster.inventory !== '' &&
        monster.inventory !== '<br>'
      "
      class="skill dnd-cascade-panel dnd-cellular-row sb-row"
    >
      <span class="name dnd-cascade-title sb-cell sb-head" data-help="gear" tabindex="0">{{ $t('monster.gear') }}</span>
      <div class="dnd-cascade-badges-wrap sb-cell" v-html="inventory"></div>
    </div>

    <!-- Unified Defense Panel per Scope (| Vulnerabilities | [prose text / zebra stripes]) -->
    <template v-for="defSec in cascadingDefenses" :key="defSec.key">
      <div
        class="skill dnd-cascade-panel dnd-cellular-row dnd-defense-cascade-row sb-row"
        :class="['cascade-' + defSec.key, { 'zebra-stripe-text': defSec.isVerbose }]"
        :data-defense-title="defSec.title"
      >
        <span class="name dnd-cascade-title sb-cell sb-head" :data-help="defSec.key" tabindex="0">{{ defSec.scopeLabel }}</span>
        <span v-if="defSec.subTypeLabel" class="dnd-cascade-subtitle sb-cell sb-qual">{{ defSec.subTypeLabel }}</span>
        <div class="dnd-defense-unified-body sb-cell sb-grow q-px-sm flex items-center">
          <span class="dnd-defense-prose-text" v-html="defSec.formattedProse"></span>
        </div>
      </div>
    </template>

    <!-- Senses (Horizontal Cellular Row -> Badges, no redundant Passive Perception) -->
    <div v-if="sensesBadges.length > 0" class="skill dnd-cascade-panel dnd-cellular-row sb-row">
      <span class="name dnd-cascade-title sb-cell sb-head" data-help="senses" tabindex="0">{{ $t('monster.senses') }}</span>
      <div class="dnd-cascade-badges-wrap sb-cell">
        <span
          v-for="(sBadge, sIdx) in sensesBadges"
          :key="'sense-badge-' + sIdx"
          class="dnd-cascade-badge"
        >{{ sBadge }}<span v-if="sIdx < sensesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
      </div>
    </div>

    <!-- Unified Passives, Skills & Tools Cellular Rows (| Study | Action | ... |, | Skills | Action | ... |, | Tools | Action | ... |) -->
    <template v-for="group in actionPassivesGroups" :key="group.name">
      <div class="skill dnd-cascade-panel dnd-cellular-row sb-row" :class="'cascade-skill-' + group.scopeLabel.toLowerCase()">
        <span class="name dnd-cascade-title sb-cell sb-head" :data-help="group.tip ? undefined : group.scopeLabel.toLowerCase()" tabindex="0">{{ group.scopeLabel }}<q-tooltip v-if="group.tip" class="dnd-tip" max-width="320px">{{ group.tip }}</q-tooltip></span>
        <span class="dnd-cascade-subtitle sb-cell sb-qual">{{ group.subTypeLabel }}</span>
        <div class="dnd-cascade-badges-wrap sb-cell sb-grow" v-html="group.skills"></div>
      </div>
    </template>

    <!-- Languages (Horizontal Cellular Row -> Badges) -->
    <div class="skill dnd-cascade-panel dnd-cellular-row sb-row">
      <span class="name dnd-cascade-title sb-cell sb-head" data-help="languages" tabindex="0">{{ $t('monster.languages') }}</span>
      <div v-if="languagesBadges.length > 0" class="dnd-cascade-badges-wrap sb-cell">
        <span
          v-for="(lBadge, lIdx) in languagesBadges"
          :key="'lang-badge-' + lIdx"
          class="dnd-cascade-badge"
        >{{ lBadge }}<span v-if="lIdx < languagesBadges.length - 1" class="text-grey-7 q-mr-xs">,</span></span>
      </div>
      <span v-else class="dnd-cascade-badge sb-cell">&mdash;</span>
    </div>
    <div v-if="editorStore?.visualTemplate !== 'modern'" class="skill">
      <span class="name">{{ blockStyle.mm2014 ? 'Challenge' : 'CR' }}</span>
      {{ cr }}
      <span v-if="blockStyle.mm2014" style="float: right"
        ><b>Proficiency Bonus</b> +{{ monster.proficiency }}</span
      >
    </div>
    <hr />
    <h3 v-if="blockStyle.mm2024 && (hasGroupedTraits || monster.spellcasting?.standard?.length > 0 || monster.spellcasting?.atWill?.length > 0)" class="section first">
      {{ $t('editor.traits.label') }}
    </h3>
    <div class="traits">
      <!-- Standard Traits -->
      <div
        v-for="(trait, idx) in sanitizedGroupedTraits.standard"
        :key="'trait-std-' + idx"
        class="trait"
        v-html="trait"
      ></div>

      <!-- Dedicated Recharge Sections -->
      <template v-for="sec in sanitizedGroupedTraits.rechargeSections" :key="'sec-' + sec.section">
        <h4 class="sub-section-header">{{ sec.section }}</h4>
        <div
          v-for="(trait, idx) in sec.traits"
          :key="'trait-sec-' + idx"
          class="trait"
          v-html="trait"
        ></div>
      </template>

      <!-- Conditionals Sub-Sections -->
      <template v-for="cond in sanitizedGroupedTraits.conditionals" :key="'cond-' + cond.trigger">
        <h4 class="sub-section-header">Conditionals ({{ cond.trigger }})</h4>
        <div
          v-for="(trait, idx) in cond.traits"
          :key="'trait-cond-' + idx"
          class="trait"
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
      <div v-if="innateSpellPlate.groups.length > 0" class="innate-spellcasting spellcasting-panel sb-plate">
        <div class="sb-row">
          <div class="sb-cell sb-head" data-help="entry-name" tabindex="0"><strong>Innate Spellcasting</strong> <span class="sb-qual">({{ innateSpellPlate.stat }})</span></div>
          <div class="sb-cell" data-help="spell-save-dc" tabindex="0">Spell Save DC <strong>{{ innateSpellPlate.save }}</strong></div>
          <div class="sb-cell" data-help="spell-attack" tabindex="0">Spell Attack <strong>{{ innateSpellPlate.attack }}</strong></div>
        </div>
        <div v-if="innateSpellPlate.processedNotes" class="sb-body" v-html="innateSpellPlate.processedNotes"></div>
        <div v-for="(group, groupIndex) in innateSpellPlate.groups" :key="'innate-level-' + groupIndex" class="sb-row">
          <div class="sb-cell sb-head" data-help="spell-cadence" tabindex="0">{{ group.label }}</div>
          <div v-for="(spell, spellIndex) in group.spells" :key="'innate-spell-' + groupIndex + '-' + spellIndex" class="sb-cell sb-spell">
            {{ spell.name }}<span v-if="spell.tags" class="spell-tag-badge" data-help="spell-components" tabindex="0">({{ spell.tags }})</span>
          </div>
        </div>
      </div>

      <div v-if="spellPlate.levels.length > 0" class="class-spellcasting spellcasting sb-plate">
        <div class="sb-row">
          <div class="sb-cell sb-head" data-help="entry-name" tabindex="0"><strong>{{ spellPlate.title }}</strong> <span class="sb-qual">({{ spellPlate.stat }})</span></div>
          <div class="sb-cell" data-help="spell-save-dc" tabindex="0">Spell Save DC <strong>{{ spellPlate.save }}</strong> · Spell Attack <strong>{{ spellPlate.attack }}</strong></div>
          <div v-if="spellPlate.resource" class="sb-cell" data-help="spell-slots" tabindex="0">{{ spellPlate.resource }}</div>
          <div v-if="spellPlate.prepared" class="sb-cell" data-help="spell-slots" tabindex="0">{{ spellPlate.prepared }}</div>
        </div>
        <div v-if="spellPlate.metamagic" class="sb-row">
          <div class="sb-cell sb-head" data-help="metamagic" tabindex="0">Metamagic · <strong>{{ spellPlate.metamagic.points }}</strong> Sorcery Points · regained on {{ spellPlate.metamagic.refresh }}</div>
          <div v-for="(meta, index) in spellPlate.metamagic.options" :key="'metamagic-' + index" class="sb-cell">
            <strong v-if="meta.cost">{{ meta.cost === 'Spell level' ? 'Cost equals spell level' : `Cost ${meta.cost} SP` }} · </strong>{{ meta.name }}<template v-if="meta.effect">: {{ meta.effect }}</template>
          </div>
        </div>
        <div v-for="row in spellPlate.levels" :key="'spell-level-' + row.level" class="sb-row">
          <div class="sb-cell sb-head" :data-help="row.level === 0 ? 'cantrips' : 'spell-slots'" tabindex="0">
            <template v-if="row.level === 0">Cantrips</template>
            <template v-else><strong>{{ row.ordinal }}</strong> Level<template v-if="row.slotCount"> · <strong>{{ row.slotCount }}</strong></template><template v-if="row.cadence"> · {{ row.cadence }}</template></template>
            <template v-if="row.bonusAction"> · Bonus Action</template>
          </div>
          <div v-for="(spell, spellIndex) in row.spells" :key="'spell-' + row.level + '-' + spellIndex" class="sb-cell sb-spell">
            {{ spell.name }}<span v-if="spell.tags" class="spell-tag-badge" data-help="spell-components" tabindex="0">({{ spell.tags }})</span>
            <span v-if="spell.cadence" class="spell-cadence-badge" data-help="spell-cadence" tabindex="0">{{ spell.cadence }}</span>
          </div>
        </div>
        <div v-if="monster.spellcasting?.useCustomClassPreamble && sanitizedClassSpellcastingPreamble" class="sb-body" v-html="sanitizedClassSpellcastingPreamble"></div>
      </div>
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
      v-html="action"
    ></div>
    <div v-if="bonusActions.length > 0" class="bonus-actions">
      <h3 class="section">{{ $t('monster.bonusActions') }}</h3>
      <div
        v-for="(action, idx) in bonusActions"
        :key="idx"
        class="action"
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

    <!-- Right Portrait -->
    <div
      v-if="hasPortrait && (!editorStore?.a4PreviewMode || (resolvedA4Layout !== 'stacked' && resolvedA4Layout !== 'statblock_only')) && monster.portrait?.position === 'right'"
      class="monster-portrait portrait-right"
      :style="editorStore?.a4PreviewMode ? a4PortraitStyle : portraitStyle"
    >
      <div class="portrait-img-container" :style="portraitCropContainerStyle">
        <img :src="monster.portrait?.url" :alt="monster.name" class="portrait-img" :style="portraitImgStyle" />
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
    <img :src="monster.portrait?.url" :alt="monster.name" class="a4-hero-img" :style="portraitImgStyle" />
    <div v-if="monster.portrait?.caption" class="a4-portrait-caption">
      {{ monster.portrait?.caption }}
    </div>
  </div>

  <!-- A4 Composition Layers: Foreground Alpha Frames & Custom Overlays -->
  <template v-if="editorStore?.a4PreviewMode">
    <div
      v-for="layer in a4ForegroundLayers"
      :key="layer.id"
      class="a4-comp-layer a4-fg-layer"
      :style="getLayerStyle(layer)"
    >
      <div
        v-if="layer.showTextOverlay && layer.overlayText"
        class="a4-layer-text-overlay"
        :style="getLayerTextStyle(layer)"
      >
        {{ layer.overlayText }}
      </div>
    </div>
  </template>
        </div>
      </div>
    </div>

  </div>
  <Teleport to="body">
    <div
      v-if="activeHelpTip"
      ref="helpTipElement"
      id="statblock-help-tip"
      class="statblock-help-tip"
      role="tooltip"
      :style="helpTipStyle"
    >{{ activeHelpTip.text }}</div>
  </Teleport>
</template>

<script lang="ts">
import { computed, defineComponent, inject, nextTick, onBeforeUnmount, onMounted, ref, StyleValue, watch } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { useTextRenderer } from './useTextRenderer'
import { useProcessTokens } from './useProcessTokens'
import { useEditorStore } from 'src/stores/editor-store'
import { CR } from 'src/data/CR'
import { getSpellTagString } from 'src/core/domain/spell-metadata'
import { buildInnateSpellPlate, buildSpellPlate, ordinalLabel } from 'src/core/domain/spell-plate'
import { formatSpellcastingTitle, calculateSpellcastingMetrics, SPELL_POINTS_BY_LEVEL } from 'src/core/usecases/AutoSyncSpellcasting'
import { statModifier } from 'src/core/domain/math-utils'
import { statblockHelpText } from './statblock-help'

export default defineComponent({
  name: 'WebRenderer',
  setup() {
    const monster = useMonsterStore()
    const editorStore = useEditorStore()
    const renderRoot = ref<HTMLElement | null>(null)
    const helpTipElement = ref<HTMLElement | null>(null)
    const activeHelpTip = ref<{ text: string } | null>(null)
    const activeHelpTarget = ref<HTMLElement | null>(null)
    const helpTipStyle = ref<StyleValue>({ position: 'fixed', left: '12px', top: '12px' })
    let helpTipObserver: MutationObserver | null = null
    const { sanitizeWebString } = useProcessTokens()
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
      const description = statblockHelpText(target.dataset.help)
      const row = target.matches('.sb-head') ? target.closest('.sb-row') : null
      const rowValues = row
        ? [...row.querySelectorAll<HTMLElement>(':scope > .sb-cell:not(.sb-head)')]
            .map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim())
            .filter((value): value is string => Boolean(value))
            .join(' · ')
            .slice(0, 180)
        : ''
      const text = [description, rowValues ? `Shown here: ${rowValues}` : ''].filter(Boolean).join(' ')
      if (!text) {
        if (activeHelpTarget.value !== target) hideHelpTip()
        return
      }
      if (activeHelpTarget.value !== target) hideHelpTip()
      activeHelpTarget.value = target
      activeHelpTip.value = { text }
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

    const openLayerStudio = () => {
      const el = document.getElementById('a4-layer-studio-expansion')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    const a4BackgroundLayers = computed(() => {
      return (editorStore.a4Layers || []).filter(l => l.type === 'background')
    })
    const a4ForegroundLayers = computed(() => {
      return (editorStore.a4Layers || []).filter(l => l.type === 'foreground')
    })

    const a4PageRef = ref<HTMLElement | null>(null)
    const a4ViewportRef = ref<HTMLElement | null>(null)

    const a4TargetHeightPx = computed(() => {
      return editorStore.a4Orientation === 'landscape' ? 794 : 1123
    })

    const resolvedA4Layout = computed(() => {
      if (editorStore.a4Layout && editorStore.a4Layout !== 'auto') {
        return editorStore.a4Layout
      }
      if (!hasPortrait.value) return 'statblock_only'
      if (editorStore.a4Orientation === 'landscape') return 'side_by_side'
      return 'side_by_side'
    })

    const a4ScaleStageStyle = computed<StyleValue>(() => {
      const zoom = editorStore.a4Zoom
      const baseWidth = editorStore.a4Orientation === 'landscape' ? 1123 : 794
      const baseHeight = editorStore.a4Orientation === 'landscape' ? 794 : 1123

      let scale = 1.0
      if (typeof zoom === 'number') {
        scale = zoom / 100
      } else if (zoom === 'fit') {
        const vpWidth = a4ViewportRef.value?.clientWidth || 794
        scale = Math.min(1.0, Math.max(0.4, (vpWidth - 32) / baseWidth))
      }

      if (scale === 1.0) {
        return {
          width: `${baseWidth}px`,
        }
      }

      return {
        width: `${baseWidth * scale}px`,
        height: `${baseHeight * scale + 30}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }
    })

    const a4StatblockStyle = computed<StyleValue>(() => {
      const base = { ...(columns.value as Record<string, string>) }
      const occ = editorStore.a4PictureOcclusion || 0
      const opacity = editorStore.a4StatblockOpacity ?? 100
      const portraitW = monster.portrait?.width && monster.portrait.width > 50 ? monster.portrait.width : 280

      const offX = editorStore.a4StatblockOffsetX || 0
      const offY = editorStore.a4StatblockOffsetY || 0
      const scX = (editorStore.a4StatblockScaleX ?? 100) / 100
      const scY = (editorStore.a4StatblockScaleY ?? 100) / 100
      const transformStyle = (offX !== 0 || offY !== 0 || scX !== 1 || scY !== 1)
        ? {
            transform: `translate(${offX}px, ${offY}px) scale(${scX}, ${scY})`,
            transformOrigin: 'top left'
          }
        : {}

      const opacityStyle = opacity < 100 ? {
        '--statblock-opacity': `${opacity / 100}`,
        backgroundColor: editorStore.visualTheme === 'wotc'
          ? `rgba(253, 241, 220, ${(opacity / 100) * 0.95}) !important`
          : `rgba(255, 255, 255, ${(opacity / 100) * 0.95}) !important`,
        backdropFilter: 'blur(2px)'
      } : {}

      if (resolvedA4Layout.value === 'statblock_only' || !hasPortrait.value) {
        return {
          ...base,
          width: '100%',
          columnCount: editorStore.statBlockColumns > 1 ? 2 : (editorStore.a4Orientation === 'landscape' ? 2 : 1),
          ...opacityStyle,
          ...transformStyle
        }
      }
      if (resolvedA4Layout.value === 'stacked') {
        return {
          ...base,
          width: '100%',
          columnCount: 2,
          ...opacityStyle,
          ...transformStyle
        }
      }

      if (occ >= 100) {
        return {
          ...base,
          width: '100%',
          zIndex: 3,
          position: 'relative',
          ...opacityStyle,
          ...transformStyle
        }
      }

      if (occ > 0) {
        const overlapPx = Math.round((portraitW * occ) / 100)
        return {
          ...base,
          flex: '1 1 0',
          minWidth: '0',
          marginLeft: `-${overlapPx}px`,
          zIndex: 3,
          position: 'relative',
          ...opacityStyle,
          ...transformStyle
        }
      }

      return {
        ...base,
        width: '100%',
        flex: '1 1 0',
        minWidth: '0',
        zIndex: 3,
        ...opacityStyle,
        ...transformStyle
      }
    })

    const a4PortraitStyle = computed<StyleValue>(() => {
      const w = monster.portrait?.width && monster.portrait.width > 50 ? monster.portrait.width : 280
      const occ = editorStore.a4PictureOcclusion || 0

      const pOffX = editorStore.a4PortraitOffsetX || 0
      const pOffY = editorStore.a4PortraitOffsetY || 0
      const pScale = (editorStore.a4PortraitScale ?? 100) / 100
      const pTransform = (pOffX !== 0 || pOffY !== 0 || pScale !== 1)
        ? {
            transform: `translate(${pOffX}px, ${pOffY}px) scale(${pScale})`,
            transformOrigin: 'top center'
          }
        : {}

      if (occ >= 100) {
        return {
          position: 'absolute',
          left: '20px',
          top: '20px',
          width: `${w}px`,
          maxWidth: `${w}px`,
          zIndex: 2,
          opacity: 0.9,
          ...pTransform
        }
      }

      return {
        width: `${w}px`,
        maxWidth: `${w}px`,
        flexShrink: '0',
        zIndex: 2,
        position: 'relative',
        ...pTransform
      }
    })

    const portraitCropContainerStyle = computed<StyleValue>(() => {
      if (!editorStore.a4PreviewMode) return {}
      const cropX = editorStore.a4PortraitCropX || { min: 0, max: 100 }
      const cropY = editorStore.a4PortraitCropY || { min: 0, max: 100 }
      const top = cropY.min || 0
      const right = 100 - (cropX.max ?? 100)
      const bottom = 100 - (cropY.max ?? 100)
      const left = cropX.min || 0
      if (top === 0 && right === 0 && bottom === 0 && left === 0) return {}
      return {
        clipPath: `inset(${top}% ${right}% ${bottom}% ${left}%)`,
        WebkitClipPath: `inset(${top}% ${right}% ${bottom}% ${left}%)`,
      }
    })

    const portraitImgStyle = computed<StyleValue>(() => {
      if (!editorStore.a4PreviewMode) return {}
      const cx = editorStore.a4PortraitCropCenterX || 0
      const cy = editorStore.a4PortraitCropCenterY || 0
      if (cx === 0 && cy === 0) return {}
      return {
        objectPosition: `${50 + cx}% ${50 + cy}%`,
        transform: `translate(${cx}%, ${cy}%)`,
      }
    })

    const getLayerStyle = (layer: A4CompositionLayer): StyleValue => {
      const top = layer.cropY?.min || 0
      const right = 100 - (layer.cropX?.max ?? 100)
      const bottom = 100 - (layer.cropY?.max ?? 100)
      const left = layer.cropX?.min || 0
      const clipPath = (top > 0 || right > 0 || bottom > 0 || left > 0)
        ? `inset(${top}% ${right}% ${bottom}% ${left}%)`
        : undefined

      const cx = layer.cropCenterX || 0
      const cy = layer.cropCenterY || 0
      const bgPos = (cx !== 0 || cy !== 0) ? `${50 + cx}% ${50 + cy}%` : undefined

      const offX = layer.offsetX || 0
      const offY = layer.offsetY || 0
      const sc = (layer.scale ?? 100) / 100
      const transform = (offX !== 0 || offY !== 0 || sc !== 1)
        ? `translate(${offX}px, ${offY}px) scale(${sc})`
        : undefined

      return {
        backgroundImage: 'url(' + layer.url + ')',
        opacity: layer.opacity / 100,
        mixBlendMode: layer.blendMode,
        display: layer.visible ? 'block' : 'none',
        maskImage: layer.maskUrl ? 'url(' + layer.maskUrl + ')' : undefined,
        WebkitMaskImage: layer.maskUrl ? 'url(' + layer.maskUrl + ')' : undefined,
        maskSize: layer.maskUrl ? 'cover' : undefined,
        WebkitMaskSize: layer.maskUrl ? 'cover' : undefined,
        clipPath,
        WebkitClipPath: clipPath,
        backgroundPosition: bgPos,
        transform,
        transformOrigin: 'center center'
      }
    }

    const getLayerTextStyle = (layer: A4CompositionLayer): StyleValue => {
      const align = layer.overlayTextAlign || 'center'
      const offsetX = layer.overlayTextOffsetX || 0
      const offsetY = layer.overlayTextOffsetY || 0
      const color = layer.overlayTextColor || '#58180d'
      const fontSize = layer.overlayTextFontSize ? `${layer.overlayTextFontSize}pt` : '9pt'

      return {
        position: 'absolute',
        left: align === 'left' ? `${16 + offsetX}px` : align === 'center' ? '50%' : 'auto',
        right: align === 'right' ? `${16 - offsetX}px` : 'auto',
        bottom: '12px',
        transform: align === 'center' ? `translateX(-50%) translate(${offsetX}px, ${offsetY}px)` : `translateY(${offsetY}px)`,
        color,
        fontSize,
        fontFamily: "'Scaly Sans', 'Cinzel', serif",
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        zIndex: '10',
        whiteSpace: 'nowrap',
      }
    }

    const a4PageOverflowPx = ref<number>(0)
    const checkA4Overflow = () => {
      if (!a4PageRef.value) return
      const actualHeight = a4PageRef.value.scrollHeight || 0
      const targetHeight = a4TargetHeightPx.value
      a4PageOverflowPx.value = Math.max(0, actualHeight - targetHeight)
    }

    onMounted(() => {
      nextTick(() => checkA4Overflow())
    })
    watch(
      [
        () => monster,
        () => editorStore.a4Orientation,
        () => editorStore.a4Layout,
        () => editorStore.a4CompactDensity,
        () => editorStore.a4PreviewMode,
      ],
      () => {
        nextTick(() => checkA4Overflow())
      },
      { deep: true }
    )

    const printA4Sheet = () => {
      window.print()
    }

    const traits = computed(() =>
      textRenderer.traits.value.map((t) => sanitizeWebString(t))
    )

    const sanitizedClassSpellcastingPreamble = computed(() =>
      sanitizeWebString(textRenderer.classSpellcastingPreamble.value)
    )

    const sanitizedInnateSpellcastingPreamble = computed(() =>
      sanitizeWebString(textRenderer.innateSpellcastingPreamble.value)
    )

    const renderedSpellcastingTitle = computed(() => {
      const sc = monster.spellcasting
      if (!sc) return 'Spellcasting'
      const primaryClass = sc.class || 'Wizard'
      const primaryLevel = sc.level || 1
      const secondary = sc.classes?.[1]
      const mode = sc.displayTitleMode || 'class_names'
      const title = formatSpellcastingTitle(primaryClass, primaryLevel, secondary?.className, secondary?.level, mode)
      if (mode === 'caster_source') return `${ordinalLabel(primaryLevel)} Level ${title}`
      return title.replace(/Level (\d+) /g, (_match: string, value: string) => `${ordinalLabel(Number(value))} Level `)
    })

    const spellPlate = computed(() => {
      const sc = monster.spellcasting
      const className = sc?.class || 'Wizard'
      const level = sc?.level || 1
      const stat = sc?.stat || 'INT'
      const knownCantrips = monster.knownSpellsOfLevel(0)
      const knownLeveled = (sc?.standard || []).filter((name: string) => !knownCantrips.includes(name)).length
      const metrics = calculateSpellcastingMetrics(className, level, statModifier(monster.stats[stat] ?? 10))
      const levelCadenceMap = (sc as typeof sc & { levelCadenceMap?: Record<number, string> })?.levelCadenceMap
      const bonusActionLevelMap = (sc as typeof sc & { bonusActionLevelMap?: Record<number, boolean> })?.bonusActionLevelMap
      const metamagic = (sc as typeof sc & { metamagic?: { enabled: boolean; sorceryPoints?: number; refreshRate?: string; options?: string[] } })?.metamagic
      const pointValue = sc?.resourceType === 'points' ? SPELL_POINTS_BY_LEVEL[level] : undefined
      const spellLevels = Array.from({ length: 10 }, (_, spellLevel) => ({
        level: spellLevel,
        spells: monster.knownSpellsOfLevel(spellLevel).map((name: string) => ({
          name,
          tags: getSpellTagString(name),
          cadence: sc?.spellCadenceMap?.[name],
        })),
        cadence: levelCadenceMap?.[spellLevel],
        bonusAction: Boolean(bonusActionLevelMap?.[spellLevel]),
      }))
      return buildSpellPlate({
        title: renderedSpellcastingTitle.value,
        stat,
        save: monster.spellSave,
        attack: monster.spellAttackModifier,
        className,
        level,
        resourceType: sc?.resourceType || 'slots',
        resourceValue: sc?.resourceType === 'focus' ? level : pointValue,
        refreshRate: sc?.refreshRate,
        customRefreshRate: sc?.customRefreshRate,
        slots: sc?.slots,
        preparedCount: sc?.preparedCountOverride ?? (metrics.preparedSpells || knownLeveled),
        preparedInterval: sc?.preparedInterval,
        levelCadenceMap,
        metamagic: metamagic ? {
          enabled: metamagic.enabled,
          points: metamagic.sorceryPoints || level,
          refreshRate: metamagic.refreshRate,
          options: metamagic.options,
        } : undefined,
        edition: editorStore.style === '2014' ? '2014' : '2024',
        spellLevels,
      })
    })

    const innateSpellPlate = computed(() => {
      const sc = monster.spellcasting
      const processedNotes = sc?.useCustomInnatePreamble
        ? sanitizedInnateSpellcastingPreamble.value
        : sanitizeWebString(sc?.atWillNotes || '')
      return buildInnateSpellPlate({
        stat: sc?.stat || 'INT',
        save: monster.spellSave,
        attack: monster.spellAttackModifier,
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
      textRenderer.lairActions.value.map((la) => sanitizeWebString(la))
    )

    const regionalEffectPreamble = computed(() =>
      sanitizeWebString(textRenderer.regionalEffectPreamble.value)
    )

    const regionalEffects = computed(() =>
      textRenderer.regionalEffects.value.map((re) => sanitizeWebString(re))
    )

    const columns = computed<StyleValue>(() => {
      return {
        columnCount: editorStore.statBlockColumns,
      }
    })

    const blockStyle = computed(() => ({
      mm2014: editorStore.style === '2014',
      mm2024: editorStore.style === '2024',
      condenseImmunities: editorStore.condenseImmunities,
    }))

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

    const sanitizedHpBadges = computed(() =>
      (textRenderer.hpBadges?.value || []).map((c) => sanitizeWebString(c))
    )

    const hasPortrait = computed(() => {
      return (
        !!monster.portrait?.url &&
        monster.portrait.position !== 'none'
      )
    })

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
    const languages = computed(() => sanitizeWebString(textRenderer.languages.value))
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

    const anatomyPartsList = computed(() => textRenderer.anatomyPartsList.value)
    const villainActionsList = computed(() => textRenderer.villainActionsList.value)
    const bloodiedActionsList = computed(() => textRenderer.bloodiedActionsList.value)
    const reactiveActionsList = computed(() => textRenderer.reactiveActionsList.value)
    const comboActionsList = computed(() => textRenderer.comboActionsList.value)
    const runehammerTrackData = computed(() => textRenderer.runehammerTrackData.value)

    return {
      renderRoot,
      helpTipElement,
      activeHelpTip,
      helpTipStyle,
      anatomyPartsList,
      villainActionsList,
      bloodiedActionsList,
      reactiveActionsList,
      comboActionsList,
      runehammerTrackData,
      monster,
      editorStore,
      xpFormatted,
      xpCompact,
      crDisplay,
      ...textRenderer,
      cr,
      spellPlate,
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
      columns,
      inventory,
      blockStyle,
      initiative,
      sanitizedInitiativeCells,
      sanitizedAcBadges,
      sanitizedHpBadges,
      hasPortrait,
      portraitStyle,
      actionPassivesGroups,
      languages,
      actionPassives,
      sanitizedGroupedTraits,
      hasGroupedTraits,
      a4PageRef,
      a4ViewportRef,
      a4TargetHeightPx,
      resolvedA4Layout,
      a4ScaleStageStyle,
      a4StatblockStyle,
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
    }
  },
})
</script>

<style lang="scss">
/* i don't know why scoped doesn't work but this does */
.statblock b {
  font-family: ff-scala-sans-pro;
  font-style: normal;
  font-weight: 700;
}

.statblock i {
  font-family: ff-scala-sans-pro;
  font-style: italic;
}

.statblock b > i,
.statblock i > b {
  font-family: ff-scala-sans-pro;
  font-style: italic;
  font-weight: 700;
}

.trait > div:first-of-type:not(.action-composite-header),
.attack > div:first-of-type:not(.action-composite-header),
.action > div:first-of-type:not(.action-composite-header),
.multiattack > div:first-of-type:not(.action-composite-header) {
  display: inline;
}

.statblock-wrapper {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 16px;
  width: 100%;
}

.monster-portrait {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  height: 100%;
  box-sizing: border-box;
  background-color: #fdf1dc;
  border: 1px solid #9c2b1b;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  padding: 6px;
  border-radius: 3px;

  .portrait-img-container {
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .portrait-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    min-height: 0;
    object-fit: cover;
    object-position: center top;
    display: block;
    border-radius: 2px;
  }

  .portrait-caption {
    font-family: ff-scala-sans-pro, ScalySansItalic;
    font-style: italic;
    font-size: 0.85rem;
    color: #58180d;
    margin-top: 4px;
    text-align: center;
  }
}

.sub-section-header {
  font-family: ff-scala-sans-pro, ScalySans;
  font-style: italic;
  font-weight: bold;
  color: #58180d;
  border-bottom: 1px dotted #9c2b1b;
  margin: 8px 0 4px 0;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

.monster-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
}

.monster-title-col {
  flex: 1;
  min-width: 0;
}

.monster-cr-badge-cluster {
  display: flex;
  align-items: center;
  margin-left: 8px;
  flex-shrink: 0;
}

.dnd-item-adv {
  color: #2e7d32 !important;
  font-weight: 600;
}

.dnd-item-disadv {
  color: #c62828 !important;
  font-weight: 600;
}

.dnd-badge-adv {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2e7d32;
  background: rgba(46, 125, 50, 0.15);
  border: 1px solid rgba(46, 125, 50, 0.45);
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1;
  padding: 1px 3px;
  margin-left: 3px;
  vertical-align: baseline;
  cursor: help;
  user-select: none;
}

.dnd-badge-disadv {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #c62828;
  background: rgba(198, 40, 40, 0.15);
  border: 1px solid rgba(198, 40, 40, 0.45);
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1;
  padding: 1px 3px;
  margin-left: 3px;
  vertical-align: baseline;
  cursor: help;
  user-select: none;
}

.dnd-adv-arrow, .dnd-disadv-arrow {
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: -1px;
  display: inline-block;
  line-height: 1;
}

/* Modern Modular (Giffyglyph-Inspired) Visual Theme */
.statblock.modern-modular {
  background: #f4f6f9;
  border-radius: 12px;
  border: 1px solid #dcdfe6;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 16px;
  color: #2c3e50;

  .monster-name {
    color: #1a365d;
    font-weight: 800;
    font-size: 1.6rem;
    letter-spacing: -0.02em;
  }
  .type {
    color: #4a5568;
    font-style: normal;
    font-weight: 500;
  }
  .cr-composite-pill {
    background: #ffffff;
    border: 1.5px solid #1a4971;
    box-shadow: 0 1px 3px rgba(26, 73, 113, 0.15);

    .cr-main-region {
      background: #2b6cb0;
      .region-label {
        color: #e2e8f0;
      }
      .region-val {
        color: #ffffff;
      }
    }

    .cr-sub-region {
      background: #ffffff;
      .region-label {
        color: #4a5568;
      }
      .region-val {
        color: #1a202c;
      }
    }

    .region-divider {
      background: #cbd5e0;
    }
  }

  .monster-nameplate-panel .monster-name {
    border-bottom: none !important;
    margin-bottom: 0 !important;
  }

  .dnd-section-card {
    background: #ffffff;
    border: 1.5px solid #cbd5e0;
    border-radius: 6px;
    padding: 6px 10px !important;
    margin-bottom: 6px !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    text-indent: 0 !important;
  }
  hr {
    border-color: #cbd5e0 !important;
    background: #cbd5e0 !important;
    height: 1px;
    margin: 8px 0;
  }
  .skill {
    padding: 3px 0;
    color: #2d3748;
    .name:not(.dnd-cascade-title) {
      color: #1a365d;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 0.03em;
    }
    .dnd-cascade-title,
    .name.dnd-cascade-title {
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  }
  .stat-table {
    background: #edf2f7;
    border-radius: 8px;
    padding: 8px;
    margin: 6px 0;
    border: 1px solid #e2e8f0;
  }
  .stat-table .header-label {
    color: #4a5568;
    font-weight: 700;
    font-size: 0.75rem;
  }
  .stat-table .score {
    font-weight: 800;
    color: #1a202c;
  }
  .stat-table .mod.one, .stat-table .save.one {
    background-color: #e2e8f0;
    border-radius: 4px;
  }
  .stat-table .mod.two, .stat-table .save.two {
    background-color: #edf2f7;
    border-radius: 4px;
  }
  h3.section {
    color: #2b6cb0;
    border-bottom: 2px solid #2b6cb0;
    padding-bottom: 3px;
    font-size: 1.15rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 12px 0 6px 0;
  }
  .sub-section-header {
    color: #2c5282;
    font-weight: 700;
    font-size: 0.95rem;
    border-left: 3px solid #2b6cb0;
    padding-left: 6px;
    margin: 8px 0 4px 0;
  }
  .trait, .action, .attack, .multiattack, .reaction, .spell-row:not(.dnd-cascade-subpanel) {
    background: #ffffff;
    border: 1.5px solid #cbd5e0;
    border-radius: 6px;
    padding: 7px 12px;
    margin-bottom: 7px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    line-height: 1.45;
  }

  .paragon-pool-filter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin: 6px 0 10px 0;
    padding: 4px 8px;
    background: rgba(107, 70, 193, 0.08);
    border: 1px solid rgba(107, 70, 193, 0.25);
    border-radius: 6px;

    .filter-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #553c9a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-right: 4px;
    }

    .pool-filter-btn {
      border: none;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      background: #e2e8f0;
      color: #4a5568;
      transition: all 0.15s ease;

      &:hover {
        background: #cbd5e0;
      }

      &.active {
        background: #6b46c1;
        color: #ffffff;
        box-shadow: 0 1px 3px rgba(107, 70, 193, 0.3);
      }
    }
  }

  .preamble {
    color: #718096 !important;
    font-style: italic;
    font-size: 0.88rem;
    margin: 4px 0 8px 2px;
  }
}

.dnd-badge-cond {
  display: inline-block;
  font-style: italic;
  color: #58180d;
  font-size: 0.85rem;
  margin-left: 2px;
  cursor: help;
}
</style>

<style lang="scss" scoped>
.statblock {
  background-color: #fdf1dc;
  color: #000;
  font-family: ff-scala-sans-pro;
  font-size: 1rem;
  letter-spacing: 0.01em;
  padding: 8px;
  width: 100%;

  .monster-name {
    font-family: mrs-eaves-roman-small-caps, MrEaves;
    color: #58180d;
    font-weight: 800;
    font-size: 2.2em;
    margin: 0;
    line-height: 2.5rem;
  }

  .type,
  .attack .distance,
  .attack .hit {
    font-family: ff-scala-sans-pro, ScalySansItalic;
    font-style: italic;
  }

  hr {
    border: 1px solid #9c2b1b;
    margin: 4px 0;
  }

  .skill {
    line-height: 1.2rem;
    color: #58180d;

    .name {
      font-family: ff-scala-sans-pro, ScalySansBold;
      font-weight: 700;
      margin-right: 0.35rem;
    }
  }

  .stat-container {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #58180d;

    .stat-name {
      font-family: ff-scala-sans-pro, ScalySansBold;
      font-weight: 700;
    }

    .stat {
      display: flex;
      font-size: 0.95rem;
      .score {
        margin-right: 4px;
      }
    }
  }

  .spell-list {
    margin-top: 0.4rem;

    .spell-row:not(.dnd-cascade-subpanel) {
      margin-left: 20px;
      text-indent: -20px;
    }

    .spell-list-entries {
      font-family: ff-scala-sans-pro, ScalySansItalic;
      font-style: italic;
    }
  }

  .legendary.action {
    margin-bottom: 0.1rem;
    margin-left: 20px;
    text-indent: -20px;
  }

  .trait,
  .attack,
  .action,
  .innate-spellcasting,
  .spellcasting,
  .legendary-actions .preamble,
  .mythic-actions .preamble,
  .lair-actions .preamble,
  .regional-effects .preamble,
  .multiattack {
    line-height: 1.15rem;
    margin-bottom: 0.8rem;

    .name {
      font-family: ff-scala-sans-pro, ScalySansBoldItalic;
      font-weight: 700;
      font-style: italic;
    }
  }

  .lair-actions,
  .regional-effects {
    li {
      margin-bottom: 0;
    }
  }

  h3.section {
    font-size: 1.3rem;
    font-family: ScalaSansCaps;
    font-weight: 400;
    letter-spacing: normal;
    color: #58180d;
    border-bottom: 1px solid #58180d;
    margin-bottom: 4px;
    line-height: 1.5rem;
  }
}

/** 2024 overrides */
.statblock.mm2024 {
  background-color: #e4e2d9;
  border-radius: 12px;
  border: 2px solid #69665f;
  outline: 2px solid #69665f;
  outline-offset: -6px;
  padding: 10px;
  font-weight: 400;
  letter-spacing: 0.3px;

  .trait,
  .attack,
  .action,
  .innate-spellcasting,
  .spellcasting,
  .legendary-actions .preamble,
  .mythic-actions .preamble,
  .lair-actions .preamble,
  .regional-effects .preamble,
  .multiattack {
    line-height: 1.2em;
  }

  .legendary.action {
    text-indent: 0px;
    margin-left: 0px;
  }

  .monster-name {
    font-family: ScalaSansCaps;
    letter-spacing: -1px;
    font-size: 1.8em;
    border-bottom: 1px solid #58180d;
    line-height: 2rem;
    column-span: all;
    margin-bottom: 8px;
  }

  .type {
    color: #69665f;
    margin-top: -4px;
  }

  hr {
    margin: 0.5rem 0;
    border: none;
  }

  .ac:not(.dnd-cascade-panel) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
  }

  .skill:not(.dnd-cascade-panel) {
    padding-left: 18px;
    text-indent: -18px;
  }

  .first.section {
    margin-top: 0.5em;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    grid-template-rows: auto;
    gap: 6px;
    margin-bottom: 1em;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;

    .stat-table {
      display: grid;
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      grid-template-columns: minmax(24px, 1.1fr) minmax(18px, 0.9fr) minmax(26px, 1fr) minmax(32px, 1.4fr);
      grid-template-rows: repeat(3, auto);
      grid-template-areas: 'blank blank mod save' 'stat-1 score-1 mod-1 save-1' 'stat-2 score-2 mod-2 save-2';
      row-gap: 3px;
      padding: 4px 4px !important;

      > div {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #58180d;
        padding: 2px 2px !important;
        min-height: 26px;
        min-width: 0 !important;
        box-sizing: border-box;
        overflow: hidden;
      }

      .header-label {
        font-family: ScalaSansCaps;
        font-size: 12px;
        color: #69665f;
        text-transform: uppercase;
      }

      .header-label.mod {
        grid-area: mod;
      }

      .header-label.save {
        grid-area: save;
      }

      .stat {
        font-weight: bold;
        font-family: ScalaSansCaps;
        text-transform: capitalize;
      }

      .stat.one,
      .score.one {
        background-color: #dcd2ba;
      }

      .stat.two,
      .score.two {
        background-color: #d0d5b5;
      }

      .mod.one,
      .save.one {
        background-color: #d7c9c2;
      }

      .mod.two,
      .save.two {
        background-color: #d4c8db;
      }

      .stat.one {
        grid-area: stat-1;
      }

      .score.one {
        grid-area: score-1;
      }

      .mod.one {
        grid-area: mod-1;
      }

      .save.one {
        grid-area: save-1;
      }

      .stat.two {
        grid-area: stat-2;
      }

      .score.two {
        grid-area: score-2;
      }

      .mod.two {
        grid-area: mod-2;
      }

      .save.two {
        grid-area: save-2;
      }
    }
  }
}
</style>
