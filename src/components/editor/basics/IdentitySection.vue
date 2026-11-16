<template>
  <div>
    <!-- 1. Monster Portrait & A4 Composition -->
    <q-expansion-item
      v-help="'Artwork placement, local upload, and A4 composition settings for this creature.'"
      dense
      dense-toggle
      expand-separator
      class="q-mb-sm rounded-borders"
      style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      icon="photo_camera"
      label="Monster Portrait"
      caption="Add creature illustration to the left or right of the stat block"
    >
      <div class="q-pa-sm">
        <div class="row q-col-gutter-xs items-center">
          <catalog-select
            v-model="portrait.position"
            v-help="$t('help.identity.portraitPosition')"
            :entries="PORTRAIT_POSITION_ENTRIES"
            :searchable="false"
            preserve-order
            label="Portrait Position"
            class="col-12 col-sm-4"
          />
          <q-input
            v-model="portrait.url"
            v-help="'Web address or embedded data URI for the monster portrait.'"
            label="Image URL or Data URI"
            dense
            outlined
            class="col-12 col-sm-8"
            clearable
          />
        </div>

        <div class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12 col-sm-6">
            <q-file
              v-model="portraitFile"
              v-help="'Embed an image file from disk directly into this creature without network access.'"
              label="Upload local image (100% offline)"
              dense
              outlined
              accept="image/*"
              @update:model-value="onPortraitFileSelected"
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
          </div>
          <div class="col-12 col-sm-3">
            <q-input
              v-model.number="portrait.width"
              v-help="$t('help.identity.portraitWidth')"
              type="number"
              label="Width (px)"
              dense
              outlined
              min="80"
              max="600"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-input
              v-model="portrait.caption"
              v-help="$t('help.identity.portraitCaption')"
              label="Caption / Artist"
              dense
              outlined
            />
          </div>
          <div class="col-12 col-sm-auto flex items-center">
            <q-toggle
              v-model="portrait.frameless"
              v-help="$t('help.identity.portraitFrameless')"
              data-portrait-frameless
              label="No frame"
              dense
            />
          </div>
        </div>

        <!-- A4 Composition Heuristics: Artwork Occlusion & Background Opacity -->
        <div class="row q-col-gutter-sm items-center q-mt-xs">
          <div class="col-12 col-sm-6">
            <div class="text-caption text-weight-bold flex items-center justify-between text-cyan-3">
              <span>Statblock Occlusion / Overlap</span>
              <span>{{ editorStore.a4PictureOcclusion || 0 }}%</span>
            </div>
            <div class="row items-center q-col-gutter-xs">
              <div class="col">
                <q-slider
                  v-model="editorStore.a4PictureOcclusion"
                  v-help="$t('help.identity.portraitOverlap')"
                  :min="0"
                  :max="100"
                  color="cyan-4"
                  dense
                />
              </div>
              <div class="col-auto">
                <q-input
                  v-model.number="editorStore.a4PictureOcclusion"
                  v-help="$t('help.identity.portraitOverlap')"
                  type="number"
                  min="0"
                  max="100"
                  dense
                  outlined
                  label="%"
                  style="width: 70px;"
                />
              </div>
            </div>
            <div class="text-caption text-grey-5" style="font-size: 0.72rem;">
              0% = Side by Side | 50% = Covers Half | 100% = Full Cover
            </div>
          </div>

          <div class="col-12 col-sm-6">
            <div class="text-caption text-weight-bold flex items-center justify-between text-amber-3">
              <span>Statblock Background Opacity</span>
              <span>{{ editorStore.a4StatblockOpacity ?? 100 }}%</span>
            </div>
            <div class="row items-center q-col-gutter-xs">
              <div class="col">
                <q-slider
                  v-model="editorStore.a4StatblockOpacity"
                  v-help="$t('help.identity.statblockOpacity')"
                  :min="0"
                  :max="100"
                  color="amber-4"
                  dense
                />
              </div>
              <div class="col-auto">
                <q-input
                  v-model.number="editorStore.a4StatblockOpacity"
                  v-help="$t('help.identity.statblockOpacity')"
                  type="number"
                  min="0"
                  max="100"
                  dense
                  outlined
                  label="%"
                  style="width: 70px;"
                />
              </div>
            </div>
            <div class="text-caption text-grey-5" style="font-size: 0.72rem;">
              Reveals underlying artwork and page textures
            </div>
          </div>
        </div>

        <div class="row items-center justify-between q-mt-xs">
          <q-btn
            v-help="$t('help.identity.a4LayerStudio')"
            outline
            dense
            no-caps
            icon="layers"
            color="purple-3"
            label="A4 Composition Layer Studio (Parchments, Artwork & Watercolor Masks)"
            @click="openLayerStudio"
          />
        </div>

        <div v-if="portrait.url" class="q-mt-sm text-center">
          <img
            :src="portrait.url"
            style="max-height: 80px; max-width: 140px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.2);"
          />
        </div>
      </div>
    </q-expansion-item>

    <!-- 2. Identity & Names -->
    <div class="row q-col-gutter-xs items-center">
      <q-input
        v-model="monster.name"
        v-help="'Primary creature name printed in the stat block header and saved in the creature library.'"
        :label="$t('monster.name')"
        class="col-12 col-sm-6"
        debounce="500"
        outlined
        dense
      />
      <q-input
        v-model="monster.nickname"
        v-help="'Short informal name substituted wherever nickname tokens appear in traits or actions.'"
        :label="$t('monster.nickname')"
        class="col-12 col-sm-6"
        debounce="500"
        outlined
        dense
      />
    </div>

    <!-- 3. Challenge Rating & Proficiency -->
    <div class="row q-col-gutter-xs items-center q-mt-xs">
      <catalog-select
        v-if="!monster.useCrDisplayOverride"
        v-help="'Challenge Rating governing XP reward, default Proficiency Bonus, and CR presets.'"
        :model-value="monster.CR"
        :entries="CR_ENTRIES"
        preserve-order
        :label="$t('monster.cr')"
        class="col-auto"
        style="width: 10.5rem"
        @update:model-value="(value) => monster.setCR(typeof value === 'number' ? value : Number(value ?? 0))"
      >
        <template #append>
          <lock-toggle-button
            :locked="!monster.useCrDisplayOverride"
            :lock-tooltip="$t('editor.cr.standard')"
            :unlock-tooltip="$t('editor.cr.visualOverride')"
            @click="monster.useCrDisplayOverride = !monster.useCrDisplayOverride"
          />
        </template>
      </catalog-select>
      <q-input
        v-else
        v-model="monster.crOverride"
        v-help="'Custom text displayed instead of the standard Challenge Rating and XP calculation.'"
        :label="$t('monster.cr')"
        class="col-auto"
        style="width: 10.5rem"
        outlined
        dense
      >
        <template #append>
          <lock-toggle-button
            :locked="!monster.useCrDisplayOverride"
            :lock-tooltip="$t('editor.cr.standard')"
            :unlock-tooltip="$t('editor.cr.visualOverride')"
            @click="monster.useCrDisplayOverride = !monster.useCrDisplayOverride"
          />
        </template>
      </q-input>

      <catalog-select
        v-if="!monster.useCrDisplayOverride"
        v-help="'Challenge Rating when encountered inside its lair; select None if unchanged.'"
        :model-value="monster.lairCr"
        :entries="LAIR_CR_ENTRIES"
        preserve-order
        :label="$t('monster.lairCr')"
        class="col-auto"
        style="width: 8.5rem"
        @update:model-value="(value) => (monster.lairCr = typeof value === 'number' ? value : Number(value ?? -1))"
      />
      <mechanic-text-editor
        v-model="monster.lairCrNote"
        v-help="'Short qualifier printed beside lair CR in the header (for example in lair).'"
        :label="$t('monster.lairCrNote')"
        :disable="monster.lairCr === -1"
        class="col"
        style="min-width: 9rem"
        debounce="500"
        outlined
        dense
      />
      <!-- Proficiency and nameplate options share the second line -->
      <div class="col-12 q-py-none"></div>
      <formula-field
        v-help="'Proficiency Bonus added to proficient saves, skills, and attacks unless overridden.'"
        path="proficiency"
        :label="$t('monster.proficiencyBonus')"
        class="col-auto"
        style="width: 8rem"
        :disable="!monster.proficiencyOverride"
        outlined
        dense
        @applied="(value: number | string) => (monster.proficiency = Number(value) || 0)"
      >
        <template #append>
          <lock-toggle-button
            :locked="!monster.proficiencyOverride"
            lock-tooltip="Set proficiency manually"
            unlock-tooltip="Use the selected proficiency scale"
            @click="monster.toggleProficiencyOverride"
          />
        </template>
      </formula-field>

      <div class="col-auto editor-fit-wrap">
        <q-btn-toggle
          v-help="'Switch auto-calculated Proficiency Bonus between CR-based monster scaling and HD-based character scaling.'"
          :model-value="monster.proficiencyScale || 'monster'"
          :options="[{ label: 'Monster (CR)', value: 'monster' }, { label: 'Character (HD)', value: 'character' }]"
          :disable="monster.proficiencyOverride"
          aria-label="Proficiency scale"
          data-proficiency-scale
          dense
          no-caps
          unelevated
          @update:model-value="monster.setProficiencyScale"
        />
      </div>

      <div class="col-12 col-sm editor-fit-wrap items-center">
        <q-toggle
          v-model="monster.showXp"
          v-help="'Disclose calculated XP value next to the Challenge Rating on the stat block nameplate.'"
          label="Show XP on Nameplate"
          dense
          color="amber-9"
        />
        <q-toggle
          v-model="monster.compactNameplate"
          v-help="'Fit creature name, type, alignment, and CR into fewer header lines.'"
          label="Compact Nameplate Layout"
          dense
          color="amber-9"
        />
      </div>
    </div>

    <!-- 4. Size, Type, Subtype, Species & Alignment -->
    <div class="row q-col-gutter-xs items-center q-mt-xs">
      <catalog-select
        v-help="$t('help.identity.size')"
        catalog-id="sizes"
        :model-value="monster.size"
        :searchable="false"
        :label="$t('monster.size')"
        class="col-6 col-sm-2"
        @update:model-value="(val) => monster.setSize(String(val || 'Medium'))"
      />
      <catalog-select
        v-help="$t('help.identity.type')"
        :model-value="monster.type"
        catalog-id="creatureTypes"
        :label="$t('monster.type')"
        class="col-6 col-sm-2"
        @update:model-value="(val) => (monster.type = String(val || ''))"
      />
      <q-input
        v-model="monster.subtype"
        v-help="$t('help.identity.subtype')"
        label="Subtype Tag"
        class="col-6 col-sm-2"
        outlined
        dense
        placeholder="e.g. shapechanger"
      />
      <catalog-select
        v-help="'Optional species template; pre-populates typical traits, speeds, and senses.'"
        :model-value="selectedSpecies"
        :entries="SPECIES_ENTRIES"
        preserve-order
        clearable
        label="Species / Lineage"
        class="col-6 col-sm-3"
        @update:model-value="(val) => { const next = val ? String(val) : null; selectedSpecies = next; onSpeciesSelected(next) }"
      >
        <template #prepend>
          <q-icon name="fingerprint" color="primary" />
        </template>
      </catalog-select>
      <catalog-select
        v-help="$t('help.identity.alignment')"
        :model-value="monster.alignment"
        catalog-id="alignments"
        :label="$t('monster.alignment')"
        class="col-12 col-sm-3"
        @update:model-value="(val) => (monster.alignment = String(val || ''))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import FormulaField from 'src/components/kit/FormulaField.vue'
import LockToggleButton from '../../LockToggleButton.vue'
import MechanicTextEditor from '../MechanicTextEditor.vue'
import { CR_ENTRIES, LAIR_CR_ENTRIES, PORTRAIT_POSITION_ENTRIES, SPECIES_ENTRIES } from './basics-catalogs'
import { useBasicsContext } from './useBasicsContext'

const {
  monster,
  editorStore,
  selectedSpecies,
  portrait,
  portraitFile,
  openLayerStudio,
  onSpeciesSelected,
  onPortraitFileSelected,
} = useBasicsContext()
</script>
