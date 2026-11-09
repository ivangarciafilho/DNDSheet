<template>
  <q-expansion-item
    expand-separator
    default-opened
    icon="info"
    :label="$t('editor.basics.label')"
    :caption="$t('editor.basics.caption')"
  >
    <q-card class="q-pa-sm">
      <!-- 1. Monster Portrait (Top Precedence) -->
      <q-expansion-item
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
            <q-select
              v-model="portrait.position"
              :options="portraitPositions"
              emit-value
              map-options
              label="Portrait Position"
              dense
              outlined
              class="col-12 col-sm-4"
            />
            <q-input
              v-model="portrait.url"
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
                label="Caption / Artist"
                dense
                outlined
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
                    :min="0"
                    :max="100"
                    color="cyan-4"
                    dense
                  />
                </div>
                <div class="col-auto">
                  <q-input
                    v-model.number="editorStore.a4PictureOcclusion"
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
                    :min="0"
                    :max="100"
                    color="amber-4"
                    dense
                  />
                </div>
                <div class="col-auto">
                  <q-input
                    v-model.number="editorStore.a4StatblockOpacity"
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
          :label="$t('monster.name')"
          class="col-12 col-sm-6"
          debounce="500"
          outlined
          dense
        />
        <q-input
          v-model="monster.nickname"
          :label="$t('monster.nickname')"
          class="col-12 col-sm-6"
          debounce="500"
          outlined
          dense
        />
      </div>

      <!-- 3. Challenge Rating & Proficiency -->
      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <q-select
          v-if="!monster.useCrDisplayOverride"
          :model-value="monster.CR"
          :options="crValues"
          :display-value="crValues[monster.CR]?.label ?? ''"
          emit-value
          :label="$t('monster.cr')"
          class="col-12 col-sm-6"
          outlined
          dense
          @update:model-value="(value: number | undefined) => {
            if (value != null) {
              monster.setCR(value)
            } else {
              monster.setCR(0)
            }
          }"
        >
          <template #append>
            <lock-toggle-button
              :locked="!monster.useCrDisplayOverride"
              :lock-tooltip="$t('editor.cr.standard')"
              :unlock-tooltip="$t('editor.cr.visualOverride')"
              @click="monster.useCrDisplayOverride = !monster.useCrDisplayOverride"
            />
          </template>
        </q-select>
        <q-input
          v-else
          v-model="monster.crOverride"
          :label="$t('monster.cr')"
          class="col-12 col-sm-6"
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

        <formula-field
          path="proficiency"
          :label="$t('monster.proficiencyBonus')"
          class="col-12 col-sm-6"
          :disable="!monster.proficiencyOverride"
          outlined
          dense
          @applied="(value: number | string) => (monster.proficiency = Number(value) || 0)"
        >
          <template #append>
            <lock-toggle-button
              :locked="!monster.proficiencyOverride"
              :lock-tooltip="$t('monster.proficiency.unlockFromCr')"
              :unlock-tooltip="$t('monster.proficiency.lockToCr')"
              @click="monster.toggleProficiencyOverride"
            />
          </template>
        </formula-field>

        <q-select
          v-if="!monster.useCrDisplayOverride"
          :model-value="monster.lairCr"
          :options="lairCrValues"
          :display-value="lairCrValues[monster.lairCr + 1]?.label ?? ''"
          emit-value
          :label="$t('monster.lairCr')"
          class="col-12 col-sm-4"
          outlined
          dense
          @update:model-value="(value: number | undefined) => {
            monster.lairCr = value ?? -1
          }"
        />
        <q-input
          v-model="monster.lairCrNote"
          :label="$t('monster.lairCrNote')"
          :disable="monster.lairCr === -1"
          class="col-12 col-sm-8"
          debounce="500"
          outlined
          dense
        />
        <div class="col-12 row items-center q-gutter-md q-my-xs">
          <q-toggle
            v-model="monster.showXp"
            label="Show XP on Nameplate"
            dense
            color="amber-9"
          >
            <q-tooltip class="dnd-tip">When enabled, discloses calculated XP on the header nameplate.</q-tooltip>
          </q-toggle>
          <q-toggle
            v-model="monster.compactNameplate"
            label="Compact Nameplate Layout"
            dense
            color="amber-9"
          >
            <q-tooltip class="dnd-tip">Displays a streamlined, ultra-compact 2-row plate layout for high information density.</q-tooltip>
          </q-toggle>
        </div>
      </div>

      <!-- 4. Size, Type, Subtype, Species & Alignment -->
      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <q-select
          :model-value="monster.size"
          :options="sizeValues"
          :label="$t('monster.size')"
          class="col-6 col-sm-2"
          outlined
          dense
          @update:model-value="monster.setSize"
        />
        <q-select
          v-model="monster.type"
          :options="typeOptions"
          use-input
          input-debounce="0"
          :label="$t('monster.type')"
          class="col-6 col-sm-2"
          new-value-mode="add-unique"
          outlined
          dense
          @filter="typeFilter"
        />
        <q-input
          v-model="monster.subtype"
          label="Subtype Tag"
          class="col-6 col-sm-2"
          outlined
          dense
          placeholder="e.g. shapechanger"
        />
        <q-select
          v-model="selectedSpecies"
          :options="speciesOptions"
          label="Species / Lineage"
          class="col-6 col-sm-3"
          outlined
          dense
          emit-value
          map-options
          clearable
          @update:model-value="onSpeciesSelected"
        >
          <template #prepend>
            <q-icon name="fingerprint" color="primary" />
          </template>
          <q-tooltip class="text-caption">Auto-populate traits, speeds, senses, and racial stat hints</q-tooltip>
        </q-select>
        <q-select
          v-model="monster.alignment"
          :options="alignmentOptions"
          input-debounce="0"
          use-input
          :label="$t('monster.alignment')"
          class="col-12 col-sm-3"
          new-value-mode="add-unique"
          outlined
          dense
          @filter="alignmentFilter"
        />
      </div>

      <!-- 5. Ability Scores (Feeds AC, HP & Initiative) -->
      <div class="row items-center justify-between q-mt-md q-mb-xs">
        <div class="row items-center q-gutter-x-sm">
          <span class="text-subtitle2 text-weight-bold text-grey-4">Ability Scores</span>
          <q-badge
            :color="pointBuyInfo.isValid ? (pointBuyInfo.remaining === 0 ? 'positive' : 'amber-8') : 'negative'"
            class="text-weight-bold text-caption"
          >
            Point Buy: {{ pointBuyInfo.remaining }} / 27 remaining
          </q-badge>
        </div>
        <div class="row items-center q-gutter-x-xs">
          <q-btn size="xs" outline dense color="primary" label="Standard Array" @click="applyStandardArray">
            <q-tooltip class="text-caption">Apply standard 5e array: 15, 14, 13, 12, 10, 8</q-tooltip>
          </q-btn>
          <q-btn size="xs" outline dense color="grey-5" label="All 8s" @click="applyAllStats(8)">
            <q-tooltip class="text-caption">Reset all ability scores to baseline 8</q-tooltip>
          </q-btn>
          <q-btn size="xs" outline dense color="grey-5" label="All 10s" @click="applyAllStats(10)">
            <q-tooltip class="text-caption">Reset all ability scores to baseline 10</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Monster Role Archetype Heuristics Chips -->
      <div class="row items-center q-gutter-x-xs q-mb-sm">
        <span class="text-caption text-grey-5 q-mr-xs">Archetypes:</span>
        <q-btn
          v-for="arch in roleArchetypes"
          :key="arch.id"
          size="xs"
          :color="arch.color"
          outline
          dense
          :icon="arch.icon"
          :label="arch.label"
          @click="applyArchetype(arch)"
        >
          <q-tooltip class="text-caption">{{ arch.description }}</q-tooltip>
        </q-btn>
      </div>

      <div class="row q-col-gutter-sm q-mb-md">
        <formula-field
          v-for="stat in statKeys"
          :key="stat"
          :path="`stats.${stat}`"
          :label="stat"
          class="col-4 col-sm-2"
          outlined
          dense
          @applied="(value: number | string) => updateStat(stat, value)"
        />
      </div>

      <!-- 6. Armor Class & AC Compositor -->
      <div class="row q-col-gutter-sm items-center q-mt-md">
        <formula-field
          path="AC"
          :label="$t('monster.ac')"
          class="col-12 col-sm-3"
          outlined
          dense
          @applied="(value: number | string) => (monster.AC = Number(value) || 0)"
        >
          <template #append>
            <q-btn
              flat
              dense
              round
              color="primary"
              size="sm"
              icon="auto_fix_high"
              @click="monster.setAcByCr"
            >
              <q-tooltip class="text-body2">{{ $t('monster.setAcByCr') }}</q-tooltip>
            </q-btn>
          </template>
        </formula-field>
        <q-input
          v-model="monster.ACType"
          :label="$t('monster.acType')"
          class="col-12 col-sm-5"
          outlined
          dense
        />
        <div class="col-12 col-sm-4 text-right">
          <q-badge color="blue-8" class="text-weight-bold q-pa-xs">
            Preview: AC {{ computedCompositorAc }} {{ computedCompositorType ? `(${computedCompositorType})` : '' }}
          </q-badge>
        </div>
      </div>

      <!-- AC Formula & Defensive Mechanics Compositor Card (Disclosed Inline, Real-Time Sync) -->
      <div
        class="q-pa-sm rounded-borders q-mt-xs q-mb-xs"
        style="background: rgba(30, 58, 138, 0.08); border: 1.5px solid #3b82f6;"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-caption text-weight-bold text-blue-4">
            📐 Armor Class Compositor & Defensive Mechanics (Direct Real-time Auto-Calculation)
          </div>
          <div class="row items-center q-gutter-x-xs">
            <q-toggle
              v-model="monster.splitAcRiderRows"
              dark
              dense
              size="xs"
              color="blue-4"
              label="Split AC Riders into Sub-Rows"
              class="text-caption text-weight-medium text-blue-2 q-mr-xs"
            >
              <q-tooltip>Renders AC relatable riders on dedicated indented sub-rows (↳) directly beneath base AC.</q-tooltip>
            </q-toggle>
            <q-badge outline color="cyan-4" class="text-weight-bold text-caption">
              Auto-Synced to AC in Real Time
            </q-badge>
          </div>
        </div>

        <div class="row q-col-gutter-xs items-center">
          <!-- 1. Base -->
          <div class="col-12 col-sm-4">
            <q-select
              v-model="acConfig.baseMode"
              :options="acBaseOptions"
              emit-value
              map-options
              dense
              outlined
              label="Base AC Source"
              @update:model-value="onAcCompositorChanged"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps" dense>
                  <q-item-section v-if="scope.opt.icon" avatar style="min-width: 24px;">
                    <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'blue-4'" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section v-if="scope.opt.category" side>
                    <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- 2. Ability Bonus -->
          <div class="col-12 col-sm-4">
            <q-select
              v-model="acConfig.abilityBonus"
              :options="acAbilityBonusOptions"
              emit-value
              map-options
              dense
              outlined
              label="Ability Bonus"
              @update:model-value="onAcCompositorChanged"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps" dense>
                  <q-item-section v-if="scope.opt.icon" avatar style="min-width: 24px;">
                    <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'green-4'" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section v-if="scope.opt.category" side>
                    <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- 3. Defense Item -->
          <div class="col-12 col-sm-4">
            <q-select
              v-model="acConfig.defenseItem"
              :options="acDefenseItemOptions"
              emit-value
              map-options
              dense
              outlined
              label="Defense Item"
              @update:model-value="onAcCompositorChanged"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps" dense>
                  <q-item-section v-if="scope.opt.icon" avatar style="min-width: 24px;">
                    <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'amber-4'" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section v-if="scope.opt.category" side>
                    <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>

        <div class="row q-col-gutter-xs items-center q-mt-xs">
          <!-- 4. Temporary Bonus -->
          <div class="col-12 col-sm-6">
            <q-select
              v-model="acConfig.temporary"
              :options="acTemporaryOptions"
              emit-value
              map-options
              dense
              outlined
              label="Temporary / Reaction AC"
              @update:model-value="onAcCompositorChanged"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps" dense>
                  <q-item-section v-if="scope.opt.icon" avatar style="min-width: 24px;">
                    <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'cyan-4'" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section v-if="scope.opt.category" side>
                    <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- 5. Conditional Bonus -->
          <div class="col-12 col-sm-6">
            <q-select
              v-model="acConfig.conditional"
              :options="acConditionalOptions"
              emit-value
              map-options
              dense
              outlined
              label="Conditional AC Modifier"
              @update:model-value="onAcCompositorChanged"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps" dense>
                  <q-item-section v-if="scope.opt.icon" avatar style="min-width: 24px;">
                    <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'purple-4'" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section v-if="scope.opt.category" side>
                    <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                  </q-item-section>
                  <q-tooltip class="bg-grey-10 text-amber-2 text-caption" :delay="250" max-width="260px">
                    {{ scope.opt.tooltip || `${scope.opt.label}${scope.opt.category ? ' (' + scope.opt.category + ')' : ''}` }}
                  </q-tooltip>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>

        <!-- 6. Defensive Mechanic / Condition Mode (37 Permutable Archetypes) -->
        <div class="row q-col-gutter-xs items-center q-mt-xs">
          <div :class="needsSecondaryAc ? 'col-12 col-sm-8' : 'col-12'">
            <q-select
              v-model="acConfig.conditionMode"
              :options="acDefensiveMechanicOptions"
              emit-value
              map-options
              dense
              outlined
              label="Defensive Mechanic / Invulnerability Mode (37 Permutable Archetypes)"
              @update:model-value="onAcCompositorChanged"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps" dense>
                  <q-item-section v-if="scope.opt.icon" avatar style="min-width: 24px;">
                    <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'deep-purple-4'" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section v-if="scope.opt.category" side>
                    <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                  </q-item-section>
                  <q-tooltip class="bg-grey-10 text-amber-2 text-caption" :delay="250" max-width="260px">
                    {{ scope.opt.tooltip || `${scope.opt.label}${scope.opt.category ? ' (' + scope.opt.category + ')' : ''}` }}
                  </q-tooltip>
                </q-item>
              </template>
            </q-select>
          </div>
          <div v-if="needsSecondaryAc" class="col-12 col-sm-4">
            <formula-field path="acConfig.secondaryAc" label="Secondary AC / Value" dense outlined @applied="onAcCompositorChanged" />
          </div>
        </div>

        <!-- Contextual Controls for Selected Defensive Mechanic -->
        <!-- 6a. Versus Creature Types -->
        <div v-if="acConfig.conditionMode === 'creature_type' || acConfig.conditionMode === 'versus_creature_types'" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12">
            <q-select
              v-model="acConfig.conditionCreatureTypes"
              :options="creatureTypeOptions"
              multiple
              use-chips
              dense
              outlined
              label="Creature Types (e.g. Undead, Fiends)"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- 6b. Versus Attack Types -->
        <div v-if="acConfig.conditionMode === 'attack_type' || acConfig.conditionMode === 'ranged_attacks'" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12">
            <q-select
              v-model="acConfig.conditionAttackTypes"
              :options="attackTypeOptions"
              multiple
              use-chips
              dense
              outlined
              label="Attack Types (e.g. Ranged Attacks, Spell Attacks)"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- 6c. Versus Damage Types -->
        <div v-if="acConfig.conditionMode === 'versus_damage_types' || acConfig.conditionMode === 'damage_type'" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12">
            <q-select
              v-model="acConfig.conditionDamageTypes"
              :options="damageTypeOptions"
              multiple
              use-chips
              dense
              outlined
              label="Trigger Damage Types (e.g. Lightning, Thunder, Force)"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- 6d. Attacker Save DC, Phrasing & Failure/Success Outcomes -->
        <div v-if="acConfig.conditionMode === 'attacker_save'" class="col-12 q-mt-xs">
          <div class="row q-col-gutter-xs items-center">
            <div class="col-12 col-sm-4">
              <q-select
                v-model="acConfig.saveVerb"
                :options="[
                  { label: 'must Succeed (Standard)', value: 'must_succeed' },
                  { label: 'Makes (Alternative Trigger)', value: 'makes' },
                  { label: 'Must Succeed ... to Hit', value: 'must_succeed_to_hit' }
                ]"
                emit-value
                map-options
                dense
                outlined
                label="Save Trigger Phrasing"
                @update:model-value="onAcCompositorChanged"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="acConfig.saveStat"
                :options="['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']"
                dense
                outlined
                label="Save Ability"
                @update:model-value="onAcCompositorChanged"
              />
            </div>
            <div class="col-12 col-sm-2">
              <q-select
                v-model="acConfig.saveDcSource"
                :options="saveDcSourceOptions"
                emit-value
                map-options
                dense
                outlined
                label="DC Source"
                @update:model-value="onAcCompositorChanged"
              />
            </div>
            <div class="col-12 col-sm-2">
              <formula-field path="acConfig.saveDc" label="Save DC" dense outlined @applied="onAcCompositorChanged" />
            </div>
          </div>

          <!-- Failure & Success Outcome Clauses -->
          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-3">
              <q-select
                v-model="acConfig.onSaveFailure"
                :options="[
                  { label: 'On Failure: None', value: 'none' },
                  { label: 'On Failure: Knocks Prone', value: 'knocks_prone' },
                  { label: 'On Failure: Takes Damage', value: 'takes_damage' },
                  { label: 'On Failure: Can\'t Attack', value: 'cant_attack' }
                ]"
                emit-value
                map-options
                dense
                outlined
                label="On Failure Outcome"
                @update:model-value="onAcCompositorChanged"
              />
            </div>
            <div v-if="acConfig.onSaveFailure === 'takes_damage' || acConfig.onSaveFailure === 'damage_attacker'" class="col-6 col-sm-2">
              <formula-field path="acConfig.onSaveFailureDamageAmount" label="Fail Dmg" dense outlined @applied="onAcCompositorChanged" />
            </div>
            <div v-if="acConfig.onSaveFailure === 'takes_damage' || acConfig.onSaveFailure === 'damage_attacker'" class="col-6 col-sm-2">
              <q-select
                v-model="acConfig.onSaveFailureDamageType"
                :options="damageTypeOptions"
                dense
                outlined
                label="Fail Type"
                @update:model-value="onAcCompositorChanged"
              />
            </div>

            <div class="col-12 col-sm-3">
              <q-select
                v-model="acConfig.onSaveSuccess"
                :options="[
                  { label: 'On Success: None', value: 'none' },
                  { label: 'On Success: Takes Damage', value: 'takes_damage' },
                  { label: 'to Hit Automatically', value: 'hits_automatically' },
                  { label: 'On Success: Half Damage', value: 'half_damage' }
                ]"
                emit-value
                map-options
                dense
                outlined
                label="On Success Outcome"
                @update:model-value="onAcCompositorChanged"
              />
            </div>
            <div v-if="acConfig.onSaveSuccess === 'takes_damage' || acConfig.onSaveSuccess === 'damage_attacker'" class="col-6 col-sm-2">
              <formula-field path="acConfig.onSaveSuccessDamageAmount" label="Succ Dmg" dense outlined @applied="onAcCompositorChanged" />
            </div>
            <div v-if="acConfig.onSaveSuccess === 'takes_damage' || acConfig.onSaveSuccess === 'damage_attacker'" class="col-6 col-sm-2">
              <q-select
                v-model="acConfig.onSaveSuccessDamageType"
                :options="damageTypeOptions"
                dense
                outlined
                label="Succ Type"
                @update:model-value="onAcCompositorChanged"
              />
            </div>
          </div>
        </div>

        <!-- 6e. Took Damage Since Timeframe -->
        <div v-if="acConfig.conditionMode === 'took_damage_since'" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="acConfig.tookDamageType"
              :options="damageTypeOptions"
              dense
              outlined
              label="Damage Type Taken"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="acConfig.tookDamageTimeframe"
              :options="timeframeOptions"
              dense
              outlined
              label="Timeframe"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- 6f. In Light Level -->
        <div v-if="acConfig.conditionMode === 'in_light'" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12">
            <q-select
              v-model="acConfig.lightLevel"
              :options="lightLevelOptions"
              dense
              outlined
              label="Light Level"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- 6g. Custom Defensive Condition -->
        <div v-if="acConfig.conditionMode === 'custom'" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12">
            <q-input
              v-model="acConfig.customCondition"
              dense
              outlined
              label="Custom Defensive Condition"
              placeholder="e.g. 30 while near a non-incapacitated allied creature"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- 6h. Decoupled On Miss & When Hit Logic + Contextual Split Riders Toggle -->
        <div class="row items-center justify-between q-mt-xs q-px-xs">
          <span class="text-caption text-cyan-3 text-weight-bold">Decoupled AC Riders (On Miss / When Hit)</span>
          <q-toggle
            v-model="monster.splitAcRiderRows"
            dark
            dense
            size="xs"
            color="cyan-4"
            label="↳ Split AC Riders into Sub-Rows"
            class="text-caption text-cyan-2"
            data-contextual-split-ac="true"
          >
            <q-tooltip>Renders AC riders (On Miss, When Hit, Attacker Save, Conditional AC) on dedicated indented sub-rows (↳) beneath base AC.</q-tooltip>
          </q-toggle>
        </div>
        <div class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="acConfig.onMiss"
              :options="onMissOptions"
              emit-value
              map-options
              dense
              outlined
              label="On Miss Effect (Decoupled)"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="acConfig.onHit"
              :options="onHitOptions"
              emit-value
              map-options
              dense
              outlined
              label="When Hit Effect (Decoupled)"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- On Miss Extra Inputs -->
        <div v-if="acConfig.onMiss === 'hits_target_feet'" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12 col-sm-6">
            <formula-field path="acConfig.onMissDistance" label="Hit Another Creature Within Distance (ft)" dense outlined @applied="onAcCompositorChanged" />
          </div>
        </div>

        <div v-if="acConfig.onMiss === 'damage_attacker'" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-6 col-sm-3">
            <formula-field path="acConfig.onMissDamageAmount" label="Damage Amount" dense outlined @applied="onAcCompositorChanged" />
          </div>
          <div class="col-6 col-sm-3">
            <q-select
              v-model="acConfig.onMissDamageType"
              :options="damageTypeOptions"
              dense
              outlined
              label="Damage Type"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- When Hit Extra Inputs -->
        <div v-if="acConfig.onHit === 'damage_attacker'" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-6 col-sm-3">
            <formula-field path="acConfig.onHitDamageAmount" label="On Hit Damage Amount" dense outlined @applied="onAcCompositorChanged" />
          </div>
          <div class="col-6 col-sm-3">
            <q-select
              v-model="acConfig.onHitDamageType"
              :options="damageTypeOptions"
              dense
              outlined
              label="On Hit Damage Type"
              @update:model-value="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- 6i. Composed Real-Time AC Result Preview -->
        <div class="row items-center justify-between q-mt-xs q-pa-xs rounded-borders bg-grey-9">
          <div class="text-caption text-weight-bold text-cyan-3 flex items-center">
            <q-icon name="preview" class="q-mr-xs" />
            Composed AC & Defensive Ruling:
          </div>
          <q-badge color="cyan-4" outline class="text-subtitle2 text-weight-bold q-pa-xs">
            AC {{ monster.AC }} {{ monster.ACType ? '(' + monster.ACType + ')' : '' }}
          </q-badge>
        </div>
      </div>

      <!-- 7. Hit Points & Hit Dice -->
      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <formula-field
          path="HP.HD"
          :label="$t('monster.hp.hd')"
          class="col-12 col-sm-4"
          outlined
          dense
          @applied="(value: number | string) => monster.setHpModifier(value, monster.stats.CON)"
        >
          <template #append>
            <q-btn
              flat
              dense
              round
              color="primary"
              size="sm"
              icon="auto_fix_high"
              @click="monster.setHdByCr"
            >
              <q-tooltip class="text-body2">{{ $t('monster.setHdByCr') }}</q-tooltip>
            </q-btn>
          </template>
        </formula-field>

        <formula-field
          path="HP.type"
          :label="$t('monster.hp.type')"
          class="col-12 col-sm-4"
          :disable="!monster.hpDieTypeOverride"
          outlined
          dense
          @applied="(value: number | string) => {
            const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : Number(value);
            monster.HP.type = num || 8;
            monster.setHpModifier(monster.HP.HD, monster.stats.CON);
          }"
        >
          <template #append>
            <lock-toggle-button
              :locked="!monster.hpDieTypeOverride"
              :lock-tooltip="$t('monster.hp.unlockFromSize')"
              :unlock-tooltip="$t('monster.hp.lockToSize')"
              @click="monster.toggleDieTypeOverride"
            />
          </template>
        </formula-field>

        <formula-field
          path="HP.modifier"
          :disable="!monster.hpModifierOverride"
          :label="$t('monster.hp.modifier')"
          class="col-12 col-sm-4"
          outlined
          dense
          @applied="(value: number | string) => (monster.HP.modifier = Number(value) || 0)"
        >
          <template #append>
            <lock-toggle-button
              :locked="!monster.hpModifierOverride"
              :lock-tooltip="$t('monster.hp.unlockModifier')"
              :unlock-tooltip="$t('monster.hp.lockModifier')"
              @click="monster.toggleHpModifierOverride"
            />
          </template>
        </formula-field>
      </div>

      <!-- 8. Initiative Tuning & Paragon Multi-Phase Gate (Feeds Paragon HP Stages below) -->
      <q-expansion-item
        dense
        dense-toggle
        expand-separator
        class="q-mt-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
        icon="flash_on"
        label="Initiative Tuning & Paragon Phases"
        caption="Proficiency, secondary ability, Lair count, spell triggers & Paragon phase pools"
      >
        <div class="q-pa-sm q-gutter-y-sm">
          <div class="row q-col-gutter-xs items-center">
            <div class="col-12 col-sm-3">
              <q-checkbox
                v-model="initiativeConfig.proficient"
                label="Add Proficiency Bonus"
                dense
              />
            </div>
            <div class="col-12 col-sm-3">
              <q-select
                v-model="initiativeConfig.secondaryStat"
                :options="secondaryStatOptions"
                emit-value
                map-options
                label="Secondary Ability"
                dense
                outlined
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps" dense>
                    <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                      <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'amber-4'" size="xs" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                    <q-item-section v-if="scope.opt.category" side>
                      <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col-12 col-sm-2">
              <q-select
                v-model="initiativeConfig.statMode"
                :options="statModeOptions"
                emit-value
                map-options
                label="Secondary Mode"
                dense
                outlined
                :disable="initiativeConfig.secondaryStat === 'none'"
              />
            </div>
            <div class="col-12 col-sm-4 text-center">
              <q-badge
                color="accent"
                outline
                class="text-subtitle2 q-pa-xs"
                style="white-space: normal; word-break: break-word; line-height: 1.25; display: inline-flex; align-items: center; justify-content: center; max-width: 100%;"
              >
                Initiative: {{ initiativePreview }}
              </q-badge>
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center">
            <div class="col-12 col-sm-5 row items-center q-gutter-x-xs">
              <span class="text-caption text-grey-4 q-mr-xs">Roll State:</span>
              <q-btn-toggle
                v-model="initiativeRollMode"
                dense
                no-caps
                rounded
                unelevated
                size="sm"
                toggle-color="primary"
                color="grey-9"
                text-color="grey-4"
                :options="[
                  { label: 'Normal', value: 'normal' },
                  { label: 'Advantage ▲▲', value: 'advantage' },
                  { label: 'Disadvantage ▼▼', value: 'disadvantage' }
                ]"
              >
                <q-tooltip class="dnd-tip">Toggle whether creature rolls Initiative normally, with Advantage, or with Disadvantage.</q-tooltip>
              </q-btn-toggle>
            </div>
            <div class="col-12 col-sm-3">
              <q-checkbox
                v-model="initiativeConfig.cantBeSurprised"
                label="Can't be Surprised"
                dense
              />
            </div>
            <div class="col-6 col-sm-2">
              <q-checkbox
                v-model="initiativeConfig.useLairInitiative"
                label="Lair Initiative"
                dense
              />
            </div>
            <div v-if="initiativeConfig.useLairInitiative" class="col-6 col-sm-2">
              <formula-field path="initiativeConfig.lairInitiative" label="Lair" dense outlined />
            </div>
          </div>

          <!-- Special Initiative Trigger / Spell Cast Rule -->
          <div class="row q-col-gutter-sm items-center">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="initiativeConfig.specialTrigger"
                :options="initiativeTriggerOptions"
                emit-value
                map-options
                dense
                outlined
                label="Special Initiative Trigger / Spell Rule"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps" dense>
                    <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                      <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'amber-4'" size="xs" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                    <q-item-section v-if="scope.opt.category" side>
                      <q-badge :color="scope.opt.color || 'amber-4'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div v-if="initiativeConfig.specialTrigger === 'cast_custom'" class="col-12 col-sm-6">
              <q-input
                v-model="initiativeConfig.specialTriggerSpell"
                dense
                outlined
                label="Spell Name to Cast on Lowest Dice"
                placeholder="e.g. Sanctuary, Shield of Faith"
              />
            </div>
            <div v-else-if="initiativeConfig.specialTrigger === 'custom'" class="col-12 col-sm-6">
              <q-input
                v-model="initiativeConfig.customEffectNote"
                dense
                outlined
                label="Custom Initiative Note"
                placeholder="e.g. Acts twice per round"
              />
            </div>
          </div>

          <!-- Modular Composable Initiative Riders -->
          <div
            class="q-pa-sm rounded-borders"
            style="background: rgba(147, 51, 234, 0.05); border: 1px dashed rgba(147, 51, 234, 0.4);"
          >
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-weight-bold" style="color: #c084fc;">
                ⚡ Composable Initiative Riders & Permutable Mechanics
              </div>
              <q-badge v-if="initiativeConfig.riders && initiativeConfig.riders.length > 0" color="purple-5" outline>
                {{ initiativeConfig.riders.length }} Active Rider{{ initiativeConfig.riders.length > 1 ? 's' : '' }}
              </q-badge>
            </div>

            <!-- Existing Riders Chips List -->
            <div v-if="initiativeConfig.riders && initiativeConfig.riders.length > 0" class="row q-gutter-xs q-mb-sm">
              <q-chip
                v-for="(rider, rIdx) in initiativeConfig.riders"
                :key="rider.id || 'r-' + rIdx"
                removable
                dense
                color="purple-9"
                text-color="purple-1"
                @remove="removeInitiativeRider(rIdx)"
              >
                {{ formatInitiativeRider(rider) }}
              </q-chip>
            </div>

            <!-- Composer Row: Precondition, Target Types, Roll Effect, Action -->
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12 col-sm-3">
                <q-select
                  v-model="newRiderAdvMode"
                  :options="initiativeAdvModeOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Roll Precondition"
                />
              </div>

              <div class="col-12 col-sm-4">
                <q-select
                  v-model="newRiderCreatureTypes"
                  :options="creatureTypeOptions"
                  multiple
                  use-chips
                  dense
                  outlined
                  label="Target Creature Types"
                  placeholder="e.g. Fiends, Undead"
                />
              </div>

              <div v-if="newRiderCreatureTypes && newRiderCreatureTypes.length > 0" class="col-12 col-sm-2">
                <q-select
                  v-model="newRiderRollEffect"
                  :options="[
                    { label: 'Disadvantage', value: 'disadvantage' },
                    { label: 'Advantage', value: 'advantage' }
                  ]"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Target Roll Effect"
                />
              </div>

              <div :class="newRiderCreatureTypes && newRiderCreatureTypes.length > 0 ? 'col-12 col-sm-3' : 'col-12 col-sm-5'">
                <q-select
                  v-model="newRiderActionType"
                  :options="initiativeActionTypeOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Composable Action"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps" dense>
                      <q-item-section v-if="scope.opt.icon" avatar style="min-width: 24px;">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'purple-4'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>

            <!-- Parameter Row: Spell Name / HP Amount / Move Distance / Custom Text & Add Button -->
            <div class="row q-col-gutter-xs items-center q-mt-xs">
              <div v-if="newRiderActionType === 'cast_spell'" class="col-12 col-sm-6">
                <q-input
                  v-model="newRiderSpellName"
                  dense
                  outlined
                  label="Spell Name"
                  placeholder="e.g. Thaumaturgy, Compelled Duel"
                />
              </div>
              <div v-else-if="newRiderActionType === 'regain_hp' || newRiderActionType === 'gain_temp_hp'" class="col-12 col-sm-6">
                <q-input
                  v-model="newRiderHpAmount"
                  dense
                  outlined
                  :label="newRiderActionType === 'regain_hp' ? 'Hit Points Regained' : 'Temporary Hit Points Gained'"
                  placeholder="e.g. 10 or 2d8+2"
                />
              </div>
              <div v-else-if="newRiderActionType === 'move_distance'" class="col-12 col-sm-6">
                <q-input
                  v-model="newRiderMoveDistance"
                  dense
                  outlined
                  label="Distance (e.g. 10ft)"
                  placeholder="10ft"
                />
              </div>
              <div v-else-if="newRiderActionType === 'custom'" class="col-12 col-sm-6">
                <q-input
                  v-model="newRiderCustomText"
                  dense
                  outlined
                  label="Custom Action Text"
                  placeholder="e.g. Can take the Disengage action"
                />
              </div>

              <div class="col-12 col-sm-3 q-ml-auto text-right">
                <q-btn
                  color="purple"
                  icon="add"
                  label="Add Rider"
                  dense
                  unelevated
                  class="full-width"
                  @click="addInitiativeRider"
                />
              </div>
            </div>
          </div>

          <!-- Single Gate for Paragon Multi-Phase Pools & Per-Phase Initiative Counts -->
          <div
            class="q-pa-sm rounded-borders"
            style="background: rgba(156, 43, 27, 0.05); border: 1px dashed rgba(156, 43, 27, 0.4);"
          >
            <div class="row items-center justify-between">
              <div class="text-caption text-weight-bold" style="color: #f87171;">
                👹 Paragon Multi-Phase Pools & Initiative Gate (1 = Standard Single Pool)
              </div>
              <q-badge v-if="monster.paragonConfig.poolCount > 1" color="negative" outline>
                Active ({{ monster.paragonConfig.poolCount }} {{ monster.paragonConfig.phaseName || 'Phase' }}s)
              </q-badge>
            </div>
            <div class="q-mt-xs q-gutter-y-xs text-caption">
              <div class="row q-col-gutter-sm items-center">
                <div class="col-12 col-sm-3">
                  <formula-field path="paragonConfig.poolCount" label="Number of Stage Pools" dense outlined @applied="updateParagonPoolHp" />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model="monster.paragonConfig.phaseName"
                    dense
                    outlined
                    label="Stage Naming (Phase/Pool)"
                    placeholder="Phase"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="monster.paragonConfig.transitionEffect"
                    dense
                    outlined
                    label="Stage Transition Fury / Trigger"
                    placeholder="e.g. sheds all conditions and unleashes Bloodied roar"
                  />
                </div>
              </div>
              <div v-if="monster.paragonConfig.poolCount > 1" class="row q-col-gutter-sm items-center q-mt-xs">
                <div
                  v-for="(phaseCfg, pIdx) in paragonPhaseRows"
                  :key="'init-phase-bonus-' + pIdx"
                  class="col-6 col-sm-3"
                >
                  <q-input
                    v-model.number="phaseCfg.initiativeBonus"
                    type="number"
                    dense
                    outlined
                    :label="`${phaseCfg.name} Init Bonus`"
                    :placeholder="`+${(pIdx + 1) * 10}`"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-expansion-item>

      <!-- 9. Hit Points Defenses & Survival -->
      <q-expansion-item
        dense
        dense-toggle
        expand-separator
        class="q-mt-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
        icon="favorite_border"
        label="Hit Points Defenses & Survival"
        caption="Bloodied, Damage Threshold/Reduction, Invulnerability, Regeneration & Immortality"
      >
        <div class="q-pa-sm q-gutter-y-sm">
          <div class="row items-center justify-between q-px-xs q-mb-xs">
            <q-toggle
              v-model="monster.splitHpRiderRows"
              dark
              dense
              size="xs"
              color="red-4"
              label="Split HP Relatable Riders into Sub-Rows"
              class="text-caption text-weight-medium text-red-2"
            >
              <q-tooltip>Renders HP relatable riders (Temporary HP, Bloodied riders, Death Prevention, Damage Threshold) on dedicated indented sub-rows (↳) directly beneath base HP.</q-tooltip>
            </q-toggle>
          </div>
          <!-- Row 1: Bloodied & Per-Phase Bloodied States -->
          <div class="q-pa-sm rounded-borders" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.25);">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-weight-bold text-red-4">
                🩸 Bloodied & Phase Thresholds
              </div>
              <div class="row items-center q-gutter-x-sm">
                <q-toggle
                  v-model="monster.splitHpRiderRows"
                  dark
                  dense
                  size="xs"
                  color="red-4"
                  label="↳ Sub-Row"
                  class="text-caption text-red-2"
                  data-contextual-split-hp="bloodied"
                >
                  <q-tooltip>Split HP Riders into dedicated indented sub-rows (↳) beneath base HP.</q-tooltip>
                </q-toggle>
                <q-badge v-if="(extendedHp.bloodiedSource && extendedHp.bloodiedSource !== 'none') || extendedHp.showBloodied || monster.paragonConfig.poolCount > 1" color="red-5" outline>
                  {{ monster.paragonConfig.poolCount > 1 ? `${monster.paragonConfig.poolCount} Stages` : `Bloodied: ${extendedHp.bloodiedSource === 'flat' ? (extendedHp.bloodiedOverride || Math.max(1, Math.floor(monster.avgHp / 2))) : getDynamicSourceValue(extendedHp.bloodiedSource || 'half_hp', extendedHp.bloodiedDice)} HP` }}
                </q-badge>
              </div>
            </div>

            <!-- Single-Stage Bloodied Source Row (Hidden when Multi-Stage Paragon uses per-phase Bloodied checkboxes) -->
            <div v-if="!monster.paragonConfig?.poolCount || monster.paragonConfig.poolCount <= 1" class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="extendedHp.bloodiedSource"
                  :options="bloodiedSourceOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Bloodied Threshold Source"
                  @update:model-value="(val) => { extendedHp.showBloodied = val !== 'none' }"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps" dense>
                      <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'red-4'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section v-if="scope.opt.category" side>
                        <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                      </q-item-section>
                      <q-tooltip class="bg-grey-10 text-amber-2 text-caption" :delay="250" max-width="260px">
                        {{ scope.opt.tooltip || `${scope.opt.label}${scope.opt.category ? ' (' + scope.opt.category + ')' : ''}` }}
                      </q-tooltip>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div v-if="extendedHp.bloodiedSource === 'dice'" class="col-12 col-sm-6">
                <q-input
                  v-model="extendedHp.bloodiedDice"
                  dense
                  outlined
                  label="Bloodied Dice Formula"
                  placeholder="e.g. 4d10 + 10"
                  @update:model-value="() => { extendedHp.showBloodied = true }"
                />
              </div>
              <div v-else-if="extendedHp.bloodiedSource === 'flat'" class="col-12 col-sm-6">
                <formula-field
                  path="extendedHp.bloodiedOverride"
                  label="Bloodied HP Value"
                  dense
                  outlined
                  @applied="(val: number | string) => { extendedHp.bloodiedOverride = Number(val) || 0; if (extendedHp.bloodiedOverride > 0) extendedHp.showBloodied = true; }"
                />
              </div>
              <div v-else-if="extendedHp.bloodiedSource && extendedHp.bloodiedSource !== 'none'" class="col-12 col-sm-6">
                <div class="q-pa-xs rounded-borders text-caption text-red-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                  Resolved: {{ getDynamicSourceValue(extendedHp.bloodiedSource, extendedHp.bloodiedDice) }} HP
                </div>
              </div>
            </div>

            <!-- Multi-Stage Paragon Creature Per-Phase HP Threshold Rows with Cascading Left-Hand Bloodied Checkboxes -->
            <div v-if="monster.paragonConfig?.poolCount && monster.paragonConfig.poolCount > 1" class="q-gutter-y-xs q-mt-xs">
              <div class="text-caption text-amber-4 q-mb-xs">
                Configure each stage HP threshold & check <b>Bloodied</b> on any stage (automatically cascades to all subsequent stages beneath it):
              </div>
              <div
                v-for="(phaseCfg, pIdx) in paragonPhaseRows"
                :key="'paragon-phase-row-' + pIdx"
                class="row q-col-gutter-sm items-center q-pa-xs rounded-borders"
                :style="phaseCfg.isBloodied ? 'background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.45);' : 'background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);'"
              >
                <div class="col-12 col-sm-2">
                  <q-checkbox
                    :model-value="Boolean(phaseCfg.isBloodied)"
                    color="red-5"
                    dense
                    label="Bloodied"
                    class="text-weight-bold text-red-4"
                    @update:model-value="(val) => onTogglePhaseBloodied(pIdx, Boolean(val))"
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="phaseCfg.name"
                    dense
                    outlined
                    label="Stage Label"
                    @update:model-value="syncParagonPhaseRows"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-select
                    v-model="phaseCfg.source"
                    :options="dynamicSourceOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    label="Threshold Source"
                    @update:model-value="syncParagonPhaseRows"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps" dense>
                        <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'amber-4'" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                        <q-item-section v-if="scope.opt.category" side>
                          <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-if="phaseCfg.source === 'dice'" class="col-12 col-sm-2">
                  <q-input
                    v-model="phaseCfg.diceFormula"
                    dense
                    outlined
                    label="Dice Formula"
                    placeholder="e.g. 6d10"
                    @update:model-value="syncParagonPhaseRows"
                  />
                </div>
                <div v-else-if="!phaseCfg.source || phaseCfg.source === 'flat'" class="col-12 col-sm-2">
                  <q-input
                    v-model.number="phaseCfg.hpOverride"
                    type="number"
                    dense
                    outlined
                    clearable
                    label="HP Override"
                    @update:model-value="syncParagonPhaseRows"
                  />
                </div>
                <div v-else class="col-12 col-sm-2">
                  <div class="q-pa-xs rounded-borders text-caption text-amber-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                    {{ resolvePhaseRowPreview(phaseCfg) }} HP
                  </div>
                </div>
                <div class="col-12 col-sm-2 text-right">
                  <q-badge :color="phaseCfg.isBloodied ? 'red-7' : 'amber-8'" :text-color="phaseCfg.isBloodied ? 'white' : 'black'" class="text-weight-bold q-pa-xs">
                    {{ phaseCfg.name }}: {{ resolvePhaseRowPreview(phaseCfg) }}{{ isLastBloodiedPhase(pIdx) ? ' [Bloodied]' : '' }}
                  </q-badge>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2: Dedicated Damage Threshold (DT) Row -->
          <div class="q-pa-sm rounded-borders" style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.25);">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-weight-bold text-blue-4">
                🛡️ Damage Threshold (DT — Ignores hits below threshold)
              </div>
              <div class="row items-center q-gutter-x-sm">
                <q-toggle
                  v-model="monster.splitHpRiderRows"
                  dark
                  dense
                  size="xs"
                  color="blue-4"
                  label="↳ Sub-Row"
                  class="text-caption text-blue-2"
                  data-contextual-split-hp="dt"
                >
                  <q-tooltip>Split HP Riders into dedicated indented sub-rows (↳) beneath base HP.</q-tooltip>
                </q-toggle>
                <q-badge v-if="(extendedHp.damageThreshold && extendedHp.damageThreshold > 0) || (extendedHp.damageThresholdSource && extendedHp.damageThresholdSource !== 'flat' && extendedHp.damageThresholdSource !== 'none')" color="blue-4" outline>
                  DT {{ extendedHp.damageThresholdSource && extendedHp.damageThresholdSource !== 'flat' ? getDynamicSourceValue(extendedHp.damageThresholdSource, extendedHp.damageThresholdDice) : extendedHp.damageThreshold }}
                </q-badge>
              </div>
            </div>
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="extendedHp.damageThresholdSource"
                  :options="dtDrSourceOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Threshold Value Source"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps" dense>
                      <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'blue-4'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section v-if="scope.opt.category" side>
                        <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div v-if="extendedHp.damageThresholdSource === 'dice'" class="col-12 col-sm-4">
                <q-input
                  v-model="extendedHp.damageThresholdDice"
                  dense
                  outlined
                  label="Threshold Dice Formula"
                  placeholder="e.g. 2d10"
                />
              </div>
              <div v-else-if="!extendedHp.damageThresholdSource || extendedHp.damageThresholdSource === 'flat' || extendedHp.damageThresholdSource === 'none'" class="col-12 col-sm-4">
                <formula-field path="extendedHp.damageThreshold" label="Damage Threshold Value" dense outlined />
                <q-btn v-if="extendedHp.damageThreshold != null" flat dense size="sm" icon="restart_alt" label="Clear value" @click="clearHpThreshold('damageThreshold')" />
              </div>
              <div v-else class="col-12 col-sm-4">
                <div class="q-pa-xs rounded-borders text-caption text-blue-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                  Resolved: DT {{ getDynamicSourceValue(extendedHp.damageThresholdSource, extendedHp.damageThresholdDice) }}
                </div>
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="extendedHp.damageThresholdDisruption"
                  :options="disruptionOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Disrupted By"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps" dense>
                      <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'blue-4'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section v-if="scope.opt.category" side>
                        <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </div>

          <!-- Row 3: Dedicated Damage Reduction (DR) Row -->
          <div class="q-pa-sm rounded-borders" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.25);">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-weight-bold text-emerald-4" style="color: #34d399;">
                ⚔️ Damage Reduction (DR — Subtracts from incoming damage)
              </div>
              <div class="row items-center q-gutter-x-sm">
                <q-toggle
                  v-model="monster.splitHpRiderRows"
                  dark
                  dense
                  size="xs"
                  color="teal-4"
                  label="↳ Sub-Row"
                  class="text-caption text-teal-2"
                  data-contextual-split-hp="dr"
                >
                  <q-tooltip>Split HP Riders into dedicated indented sub-rows (↳) beneath base HP.</q-tooltip>
                </q-toggle>
                <q-badge v-if="(extendedHp.damageReduction && extendedHp.damageReduction > 0) || (extendedHp.damageReductionSource && extendedHp.damageReductionSource !== 'flat' && extendedHp.damageReductionSource !== 'none')" color="teal-4" outline>
                  DR {{ extendedHp.damageReductionSource && extendedHp.damageReductionSource !== 'flat' ? getDynamicSourceValue(extendedHp.damageReductionSource, extendedHp.damageReductionDice) : extendedHp.damageReduction }}
                </q-badge>
              </div>
            </div>
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="extendedHp.damageReductionSource"
                  :options="dtDrSourceOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Reduction Value Source"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps" dense>
                      <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'teal-4'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section v-if="scope.opt.category" side>
                        <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div v-if="extendedHp.damageReductionSource === 'dice'" class="col-12 col-sm-4">
                <q-input
                  v-model="extendedHp.damageReductionDice"
                  dense
                  outlined
                  label="Reduction Dice Formula"
                  placeholder="e.g. 1d8 + 2"
                />
              </div>
              <div v-else-if="!extendedHp.damageReductionSource || extendedHp.damageReductionSource === 'flat' || extendedHp.damageReductionSource === 'none'" class="col-12 col-sm-4">
                <formula-field path="extendedHp.damageReduction" label="Damage Reduction Value" dense outlined />
                <q-btn v-if="extendedHp.damageReduction != null" flat dense size="sm" icon="restart_alt" label="Clear value" @click="clearHpThreshold('damageReduction')" />
              </div>
              <div v-else class="col-12 col-sm-4">
                <div class="q-pa-xs rounded-borders text-caption text-teal-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                  Resolved: DR {{ getDynamicSourceValue(extendedHp.damageReductionSource, extendedHp.damageReductionDice) }}
                </div>
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="extendedHp.damageReductionDisruption"
                  :options="disruptionOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Disrupted By"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps" dense>
                      <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'teal-4'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section v-if="scope.opt.category" side>
                        <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </div>

          <!-- Row 5: Unified Regeneration & Temporary Hit Points Module -->
          <div
            class="q-pa-sm rounded-borders"
            style="background: rgba(20, 184, 166, 0.05); border: 1px solid rgba(20, 184, 166, 0.25);"
          >
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-weight-bold text-caption text-teal-3">
                💚 Regeneration & Temporary Hit Points Module
              </div>
              <div class="row items-center q-gutter-x-xs">
                <q-toggle
                  v-model="monster.splitHpRiderRows"
                  dark
                  dense
                  size="xs"
                  color="teal-4"
                  label="↳ Sub-Row"
                  class="text-caption text-teal-2 q-mr-xs"
                  data-contextual-split-hp="regen"
                >
                  <q-tooltip>Split HP Riders into dedicated indented sub-rows (↳) beneath base HP.</q-tooltip>
                </q-toggle>
                <q-badge
                  v-if="regenPreview"
                  color="positive"
                  outline
                  class="q-pa-xs"
                >
                  {{ regenPreview }}
                </q-badge>
                <q-btn
                  v-if="extendedHp.regeneration.enabled"
                  flat
                  dense
                  size="xs"
                  color="grey-5"
                  icon="close"
                  label="Disable"
                  @click="extendedHp.regeneration.enabled = false"
                />
              </div>
            </div>

            <div class="q-gutter-y-xs">
              <div class="row q-col-gutter-sm items-center">
                <div class="col-12 col-sm-4">
                  <q-select
                    v-model="extendedHp.regeneration.recoveryType"
                    :options="recoveryTypeOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    label="Recovery Mode"
                    @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps" dense>
                        <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'teal-4'" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                        <q-item-section v-if="scope.opt.category" side>
                          <q-badge :color="scope.opt.color || 'teal-4'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-sm-4">
                  <q-select
                    v-model="extendedHp.regeneration.valueSource"
                    :options="dynamicSourceOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    label="Value Source"
                    @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps" dense>
                        <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'teal-4'" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                        <q-item-section v-if="scope.opt.category" side>
                          <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-if="!extendedHp.regeneration.valueSource || extendedHp.regeneration.valueSource === 'flat'" class="col-12 col-sm-4">
                  <formula-field path="extendedHp.regeneration.amount" label="Amount" dense outlined @applied="(val) => { extendedHp.regeneration.enabled = val > 0 }" />
                </div>
                <div v-else-if="extendedHp.regeneration.valueSource === 'dice' || extendedHp.regeneration.valueSource.startsWith('dice_')" class="col-12 col-sm-4">
                  <q-input
                    v-model="extendedHp.regeneration.diceFormula"
                    dense
                    outlined
                    label="Dice Formula"
                    placeholder="e.g. 2d10 + 5"
                    @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                  />
                </div>
                <div v-else class="col-12 col-sm-4">
                  <div class="q-pa-xs rounded-borders text-caption text-teal-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                    Resolved: +{{ getDynamicSourceValue(extendedHp.regeneration.valueSource, extendedHp.regeneration.diceFormula) }}
                  </div>
                </div>
              </div>

              <div class="row q-col-gutter-sm items-center q-mt-xs">
                <div class="col-12 col-sm-4">
                  <q-select
                    v-model="extendedHp.regeneration.frequency"
                    :options="frequencyOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    label="Frequency & Trigger"
                    @update:model-value="onRegenFrequencyChanged"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps" dense>
                        <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'teal-4'" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                        <q-item-section v-if="scope.opt.category" side>
                          <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-if="extendedHp.regeneration.recoveryType === 'absorb_hp' || extendedHp.regeneration.recoveryType === 'absorb_temp_hp' || extendedHp.regeneration.frequency === 'damage_taken'" class="col-12 col-sm-4">
                  <q-select
                    v-model="extendedHp.regeneration.triggeredByDamageType"
                    :options="damageTypeOptions"
                    dense
                    outlined
                    label="Trigger Damage Type"
                    @update:model-value="onRegenDamageTypeTriggerChanged"
                  />
                </div>
                <div v-else class="col-12 col-sm-4">
                  <q-select
                    v-model="extendedHp.regeneration.disruptedByTypes"
                    :options="damageTypeOptions"
                    multiple
                    use-chips
                    clearable
                    label="Disrupted by Damage Type(s)"
                    dense
                    outlined
                    @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-select
                    v-model="extendedHp.regeneration.displayMode"
                    :options="displayModeOptions"
                    emit-value
                    map-options
                    label="Display Format"
                    dense
                    outlined
                    @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                  />
                </div>
              </div>

              <!-- Special Heuristic Conditions Row -->
              <div class="row q-col-gutter-sm items-center q-mt-xs">
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="extendedHp.regeneration.conditionModifier"
                    :options="regenConditionModifierOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    label="Special Condition / Trigger Heuristic"
                    @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps" dense>
                        <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'teal-4'" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                        <q-item-section v-if="scope.opt.category" side>
                          <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-if="extendedHp.regeneration.conditionModifier === 'max_hp_reduction'" class="col-12 col-sm-6">
                  <q-select
                    v-model="extendedHp.regeneration.maxHpReductionUntil"
                    :options="['short rest', 'long rest', 'short or long rest', 'dawn', 'midnight', '24 hours']"
                    dense
                    outlined
                    label="Maximum HP Reduction Duration"
                    @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                  />
                </div>
                <div v-else class="col-12 col-sm-6">
                  <q-input
                    v-model="extendedHp.regeneration.disruptedByNote"
                    dense
                    outlined
                    label="Custom Disruption / Condition Note"
                    placeholder="e.g. if head is severed"
                    @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Row 6: Immortality / Undead Fortitude / Death Prevention Module (No Checkbox; Default = Mortal) -->
          <div
            class="q-pa-sm rounded-borders"
            style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.25);"
          >
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-weight-bold text-amber-4">
                👑 Mortality & Death Prevention (Mortal / Immortal / Undead Fortitude)
              </div>
              <div class="row items-center q-gutter-x-sm">
                <q-toggle
                  v-model="monster.splitHpRiderRows"
                  dark
                  dense
                  size="xs"
                  color="amber-4"
                  label="↳ Sub-Row"
                  class="text-caption text-amber-2"
                  data-contextual-split-hp="mortality"
                >
                  <q-tooltip>Split HP Riders into dedicated indented sub-rows (↳) beneath base HP.</q-tooltip>
                </q-toggle>
                <q-badge
                  v-if="deathPrevention.enabled && deathPrevention.name !== 'Mortal' && deathPreventionPreview"
                  color="amber-5"
                  outline
                  class="q-pa-xs"
                >
                  {{ deathPreventionPreview }}
                </q-badge>
              </div>
            </div>

            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="deathPrevention.name"
                  :options="deathPreventionTemplates"
                  label="Mortality / Trait Template"
                  dense
                  outlined
                  use-input
                  new-value-mode="add-unique"
                  @update:model-value="onDeathPreventionTemplateChanged"
                />
              </div>
              <div v-if="deathPrevention.name && deathPrevention.name !== 'Mortal'" class="col-12 col-sm-4">
                <q-select
                  v-model="deathPrevention.dcRule"
                  :options="deathPreventionRuleOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Immortality / Survival Rule"
                  @update:model-value="onDeathPreventionRuleChanged"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps" dense>
                      <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'amber-4'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section v-if="scope.opt.category" side>
                        <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div v-if="deathPrevention.name && deathPrevention.name !== 'Mortal'" class="col-12 col-sm-4">
                <q-select
                  v-model="deathPrevention.displayMode"
                  :options="displayModeOptions"
                  emit-value
                  map-options
                  label="Display Format"
                  dense
                  outlined
                />
              </div>
            </div>

            <div v-if="deathPrevention.name && deathPrevention.name !== 'Mortal'" class="q-mt-xs q-gutter-y-xs">
              <!-- Critical Hits to Kill Mode -->
              <div v-if="deathPrevention.dcRule === 'until_x_crits'" class="row q-col-gutter-sm items-center">
                <div class="col-12 col-sm-4">
                  <formula-field path="extendedHp.deathPrevention.critHitsToKill" label="Critical Hits Required to Slay (X)" dense outlined />
                </div>
                <div class="col-12 col-sm-8 text-caption text-amber-3">
                  Hides numeric HP on statblock: <code>Immortal (Until being hit by {{ deathPrevention.critHitsToKill || 3 }} Critical Hits)</code>
                </div>
              </div>

              <!-- Return to Life HP Source & Saving Throw Configuration -->
              <div v-else-if="!deathPrevention.hideHp" class="row q-col-gutter-sm items-center">
                <div class="col-12 col-sm-4">
                  <q-select
                    v-model="deathPrevention.returnHpSource"
                    :options="returnHpSourceOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    label="Returns to Life with HP Source"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps" dense>
                        <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'amber-4'" size="xs" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                        <q-item-section v-if="scope.opt.category" side>
                          <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-if="deathPrevention.returnHpSource === 'flat'" class="col-12 col-sm-3">
                  <formula-field path="extendedHp.deathPrevention.returnHpValue" label="Return HP Value" dense outlined @applied="(val) => { deathPrevention.returnHpAmount = val }" />
                </div>
                <div v-else-if="deathPrevention.returnHpSource === 'dice' || deathPrevention.returnHpSource?.startsWith('dice_')" class="col-12 col-sm-3">
                  <q-input
                    v-model="deathPrevention.returnHpDice"
                    dense
                    outlined
                    label="Return HP Dice Formula"
                    placeholder="e.g. 2d8 + 4"
                  />
                </div>
                <div v-else class="col-12 col-sm-3">
                  <div class="q-pa-xs rounded-borders text-caption text-amber-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                    Resolved: {{ getDynamicSourceValue(deathPrevention.returnHpSource, deathPrevention.returnHpDice) }} HP
                  </div>
                </div>
                <div v-if="deathPrevention.requiresSave || deathPrevention.dcRule === 'custom_save'" class="col-6 col-sm-2">
                  <q-select
                    v-model="deathPrevention.saveStat"
                    :options="['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']"
                    dense
                    outlined
                    label="Save Stat"
                  />
                </div>
                <div v-if="deathPrevention.requiresSave || deathPrevention.dcRule === 'custom_save'" class="col-6 col-sm-3">
                  <formula-field path="extendedHp.deathPrevention.saveDc" label="Save DC" dense outlined />
                </div>
              </div>

              <!-- Revival Timing / Timeframe -->
              <div v-if="!deathPrevention.hideHp && deathPrevention.dcRule !== 'until_x_crits'" class="row q-col-gutter-sm items-center">
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="deathPrevention.returnTimeframe"
                    :options="[
                      { label: 'Immediate (Standard)', value: 'none' },
                      { label: 'At End of Turn', value: 'at_end_of_turn' },
                      { label: 'At Start of Next Turn', value: 'start_of_next_turn' }
                    ]"
                    emit-value
                    map-options
                    dense
                    outlined
                    label="Revival Timing"
                  />
                </div>
              </div>

              <!-- Death Burst Damage Configuration -->
              <div v-if="deathPrevention.dcRule === 'upon_death_burst' || deathPrevention.uponDeathDealsDamage" class="row q-col-gutter-sm items-center">
                <div class="col-12 col-sm-3">
                  <formula-field path="extendedHp.deathPrevention.deathBurstDamageAmount" label="Death Burst Damage" dense outlined />
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    v-model="deathPrevention.deathBurstDamageType"
                    :options="damageTypeOptions"
                    dense
                    outlined
                    label="Burst Damage Type"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    v-model="deathPrevention.deathBurstTargetFilter"
                    :options="['Creatures', 'Undeads, and Fiends', 'Hostile Creatures', 'Allies']"
                    dense
                    outlined
                    use-input
                    new-value-mode="add-unique"
                    label="Target Filter"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <formula-field path="extendedHp.deathPrevention.deathBurstRange" label="Burst Radius (ft)" dense outlined />
                </div>
              </div>

              <!-- Exceptions & Custom Note -->
              <div class="row q-col-gutter-sm items-center">
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="deathPrevention.exceptions"
                    :options="deathExceptionOptions"
                    multiple
                    use-chips
                    clearable
                    new-value-mode="add-unique"
                    label="Exceptions (Damage Types / Conditions that prevent revival)"
                    dense
                    outlined
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="deathPrevention.customNote"
                    label="Custom Exception / Condition Note"
                    dense
                    outlined
                    placeholder="e.g. or while in sunlight"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-expansion-item>

      <!-- 10. Languages Smart List (Dark Mode) -->
      <q-expansion-item
        dense
        dense-toggle
        expand-separator
        default-opened
        class="q-mt-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
        icon="translate"
        label="Languages"
        caption="Select official D&D languages, configure telepathy and understand-only options"
      >
        <div class="q-pa-sm">
          <!-- Racial / Class Communication Archetypes (Mutually Exclusive) -->
          <div
            class="q-pa-xs rounded-borders q-mb-sm"
            style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.07);"
          >
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-caption text-weight-bold text-grey-3">Universal / Archetype Communication:</span>
              <span class="text-caption text-grey-5">(Mutually Exclusive)</span>
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12">
                <q-btn-toggle
                  v-model="monster.specialCommunicationArchetype"
                  dense
                  toggle-color="primary"
                  color="dark"
                  text-color="grey-4"
                  size="sm"
                  spread
                  :options="[
                    { label: 'Standard (None)', value: 'none' },
                    { label: '🌿 Firbolg: Speech of Beast & Leaf', value: 'firbolg' },
                    { label: '☯️ Monk: Tongue of Sun & Moon', value: 'monk' },
                  ]"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
            </div>
          </div>

          <!-- Add Language via Dropdown (no add button) -->
          <div class="row q-col-gutter-xs items-center q-mb-sm">
            <q-select
              :model-value="null"
              :options="languageOptions"
              use-input
              input-debounce="0"
              new-value-mode="add-unique"
              label="Select or Type Language to Add"
              dense
              outlined
              class="col-12"
              @filter="filterLanguages"
              @update:model-value="onLanguageSelected"
            >
              <template #prepend>
                <q-icon name="add" />
              </template>
            </q-select>
          </div>

          <!-- Active Languages List -->
          <div v-if="monster.languagesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
            No languages configured. Select a language above or type custom.
          </div>

          <div
            v-for="(lang, idx) in monster.languagesList"
            :key="idx"
            class="q-pa-xs q-mb-xs rounded-borders"
            style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
          >
            <!-- Telepathy Language Card -->
            <div v-if="lang.name.toLowerCase() === 'telepathy' || lang.telepathy">
              <div class="row q-col-gutter-xs items-center justify-between">
                <div class="row items-center q-gutter-x-sm">
                  <q-chip dense outline color="accent" class="q-ma-none text-weight-bold">
                    🧠 Telepathy
                  </q-chip>
                  <formula-field :path="`languagesList[id=${encodeURIComponent(lang.id)}].telepathyRange`" label="Range (ft)" dense outlined @applied="syncLanguagesToString" />
                </div>
                <div class="row items-center q-gutter-x-xs">
                  <swap-buttons field="languagesList" :idx="idx" flat dense />
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    @click="removeLanguage(idx)"
                  />
                </div>
              </div>

              <!-- Telepathy Configuration Studio -->
              <div class="q-mt-xs q-gutter-y-xs text-caption">
                <!-- Mutually Exclusive Language Requirement -->
                <div class="row q-col-gutter-xs items-center">
                  <div class="col-12 col-sm-4 text-grey-4 text-weight-medium">
                    Language Requirement:
                  </div>
                  <div class="col-12 col-sm-8">
                    <q-btn-toggle
                      v-model="lang.languageRequirement"
                      dense
                      toggle-color="primary"
                      color="dark"
                      text-color="grey-4"
                      size="sm"
                      spread
                      :options="languageRequirementOptions"
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                </div>

                <!-- Mutually Exclusive Creature Target -->
                <div class="row q-col-gutter-xs items-center">
                  <div class="col-12 col-sm-4 text-grey-4 text-weight-medium">
                    Creature Target:
                  </div>
                  <div class="col-12 col-sm-8">
                    <q-btn-toggle
                      v-model="lang.creatureTarget"
                      dense
                      toggle-color="secondary"
                      color="dark"
                      text-color="grey-4"
                      size="sm"
                      spread
                      :options="creatureTargetOptions"
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                </div>

                <!-- Transmission & Reach Modifiers -->
                <div class="row q-col-gutter-xs items-center">
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.broadcast"
                      label="Broadcast to all creatures in range"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.noReply"
                      label="One-way only (target cannot reply)"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.simpleConceptsOnly"
                      label="Only simple ideas and concepts"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.acrossPlanes"
                      label="Across ethereal & material planes"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.multiverseWide"
                      label="Multiverse wide reach"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.telepathicAwareness"
                      label="Telepathic Awareness (perceives unseen minds)"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.sensesSentient"
                      label="Senses sentient creatures in range (Intellect Devourer pattern)"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.locatesSentient"
                      label="Locates exact location of sentient creatures (Intellect Devourer pattern)"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.telepathicEavesdrop"
                      label="Eavesdrops telepathic conversations in range (Flumph pattern)"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-select
                      v-model="lang.creatureConcentrationFilter"
                      :options="concentrationFilterOptions"
                      emit-value
                      map-options
                      dense
                      outlined
                      label="Target Concentration Filter"
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                </div>

                <!-- Deep Probing Matrix -->
                <q-expansion-item
                  dense
                  dense-toggle
                  icon="psychology"
                  label="Deep Probing & Mental Exploration"
                  caption="Detect thoughts, desires, alignment, memories, centralized save DC"
                  header-class="text-caption text-primary q-pa-none"
                  class="rounded-borders q-pa-xs"
                  style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);"
                >
                  <div class="row q-col-gutter-xs items-center q-pt-xs">
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.learnDesires"
                        label="Learns greatest desires"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.readThoughts"
                        label="Reads surface / active thoughts"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.senseEmotions"
                        label="Senses emotions & turmoil"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.senseAlignment"
                        label="Senses moral/ethical alignment"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.senseIntentions"
                        label="Senses tactical intentions"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.detectSincerity"
                        label="Detects truth & deception"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.accessMemories"
                        label="Accesses deep memories"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>

                    <!-- Unified Telepathy Saving Throw Gate -->
                    <div class="col-12 q-mt-xs">
                      <q-checkbox
                        v-model="lang.requiresSave"
                        label="Requires saving throw to resist mental probing or sensory connection"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <template v-if="lang.requiresSave">
                      <div class="col-12 col-sm-4">
                        <q-select
                          v-model="lang.saveType"
                          :options="saveTypeOptions"
                          dense
                          outlined
                          label="Save Type"
                          @update:model-value="syncLanguagesToString"
                        />
                      </div>
                      <div class="col-12 col-sm-4">
                        <q-input
                          v-model.number="lang.saveDc"
                          type="number"
                          label="Save DC"
                          dense
                          outlined
                          @update:model-value="syncLanguagesToString"
                        />
                      </div>
                      <div class="col-12 col-sm-4">
                        <q-select
                          v-model="lang.saveAwareness"
                          :options="[
                            { label: 'Unaware on Failure', value: 'unaware_on_fail' },
                            { label: 'Always Unaware', value: 'always_unaware' },
                            { label: 'Always Aware', value: 'aware' },
                          ]"
                          emit-value
                          map-options
                          dense
                          outlined
                          label="Target Awareness"
                          @update:model-value="syncLanguagesToString"
                        />
                      </div>
                    </template>
                  </div>
                </q-expansion-item>

                <!-- Sensory Links & Disruption Matrix -->
                <q-expansion-item
                  dense
                  dense-toggle
                  icon="visibility"
                  label="Sensory Links & Psychic Disruption"
                  caption="Share senses, psychic disruption, concentration"
                  header-class="text-caption text-secondary q-pa-none"
                  class="rounded-borders q-pa-xs"
                  style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);"
                >
                  <div class="row q-col-gutter-xs items-center q-pt-xs">
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.shareOwnSenses"
                        label="Shares own senses (sight/hearing)"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.probeCreatureSenses"
                        label="Perceives through creature's senses"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="lang.disruptedByPsychicDamage"
                        label="Disrupted when creature takes psychic damage"
                        dense
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-select
                        v-model="lang.concentrationMode"
                        :options="concentrationModeOptions"
                        emit-value
                        map-options
                        dense
                        outlined
                        label="Concentration Interaction"
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-select
                        v-model="lang.concentration"
                        :options="concentrationOptions"
                        emit-value
                        map-options
                        dense
                        outlined
                        label="Requires Concentration"
                        @update:model-value="syncLanguagesToString"
                      />
                    </div>
                  </div>
                </q-expansion-item>

                <div class="col-12 q-mt-xs">
                  <q-input
                    v-model="lang.note"
                    label="Additional Note"
                    dense
                    outlined
                    placeholder="e.g. within visual line of sight"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
              </div>
            </div>

            <!-- Handle Animals Ruling Card -->
            <div
              v-else-if="lang.name.toLowerCase() === 'handle animals' || lang.animalHandling?.enabled"
              class="q-pa-xs"
            >
              <div class="row q-col-gutter-xs items-center justify-between q-mb-xs">
                <div class="row items-center q-gutter-x-sm">
                  <q-chip dense outline color="secondary" class="q-ma-none text-weight-bold">
                    🐾 Handle Animals
                  </q-chip>
                  <formula-field :path="`languagesList[id=${encodeURIComponent(lang.id)}].animalHandling.dc`" label="Base DC" dense outlined @applied="syncLanguagesToString" />
                </div>
                <div class="row items-center q-gutter-x-xs no-wrap">
                  <swap-buttons field="languagesList" :idx="idx" flat dense />
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    @click="removeLanguage(idx)"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-xs items-center text-caption q-mt-xs">
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="getAnimalHandling(lang).peacefulOutcome"
                    label="DC (Calm / Cease Aggression)"
                    dense
                    outlined
                    placeholder="calm/cease aggression"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="getAnimalHandling(lang).commandOutcome"
                    label="DC+5 (Basic Commands)"
                    dense
                    outlined
                    placeholder="convey basic commands"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="getAnimalHandling(lang).recruitOutcome"
                    label="DC+10 (Recruit / Bond)"
                    dense
                    outlined
                    placeholder="recruit aid/bond"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 q-mt-xs">
                  <q-input
                    v-model="getAnimalHandling(lang).customNotes"
                    label="Custom Ruling Note"
                    dense
                    outlined
                    placeholder="e.g. beasts of CR 1 or lower"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
              </div>
            </div>

            <!-- Animals (Speak with Animals) Card -->
            <div
              v-else-if="lang.name.toLowerCase() === 'animals' || lang.animalsConfig"
              class="q-pa-xs"
            >
              <div class="row items-center justify-between q-mb-xs">
                <q-chip dense outline color="primary" class="q-ma-none text-weight-bold">
                  🦊 Animals (Speak with Animals)
                </q-chip>
                <div class="row items-center q-gutter-x-xs no-wrap">
                  <swap-buttons field="languagesList" :idx="idx" flat dense />
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    @click="removeLanguage(idx)"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-xs items-center text-caption">
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="getAnimalsConfig(lang).simpleConceptsOnly"
                    label="Simple concepts, needs, and emotions only"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.understandsOnly"
                    label="Understands beasts but cannot speak"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="getAnimalsConfig(lang).specificSubtype"
                    label="Specific Subtypes"
                    dense
                    outlined
                    placeholder="e.g. birds and rodents only"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="getAnimalsConfig(lang).note"
                    label="Note"
                    dense
                    outlined
                    placeholder="e.g. within 30 ft."
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
              </div>
            </div>

            <!-- Plants (Speak with Plants) Card -->
            <div
              v-else-if="lang.name.toLowerCase() === 'plants' || lang.plantsConfig"
              class="q-pa-xs"
            >
              <div class="row items-center justify-between q-mb-xs">
                <q-chip dense outline color="positive" class="q-ma-none text-weight-bold">
                  🌿 Plants (Speak with Plants)
                </q-chip>
                <div class="row items-center q-gutter-x-xs no-wrap">
                  <swap-buttons field="languagesList" :idx="idx" flat dense />
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    @click="removeLanguage(idx)"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-xs items-center text-caption">
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="getPlantsConfig(lang).canQuestionPastDay"
                    label="Question plants about events of past day"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="getPlantsConfig(lang).difficultTerrainNegotiation"
                    label="Negotiate difficult terrain"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.understandsOnly"
                    label="Understands plants but cannot speak"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="getPlantsConfig(lang).note"
                    label="Note"
                    dense
                    outlined
                    placeholder="e.g. ordinary and plant creatures"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
              </div>
            </div>

            <!-- Undead (Command / Speak with Undead) Card -->
            <div
              v-else-if="lang.name.toLowerCase() === 'undead' || lang.undeadConfig"
              class="q-pa-xs"
            >
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center q-gutter-x-sm">
                  <q-chip dense outline color="purple" class="q-ma-none text-weight-bold">
                    💀 Undead (Command / Speak with Undead)
                  </q-chip>
                  <formula-field :path="`languagesList[id=${encodeURIComponent(lang.id)}].undeadConfig.telepathicRange`" label="Range (ft)" dense outlined @applied="syncLanguagesToString" />
                </div>
                <div class="row items-center q-gutter-x-xs no-wrap">
                  <swap-buttons field="languagesList" :idx="idx" flat dense />
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    @click="removeLanguage(idx)"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-xs items-center text-caption">
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="getUndeadConfig(lang).commandMindless"
                    label="Issue mental commands to mindless undead"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.understandsOnly"
                    label="Understands undead languages but cannot speak"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="getUndeadConfig(lang).note"
                    label="Note"
                    dense
                    outlined
                    placeholder="e.g. skeletons and zombies under its command"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
              </div>
            </div>

            <!-- Dead (Speak with Dead) Card -->
            <div
              v-else-if="lang.name.toLowerCase().startsWith('dead') || lang.deadConfig"
              class="q-pa-xs"
            >
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center q-gutter-x-sm">
                  <q-chip dense outline color="brown" class="q-ma-none text-weight-bold">
                    🪦 Dead (Speak with Dead)
                  </q-chip>
                  <formula-field :path="`languagesList[id=${encodeURIComponent(lang.id)}].deadConfig.maxQuestions`" label="Questions" dense outlined @applied="syncLanguagesToString" />
                </div>
                <div class="row items-center q-gutter-x-xs no-wrap">
                  <swap-buttons field="languagesList" :idx="idx" flat dense />
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    @click="removeLanguage(idx)"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-xs items-center text-caption">
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="getDeadConfig(lang).corpseMustHaveMouth"
                    label="Corpse must have a mouth"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="getDeadConfig(lang).answersCryptic"
                    label="Answers may be brief, cryptic, or repetitive"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="getDeadConfig(lang).deadWithinYears"
                    label="Deceased Within"
                    dense
                    outlined
                    placeholder="e.g. 10 days, 100 years"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="getDeadConfig(lang).note"
                    label="Note"
                    dense
                    outlined
                    placeholder="e.g. requires 10-minute ritual"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
              </div>
            </div>

            <!-- Standard Language Row -->
            <div v-else>
              <div class="row q-col-gutter-xs items-center justify-between">
                <div class="col-12 col-sm-3 text-weight-bold text-subtitle2">
                  <q-chip dense outline color="primary" class="q-ma-none">
                    {{ lang.name }}
                  </q-chip>
                </div>

                <div class="col-12 col-sm-4">
                  <q-checkbox
                    v-model="lang.understandsOnly"
                    label="Understands but cannot speak"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>

                <div class="col-10 col-sm-3">
                  <q-input
                    v-model="lang.note"
                    label="Note"
                    dense
                    outlined
                    placeholder="e.g. with allies"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>

                <div class="col-2 col-sm-2 text-right row items-center justify-end q-gutter-x-xs">
                  <swap-buttons field="languagesList" :idx="idx" flat dense />
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    @click="removeLanguage(idx)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Formatted String & Raw Override Option -->
          <div class="row items-center justify-between q-mt-xs">
            <div class="text-caption text-grey-5">
              Live Preview: <em>{{ monster.languages || '&mdash;' }}</em>
            </div>
            <q-btn
              flat
              dense
              size="xs"
              color="grey-5"
              :label="showManualLangEdit ? 'Hide Manual Input' : 'Edit Raw Text'"
              @click="showManualLangEdit = !showManualLangEdit"
            />
          </div>

          <div v-if="showManualLangEdit" class="q-mt-xs">
            <q-input
              v-model="monster.languages"
              label="Raw Languages String"
              outlined
              dense
            />
          </div>
        </div>
      </q-expansion-item>
      <database-studio class="q-mt-sm" />
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { STANDARD_ALIGNMENT } from 'src/data/ALIGNMENT'
import { CR_SELECT, LAIR_CR_SELECT } from 'src/data/CR'
import { DICE_SELECT, DIE_LOOKUP } from 'src/data/DICE'
import { CREATURE_SIZE } from 'src/data/SIZE'
import { STANDARD_CREATURE_TYPE } from 'src/data/TYPE'
import { ALL_OFFICIAL_LANGUAGES } from 'src/data/LANGUAGES'
import { useMonsterStore } from 'src/stores/monster-store'
import { useEditorStore } from 'src/stores/editor-store'
import { computed, defineComponent, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { basicArrayFilter } from '../filters'
import LockToggleButton from '../LockToggleButton.vue'
import DatabaseStudio from './DatabaseStudio.vue'
import SwapButtons from './widgets/SwapButtons.vue'
import FormulaField from '../kit/FormulaField.vue'
import { entryBindingPrefix, withoutEntryBindings } from 'src/core/domain/entry-bindings'
import { validateNumber } from './numberInput'
import { avgHP } from 'src/core/domain/math-utils'
import { v4 as uuidv4 } from 'uuid'
import {
  calculatePointBuySpent,
  STANDARD_ARRAY,
  MONSTER_ROLE_ARCHETYPES,
  SPECIES_CATALOG,
  type MonsterRoleArchetype,
} from 'src/core/domain/species-and-heuristics'
import {
  formatLanguagesList,
  formatMinimalistRegen,
  formatMinimalistDeathPrevention,
  resolveDynamicNumericSource,
  composeInvulnerabilityRuling,
  resolveInvulnerabilityDisplayLocation,
  composeAcAndDefenses,
} from 'src/core/domain/defense-and-traits-utils'
import {
  ComposableInitiativeRider,
  InitiativeAdvantageMode,
  InitiativeActionType,
  INITIATIVE_ADV_MODE_OPTIONS,
  INITIATIVE_ACTION_TYPE_OPTIONS,
  STANDARD_CREATURE_TYPE_OPTIONS,
  formatInitiativeRider,
  formatInitiativeRiders,
} from 'src/core/domain/initiative-composer'
import { MonsterAcConfig, MonsterLanguageItem, ParagonPhaseConfig } from '../models'

const STANDARD_DAMAGE_TYPES = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
]

const DEATH_EXCEPTIONS = [
  'Necrotic Damage',
  'Critical Strikes',
  'Radiant Damage',
  'Fire Damage',
  // Damage Types (Alphabetized)
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
  // Special Attacks & Effects (Alphabetized)
  'adamantine weapons',
  'critical hit',
  'disintegration',
  'holy water',
  'magical weapons',
  'running water',
  'silvered weapons',
  'sunlight',
  'wish spell',
  // Conditions (Alphabetized)
  'charmed',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'paralyzed',
  'petrified',
  'poisoned',
  'restrained',
  'stunned',
  'unconscious',
]

export default defineComponent({
  name: 'BasicsEditor',
  components: { LockToggleButton, SwapButtons, FormulaField },
  setup() {
    const monster = useMonsterStore()
    const editorStore = useEditorStore()
    const openLayerStudio = () => {
      const el = document.getElementById('a4-layer-studio-expansion')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    const typeOptions = ref(STANDARD_CREATURE_TYPE)
    const alignmentOptions = ref(STANDARD_ALIGNMENT)
    const diceOptions = DICE_SELECT
    const diceLookup = DIE_LOOKUP
    const statKeys = Object.keys(
      monster.stats
    ) as (keyof typeof monster.stats)[]

    const typeFilter = basicArrayFilter(STANDARD_CREATURE_TYPE, typeOptions)
    const alignmentFilter = basicArrayFilter(
      STANDARD_ALIGNMENT,
      alignmentOptions
    )

    const $q = useQuasar()
    const pointBuyInfo = computed(() => calculatePointBuySpent(monster.stats))
    const roleArchetypes = Object.values(MONSTER_ROLE_ARCHETYPES)
    const speciesOptions = SPECIES_CATALOG.map((s) => ({ label: s.name, value: s.id }))

    const applyStandardArray = () => {
      monster.$patch((state) => {
        Object.assign(state.stats, STANDARD_ARRAY)
      })
    }

    const applyAllStats = (val: number) => {
      monster.$patch((state) => {
        for (const k of statKeys) {
          state.stats[k] = val
        }
      })
    }

    const applyArchetype = (arch: MonsterRoleArchetype) => {
      monster.$patch((state) => {
        Object.assign(state.stats, arch.stats)
      })
      $q.notify({
        type: 'positive',
        message: `Applied ${arch.label} stat heuristic array`,
      })
    }

    const selectedSpecies = ref<string | null>(null)
    const onSpeciesSelected = (speciesId: string | null) => {
      if (!speciesId) return
      const entry = SPECIES_CATALOG.find((s) => s.id === speciesId)
      if (!entry) return
      $q.dialog({
        title: `Apply ${entry.name} Features?`,
        message: `This will update Type (${entry.type}), Subtype (${entry.subtype || 'none'}), Speed (${entry.speed || 30}ft), and append ${entry.traits.length} species traits.`,
        ok: { label: 'Apply', color: 'primary' },
        cancel: true,
      }).onOk(() => {
        monster.$patch((state) => {
          if (entry.type) state.type = entry.type
          if (entry.subtype) state.subtype = entry.subtype
          if (entry.size) state.size = entry.size
          if (entry.speed) {
            const walk = state.speeds.find((s) => !s.type || s.type.toLowerCase() === 'walk')
            if (walk) walk.speed = entry.speed
          }
          if (entry.traits && entry.traits.length > 0) {
            for (const t of entry.traits) {
              if (!state.traits.some((existing) => existing.name.toLowerCase() === t.name.toLowerCase())) {
                state.traits.push({
                  id: `trait-species-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  name: t.name,
                  description: t.description,
                  customPreamble: false,
                  limitedUse: { count: 0, rate: '' },
                  crAnnotation: { include: false },
                })
              }
            }
          }
          if (entry.senses && entry.senses.length > 0) {
            for (const s of entry.senses) {
              const val = parseInt(s.value) || 60
              if (/darkvision/i.test(s.name)) {
                if (!state.senses.darkvision || state.senses.darkvision < val) state.senses.darkvision = val
              } else if (/blindsight/i.test(s.name)) {
                if (!state.senses.blindsight || state.senses.blindsight < val) state.senses.blindsight = val
              } else if (/tremorsense/i.test(s.name)) {
                if (!state.senses.tremorsense || state.senses.tremorsense < val) state.senses.tremorsense = val
              } else if (/truesight/i.test(s.name)) {
                if (!state.senses.truesight || state.senses.truesight < val) state.senses.truesight = val
              } else {
                state.sensesNotes = state.sensesNotes ? `${state.sensesNotes}, ${s.name} ${s.value}` : `${s.name} ${s.value}`
              }
            }
          }
          if (entry.resistances && entry.resistances.length > 0) {
            for (const res of entry.resistances) {
              if (!state.resistances.includes(res)) state.resistances.push(res)
            }
          }
          if (entry.immunities && entry.immunities.length > 0) {
            for (const imm of entry.immunities) {
              if (!state.immunities.includes(imm)) state.immunities.push(imm)
            }
          }
          if (entry.languages && entry.languages.length > 0) {
            for (const lang of entry.languages) {
              if (!state.languages.toLowerCase().includes(lang.toLowerCase())) {
                state.languages = state.languages ? `${state.languages}, ${lang}` : lang
              }
            }
          }
        })
        $q.notify({
          type: 'positive',
          message: `Auto-populated features from ${entry.name}! Racial stat hints: ${Object.entries(entry.statBonuses).map(([s, b]) => `+${b} ${s}`).join(', ')}`,
        })
      })
    }

    const ensureExtendedHp = () => {
      if (!monster.extendedHp) {
        monster.extendedHp = {
          showBloodied: false,
          bloodiedSource: 'none',
          bloodiedDice: '2d8',
          bloodiedAtPhase: 'half_total',
          damageThresholdSource: 'flat',
          damageThresholdDice: '2d6',
          damageThresholdDisruption: 'none',
          damageReductionSource: 'flat',
          damageReductionDice: '1d6',
          damageReductionDisruption: 'none',
          bloodiedOverride: null,
          damageThreshold: null,
          damageReduction: null,
          tempHp: {
            amount: 0,
            trigger: 'start_turn',
            damageType: 'fire',
          },
          invulnerability: {
            enabled: false,
            rule: 'none',
            conditions: [],
            nthAttack: 3,
            saveStat: 'Wisdom',
            saveDc: 15,
            alignmentFilter: 'Good',
            damageTypesFilter: ['radiant', 'fire'],
            customRule: '',
            firstXCount: 1,
            disruption: 'none',
            customDisruption: '',
            displayLocation: 'ac',
          },
          regeneration: {
            recoveryType: 'regen',
            valueSource: 'flat',
            amount: 10,
            frequency: 'turn_start',
            diceFormula: '',
            disruptedBy: 'acid or fire',
            disruptedByTypes: ['acid', 'fire'],
            disruptedByNote: '',
            timeframe: 'turn',
            displayMode: 'both',
            enabled: false,
          },
          deathPrevention: {
            enabled: false,
            name: 'Mortal',
            dcRule: 'always_survives',
            returnHpSource: '1',
            returnHpValue: 1,
            returnHpDice: '2d8',
            requiresSave: false,
            saveStat: 'CON',
            saveDc: 15,
            hideHp: false,
            critHitsToKill: 3,
            exceptions: ['radiant', 'critical hit'],
            customNote: '',
            displayMode: 'both',
          },
        }
      }
      if (!monster.extendedHp.invulnerability) {
        monster.extendedHp.invulnerability = {
          enabled: false,
          rule: 'none',
          conditions: [],
          nthAttack: 3,
          saveStat: 'Wisdom',
          saveDc: 15,
          alignmentFilter: 'Good',
          damageTypesFilter: ['radiant', 'fire'],
          customRule: '',
          firstXCount: 1,
          disruption: 'none',
          customDisruption: '',
          displayLocation: 'ac',
        }
      } else {
        if (!Array.isArray(monster.extendedHp.invulnerability.conditions)) {
          monster.extendedHp.invulnerability.conditions = []
        }
        if (monster.extendedHp.invulnerability.nthAttack == null) {
          monster.extendedHp.invulnerability.nthAttack = 3
        }
        if (!monster.extendedHp.invulnerability.saveStat) {
          monster.extendedHp.invulnerability.saveStat = 'Wisdom'
        }
        if (monster.extendedHp.invulnerability.saveDc == null) {
          monster.extendedHp.invulnerability.saveDc = 15
        }
        if (!monster.extendedHp.invulnerability.alignmentFilter) {
          monster.extendedHp.invulnerability.alignmentFilter = 'Good'
        }
        if (!Array.isArray(monster.extendedHp.invulnerability.damageTypesFilter)) {
          monster.extendedHp.invulnerability.damageTypesFilter = ['radiant', 'fire']
        }
      }
      if (!monster.extendedHp.tempHp) {
        monster.extendedHp.tempHp = {
          amount: 0,
          trigger: 'start_turn',
          damageType: 'fire',
        }
      }
      if (!monster.extendedHp.regeneration) {
        monster.extendedHp.regeneration = {
          recoveryType: 'regen',
          valueSource: 'flat',
          amount: 10,
          frequency: 'turn_start',
          diceFormula: '',
          disruptedBy: 'acid or fire',
          disruptedByTypes: ['acid', 'fire'],
          disruptedByNote: '',
          timeframe: 'turn',
          displayMode: 'both',
          enabled: false,
        }
      }
      if (!monster.extendedHp.deathPrevention) {
        monster.extendedHp.deathPrevention = {
          enabled: false,
          name: 'Mortal',
          dcRule: 'always_survives',
          returnHpSource: '1',
          returnHpValue: 1,
          returnHpDice: '2d8',
          requiresSave: false,
          saveStat: 'CON',
          saveDc: 15,
          hideHp: false,
          critHitsToKill: 3,
          exceptions: ['radiant', 'critical hit'],
          customNote: '',
          displayMode: 'both',
        }
      }
      return monster.extendedHp
    }

    const defaultAcConfig: MonsterAcConfig = {
      enabled: false,
      baseMode: 'flat',
      abilityBonus: 'none',
      defenseItem: 'none',
      temporary: 'none',
      conditional: 'none',
    }

    const ensureAcConfig = () => {
      if (!monster.acConfig) {
        monster.acConfig = { ...defaultAcConfig }
      }
      return monster.acConfig
    }

    watch(
      () => [monster.extendedHp, monster.initiativeConfig, monster.portrait, monster.acConfig],
      () => {
        ensureExtendedHp()
        ensureAcConfig()
        if (!monster.initiativeConfig) {
          monster.initiativeConfig = {
            proficient: false,
            secondaryStat: 'none',
            statMode: 'add',
            advantage: false,
            cantBeSurprised: false,
            useLairInitiative: false,
            lairInitiative: 20,
            specialTrigger: 'none',
            specialTriggerSpell: '',
            customEffectNote: '',
          }
        } else {
          if (monster.initiativeConfig.lairInitiative == null) {
            monster.initiativeConfig.lairInitiative = 20
          }
          if (!monster.initiativeConfig.specialTrigger) {
            monster.initiativeConfig.specialTrigger = 'none'
          }
        }
        if (!monster.portrait) {
          monster.portrait = {
            url: '',
            position: 'none',
            width: 220,
            caption: '',
          }
        }
      },
      { immediate: true }
    )

    // Reactive computed getters so loading/resetting a monster never detaches BasicsEditor
    const extendedHp = computed(() => monster.extendedHp || ensureExtendedHp())
    const invulnerability = computed(() => extendedHp.value.invulnerability as NonNullable<typeof extendedHp.value.invulnerability>)
    const tempHpConfig = computed(() => extendedHp.value.tempHp as NonNullable<typeof extendedHp.value.tempHp>)
    const deathPrevention = computed(() => extendedHp.value.deathPrevention as NonNullable<typeof extendedHp.value.deathPrevention>)

    const tempHpTriggerOptions = [
      { label: 'Start of its Turn', value: 'start_turn' },
      { label: 'End of its Turn', value: 'end_turn' },
      { label: 'When Taking Damage of Type...', value: 'damage_type' },
      { label: 'When Bloodied (<= 50% HP)', value: 'bloodied' },
      { label: 'At End of Short Rest', value: 'short_rest' },
      { label: 'At End of Long Rest', value: 'long_rest' },
    ]

    const tempHpPreview = computed(() => {
      const thp = tempHpConfig.value
      if (!thp.amount || thp.amount <= 0) return ''
      let trig = ''
      if (thp.trigger === 'start_turn') trig = ' at start of turn'
      else if (thp.trigger === 'end_turn') trig = ' at end of turn'
      else if (thp.trigger === 'damage_type' && thp.damageType) trig = ` when taking ${thp.damageType} damage`
      else if (thp.trigger === 'bloodied') trig = ' when bloodied'
      else if (thp.trigger === 'short_rest') trig = ' on short rest'
      else if (thp.trigger === 'long_rest') trig = ' on long rest'
      return `${thp.amount} temp HP${trig}`
    })

    const damageTypeWithNoneOptions = [
      { label: 'None (Standard)', value: '' },
      ...STANDARD_DAMAGE_TYPES.map((t) => ({ label: `Regains HP from ${t} (Auto-grants Immunity)`, value: t })),
    ]

    const onRegenDamageTypeTriggerChanged = (dmgType: string) => {
      if (!dmgType || dmgType === 'none') return
      if (!Array.isArray(monster.immunitiesList)) {
        monster.immunitiesList = []
      }
      const existing = monster.immunitiesList.find((i) => i.type?.toLowerCase() === dmgType.toLowerCase())
      if (existing) {
        existing.absorbs = true
      } else {
        monster.immunitiesList.push({
          id: uuidv4(),
          type: dmgType,
          absorbs: true,
        })
      }
    }

    const onInvulnerabilityRuleChanged = (rule: string) => {
      const inv = invulnerability.value
      inv.enabled = Boolean(rule && rule !== 'none')
      if (rule === 'only_x_can_hit' && (!Array.isArray(inv.conditions) || inv.conditions.length === 0)) {
        inv.conditions = ['critical_hits']
      } else if (rule === 'takes_damage_only_from' && (!Array.isArray(inv.conditions) || inv.conditions.length === 0)) {
        inv.conditions = ['different_damage_type']
      }
      if (rule === 'diff_damage_type' || rule === 'takes_damage_only_from') {
        inv.displayLocation = 'hp'
      } else if (!inv.displayLocation) {
        inv.displayLocation = 'ac'
      }
    }

    const onInvulnerabilityConditionsChanged = (conds?: string[] | null) => {
      const inv = invulnerability.value
      const list = Array.isArray(conds) ? conds : (Array.isArray(inv.conditions) ? inv.conditions : [])
      inv.conditions = list
      inv.enabled = list.length > 0 || Boolean(inv.customRule?.trim())
      inv.displayLocation = resolveInvulnerabilityDisplayLocation(inv)
    }

    const resolvedInvulnLocation = computed(() => {
      return resolveInvulnerabilityDisplayLocation(invulnerability.value)
    })

    const invulnerabilityPreview = computed(() => {
      return composeInvulnerabilityRuling(invulnerability.value)
    })

    const onRegenFrequencyChanged = (freq: string) => {
      const reg = extendedHp.value.regeneration
      if (freq === 'none') {
        reg.enabled = false
        return
      }
      reg.enabled = true
      reg.frequency = freq as typeof reg.frequency
      if (
        freq === 'minute' ||
        freq === 'hour' ||
        freq === 'day' ||
        freq === 'dawn' ||
        freq === 'dusk' ||
        freq === 'midday' ||
        freq === 'midnight' ||
        freq === 'short_rest' ||
        freq === 'long_rest' ||
        freq === 'downtime'
      ) {
        reg.timeframe = freq
      } else {
        reg.timeframe = 'turn'
      }
      if (freq === 'no_damage_taken' || freq === 'damage_taken' || freq === 'long_rest') {
        reg.triggerCondition = freq
      } else if (freq === 'turn_end' || freq === 'end_of_its_turn' || freq === 'end_of_a_turn' || freq === 'end_of_current_turn') {
        reg.triggerCondition = 'end_turn'
      } else {
        reg.triggerCondition = 'start_turn'
      }
    }

    const onDeathPreventionTemplateChanged = (tmpl: string) => {
      const dp = deathPrevention.value
      if (!tmpl || tmpl === 'Mortal') {
        dp.enabled = false
        dp.name = 'Mortal'
        return
      }
      dp.enabled = true
      if (tmpl === 'Undead Fortitude') {
        dp.dcRule = 'dc_5_plus_dmg'
        dp.returnHpSource = '1'
        dp.hideHp = false
        dp.exceptions = ['radiant', 'critical hit']
      } else if (tmpl === 'Relentless Endurance' || tmpl === 'Death Ward') {
        dp.dcRule = 'always_survives'
        dp.returnHpSource = '1'
        dp.hideHp = false
        dp.exceptions = ['disintegration']
      } else if (tmpl === 'Immortal') {
        if (!dp.returnHpSource) dp.returnHpSource = 'half_hp'
        if (!dp.dcRule) dp.dcRule = 'always_survives'
      }
    }

    const onDeathPreventionRuleChanged = (rule: string) => {
      const dp = deathPrevention.value
      dp.hideHp = rule === 'true_immortal' || rule === 'until_x_crits'
      dp.requiresSave = rule === 'custom_save'
      if (rule === 'death_save_success') {
        dp.triggerCondition = 'death_save_success'
        if (!dp.returnHpSource) dp.returnHpSource = '1'
      } else if (rule === 'upon_death_burst') {
        dp.triggerCondition = 'upon_death_burst'
        dp.uponDeathDealsDamage = true
        if (!dp.deathBurstDamageAmount) dp.deathBurstDamageAmount = 38
        if (!dp.deathBurstDamageType) dp.deathBurstDamageType = 'Radiant'
        if (!dp.deathBurstTargetFilter) dp.deathBurstTargetFilter = 'Creatures'
        if (!dp.deathBurstRange) dp.deathBurstRange = 30
      } else if (rule === 'always_survives' && !dp.returnHpSource) {
        dp.returnHpSource = '1'
      }
    }

    // Initiative Configuration
    const defaultInitConfig = {
      proficient: false,
      secondaryStat: 'none' as const,
      statMode: 'add' as const,
      advantage: false,
      cantBeSurprised: false,
      useLairInitiative: false,
      lairInitiative: 20,
      specialTrigger: 'none' as const,
      specialTriggerSpell: '',
      customEffectNote: '',
    }
    const initiativeConfig = computed(() => monster.initiativeConfig || defaultInitConfig)

    const initiativeRollMode = computed({
      get: () => {
        if (initiativeConfig.value.advantage) return 'advantage'
        if (initiativeConfig.value.disadvantage) return 'disadvantage'
        return 'normal'
      },
      set: (val: 'normal' | 'advantage' | 'disadvantage') => {
        if (!monster.initiativeConfig) {
          monster.initiativeConfig = { ...defaultInitConfig }
        }
        monster.initiativeConfig.advantage = val === 'advantage'
        monster.initiativeConfig.disadvantage = val === 'disadvantage'
      }
    })

    const secondaryStatOptions = [
      { label: 'None (DEX only)', value: 'none', category: 'Standard', icon: 'flash_on', color: 'grey-5' },
      { label: 'Charisma (CHA)', value: 'CHA', category: 'Ability', icon: 'auto_awesome', color: 'purple-4' },
      { label: 'Constitution (CON)', value: 'CON', category: 'Ability', icon: 'shield', color: 'teal-4' },
      { label: 'Intelligence (INT)', value: 'INT', category: 'Ability', icon: 'psychology', color: 'blue-4' },
      { label: 'Strength (STR)', value: 'STR', category: 'Ability', icon: 'fitness_center', color: 'red-4' },
      { label: 'Wisdom (WIS)', value: 'WIS', category: 'Ability', icon: 'visibility', color: 'amber-4' },
    ]

    const statModeOptions = [
      { label: 'Add to DEX (DEX + Stat)', value: 'add' },
      { label: 'Replace DEX (Use Stat instead)', value: 'replace' },
    ]

    const initiativeTriggerOptions = [
      { label: 'None (Standard Roll)', value: 'none', category: 'Standard', icon: 'flash_on', color: 'grey-5' },
      // Action Economy
      { label: 'At End of Every Turn', value: 'at_end_of_every_turn', category: 'Action Economy', icon: 'sync', color: 'purple-4' },
      { label: 'At End of Every Turn | At Start of Every Turn (Lair)', value: 'at_end_and_start_lair', category: 'Action Economy', icon: 'all_inclusive', color: 'purple-4' },
      // Dramatic Triggers
      { label: 'Within 1d6 of rounds', value: 'within_1d6_rounds', category: 'Dramatic Triggers', icon: 'hourglass_bottom', color: 'deep-orange-4' },
      { label: 'When it has no temporary Hit Points remaining', value: 'no_temp_hp_remaining', category: 'Dramatic Triggers', icon: 'shield', color: 'deep-orange-4' },
      { label: 'When hit points not equal to Maximum', value: 'hp_not_equal_max', category: 'Dramatic Triggers', icon: 'favorite_border', color: 'deep-orange-4' },
      // Spell Triggers
      { label: 'Choose lowest Dice to Cast Compelled Duel', value: 'cast_compelled_duel', category: 'Spell Trigger', icon: 'auto_fix_high', color: 'amber-4' },
      { label: 'Choose lowest Dice to Cast Thaumaturgy', value: 'cast_thaumaturgy', category: 'Spell Trigger', icon: 'auto_fix_high', color: 'amber-4' },
      { label: 'Choose lowest Dice to Cast Custom Spell...', value: 'cast_custom', category: 'Spell Trigger', icon: 'auto_fix_high', color: 'amber-4' },
      { label: 'While Bloodied, acts twice per round', value: 'while_bloodied_act_twice', category: 'Dramatic Triggers', icon: 'bloodtype', color: 'red-4' },
      { label: 'Custom Initiative Note...', value: 'custom', category: 'Custom', icon: 'edit_note', color: 'cyan-4' },
    ]

    const initiativePreview = computed(() => {
      const init = monster.initiative
      const mod = `${init.mod >= 0 ? '+' : ''}${init.mod}`
      const parts = [mod]
      if (init.advantage) parts.push('Advantage')
      if (init.disadvantage) parts.push('Disadvantage')
      if (init.cantBeSurprised) parts.push("Can't be Surprised")
      const trig = initiativeConfig.value.specialTrigger
      if (trig === 'at_end_of_every_turn') parts.push('At End of Every Turn')
      else if (trig === 'at_end_and_start_lair') parts.push('At End of Every Turn | At Start of Every Turn (Lair)')
      else if (trig === 'within_1d6_rounds') parts.push('Within 1d6 of rounds')
      else if (trig === 'no_temp_hp_remaining') parts.push('No Temp HP')
      else if (trig === 'hp_not_equal_max') parts.push('HP != Max')
      else if (trig === 'while_bloodied_act_twice') parts.push('Acts twice while Bloodied')
      else if (trig === 'cast_thaumaturgy' || trig === 'choose_lowest_thaumaturgy') parts.push('can cast Thaumaturgy')
      else if (trig === 'cast_compelled_duel' || trig === 'choose_lowest_compelled_duel') parts.push('can cast Compelled Duel')
      else if (trig === 'cast_custom' || trig === 'choose_lowest_custom') parts.push(`can cast ${initiativeConfig.value.specialTriggerSpell || 'Spell'}`)
      else if (trig === 'custom' && initiativeConfig.value.customEffectNote) parts.push(initiativeConfig.value.customEffectNote)
      if (initiativeConfig.value.useLairInitiative && trig !== 'at_end_and_start_lair') {
        parts.push(`| ${initiativeConfig.value.lairInitiative ?? 20} (Lair)`)
      }

      // Modular composable riders
      if (Array.isArray(initiativeConfig.value.riders) && initiativeConfig.value.riders.length > 0) {
        const ridersFormatted = formatInitiativeRiders(initiativeConfig.value.riders)
        if (ridersFormatted.length > 0) {
          parts.push(...ridersFormatted)
        }
      }

      return parts.join(', ')
    })

    // Composable Initiative Riders Composer State & Methods
    const newRiderAdvMode = ref<InitiativeAdvantageMode>('none')
    const newRiderCreatureTypes = ref<string[]>([])
    const newRiderRollEffect = ref<'disadvantage' | 'advantage'>('disadvantage')
    const newRiderActionType = ref<InitiativeActionType>('none')
    const newRiderSpellName = ref('')
    const newRiderHpAmount = ref<number | string>(10)
    const newRiderMoveDistance = ref<number | string>('10ft')
    const newRiderCustomText = ref('')

    const addInitiativeRider = () => {
      if (!monster.initiativeConfig.riders) {
        monster.initiativeConfig.riders = []
      }
      const rider: ComposableInitiativeRider = {
        id: uuidv4(),
        advMode: newRiderAdvMode.value,
        targetCreatureTypes: [...newRiderCreatureTypes.value],
        targetRollEffect: newRiderRollEffect.value,
        actionType: newRiderActionType.value,
        spellName: newRiderSpellName.value.trim(),
        hpAmount: newRiderHpAmount.value,
        moveDistance: newRiderMoveDistance.value,
        customText: newRiderCustomText.value.trim(),
      }
      monster.initiativeConfig.riders.push(rider)
      // Reset form controls
      newRiderAdvMode.value = 'none'
      newRiderCreatureTypes.value = []
      newRiderRollEffect.value = 'disadvantage'
      newRiderActionType.value = 'none'
      newRiderSpellName.value = ''
      newRiderCustomText.value = ''
    }

    const removeInitiativeRider = (index: number) => {
      if (monster.initiativeConfig.riders) {
        monster.initiativeConfig.riders.splice(index, 1)
      }
    }

    // Ensure portrait initialized
    const defaultPortrait = {
      url: '',
      position: 'none' as const,
      width: 220,
      caption: '',
    }
    const portrait = computed(() => monster.portrait || defaultPortrait)
    const portraitFile = ref<File | null>(null)

    const portraitPositions = [
      { label: 'None (Hidden)', value: 'none' },
      { label: 'Left of Statblock', value: 'left' },
      { label: 'Right of Statblock', value: 'right' },
    ]

    // Categorized & Alphabetically Sorted Dynamic Source Options
    const dynamicSourceOptions = [
      // Category: HP Fractions (Alphabetized)
      { label: '1/2 of Hit Points', value: 'half_hp', category: 'HP Fraction', icon: 'favorite', color: 'red-4' },
      { label: '1/4 of Hit Points', value: 'quarter_hp', category: 'HP Fraction', icon: 'favorite_border', color: 'red-4' },
      { label: '1/8 of Hit Points', value: 'eighth_hp', category: 'HP Fraction', icon: 'heart_broken', color: 'red-4' },
      // Category: Scaling & Dice (Alphabetized)
      { label: 'CR (Challenge Rating)', value: 'cr', category: 'Dice & Scaling', icon: 'grade', color: 'amber-6' },
      { label: 'Custom Formula (Expression)', value: 'custom_formula', category: 'Dice & Scaling', icon: 'calculate', color: 'cyan-4' },
      { label: 'Dice Roll Formula', value: 'dice', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
      { label: 'Flat Value', value: 'flat', category: 'Dice & Scaling', icon: 'pin', color: 'cyan-4' },
      { label: 'Hit Dice Count', value: 'hit_dice', category: 'Dice & Scaling', icon: 'layers', color: 'amber-4' },
      { label: 'Hit Dice Die Size (d8/d10)', value: 'hd_type', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
      { label: 'Proficiency Bonus (+PB)', value: 'proficiency', category: 'Dice & Scaling', icon: 'military_tech', color: 'amber-4' },
      { label: 'Twice Proficiency (+2x PB)', value: 'twice_proficiency', category: 'Dice & Scaling', icon: 'military_tech', color: 'amber-5' },
      // Category: Ability Modifiers (Alphabetized)
      { label: 'Charisma Modifier (CHA mod)', value: 'cha_mod', category: 'Ability Mod', icon: 'auto_awesome', color: 'purple-4' },
      { label: 'Constitution Modifier (CON mod)', value: 'con_mod', category: 'Ability Mod', icon: 'shield', color: 'purple-4' },
      { label: 'Dexterity Modifier (DEX mod)', value: 'dex_mod', category: 'Ability Mod', icon: 'bolt', color: 'purple-4' },
      { label: 'Intelligence Modifier (INT mod)', value: 'int_mod', category: 'Ability Mod', icon: 'psychology', color: 'purple-4' },
      { label: 'Strength Modifier (STR mod)', value: 'str_mod', category: 'Ability Mod', icon: 'fitness_center', color: 'purple-4' },
      { label: 'Wisdom Modifier (WIS mod)', value: 'wis_mod', category: 'Ability Mod', icon: 'visibility', color: 'purple-4' },
      // Category: Ability Scores (Alphabetized)
      { label: 'Charisma Score (CHA)', value: 'cha_score', category: 'Ability Score', icon: 'auto_awesome', color: 'teal-4' },
      { label: 'Constitution Score (CON)', value: 'con_score', category: 'Ability Score', icon: 'shield', color: 'teal-4' },
      { label: 'Dexterity Score (DEX)', value: 'dex_score', category: 'Ability Score', icon: 'bolt', color: 'teal-4' },
      { label: 'Intelligence Score (INT)', value: 'int_score', category: 'Ability Score', icon: 'psychology', color: 'teal-4' },
      { label: 'Strength Score (STR)', value: 'str_score', category: 'Ability Score', icon: 'fitness_center', color: 'teal-4' },
      { label: 'Wisdom Score (WIS)', value: 'wis_score', category: 'Ability Score', icon: 'visibility', color: 'teal-4' },
    ]

    const bloodiedSourceOptions = [
      { label: 'None (Hidden)', value: 'none', category: 'Disabled', icon: 'visibility_off', color: 'grey-5' },
      ...dynamicSourceOptions,
    ]

    const dtDrSourceOptions = [
      { label: 'Flat Value (or Empty for Disabled)', value: 'flat', category: 'Dice & Scaling', icon: 'pin', color: 'cyan-4' },
      ...dynamicSourceOptions.filter((o) => o.value !== 'flat'),
    ]

    const returnHpSourceOptions = [
      { label: '1 Hit Point', value: '1', category: 'Fixed', icon: 'looks_one', color: 'amber-4' },
      { label: 'Flat Value', value: 'flat', category: 'Fixed', icon: 'pin', color: 'cyan-4' },
      { label: '1/2 of Hit Points', value: 'half_hp', category: 'HP Fraction', icon: 'favorite', color: 'red-4' },
      { label: '1/4 of Hit Points', value: 'quarter_hp', category: 'HP Fraction', icon: 'favorite_border', color: 'red-4' },
      { label: '1/8 of Hit Points', value: 'eighth_hp', category: 'HP Fraction', icon: 'heart_broken', color: 'red-4' },
      { label: 'Dice Roll', value: 'dice', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
      { label: 'Dice Roll + CHA Modifier', value: 'dice_cha_mod', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
      { label: 'Dice Roll + CON Modifier', value: 'dice_con_mod', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
      { label: 'Dice Roll + WIS Modifier', value: 'dice_wis_mod', category: 'Dice & Scaling', icon: 'casino', color: 'amber-4' },
      { label: 'Hit Dice Count', value: 'hit_dice', category: 'Dice & Scaling', icon: 'layers', color: 'amber-4' },
      { label: 'Proficiency Bonus (+PB)', value: 'proficiency', category: 'Dice & Scaling', icon: 'military_tech', color: 'amber-4' },
      { label: 'Constitution Modifier (CON mod)', value: 'con_mod', category: 'Ability Mod', icon: 'shield', color: 'purple-4' },
      { label: 'Charisma Score (CHA)', value: 'cha_score', category: 'Ability Score', icon: 'auto_awesome', color: 'teal-4' },
      { label: 'Constitution Score (CON)', value: 'con_score', category: 'Ability Score', icon: 'shield', color: 'teal-4' },
      { label: 'Strength Score (STR)', value: 'str_score', category: 'Ability Score', icon: 'fitness_center', color: 'teal-4' },
      { label: 'Wisdom Score (WIS)', value: 'wis_score', category: 'Ability Score', icon: 'visibility', color: 'teal-4' },
    ]

    const deathPreventionRuleOptions = [
      { label: 'Returns to Life with X Hit Points', value: 'always_survives', category: 'Revival', icon: 'autorenew', color: 'positive' },
      { label: 'Returns upon Death Saving Throw Success', value: 'death_save_success', category: 'Revival', icon: 'favorite', color: 'teal-4' },
      { label: 'Upon death Deals Damage (Death Burst)', value: 'upon_death_burst', category: 'Death Burst', icon: 'flare', color: 'deep-orange-4' },
      { label: 'CON Save DC 5 + Damage Taken (Undead Fortitude)', value: 'dc_5_plus_dmg', category: 'Saving Throw', icon: 'shield', color: 'amber-4' },
      { label: 'Custom Saving Throw DC', value: 'custom_save', category: 'Saving Throw', icon: 'tune', color: 'amber-4' },
      { label: 'True Immortal (Hide HP on Statblock)', value: 'true_immortal', category: 'Immortality', icon: 'all_inclusive', color: 'purple-4' },
      { label: 'Until Hit by X Critical Hits (Hide HP)', value: 'until_x_crits', category: 'Immortality', icon: 'gavel', color: 'red-4' },
    ]

    const disruptionOptions = [
      { label: 'None', value: 'none', category: 'Standard', icon: 'check_circle_outline', color: 'grey-5' },
      // Category: Attacks & Weapons (Alphabetized)
      { label: 'Adamantine Weapons', value: 'adamantine', category: 'Weapon / Attack', icon: 'hardware', color: 'amber-4' },
      { label: 'Critical Hits', value: 'critical_hits', category: 'Weapon / Attack', icon: 'Flare', color: 'red-4' },
      { label: 'Magical Attacks', value: 'magical', category: 'Weapon / Attack', icon: 'auto_fix_high', color: 'purple-4' },
      { label: 'Silvered Weapons', value: 'silvered', category: 'Weapon / Attack', icon: 'colorize', color: 'blue-3' },
      // Category: Conditions (Alphabetized)
      { label: 'Incapacitated', value: 'incapacitated', category: 'Condition', icon: 'block', color: 'orange-4' },
      { label: 'Paralyzed', value: 'paralyzed', category: 'Condition', icon: 'accessibility_new', color: 'orange-4' },
      { label: 'Stunned', value: 'stunned', category: 'Condition', icon: 'Offline_bolt', color: 'orange-4' },
      { label: 'Unconscious', value: 'unconscious', category: 'Condition', icon: 'bedtime', color: 'orange-4' },
      // Category: Damage & Environment (Alphabetized)
      { label: 'Psychic Damage', value: 'psychic', category: 'Damage / Env', icon: 'psychology', color: 'pink-4' },
      { label: 'Radiant or Fire Damage', value: 'radiant_or_fire', category: 'Damage / Env', icon: 'local_fire_department', color: 'amber-5' },
      { label: 'Sunlight', value: 'sunlight', category: 'Damage / Env', icon: 'wb_sunny', color: 'yellow-6' },
      // Category: Custom
      { label: 'Custom Disruption', value: 'custom', category: 'Custom', icon: 'edit_note', color: 'cyan-4' },
    ]

    const frequencyOptions = [
      { label: 'None (Disabled)', value: 'none', category: 'Disabled', icon: 'block', color: 'grey-5' },
      // Category: Combat Turn Triggers (Alphabetized)
      { label: 'Did not take damage since the start of last turn', value: 'no_damage_taken', category: 'Combat Turn', icon: 'shield', color: 'teal-4' },
      { label: 'End of a turn', value: 'end_of_a_turn', category: 'Combat Turn', icon: 'schedule', color: 'teal-4' },
      { label: 'End of current turn', value: 'end_of_current_turn', category: 'Combat Turn', icon: 'update', color: 'teal-4' },
      { label: 'End of its turn', value: 'turn_end', category: 'Combat Turn', icon: 'schedule', color: 'teal-4' },
      { label: 'Start of a turn', value: 'start_of_a_turn', category: 'Combat Turn', icon: 'play_circle', color: 'teal-4' },
      { label: 'Start of its turn', value: 'turn_start', category: 'Combat Turn', icon: 'bolt', color: 'teal-4' },
      { label: 'When taking damage of selected type', value: 'damage_taken', category: 'Combat Turn', icon: 'flash_on', color: 'amber-4' },
      // Category: Time & Cycle (Alphabetized)
      { label: 'At Dawn', value: 'dawn', category: 'Solar Cycle', icon: 'wb_twilight', color: 'amber-4' },
      { label: 'At Dusk', value: 'dusk', category: 'Solar Cycle', icon: 'nights_stay', color: 'deep-orange-4' },
      { label: 'At Midday', value: 'midday', category: 'Solar Cycle', icon: 'wb_sunny', color: 'yellow-6' },
      { label: 'At Midnight', value: 'midnight', category: 'Solar Cycle', icon: 'bedtime', color: 'indigo-4' },
      { label: 'Every Day', value: 'day', category: 'Time Interval', icon: 'today', color: 'blue-4' },
      { label: 'Every Hour', value: 'hour', category: 'Time Interval', icon: 'hourglass_bottom', color: 'blue-4' },
      { label: 'Every Minute', value: 'minute', category: 'Time Interval', icon: 'timer', color: 'blue-4' },
      // Category: Rest & Downtime (Alphabetized)
      { label: 'On a Long Rest', value: 'long_rest', category: 'Rest & Downtime', icon: 'hotel', color: 'purple-4' },
      { label: 'On a Short Rest', value: 'short_rest', category: 'Rest & Downtime', icon: 'coffee', color: 'purple-4' },
      { label: 'On Downtime', value: 'downtime', category: 'Rest & Downtime', icon: 'weekend', color: 'purple-4' },
    ]

    // Decoupled Invulnerability: 3 Core Rules + Combinable N Conditions
    const invulnerabilityRuleOptions = [
      { label: 'None', value: 'none', category: 'Disabled', icon: 'block', color: 'grey-5' },
      { label: 'Only "X" can Hit You', value: 'only_x_can_hit', category: 'Core Rule', icon: 'security', color: 'purple-4' },
      { label: 'Takes damage only from "X"', value: 'takes_damage_only_from', category: 'Core Rule', icon: 'gpp_good', color: 'amber-4' },
    ]

    const invulnerabilityConditionOptions = [
      // Category: Attack & Hit Qualifiers (Alphabetized)
      { label: 'Attacker must succeed on Saving Throw DC X to Hit', value: 'attacker_save', category: 'Attack Qualifier', icon: 'psychology_alt', color: 'amber-4' },
      { label: 'Attacker that did not attack you since previous turn', value: 'different_attacker', category: 'Attack Qualifier', icon: 'person_off', color: 'purple-4' },
      { label: 'Attacks with Advantage', value: 'attacks_with_advantage', category: 'Attack Qualifier', icon: 'trending_up', color: 'positive' },
      { label: 'Critical Hits', value: 'critical_hits', category: 'Attack Qualifier', icon: 'flare', color: 'red-4' },
      { label: 'First X attacks in a round Miss you', value: 'first_x_attacks_miss', category: 'Attack Qualifier', icon: 'filter_1', color: 'cyan-4' },
      { label: 'Nth attack in a round (e.g. 3rd attack)', value: 'nth_attack_in_round', category: 'Attack Qualifier', icon: 'format_list_numbered', color: 'cyan-4' },
      { label: 'Turn critical Hits into normal hits', value: 'turn_crits_to_normal', category: 'Attack Qualifier', icon: 'published_with_changes', color: 'orange-4' },
      // Category: Creature & Alignment Qualifiers (Alphabetized)
      { label: 'X Aligned creatures (Specify Alignment)', value: 'alignment', category: 'Creature Qualifier', icon: 'balance', color: 'indigo-4' },
      // Category: Damage & Weapon Qualifiers (Alphabetized)
      { label: 'Adamantine weapons', value: 'adamantine_weapons', category: 'Weapon / Damage', icon: 'hardware', color: 'amber-5' },
      { label: 'Different damage type from last taken', value: 'different_damage_type', category: 'Weapon / Damage', icon: 'shuffle', color: 'teal-4' },
      { label: 'Magical weapons or spells', value: 'magical_weapons', category: 'Weapon / Damage', icon: 'auto_fix_high', color: 'purple-3' },
      { label: 'Silvered weapons', value: 'silvered_weapons', category: 'Weapon / Damage', icon: 'colorize', color: 'blue-3' },
      { label: 'Specific damage types', value: 'specific_damage_types', category: 'Weapon / Damage', icon: 'local_fire_department', color: 'deep-orange-4' },
      // Category: Disruptions & Counters (Alphabetized)
      { label: 'Disrupted by Acid damage', value: 'disrupted_by_acid', category: 'Disruption & Counter', icon: 'science', color: 'light-green-4' },
      { label: 'Disrupted by Adamantine weapons', value: 'disrupted_by_adamantine', category: 'Disruption & Counter', icon: 'hardware', color: 'blue-grey-4' },
      { label: 'Disrupted by Fire damage', value: 'disrupted_by_fire', category: 'Disruption & Counter', icon: 'local_fire_department', color: 'deep-orange-4' },
      { label: 'Disrupted by Force damage', value: 'disrupted_by_force', category: 'Disruption & Counter', icon: 'blur_on', color: 'indigo-4' },
      { label: 'Disrupted by Holy Water', value: 'disrupted_by_holy_water', category: 'Disruption & Counter', icon: 'water_drop', color: 'light-blue-4' },
      { label: 'Disrupted by Incapacitated', value: 'disrupted_by_incapacitated', category: 'Disruption & Counter', icon: 'error_outline', color: 'red-4' },
      { label: 'Disrupted by Magical attacks', value: 'disrupted_by_magical', category: 'Disruption & Counter', icon: 'auto_fix_high', color: 'purple-4' },
      { label: 'Disrupted by Paralyzed', value: 'disrupted_by_paralyzed', category: 'Disruption & Counter', icon: 'do_not_disturb_on', color: 'red-4' },
      { label: 'Disrupted by Radiant damage', value: 'disrupted_by_radiant', category: 'Disruption & Counter', icon: 'wb_sunny', color: 'amber-4' },
      { label: 'Disrupted by Silvered weapons', value: 'disrupted_by_silvered', category: 'Disruption & Counter', icon: 'colorize', color: 'blue-grey-3' },
      { label: 'Disrupted by Stunned', value: 'disrupted_by_stunned', category: 'Disruption & Counter', icon: 'bolt', color: 'red-4' },
      { label: 'Disrupted by Sunlight', value: 'disrupted_by_sunlight', category: 'Disruption & Counter', icon: 'light_mode', color: 'yellow-5' },
      { label: 'Disrupted by Unconscious', value: 'disrupted_by_unconscious', category: 'Disruption & Counter', icon: 'bedtime', color: 'red-4' },
      // Category: State & Movement Conditions (Alphabetized)
      { label: 'While not in Sunlight', value: 'not_in_sunlight', category: 'State Condition', icon: 'wb_twilight', color: 'yellow-6' },
      { label: 'While not Incapacitated', value: 'not_incapacitated', category: 'State Condition', icon: 'verified_user', color: 'blue-4' },
      { label: 'While not Paralyzed', value: 'not_paralyzed', category: 'State Condition', icon: 'accessibility_new', color: 'blue-4' },
      { label: 'While not Stunned', value: 'not_stunned', category: 'State Condition', icon: 'bolt', color: 'blue-4' },
      { label: 'While not Unconscious', value: 'not_unconscious', category: 'State Condition', icon: 'visibility', color: 'blue-4' },
      { label: "While your speed isn't 0", value: 'speed_not_zero', category: 'State Condition', icon: 'directions_run', color: 'green-4' },
    ]

    const regenConditionModifierOptions = [
      { label: 'Standard Minimalist Notation', value: 'none', category: 'Standard', icon: 'favorite', color: 'teal-4' },
      { label: 'If took no damage since previous turn', value: 'no_damage_since_previous_turn', category: 'Turn Trigger', icon: 'verified_user', color: 'green-4' },
      { label: 'If your head is not severed', value: 'head_not_severed', category: 'Anatomy / Survival', icon: 'face', color: 'blue-4' },
      { label: 'Reduces maximum hit points until rest', value: 'max_hp_reduction', category: 'Max HP Reduction', icon: 'trending_down', color: 'deep-orange-4' },
      { label: 'While not Bloodied', value: 'not_bloodied', category: 'State', icon: 'warning', color: 'red-4' },
      { label: 'Of temp HP if you have temp HP', value: 'has_temp_hp', category: 'Temp HP Condition', icon: 'shield', color: 'cyan-4' },
    ]

    // AC Compositor Configuration & Heuristics
    const acConfig = computed<MonsterAcConfig>(() => {
      return monster.acConfig || defaultAcConfig
    })

    const acBaseOptions = [
      { label: 'Current Flat AC', value: 'flat', category: 'Standard', icon: 'numbers', color: 'blue-4' },
      { label: '10 + DEX (Unarmored)', value: '10', category: 'Standard', icon: 'accessibility', color: 'blue-4' },
      { label: 'Leather Armor (11 + DEX)', value: 'leather', category: 'Light Armor', icon: 'shield', color: 'brown-4' },
      { label: 'Studded Leather (12 + DEX)', value: 'studded_leather', category: 'Light Armor', icon: 'shield', color: 'brown-4' },
      { label: 'Hide (12 + DEX max 2)', value: 'hide', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
      { label: 'Chain Shirt (13 + DEX max 2)', value: 'chain_shirt', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
      { label: 'Scale Mail (14 + DEX max 2)', value: 'scale_mail', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
      { label: 'Breastplate (14 + DEX max 2)', value: 'breastplate', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
      { label: 'Half Plate (15 + DEX max 2)', value: 'half_plate', category: 'Medium Armor', icon: 'shield', color: 'orange-4' },
      { label: 'Ring Mail (14)', value: 'ring_mail', category: 'Heavy Armor', icon: 'shield', color: 'grey-7' },
      { label: 'Chain Mail (16)', value: 'chain_mail', category: 'Heavy Armor', icon: 'shield', color: 'grey-7' },
      { label: 'Splint (17)', value: 'splint', category: 'Heavy Armor', icon: 'shield', color: 'grey-7' },
      { label: 'Plate (18)', value: 'plate', category: 'Heavy Armor', icon: 'shield', color: 'amber-6' },
      { label: 'Arcane Armor (13 + INT/DEX)', value: 'arcane_armor', category: 'Special', icon: 'auto_fix_high', color: 'purple-4' },
      { label: 'Strength Score as AC', value: 'str_score', category: 'Ability Scores', icon: 'fitness_center', color: 'red-4' },
      { label: 'Dexterity Score as AC', value: 'dex_score', category: 'Ability Scores', icon: 'directions_run', color: 'green-4' },
      { label: 'Constitution Score as AC', value: 'con_score', category: 'Ability Scores', icon: 'favorite', color: 'amber-4' },
      { label: 'Intelligence Score as AC', value: 'int_score', category: 'Ability Scores', icon: 'school', color: 'blue-4' },
      { label: 'Wisdom Score as AC', value: 'wis_score', category: 'Ability Scores', icon: 'psychology', color: 'teal-4' },
      { label: 'Charisma Score as AC', value: 'cha_score', category: 'Ability Scores', icon: 'record_voice_over', color: 'purple-4' },
    ]

    const acAbilityBonusOptions = [
      { label: 'None', value: 'none', category: 'None', icon: 'block', color: 'grey-5' },
      { label: 'STR Modifier', value: 'STR', category: 'Ability Score', icon: 'fitness_center', color: 'red-4' },
      { label: 'DEX Modifier', value: 'DEX', category: 'Ability Score', icon: 'directions_run', color: 'green-4' },
      { label: 'CON Modifier', value: 'CON', category: 'Ability Score', icon: 'favorite', color: 'amber-4' },
      { label: 'INT Modifier', value: 'INT', category: 'Ability Score', icon: 'school', color: 'blue-4' },
      { label: 'WIS Modifier', value: 'WIS', category: 'Ability Score', icon: 'psychology', color: 'teal-4' },
      { label: 'CHA Modifier', value: 'CHA', category: 'Ability Score', icon: 'record_voice_over', color: 'purple-4' },
      { label: 'Proficiency Bonus (+PB)', value: 'pb', category: 'Proficiency & Level', icon: 'military_tech', color: 'amber-5' },
      { label: 'Monster Level', value: 'level', category: 'Proficiency & Level', icon: 'military_tech', color: 'amber-5' },
      { label: 'CR (Challenge Rating)', value: 'cr', category: 'Proficiency & Level', icon: 'grade', color: 'amber-6' },
      { label: 'Hit Dice Count', value: 'hd', category: 'Hit Dice', icon: 'casino', color: 'cyan-4' },
    ]

    const acDefenseItemOptions = [
      { label: 'None', value: 'none', category: 'None', icon: 'block', color: 'grey-5' },
      { label: 'Shield (+2)', value: 'shield', category: 'Shield', icon: 'shield', color: 'blue-4' },
      { label: 'Animated Shield (+2)', value: 'animated_shield', category: 'Magic Shield', icon: 'auto_awesome', color: 'purple-4' },
      { label: 'Cloak of Protection (+1)', value: 'cloak_of_protection', category: 'Wondrous Item', icon: 'dry_cleaning', color: 'teal-4' },
      { label: 'Ring of Protection (+1)', value: 'ring_of_protection', category: 'Ring', icon: 'circle', color: 'amber-4' },
      { label: 'Defender (+3)', value: 'defender', category: 'Magic Weapon', icon: 'colorize', color: 'deep-orange-4' },
      { label: 'Bracers of Defense (+2)', value: 'bracers_of_defense', category: 'Wondrous Item', icon: 'front_hand', color: 'green-4' },
      { label: 'Custom Magic Item', value: 'custom', category: 'Custom', icon: 'star', color: 'amber-5' },
    ]

    const acTemporaryOptions = [
      { label: 'None', value: 'none', category: 'None', icon: 'block', color: 'grey-5' },
      { label: 'Spell: Shield (+5)', value: 'spell_shield', category: 'Spells', icon: 'shield', color: 'indigo-4' },
      { label: 'Spell: Shield of Faith (+2)', value: 'spell_shield_of_faith', category: 'Spells', icon: 'auto_fix_high', color: 'amber-4' },
      { label: 'Parry (+PB)', value: 'parry_pb', category: 'Reactions', icon: 'sports_kabaddi', color: 'red-4' },
      { label: 'Parry (+2)', value: 'parry_custom', category: 'Reactions', icon: 'sports_kabaddi', color: 'red-4' },
    ]

    const acConditionalOptions = [
      { label: 'None', value: 'none', category: 'None', icon: 'block', color: 'grey-5' },
      { label: '+2 to attacks beyond 1st until next turn', value: 'all_attacks_beyond_first', category: 'Sequential Attacks', icon: 'trending_up', color: 'green-4' },
      { label: '+2 to first 2 attacks each round', value: 'first_y_attacks', category: 'Round Attacks', icon: 'filter_2', color: 'cyan-4' },
    ]

    const acDefensiveMechanicOptions = [
      { label: 'None (Standard AC)', value: 'none', category: 'Standard', icon: 'shield', color: 'grey-5' },
      { label: 'Versus Creature Type (e.g. Undead, Fiends)', value: 'creature_type', category: 'Creature Type Defenses', icon: 'cruelty_free', color: 'purple-4' },
      { label: 'Versus Attack Type (e.g. Ranged, Spell Attacks)', value: 'attack_type', category: 'Attack Type Defenses', icon: 'gps_fixed', color: 'teal-4' },
      { label: 'Versus Damage Type (e.g. Lightning, Thunder, Force)', value: 'damage_type', category: 'Damage Defenses', icon: 'bolt', color: 'amber-5' },
      { label: 'If It Has Temporary Hit Points', value: 'has_temp_hp', category: 'Health Thresholds', icon: 'add_moderator', color: 'cyan-4' },
      { label: 'If It took Damage since Timeframe', value: 'took_damage_since', category: 'Damage Defenses', icon: 'ac_unit', color: 'light-blue-4' },
      { label: 'If In Light Level (Bright Light, Daylight, etc.)', value: 'in_light', category: 'Environment Defenses', icon: 'wb_sunny', color: 'yellow-7' },
      { label: 'If Bloodied (Higher or Lower AC)', value: 'bloodied', category: 'Health Thresholds', icon: 'bloodtype', color: 'red-4' },
      { label: 'Parry (Reaction: +PB / +X)', value: 'parry', category: 'Reaction Defenses', icon: 'sports_kabaddi', color: 'cyan-4' },
      { label: 'Without Advantage (e.g. AC 30 without Advantage)', value: 'without_advantage', category: 'Advantage Qualifiers', icon: 'trending_up', color: 'purple-4' },
      { label: 'Attacks Without Advantage Miss You', value: 'no_advantage_misses', category: 'Advantage Qualifiers', icon: 'visibility_off', color: 'purple-4' },
      { label: 'Versus Damage Types (Force, Lightning, Thunder + Miss Reflection)', value: 'versus_damage_types', category: 'Damage Defenses', icon: 'bolt', color: 'amber-5' },
      { label: 'Attacker Save DC to Hit Automatically', value: 'attacker_save', category: 'Absolute Rules', icon: 'psychology_alt', color: 'amber-4' },
      { label: 'Only Hit by Critical Hits', value: 'only_crits', category: 'Absolute Rules', icon: 'flare', color: 'red-4' },
      { label: 'Only Hit by Magical Attacks', value: 'only_magical', category: 'Absolute Rules', icon: 'auto_awesome', color: 'deep-purple-4' },
      { label: 'Only Hit by Adamantine or Silvered Weapons', value: 'only_adamantine_silver', category: 'Absolute Rules', icon: 'hardware', color: 'blue-grey-4' },
      { label: 'While Cursed (e.g. AC 13 while Cursed)', value: 'while_cursed', category: 'Condition / State', icon: 'coronavirus', color: 'deep-orange-4' },
      { label: 'Near Non-Incapacitated Allied Creature', value: 'near_ally', category: 'Proximity Defenses', icon: 'group', color: 'green-4' },
      { label: 'While Moving (+X AC)', value: 'while_moving', category: 'Movement Defenses', icon: 'directions_run', color: 'blue-4' },
      { label: 'Per 10 ft Moved This Turn (+1 per 10 ft)', value: 'per_distance_moved', category: 'Movement Defenses', icon: 'speed', color: 'blue-4' },
      { label: 'While Bloodied (Higher or Lower AC)', value: 'while_bloodied', category: 'Health Thresholds', icon: 'bloodtype', color: 'red-4' },
      { label: 'Within 10 ft of an Ally', value: 'while_within_ally', category: 'Proximity Defenses', icon: 'people', color: 'green-4' },
      { label: 'Within 5 ft of a Shield Bearer', value: 'while_within_shield_bearer', category: 'Proximity Defenses', icon: 'shield', color: 'green-4' },
      { label: 'While Prone (Reduced AC)', value: 'while_prone', category: 'Condition / State', icon: 'airline_seat_flat', color: 'orange-4' },
      { label: 'Shield Spell (+5 Reaction)', value: 'shield_spell', category: 'Spell Buffs', icon: 'shield', color: 'cyan-4' },
      { label: 'Shield of Faith (+2)', value: 'shield_of_faith', category: 'Spell Buffs', icon: 'church', color: 'amber-4' },
      { label: 'Against Ranged Attacks (+X)', value: 'ranged_attacks', category: 'Attack Type Defenses', icon: 'gps_fixed', color: 'teal-4' },
      { label: 'Against Melee Attacks (+X)', value: 'melee_attacks', category: 'Attack Type Defenses', icon: 'sports_martial_arts', color: 'teal-4' },
      { label: 'Attacks from More Than 30 ft Away', value: 'distance_away', category: 'Distance Defenses', icon: 'straighten', color: 'indigo-4' },
      { label: 'First Attack Each Round', value: 'first_attack_each_round', category: 'Turn & Round Defenses', icon: 'filter_1', color: 'blue-4' },
      { label: 'Attacks Beyond the First Each Turn', value: 'attacks_beyond_first', category: 'Turn & Round Defenses', icon: 'filter_2', color: 'blue-4' },
      { label: 'Against Spell Attacks', value: 'spell_attacks', category: 'Attack Type Defenses', icon: 'auto_fix_high', color: 'purple-4' },
      { label: 'From Behind or Flanking (Reduced AC)', value: 'behind_flanking', category: 'Positioning Defenses', icon: 'low_priority', color: 'deep-orange-4' },
      { label: 'Per Hostile Creature within 5 ft (+X, max +Y)', value: 'per_hostile', category: 'Proximity Defenses', icon: 'groups', color: 'red-4' },
      { label: 'Per Creature Grappling It (-X per grappler)', value: 'per_grappler', category: 'Condition / State', icon: 'pan_tool', color: 'orange-4' },
      { label: 'While Flying', value: 'while_flying', category: 'Movement Defenses', icon: 'flight', color: 'light-blue-4' },
      { label: 'While Underwater', value: 'while_underwater', category: 'Environment Defenses', icon: 'scuba_diving', color: 'cyan-4' },
      { label: 'In Bright Light', value: 'in_bright_light', category: 'Environment Defenses', icon: 'wb_sunny', color: 'yellow-7' },
      { label: 'In Dim Light or Darkness', value: 'in_darkness', category: 'Environment Defenses', icon: 'dark_mode', color: 'indigo-4' },
      { label: 'Versus Bludgeoning, Piercing, or Slashing', value: 'versus_bps', category: 'Damage Defenses', icon: 'shield', color: 'brown-4' },
      { label: 'Versus Aberrations, Celestials, or Fiends', value: 'versus_creature_types', category: 'Creature Type Defenses', icon: 'cruelty_free', color: 'purple-4' },
      { label: 'While Concentrating on a Spell', value: 'while_concentrating', category: 'Spell Buffs', icon: 'self_improvement', color: 'teal-4' },
      { label: 'While Asleep or Unconscious', value: 'asleep_unconscious', category: 'Condition / State', icon: 'bedtime', color: 'grey-7' },
      { label: 'Ranged Misses Reflect Back at Attacker', value: 'miss_reflects', category: 'Reflection Defenses', icon: 'replay', color: 'cyan-4' },
      { label: 'Custom Defensive Condition...', value: 'custom', category: 'Custom', icon: 'edit_note', color: 'cyan-4' },
    ]

    const needsSecondaryAc = computed(() => {
      const m = acConfig.value.conditionMode
      return [
        'parry', 'without_advantage', 'versus_damage_types', 'damage_type', 'while_cursed', 'near_ally',
        'while_moving', 'while_bloodied', 'bloodied', 'while_within_ally', 'while_within_shield_bearer',
        'while_prone', 'shield_spell', 'shield_of_faith', 'ranged_attacks', 'melee_attacks',
        'distance_away', 'first_attack_each_round', 'attacks_beyond_first', 'spell_attacks',
        'behind_flanking', 'while_flying', 'while_underwater', 'in_bright_light', 'in_daylight', 'in_darkness', 'in_light',
        'versus_bps', 'versus_creature_types', 'creature_type', 'attack_type', 'has_temp_hp', 'took_damage_since',
        'while_concentrating', 'asleep_unconscious'
      ].includes(m || '')
    })

    const creatureTypeOptions = [
      'Aberrations',
      'Beasts',
      'Celestials',
      'Constructs',
      'Dragons',
      'Elementals',
      'Fey',
      'Fiends',
      'Giants',
      'Humanoids',
      'Monstrosities',
      'Oozes',
      'Plants',
      'Undead',
    ]

    const attackTypeOptions = [
      'Ranged Attacks',
      'Melee Attacks',
      'Spell Attacks',
      'Weapon Attacks',
      'Ranged Spell Attacks',
      'Melee Spell Attacks',
      'Ranged Weapon Attacks',
      'Melee Weapon Attacks',
    ]

    const saveDcSourceOptions = [
      { label: 'Spell Save DC (Calculated from Spellcasting)', value: 'spell_save_dc' },
      { label: 'Special Ability DC (8 + PB + Stat)', value: 'special_save_dc' },
      { label: '8 + PB + STR DC', value: '8_plus_pb_str' },
      { label: '8 + PB + DEX DC', value: '8_plus_pb_dex' },
      { label: '8 + PB + CON DC', value: '8_plus_pb_con' },
      { label: '8 + PB + INT DC', value: '8_plus_pb_int' },
      { label: '8 + PB + WIS DC', value: '8_plus_pb_wis' },
      { label: '8 + PB + CHA DC', value: '8_plus_pb_cha' },
      { label: '8 + 2x PB + Stat (Legendary Save DC)', value: '8_plus_2x_pb' },
      { label: '10 + PB + Stat (Epic DC)', value: '10_plus_pb' },
      { label: '8 + PB + CR (CR Scaled DC)', value: 'cr_based' },
      { label: 'Custom Flat / Formula DC', value: 'custom' },
    ]

    const saveDcPresetOptions = [
      '10', '12', '13', '14', '15', '16', '17', '18', '19', '20', '22', '25', '30'
    ]

    const dtPresetOptions = ['5', '10', '15', '20', '25', '30', '50']
    const drPresetOptions = ['2', '3', '5', '8', '10', '15', '20']
    const damageAmountPresets = ['3', '5', '8', '10', '13', '15', '20', '25', '30', '38', '50']
    const secondaryAcPresetOptions = [
      '12', '13', '14', '15', '16', '17', '18', '19', '20', '22', '25', '30'
    ]

    const lightLevelOptions = [
      'Bright Light',
      'Daylight',
      'Dim Light',
      'Darkness',
      'Magical Darkness',
    ]

    const onMissOptions = [
      { label: 'None', value: 'none' },
      { label: 'Hits the Attacker Instead', value: 'hits_attacker' },
      { label: 'Hits Target within its Range', value: 'hits_target_range' },
      { label: 'Hits another creature within Distance', value: 'hits_target_feet' },
      { label: 'Attacker takes Damage', value: 'damage_attacker' },
      { label: 'Knocks Prone', value: 'knocks_prone' },
    ]

    const onHitOptions = [
      { label: 'None', value: 'none' },
      { label: 'Attacker takes Damage', value: 'damage_attacker' },
      { label: 'Attacker Knocks Prone', value: 'knocks_prone' },
      { label: 'Can make a Melee Attack as a Reaction', value: 'retaliate_melee' },
    ]

    const calculateCompositorAc = (): { totalAc: number; typeDescription: string } => {
      const res = composeAcAndDefenses(monster)
      return { totalAc: res.totalAc, typeDescription: res.armorTypeDesc }
    }

    const computedCompositorAc = computed(() => calculateCompositorAc().totalAc)
    const computedCompositorType = computed(() => calculateCompositorAc().typeDescription)

    const onAcCompositorChanged = () => {
      const cfg = ensureAcConfig()
      cfg.enabled = true
      const res = composeAcAndDefenses(monster)
      monster.AC = res.totalAc
      if (res.armorTypeDesc) {
        monster.ACType = res.armorTypeDesc
      }
    }

    // Keep the legacy base AC projection current when a formula source changes.
    // An explicitly disabled compositor keeps ownership of its manual AC.
    watch(() => JSON.stringify(monster.acConfig), () => {
      if (monster.acConfig?.enabled && Object.keys(monster.bindings || {}).some((path) => path.startsWith('acConfig.'))) {
        onAcCompositorChanged()
      }
    }, { immediate: true })

    const clearHpThreshold = (field: 'damageThreshold' | 'damageReduction') => {
      monster.clearBinding(`extendedHp.${field}`)
      extendedHp.value[field] = null
    }

    const recoveryTypeOptions = [
      { label: 'Absorb Damage as Hit Points', value: 'absorb_hp', category: 'Absorption', icon: 'flash_on', color: 'amber-4' },
      { label: 'Absorb Damage as Temp HP', value: 'absorb_temp_hp', category: 'Absorption', icon: 'shield', color: 'amber-4' },
      { label: 'Gain Temporary Hit Points', value: 'temp_hp', category: 'Temp HP', icon: 'add_moderator', color: 'cyan-4' },
      { label: 'Regain Hit Points (Regeneration)', value: 'regen', category: 'Healing', icon: 'favorite', color: 'teal-4' },
    ]

    const unifiedTriggerConditionOptions = frequencyOptions

    const getDynamicSourceValue = (source: string | undefined, diceFormula?: string): string => {
      return resolveDynamicNumericSource(source, 10, diceFormula, {
        avgHp: monster.avgHp,
        proficiency: monster.proficiency,
        hd: monster.HP.HD,
        hdType: monster.HP.type,
        stats: monster.stats as unknown as Record<string, number>,
      })
    }

    const timeframeOptions = [
      'The Start Of Its Last Turn',
      'The End Of Its Last Turn',
      'The Start Of Its Current Turn',
      'The End Of Its Current Turn',
      'Its Last Turn',
    ]

    const displayModeOptions = [
      { label: 'Both (Near HP & in Traits)', value: 'both' },
      { label: 'Minimalist Only (Near HP)', value: 'minimalist' },
      { label: 'Detailed Only (In Traits)', value: 'detailed' },
    ]

    const deathPreventionTemplates = [
      'Mortal',
      'Immortal',
      'Undead Fortitude',
      'Relentless Endurance',
      'Death Ward',
      'Custom',
    ]

    watch(() => portrait.value.position, (pos) => {
      if (pos === 'none') {
        editorStore.a4Layout = 'statblock_only'
      } else if (pos === 'top' || pos === 'bottom') {
        editorStore.a4Layout = 'stacked'
      } else if (pos === 'left' || pos === 'right') {
        editorStore.a4Layout = 'side_by_side'
      }
    })

    const onPortraitFileSelected = (file: File | null) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          portrait.value.url = e.target.result
          if (portrait.value.position === 'none') {
            portrait.value.position = 'right'
          }
        }
      }
      reader.readAsDataURL(file)
    }

    const computedBloodiedHp = computed(() => {
      if (extendedHp.value.bloodiedOverride && extendedHp.value.bloodiedOverride > 0) {
        return extendedHp.value.bloodiedOverride
      }
      const total = avgHP(monster.HP)
      return Math.max(1, Math.floor(total / 2))
    })

    const regenPreview = computed(() => {
      return formatMinimalistRegen(extendedHp.value.regeneration, {
        avgHp: monster.avgHp,
        proficiency: monster.proficiency,
        hd: monster.HP.HD,
        hdType: monster.HP.type,
        stats: monster.stats as unknown as Record<string, number>,
      })
    })

    const deathPreventionPreview = computed(() => {
      return formatMinimalistDeathPrevention(deathPrevention.value, {
        avgHp: monster.avgHp,
        proficiency: monster.proficiency,
        hd: monster.HP.HD,
        hdType: monster.HP.type,
        stats: monster.stats as unknown as Record<string, number>,
      })
    })

    if (!monster.paragonConfig) {
      monster.paragonConfig = {
        enabled: false,
        poolCount: 1,
        poolHp: [],
        initiativeStep: 'Initiative 20 & 10',
        enrageNote: '',
        transitionEffect: '',
        phaseName: 'Phase',
        bloodiedPerPhase: [],
        phaseConfigs: [],
      }
    }
    if (!monster.specialCommunicationArchetype) {
      monster.specialCommunicationArchetype = 'none'
    }

    const defaultSourcesByIdx = ['half_hp', 'quarter_hp', 'eighth_hp']

    const ensureParagonPhaseConfigs = () => {
      const p = monster.paragonConfig
      if (!p) return []
      const count = Math.max(1, p.poolCount || 1)
      if (count <= 1) {
        p.enabled = false
        return []
      }
      p.enabled = true
      const pName = p.phaseName?.trim() || 'Phase'
      if (!Array.isArray(p.phaseConfigs)) {
        p.phaseConfigs = []
      }
      while (p.phaseConfigs.length < count) {
        const idx = p.phaseConfigs.length
        p.phaseConfigs.push({
          name: idx === count - 1 ? 'Final' : `${pName} ${idx + 2}`,
          source: (defaultSourcesByIdx[idx] || 'flat') as ParagonPhaseConfig['source'],
          hpOverride: p.bloodiedPerPhase?.[idx] ?? null,
          diceFormula: '4d10',
          initiativeBonus: (idx + 1) * 10,
        })
      }
      if (p.phaseConfigs.length > count) {
        p.phaseConfigs.splice(count)
      }
      // Re-sequence auto-generated names to eliminate duplicate 'Final'
      p.phaseConfigs.forEach((cfg, idx) => {
        const isAuto = !cfg.name || cfg.name === 'Final' || /^Phase \d+$/i.test(cfg.name) || /^Stage \d+$/i.test(cfg.name) || /^Pool \d+$/i.test(cfg.name)
        if (isAuto) {
          cfg.name = idx === count - 1 ? 'Final' : `${pName} ${idx + 2}`
        }
      })
      return p.phaseConfigs
    }

    const isLastBloodiedPhase = (pIdx: number): boolean => {
      const p = monster.paragonConfig
      if (!p || !Array.isArray(p.phaseConfigs)) return false
      if (!p.phaseConfigs[pIdx]?.isBloodied) return false
      for (let i = pIdx + 1; i < p.phaseConfigs.length; i++) {
        if (p.phaseConfigs[i]?.isBloodied) return false
      }
      return true
    }

    const paragonPhaseRows = computed<ParagonPhaseConfig[]>(() => {
      return ensureParagonPhaseConfigs()
    })

    const bloodiedAtPhaseOptions = computed(() => {
      const opts = [
        { label: 'Standard Bloodied (50% HP)', value: 'half_total' },
      ]
      paragonPhaseRows.value.forEach((cfg) => {
        if (cfg.name) {
          opts.push({ label: `At ${cfg.name}`, value: cfg.name })
        }
      })
      return opts
    })

    const resolvePhaseRowPreview = (cfg: ParagonPhaseConfig): string => {
      if (cfg.hpOverride != null && cfg.hpOverride > 0 && cfg.source === 'flat') {
        return `${cfg.hpOverride}`
      }
      return resolveDynamicNumericSource(cfg.source || 'half_hp', cfg.hpOverride ?? 10, cfg.diceFormula, {
        avgHp: monster.avgHp,
        proficiency: monster.proficiency,
        hd: monster.HP.HD,
        hdType: monster.HP.type,
        stats: monster.stats as unknown as Record<string, number>,
      })
    }

    const onTogglePhaseBloodied = (pIdx: number, val: boolean) => {
      const p = monster.paragonConfig
      if (!p || !Array.isArray(p.phaseConfigs)) return
      if (val) {
        // Checking phase pIdx cascades to phase pIdx and all subsequent phases beneath it
        for (let i = pIdx; i < p.phaseConfigs.length; i++) {
          p.phaseConfigs[i].isBloodied = true
        }
      } else {
        // Unchecking phase pIdx clears phases 0..pIdx so only later phases remain bloodied
        for (let i = 0; i <= pIdx; i++) {
          if (p.phaseConfigs[i]) p.phaseConfigs[i].isBloodied = false
        }
      }
      syncParagonPhaseRows()
    }

    const syncParagonPhaseRows = () => {
      const p = monster.paragonConfig
      if (!p || !Array.isArray(p.phaseConfigs)) return
      p.bloodiedPerPhase = p.phaseConfigs.map((cfg) => Number(resolvePhaseRowPreview(cfg)) || 10)
    }

    const updateParagonPoolHp = () => {
      const p = monster.paragonConfig
      if (!p) return
      const count = Math.max(1, p.poolCount || 1)
      if (count <= 1) {
        p.enabled = false
        p.poolHp = []
        p.phaseConfigs = []
        p.bloodiedPerPhase = []
        return
      }
      p.enabled = true
      const each = Math.max(1, Math.floor(monster.avgHp / count))
      p.poolHp = Array(count).fill(each)
      ensureParagonPhaseConfigs()
      syncParagonPhaseRows()
    }

    // A bound pool count can change when its source changes, without another
    // Apply click. Reconcile only a mismatched topology; loading matching saved
    // phase rows must retain their authored HP and names.
    watch(() => monster.paragonConfig?.poolCount, (count) => {
      if (!monster.bindings?.['paragonConfig.poolCount']) return
      const p = monster.paragonConfig
      const expectedRows = count > 1 ? count : 0
      if (p && p.phaseConfigs?.length !== expectedRows) updateParagonPoolHp()
    }, { immediate: true })

    const computedParagonPoolSummary = computed(() => {
      const p = monster.paragonConfig
      if (!p || !p.enabled || (p.poolCount || 1) <= 1) return ''
      const count = p.poolCount || 2
      if (Array.isArray(p.phaseConfigs) && p.phaseConfigs.length > 0) {
        return p.phaseConfigs.map((cfg) => `${cfg.name}: ${resolvePhaseRowPreview(cfg)} HP`).join(', ')
      }
      return `${count} Stages of ${Math.floor(monster.avgHp / count)} HP`
    })

    const updateStat = function (
      stat: keyof typeof monster.stats,
      value: number | string | null
    ) {
      if (stat === 'CON') {
        monster.setHpModifier(monster.HP.HD, value)
      } else {
        monster.stats[stat] = validateNumber(value, 10)
      }
    }

    watch(() => extendedHp.value.regeneration.amount, (amount) => {
      if (monster.bindings?.['extendedHp.regeneration.amount']) extendedHp.value.regeneration.enabled = amount > 0
    }, { immediate: true })
    watch(() => deathPrevention.value.returnHpValue, (amount) => {
      if (monster.bindings?.['extendedHp.deathPrevention.returnHpValue']) deathPrevention.value.returnHpAmount = amount
    }, { immediate: true })

    // Languages logic
    if (!Array.isArray(monster.languagesList)) {
      monster.languagesList = []
      if (monster.languages) {
        const parts = monster.languages.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        monster.languagesList = parts.map((name) => ({
          id: uuidv4(),
          name,
          understandsOnly: false,
          telepathy: name.toLowerCase().includes('telepathy'),
          telepathyRange: 120,
        }))
      }
    }

    const languageOptions = ref<string[]>([...ALL_OFFICIAL_LANGUAGES])
    const showManualLangEdit = ref(false)

    const languageRequirementOptions = [
      { label: 'None', value: 'none' },
      { label: 'Must Understand ≥1', value: 'must_understand' },
      { label: 'Must Share Language', value: 'must_share' },
    ]

    const creatureTargetOptions = [
      { label: 'All Creatures', value: 'all' },
      { label: 'Intelligent (INT ≥ 6)', value: 'intelligent_only' },
      { label: 'Non-Intelligent (INT ≤ 5)', value: 'non_intelligent_only' },
    ]

    const concentrationFilterOptions = [
      { label: 'All Creatures', value: 'all' },
      { label: 'Creatures Concentrating Only', value: 'concentrating_only' },
      { label: 'Creatures Making/Maintaining Concentration', value: 'concentration_check' },
    ]

    const concentrationModeOptions = [
      { label: 'Standard (None)', value: 'none' },
      { label: 'Concentration Negates (Spell Concentration Negates Effect)', value: 'concentration_negates' },
      { label: 'Forced Concentration (Concentration Avoids Reading instead of Save)', value: 'forced_concentration' },
      { label: 'Requires Concentration (Monster Concentrates)', value: 'requires_concentration' },
    ]

    const concentrationOptions = [
      { label: 'None', value: 'none' },
      { label: 'Monster', value: 'monster_only' },
      { label: 'Target Creature', value: 'creature_only' },
      { label: 'Both', value: 'both' },
    ]

    const saveTypeOptions = ['Wisdom', 'Intelligence', 'Charisma']

    const getAnimalHandling = (lang: MonsterLanguageItem) => {
      if (!lang.animalHandling) {
        lang.animalHandling = {
          enabled: true,
          dc: 10,
          peacefulOutcome: 'calm/cease aggression',
          commandOutcome: 'convey basic commands',
          recruitOutcome: 'recruit aid/bond',
          customNotes: '',
        }
      }
      return lang.animalHandling
    }

    const getAnimalsConfig = (lang: MonsterLanguageItem) => {
      if (!lang.animalsConfig) {
        lang.animalsConfig = {
          simpleConceptsOnly: true,
          specificSubtype: '',
          note: '',
        }
      }
      return lang.animalsConfig
    }

    const getPlantsConfig = (lang: MonsterLanguageItem) => {
      if (!lang.plantsConfig) {
        lang.plantsConfig = {
          canQuestionPastDay: true,
          difficultTerrainNegotiation: false,
          note: '',
        }
      }
      return lang.plantsConfig
    }

    const getUndeadConfig = (lang: MonsterLanguageItem) => {
      if (!lang.undeadConfig) {
        lang.undeadConfig = {
          commandMindless: true,
          telepathicRange: 60,
          note: '',
        }
      }
      return lang.undeadConfig
    }

    const getDeadConfig = (lang: MonsterLanguageItem) => {
      if (!lang.deadConfig) {
        lang.deadConfig = {
          maxQuestions: 5,
          corpseMustHaveMouth: true,
          answersCryptic: false,
          deadWithinYears: '',
          note: '',
        }
      }
      return lang.deadConfig
    }

    const availableLanguages = computed(() => {
      const existing = new Set((monster.languagesList || []).map((l) => l.name.toLowerCase().trim()))
      return ALL_OFFICIAL_LANGUAGES
        .filter((l) => !existing.has(l.toLowerCase().trim()))
        .slice()
        .sort((a, b) => a.localeCompare(b))
    })

    const filterLanguages = (val: string, update: (cb: () => void) => void) => {
      update(() => {
        const pool = availableLanguages.value
        if (!val) {
          languageOptions.value = [...pool]
        } else {
          const needle = val.toLowerCase()
          languageOptions.value = pool.filter((v) =>
            v.toLowerCase().includes(needle)
          )
        }
      })
    }

    const syncLanguagesToString = () => {
      monster.languages = formatLanguagesList(monster.languagesList, monster.specialCommunicationArchetype)
    }

    watch(() => JSON.stringify(monster.languagesList), () => {
      if (Object.keys(monster.bindings || {}).some((path) => path.startsWith('languagesList['))) syncLanguagesToString()
    }, { immediate: true })

    const onLanguageSelected = (val: string | null) => {
      if (!val) return
      const name = val.trim()
      const lower = name.toLowerCase()
      // Deduplicate: prevent adding duplicate language
      if ((monster.languagesList || []).some((l) => l.name.toLowerCase().trim() === lower)) {
        return
      }
      const isTele = lower.includes('telepathy')
      const isHandleAnimals = lower === 'handle animals' || lower.includes('animal handling')
      const isAnimals = lower === 'animals'
      const isPlants = lower === 'plants'
      const isUndead = lower === 'undead'
      const isDead = lower.startsWith('dead')

      const item: MonsterLanguageItem = {
        id: uuidv4(),
        name,
        understandsOnly: false,
        telepathy: isTele,
        telepathyRange: isTele ? 120 : undefined,
        broadcast: false,
        noReply: false,
        languageRequirement: 'none',
        creatureTarget: 'all',
        simpleConceptsOnly: false,
        acrossPlanes: false,
        multiverseWide: false,
        learnDesires: false,
        readThoughts: false,
        senseEmotions: false,
        senseAlignment: false,
        senseIntentions: false,
        detectSincerity: false,
        accessMemories: false,
        shareOwnSenses: false,
        probeCreatureSenses: false,
        probeRequiresSave: false,
        probeSaveType: 'WIS',
        probeSaveDc: 13,
        probeSaveAwareness: 'unaware_on_fail',
        sensoryRequiresSave: false,
        sensorySaveType: 'WIS',
        sensorySaveDc: 13,
        syncSaves: true,
        requiresSave: false,
        saveType: 'WIS',
        saveDc: 13,
        saveAwareness: 'unaware_on_fail',
        disruptedByPsychicDamage: false,
        telepathicAwareness: false,
        concentration: 'none',
        animalHandling: isHandleAnimals
          ? {
              enabled: true,
              dc: 10,
              peacefulOutcome: 'calm/cease aggression',
              commandOutcome: 'convey basic commands',
              recruitOutcome: 'recruit aid/bond',
              customNotes: '',
            }
          : undefined,
        animalsConfig: isAnimals
          ? {
              simpleConceptsOnly: true,
              specificSubtype: '',
              note: '',
            }
          : undefined,
        plantsConfig: isPlants
          ? {
              canQuestionPastDay: true,
              difficultTerrainNegotiation: false,
              note: '',
            }
          : undefined,
        undeadConfig: isUndead
          ? {
              commandMindless: true,
              telepathicRange: 60,
              note: '',
            }
          : undefined,
        deadConfig: isDead
          ? {
              maxQuestions: 5,
              corpseMustHaveMouth: true,
              answersCryptic: false,
              deadWithinYears: '',
              note: '',
            }
          : undefined,
      }
      if (!Array.isArray(monster.languagesList)) {
        monster.languagesList = []
      }
      monster.languagesList.push(item)
      syncLanguagesToString()
    }

    const removeLanguage = (index: number) => {
      const language = monster.languagesList[index]
      if (!language) return
      monster.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('languagesList', language.id))
        state.languagesList.splice(index, 1)
      })
      syncLanguagesToString()
    }

    return {
      monster,
      crValues: CR_SELECT,
      lairCrValues: LAIR_CR_SELECT,
      sizeValues: CREATURE_SIZE,
      typeOptions,
      typeFilter,
      alignmentOptions,
      alignmentFilter,
      diceOptions,
      diceLookup,
      statKeys,
      updateStat,
      validateNumber,
      clearHpThreshold,
      extendedHp,
      tempHpConfig,
      tempHpTriggerOptions,
      tempHpPreview,
      damageTypeWithNoneOptions,
      onRegenDamageTypeTriggerChanged,
      initiativeConfig,
      initiativeRollMode,
      secondaryStatOptions,
      statModeOptions,
      initiativePreview,
      editorStore,
      openLayerStudio,
      acConfig,
      acBaseOptions,
      acAbilityBonusOptions,
      acDefenseItemOptions,
      acTemporaryOptions,
      acConditionalOptions,
      acDefensiveMechanicOptions,
      creatureTypeOptions,
      attackTypeOptions,
      saveDcSourceOptions,
      saveDcPresetOptions,
      dtPresetOptions,
      drPresetOptions,
      damageAmountPresets,
      secondaryAcPresetOptions,
      lightLevelOptions,
      onMissOptions,
      onHitOptions,
      needsSecondaryAc,
      computedCompositorAc,
      computedCompositorType,
      onAcCompositorChanged,
      isLastBloodiedPhase,
      regenConditionModifierOptions,
      deathPrevention,
      portrait,
      portraitFile,
      portraitPositions,
      dynamicSourceOptions,
      bloodiedSourceOptions,
      dtDrSourceOptions,
      returnHpSourceOptions,
      deathPreventionRuleOptions,
      disruptionOptions,
      frequencyOptions,
      invulnerabilityRuleOptions,
      invulnerabilityConditionOptions,
      invulnerability,
      resolvedInvulnLocation,
      invulnerabilityPreview,
      onInvulnerabilityRuleChanged,
      onInvulnerabilityConditionsChanged,
      onTogglePhaseBloodied,
      initiativeTriggerOptions,
      initiativeAdvModeOptions: INITIATIVE_ADV_MODE_OPTIONS,
      initiativeActionTypeOptions: INITIATIVE_ACTION_TYPE_OPTIONS,
      newRiderAdvMode,
      newRiderCreatureTypes,
      newRiderRollEffect,
      newRiderActionType,
      newRiderSpellName,
      newRiderHpAmount,
      newRiderMoveDistance,
      newRiderCustomText,
      addInitiativeRider,
      removeInitiativeRider,
      formatInitiativeRider,
      bloodiedAtPhaseOptions,
      onRegenFrequencyChanged,
      onDeathPreventionTemplateChanged,
      onDeathPreventionRuleChanged,
      paragonPhaseRows,
      resolvePhaseRowPreview,
      syncParagonPhaseRows,
      recoveryTypeOptions,
      unifiedTriggerConditionOptions,
      getDynamicSourceValue,
      timeframeOptions,
      displayModeOptions,
      damageTypeOptions: STANDARD_DAMAGE_TYPES,
      deathExceptionOptions: DEATH_EXCEPTIONS,
      deathPreventionTemplates,
      onPortraitFileSelected,
      computedBloodiedHp,
      regenPreview,
      deathPreventionPreview,
      updateParagonPoolHp,
      computedParagonPoolSummary,
      languageOptions,
      filterLanguages,
      onLanguageSelected,
      removeLanguage,
      syncLanguagesToString,
      showManualLangEdit,
      languageRequirementOptions,
      creatureTargetOptions,
      concentrationFilterOptions,
      concentrationModeOptions,
      concentrationOptions,
      saveTypeOptions,
      getAnimalHandling,
      getAnimalsConfig,
      getPlantsConfig,
      getUndeadConfig,
      getDeadConfig,
      pointBuyInfo,
      roleArchetypes,
      speciesOptions,
      selectedSpecies,
      applyStandardArray,
      applyAllStats,
      applyArchetype,
      onSpeciesSelected,
    }
  },
})
</script>
