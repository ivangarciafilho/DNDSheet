<template>
  <q-expansion-item
    expand-separator
    data-editor-section="speeds"
    icon="speed"
    :label="$t('editor.speeds.label')"
    :caption="$t('editor.speeds.caption')"
  >
    <q-card class="q-pa-xs">
      <!-- Standard Speeds List -->
      <q-card-section class="q-pa-xs">
        <!-- Speeds Auto-Add Dropdown (No add button required) -->
        <div class="row items-center justify-between q-px-xs q-mb-xs">
          <q-toggle
v-model="monster.splitSpeedRiderRows"
            v-help="$t('help.speeds.splitSubrows')"
            dark
            dense
            size="xs"
            color="cyan-4"
            label="Disclose movement riders on indented sub-rows (1 row per rider)"
            class="text-caption text-weight-medium text-cyan-2"
          >
            <q-tooltip>Renders each movement rider (Dodge, Disengage, Dash, Hide, etc.) on its own dedicated indented sub-row (↳) beneath base speed.</q-tooltip>
          </q-toggle>
        </div>
        <div class="row items-center q-col-gutter-xs q-mb-sm">
          <div class="col-12">
            <catalog-select
              v-help="'Add walk, burrow, climb, fly or swim speed, or type a custom one.'"
              :model-value="null"
              :entries="availableSpeedEntries"
              allow-custom
              searchable
              clearable
              label="Add Speed (select or type to add)..."
              placeholder="Select or type movement type (e.g. fly, swim, burrow, climb)"
              @update:model-value="val => onSpeedSelected(val ? String(val) : null)"
            >
              <template #prepend>
                <q-icon name="add" />
              </template>
            </catalog-select>
          </div>
        </div>

        <div v-if="speeds.length === 0" class="text-caption text-grey-5 q-pa-xs text-center">
          No speeds configured. Select or type a speed type above to add.
        </div>

        <div class="row q-col-gutter-xs">
          <div
            v-for="(speed, idx) in speeds"
            :key="speed.id"
            class="col-12 q-pa-xs"
          >
            <q-card
              flat
              bordered
              class="q-pa-xs rounded-borders"
              style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12);"
            >
              <div class="row items-center q-col-gutter-xs">
                <div class="col-12 col-sm-4">
                  <catalog-select
                    v-help="'Movement mode name (walk, fly, swim, climb, burrow, or custom).'"
                    :model-value="speed.type"
                    :entries="defaultSpeedEntries"
                    allow-custom
                    searchable
                    :label="$t('monster.movement.type.label')"
                    @update:model-value="val => (speed.type = String(val || 'walk'))"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    v-help="'Movement speed in feet.'"
                    dense
                    outlined
                    :model-value="speed.speed"
                    :options="speedPresetOptions"
                    use-input
                    fill-input
                    hide-selected
                    :label="$t('monster.movement.speed')"
                    suffix="ft"
                    new-value-mode="add-unique"
                    @input-value="(val) => (speed.speed = validateNumber(val, 0))"
                    @update:model-value="(val) => (speed.speed = validateNumber(val, 0))"
                  />
                </div>
                <div class="col-9 col-sm-3">
                  <mechanic-text-editor
                    v-model="speed.note"
                    dense
                    outlined
                    :label="$t('monster.movement.note')"
                    placeholder="e.g. hover, 120 ft. outside water"
                  />
                </div>
                <div class="col-3 col-sm-2 text-right row items-center justify-end q-gutter-x-xs no-wrap">
                  <swap-buttons field="speeds" :idx="idx" flat dense />
                  <q-btn
                    dense
                    round
                    size="sm"
                    icon="delete"
                    color="negative"
                    flat
                    @click="() => deleteSpeed(speed.id)"
                  >
                    <q-tooltip class="text-body2">{{ $t('editor.delete') }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
              <div v-if="speed.type && speed.type.toLowerCase() === 'fly'" class="row items-center q-mt-xs q-px-xs">
                <q-checkbox
                  v-model="speed.hover"
                  v-help="'Flying creature that stays aloft even when its speed drops to 0 or it is incapacitated.'"
                  dense label="Hover (does not fall if speed reduced to 0)"
                  color="accent"
                />
              </div>
              </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator class="q-my-sm" />

      <!-- Traversal & Cunning Actions Section -->
      <q-expansion-item
        dense
        dense-toggle
        expand-separator
        class="rounded-borders q-ma-xs"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
        icon="alt_route"
        label="Traversal & Cunning Actions"
        caption="Consolidated single-line speeds, difficult terrain, and bonus action moves"
      >
        <div class="q-pa-sm">
          <div class="text-caption text-grey-4 q-mb-sm">
            Configure terrain traversal, bonus action movements, and special tactical speeds (rendered cleanly on the single Speeds line):
          </div>

          <!-- Amorphous & Phasing Mechanics -->
          <div
            class="q-pa-xs q-mb-sm rounded-borders"
            style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);"
          >
            <div class="text-caption text-weight-bold text-teal q-mb-xs">
              💧 Amorphous & Fluid Movement Options
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="speedTraversal.amorphous1Inch"
                  v-help="'Fits through gaps as narrow as 1 inch, like an ooze.'"
                  dense label="Move through 1-inch spaces without squeezing"
                  color="teal"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="speedTraversal.amorphousCannotEnterLiquids"
                  v-help="'This speed does not work in water or other liquids.'"
                  dense label="Cannot enter liquid bodies"
                  color="teal"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="speedTraversal.moveThroughCreaturesDifficultTerrain"
                  v-help="'Can move through other creatures’ spaces, treating them as difficult terrain.'"
                  dense label="Move through creature spaces as difficult terrain"
                  color="teal"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="speedTraversal.moveThroughCreaturesTwoSizesDifferent"
                  v-help="'Can pass through a creature at least two sizes larger or smaller.'"
                  dense label="Move through spaces of creatures 2+ sizes different"
                  color="teal"
                />
              </div>
              <template v-if="speedTraversal.moveThroughCreaturesDifficultTerrain">
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="speedTraversal.moveThroughCreaturesShunt"
                    v-help="'Ending its turn inside a creature pushes that creature out.'"
                    dense label="Shunts creature if ending turn inside"
                    color="teal"
                  />
                </div>
                <template v-if="speedTraversal.moveThroughCreaturesShunt">
                  <div class="col-12 col-sm-6">
                    <catalog-select
                      v-help="'What happens to a creature pushed out when the movement ends inside it.'"
                      :model-value="speedTraversal.shuntDestination ?? 'nearest_unoccupied'"
                      :entries="shuntDestinationOptions"
                      preserve-order
                      :searchable="false"
                      label="Shunt Outcome"
                      @update:model-value="val => (speedTraversal.shuntDestination = (val === 'ethereal_plane' ? 'ethereal_plane' : 'nearest_unoccupied'))"
                    />
                  </div>
                  <div v-if="speedTraversal.shuntDestination !== 'ethereal_plane'" class="col-12 col-sm-6">
                    <catalog-select
                      v-help="'Damage dealt to a creature shunted out of this space.'"
                      :model-value="speedTraversal.moveThroughCreaturesShuntDamage ?? ''"
                      :entries="shuntDamageEntries"
                      preserve-order
                      allow-custom
                      searchable
                      label="Shunt Damage"
                      placeholder="e.g. 1d10 force"
                      @update:model-value="val => (speedTraversal.moveThroughCreaturesShuntDamage = String(val || ''))"
                    />
                  </div>
                </template>
              </template>
              <div class="col-12 col-sm-6">
                <catalog-select
                  v-help="'Can shift between the Material and Ethereal planes while moving.'"
                  :model-value="speedTraversal.etherealJaunt ?? 'none'"
                  :entries="etherealJauntOptions"
                  preserve-order
                  :searchable="false"
                  label="Planar Shift (Material / Ethereal)"
                  @update:model-value="val => (speedTraversal.etherealJaunt = String(val || 'none') as NonNullable<MonsterSpeedTraversal['etherealJaunt']>)"
                />
              </div>
            </div>
          </div>

          <!-- Aquatic Breathing & Environments -->
          <div
            class="q-pa-xs q-mb-sm rounded-borders"
            style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);"
          >
            <div class="text-caption text-weight-bold text-info q-mb-xs">
              🌊 Aquatic Breathing & Physiology
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12 col-sm-6">
                <catalog-select
                  v-help="'Can breathe water (and whether it can still breathe air).'"
                  :model-value="speedTraversal.aquaticBreathing ?? 'none'"
                  :entries="aquaticBreathingOptions"
                  preserve-order
                  :searchable="false"
                  label="Aquatic Breathing"
                  @update:model-value="val => (speedTraversal.aquaticBreathing = String(val || 'none') as NonNullable<MonsterSpeedTraversal['aquaticBreathing']>)"
                />
              </div>
              <div v-if="speedTraversal.aquaticBreathing === 'hold_breath'" class="col-12 col-sm-6">
                <mechanic-text-editor
                  v-model="speedTraversal.holdBreathDuration"
                  v-help="'How long the creature can hold its breath.'"
                  dense
                  outlined label="Hold Breath Duration"
                  placeholder="e.g. 1 hour, 15 minutes"
                />
              </div>
            </div>
          </div>

          <!-- Terrain and Cunning Checkboxes -->
          <div class="row q-col-gutter-sm items-center q-mb-sm">
            <div class="col-12 col-sm-6 col-md-3">
              <q-checkbox
                v-model="speedTraversal.ignoresDifficultTerrain"
                v-help="'Moves through difficult terrain without spending extra movement.'"
                dense label="Ignores Difficult Terrain"
                color="secondary"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-checkbox
                v-model="speedTraversal.bonusActionDash"
                v-help="'Can take the Dash action as a bonus action.'"
                dense label="Bonus Action Dash"
                color="primary"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-checkbox
                v-model="speedTraversal.bonusActionDodge"
                v-help="'Can take the Dodge action as a bonus action.'"
                dense label="Bonus Action Dodge"
                color="primary"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-checkbox
                v-model="speedTraversal.bonusActionDisengage"
                v-help="'Can take the Disengage action as a bonus action.'"
                dense label="Bonus Action Disengage"
                color="primary"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-checkbox
                v-model="(speedTraversal as any).bonusActionHide"
                v-help="'Can take the Hide action as a bonus action.'"
                dense label="Bonus Action Hide"
                color="primary"
              />
            </div>

            <!-- Cunning Action Riders -->
            <div v-if="speedTraversal.bonusActionDash" class="col-12 col-sm-6 col-md-4 q-mt-xs">
              <mechanic-select-editor
                v-model="speedTraversal.dashRider"
                v-help="'Extra effect when the creature Dashes.'"
                :options="dashRiderPresets"
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                dense
                outlined label="Dash Rider"
                placeholder="e.g. Ignores Difficult Terrain"
              >
                <q-tooltip class="text-caption">Rider applied when taking the Dash action</q-tooltip>
              </mechanic-select-editor>
            </div>

            <div v-if="speedTraversal.bonusActionDodge" class="col-12 col-sm-6 col-md-4 q-mt-xs">
              <mechanic-select-editor
                v-model="speedTraversal.dodgeRider"
                v-help="'Extra effect when the creature Dodges.'"
                :options="dodgeRiderPresets"
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                dense
                outlined label="Dodge Rider"
                placeholder="e.g. Adv on DEX saves"
              >
                <q-tooltip class="text-caption">Rider applied when taking the Dodge action</q-tooltip>
              </mechanic-select-editor>
            </div>

            <div v-if="speedTraversal.bonusActionDisengage" class="col-12 col-sm-6 col-md-4 q-mt-xs">
              <mechanic-select-editor
                v-model="speedTraversal.disengageRider"
                v-help="'Extra effect when the creature Disengages.'"
                :options="disengageRiderPresets"
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                dense
                outlined label="Disengage Rider"
                placeholder="e.g. Change to the ethereal plane"
              >
                <q-tooltip class="text-caption">Rider applied when taking the Disengage action</q-tooltip>
              </mechanic-select-editor>
            </div>

            <div v-if="(speedTraversal as any).bonusActionHide" class="col-12 col-sm-6 col-md-4 q-mt-xs">
              <mechanic-select-editor
                v-model="(speedTraversal as any).hideRider"
                v-help="'Extra effect when the creature Hides.'"
                :options="disengageRiderPresets"
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                dense
                outlined label="Hide Rider"
                placeholder="e.g. Becomes Invisible until end of turn"
              >
                <q-tooltip class="text-caption">Rider applied when taking the Hide action</q-tooltip>
              </mechanic-select-editor>
            </div>
          </div>

          <!-- Specific Tactical Speeds -->
          <div class="row q-col-gutter-xs items-center q-mb-xs">
            <div class="col-12 col-sm-4">
              <q-select
                v-model="speedTraversal.bonusActionSpeed"
                v-help="'Speed granted when moving as a bonus action.'"
                dense
                outlined
                :options="speedPresetOptions"
                use-input
                fill-input
                hide-selected label="Bonus Action Speed"
                suffix="ft"
                new-value-mode="add-unique"
                @input-value="(val) => (speedTraversal.bonusActionSpeed = validateNumber(val, 0))"
                @update:model-value="(val) => (speedTraversal.bonusActionSpeed = validateNumber(val, 0))"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="speedTraversal.trackingSpeed"
                v-help="'Speed while tracking quarry.'"
                dense
                outlined
                :options="speedPresetOptions"
                use-input
                fill-input
                hide-selected label="Tracking Speed"
                suffix="ft"
                new-value-mode="add-unique"
                @input-value="(val) => (speedTraversal.trackingSpeed = validateNumber(val, 0))"
                @update:model-value="(val) => (speedTraversal.trackingSpeed = validateNumber(val, 0))"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="speedTraversal.stealthSpeed"
                v-help="'Movement that does not break Stealth or make noise.'"
                dense
                outlined
                :options="speedPresetOptions"
                use-input
                fill-input
                hide-selected label="Stealth / Silent Speed"
                suffix="ft"
                new-value-mode="add-unique"
                @input-value="(val) => (speedTraversal.stealthSpeed = validateNumber(val, 0))"
                @update:model-value="(val) => (speedTraversal.stealthSpeed = validateNumber(val, 0))"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center">
            <div class="col-12">
              <mechanic-text-editor
                v-model="speedTraversal.note"
                v-help="'Free text added after the speed.'"
                dense
                outlined label="Traversal Note"
                placeholder="e.g. climbing does not cost extra movement, ignores nonmagical webbing"
                clearable
              />
            </div>
          </div>
        </div>
      </q-expansion-item>

      <!-- Movement Action Riders Composer (Dash, Disengage, Dodge, Auras) -->
      <div
        class="q-pa-xs q-ma-xs rounded-borders"
        style="background: rgba(255, 255, 255, 0.03); border: 1.5px solid #00b4d8; box-shadow: 0 2px 8px rgba(0, 180, 216, 0.15);"
      >
        <div class="row items-center justify-between q-pa-xs">
          <div class="row items-center q-gutter-x-xs">
            <q-icon name="directions_run" color="cyan-3" size="sm" />
            <span class="text-subtitle2 text-weight-bold text-cyan-2">Movement Action Riders Composer</span>
          </div>
          <div class="row items-center q-gutter-x-xs">
            <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
              <q-list dense dark class="bg-grey-10">
                <q-item
                  v-for="preset in SPEED_ACTION_RIDER_PRESETS"
                  :key="preset.id"
                  v-close-popup
                  clickable
                  @click="addPresetRider(preset)"
                >
                  <q-item-section>
                    <q-item-label class="text-caption text-weight-medium">{{ preset.label }}</q-item-label>
                    <q-item-label caption class="text-grey-5">{{ preset.action }}: {{ preset.rider }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
            <q-btn
              dense
              round
              flat
              size="sm"
              icon="add"
              color="cyan-3"
              @click="addCustomActionRider"
            >
              <q-tooltip class="dnd-tip">Add custom movement action rider</q-tooltip>
            </q-btn>
          </div>
        </div>

        <div class="text-caption text-grey-4 q-px-xs q-mb-xs">
          Compose rider effects for Dash, Disengage, Dodge, and movement triggers rendered directly on the Speed vital line.
        </div>

        <div class="row items-center justify-between q-px-xs q-mb-xs">
          <q-toggle
v-model="monster.splitSpeedRiderRows"
            v-help="$t('help.speeds.splitSubrows')"
            dark
            dense
            size="xs"
            color="cyan-4"
            label="Disclose movement riders on indented sub-rows"
            class="text-caption text-weight-medium text-cyan-2"
          >
            <q-tooltip>Renders movement riders on dedicated indented sub-rows (↳) directly beneath base speed.</q-tooltip>
          </q-toggle>
        </div>

        <div v-if="!actionRiders.length" class="text-caption text-grey-5 q-pa-sm text-center">
          No movement action riders added yet. Click "+", select a preset above, or use quick-mix tags below.
        </div>

        <div
          v-for="(rider, rIdx) in actionRiders"
          :key="rider.id || rIdx"
          class="q-pa-xs q-mb-xs rounded-borders bg-grey-10"
          style="border: 1px solid rgba(255, 255, 255, 0.15);"
        >
          <div class="row q-col-gutter-xs items-center">
            <div class="col-12 col-sm-3">
              <catalog-select
                v-help="'What triggers this traversal option.'"
                :model-value="rider.action"
                :entries="actionTriggerEntries"
                preserve-order
                allow-custom
                searchable
                dark
                label="Trigger / Action"
                @update:model-value="val => (rider.action = String(val || 'Dash'))"
              />
            </div>
            <div class="col-6 col-sm-2">
              <catalog-select
                v-help="'Which part of the turn this costs: action, bonus action, reaction or free.'"
                :model-value="rider.actionType"
                :entries="actionEconomyEntries"
                preserve-order
                :searchable="false"
                dark
                label="Economy"
                @update:model-value="val => (rider.actionType = (String(val || 'Bonus Action') as SpeedActionRider['actionType']))"
              />
            </div>
            <div class="col-6 col-sm-6">
              <mechanic-text-editor
                v-model="rider.rider"
                v-help="'Extra wording or a formula, such as half speed.'"
                dense
                outlined
                dark label="Rider Clause / Formula"
                placeholder="e.g. can Shove as a Bonus Action"
              >
                <template #append>
                  <q-btn
                    flat
                    round
                    dense
                    size="xs"
                    icon="close"
                    color="red-4"
                    @click="removeActionRider(rIdx)"
                  >
                    <q-tooltip class="dnd-tip">Remove this movement rider</q-tooltip>
                  </q-btn>
                </template>
              </mechanic-text-editor>
            </div>
            <div class="col-12 col-sm-1 text-right">
              <q-btn
                flat
                round
                dense
                size="xs"
                icon="delete"
                color="negative"
                @click="removeActionRider(rIdx)"
              />
            </div>
          </div>
          <!-- Live Preview Banner for this rider -->
          <div class="row items-center justify-between q-mt-xs q-px-xs text-xs text-grey-4">
            <span>Rendered Vital: <b class="text-cyan-3">{{ formatSpeedRiderPreview(rider) }}</b></span>
            <div class="row items-center q-gutter-x-xs editor-fit-wrap">
              <q-btn v-help="$t('help.speeds.chipBa')" dense flat size="xs" color="cyan-3" label="+ BA" @click="appendToken(rider, 'as a Bonus Action')" />
              <q-btn v-help="$t('help.speeds.chipTempHp')" dense flat size="xs" color="cyan-3" label="+ Temp HP" @click="appendToken(rider, 'Gain 10 Temporary Hit Points')" />
              <q-btn v-help="$t('help.speeds.chipObscured')" dense flat size="xs" color="cyan-3" label="+ Obscured" @click="appendToken(rider, 'Creatures 5ft of you are lightly obscured')" />
              <q-btn v-help="$t('help.speeds.chipAdvSaves')" dense flat size="xs" color="cyan-3" label="+ Adv Saves" @click="appendToken(rider, 'Until End Of Turn: Advantage on Strength, and Dexterity Saving Throws')" />
              <q-btn v-help="$t('help.speeds.chipTeleportVisited')" dense flat size="xs" color="cyan-3" label="+ Teleport Visited" @click="appendToken(rider, 'At end of turn: Teleports to unoccupied space visited this turn')" />
              <q-btn v-help="$t('help.speeds.chipTeleportFamiliar')" dense flat size="xs" color="cyan-3" label="+ Teleport Familiar" @click="appendToken(rider, 'At end of turn: Teleports to unoccupied space familiar to you')" />
              <q-btn v-help="$t('help.speeds.chipTeleportSee')" dense flat size="xs" color="cyan-3" label="+ Teleport 10ft See" @click="appendToken(rider, 'Teleport up to 10ft to a point you can see')" />
              <q-btn v-help="$t('help.speeds.chipTeleportFire')" dense flat size="xs" color="cyan-3" label="+ 1d8 Fire" @click="appendToken(rider, 'takes 1d8 fire damage')" />
              <q-btn v-help="$t('help.speeds.chipShove')" dense flat size="xs" color="cyan-3" label="+ Shove" @click="appendToken(rider, 'can Shove')" />
              <q-btn v-help="$t('help.speeds.chipEthereal')" dense flat size="xs" color="cyan-3" label="+ Ethereal" @click="appendToken(rider, 'shift to the Ethereal Plane')" />
            </div>
          </div>
        </div>
      </div>
      <basic-riders-editor scope="speed" label="Speed riders" />
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import BasicRidersEditor from './BasicRidersEditor.vue'
import CatalogSelect from '../kit/CatalogSelect.vue'
import MechanicTextEditor from './MechanicTextEditor.vue'
import MechanicSelectEditor from './MechanicSelectEditor.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, defineComponent } from 'vue'
import { STANDARD_MOVEMENTS } from 'src/data/MOVEMENT'
import { useI18n } from 'vue-i18n'
import { validateNumber } from './numberInput'
import { MonsterSpeedTraversal } from '../models'
import SwapButtons from './widgets/SwapButtons.vue'
import {
  SPEED_ACTION_RIDER_PRESETS,
  formatSpeedActionRider,
  SpeedActionRider,
} from 'src/core/domain/speeds-traversal'

export default defineComponent({
  name: 'SpeedsEditor',
  components: { BasicRidersEditor, CatalogSelect, MechanicSelectEditor, MechanicTextEditor, SwapButtons },
  setup() {
    const { t } = useI18n()
    const monster = useMonsterStore()

    const ensureSpeedTraversal = (): MonsterSpeedTraversal => {
      if (!monster.speedTraversal) {
        monster.speedTraversal = {
          ignoresDifficultTerrain: false,
          bonusActionDash: false,
          bonusActionDodge: false,
          bonusActionDisengage: false,
          bonusActionSpeed: 0,
          trackingSpeed: 0,
          stealthSpeed: 0,
          note: '',
        }
      }
      return monster.speedTraversal
    }
    ensureSpeedTraversal()
    const speedTraversal = computed(() => ensureSpeedTraversal())

    const defaultSpeedOptions = computed(() => {
      return STANDARD_MOVEMENTS.map((m) => t(`monster.movement.type.${m}`)).sort((a, b) => a.localeCompare(b))
    })

    const defaultSpeedEntries = computed(() =>
      defaultSpeedOptions.value.map((opt) => ({ value: opt, label: opt }))
    )

    const availableSpeedEntries = computed(() => {
      const existing = new Set((monster.speeds || []).map((s) => (s.type || 'walk').toLowerCase()))
      return defaultSpeedOptions.value
        .filter((opt) => !existing.has(opt.toLowerCase()))
        .map((opt) => ({ value: opt, label: opt }))
    })

    const shuntDestinationOptions = [
      { label: 'Nearest Unoccupied Space (Deals Damage)', value: 'nearest_unoccupied' },
      { label: 'Shunt to Ethereal Plane', value: 'ethereal_plane' },
    ]

        const dashRiderPresets = [
      'Ignores Difficult Terrain',
      'Doubles jump distance',
      'Leaves a trail of fire',
      'Disengages simultaneously',
    ]

    const dodgeRiderPresets = [
      'Advantage on Dexterity saving throws',
      'Attackers miss trigger counterattack',
      'Damage from missed attacks halved',
    ]

    const disengageRiderPresets = [
      'Change to the ethereal plane',
      'Becomes Invisible until end of turn',
      'Teleports up to 30 ft',
      'Leaves a smoke cloud',
    ]

const shuntDamageOptions = [
      '1d6 force',
      '1d10 force',
      '2d6 force',
      '2d10 force',
      '3d6 force',
      '3d10 force',
      '4d10 force',
      '1d6 bludgeoning',
      '1d10 bludgeoning',
    ]

    const etherealJauntOptions = [
      { label: 'None', value: 'none' },
      { label: 'Shift to/from Ethereal Plane (Bonus Action)', value: 'bonus_action' },
      { label: 'Shift to/from Ethereal Plane (Action)', value: 'action' },
      { label: 'Shift to/from Ethereal Plane (At-Will, No Action)', value: 'at_will' },
    ]

    const aquaticBreathingOptions = [
      { label: 'None', value: 'none' },
      { label: 'Can breathe underwater', value: 'underwater' },
      { label: 'Amphibious (breathes air and water)', value: 'amphibious' },
      { label: 'Water only (can breathe only underwater)', value: 'water_only' },
      { label: 'Hold Breath (can hold breath for duration)', value: 'hold_breath' },
    ]

    const onSpeedSelected = (val: string | null) => {
      if (!val) return
      const clean = val.trim()
      // Deduplicate: prevent adding duplicate speed type
      if ((monster.speeds || []).some((s) => (s.type || 'walk').toLowerCase() === clean.toLowerCase())) {
        return
      }
      monster.addSpeed({
        type: clean,
        speed: 30,
        note: '',
      })
    }

    const speedPresetOptions = [
      '0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '60', '70', '80', '90', '100', '120', '150'
    ]

    const actionTriggerOptions = [
      'Dash',
      'Disengage',
      'Dodge',
      'Hide',
      'Dash or Disengage',
      'Dodge or Disengage',
      'Dash, Disengage, or Dodge',
      'Dash, Disengage, Dodge, or Hide',
      'Once per round',
      'Once per round per creature',
      'General',
    ]

    const actionRiders = computed(() => {
      return speedTraversal.value.actionRiders || []
    })

    const addCustomActionRider = () => {
      const st = speedTraversal.value
      if (!st.actionRiders) {
        st.actionRiders = []
      }
      st.actionRiders.push({
        id: `rider-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: 'Dash',
        actionType: 'Bonus Action',
        rider: 'can Shove as a Bonus Action',
      })
    }

    const addPresetRider = (preset: typeof SPEED_ACTION_RIDER_PRESETS[number]) => {
      const st = speedTraversal.value
      if (!st.actionRiders) {
        st.actionRiders = []
      }
      st.actionRiders.push({
        id: `rider-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: preset.action,
        actionType: preset.actionType,
        rider: preset.rider,
      })
    }

    const removeActionRider = (idx: number) => {
      const st = speedTraversal.value
      if (st.actionRiders) {
        st.actionRiders.splice(idx, 1)
      }
    }

    const appendToken = (rider: SpeedActionRider, token: string) => {
      if (!rider.rider) {
        rider.rider = token
      } else if (!rider.rider.includes(token)) {
        rider.rider = `${rider.rider.trim()}, ${token}`
      }
    }

    const formatSpeedRiderPreview = (rider: SpeedActionRider) => {
      return formatSpeedActionRider(rider)
    }

    const shuntDamageEntries = shuntDamageOptions.map((value) => ({ value, label: value }))
    const actionTriggerEntries = actionTriggerOptions.map((value) => ({ value, label: value }))
    const actionEconomyEntries = ['Action', 'Bonus Action', 'Reaction', 'Free'].map((value) => ({ value, label: value }))

    return {
      monster,
      dashRiderPresets,
      dodgeRiderPresets,
      disengageRiderPresets,
      speeds: computed(() => monster.speeds),
      speedTraversal,
      speedPresetOptions,
      actionTriggerEntries,
      actionEconomyEntries,
      actionRiders,
      SPEED_ACTION_RIDER_PRESETS,
      addCustomActionRider,
      addPresetRider,
      removeActionRider,
      appendToken,
      formatSpeedRiderPreview,
      addSpeed: monster.addSpeed,
      deleteSpeed: monster.deleteSpeed,
      defaultSpeedEntries,
      availableSpeedEntries,
      shuntDestinationOptions,
      shuntDamageEntries,
      etherealJauntOptions,
      aquaticBreathingOptions,
      onSpeedSelected,
      validateNumber,
    }
  },
})
</script>
