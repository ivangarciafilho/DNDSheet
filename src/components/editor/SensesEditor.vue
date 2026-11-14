<template>
  <q-expansion-item
    expand-separator
    data-editor-section="senses"
    icon="settings_input_antenna"
    :label="$t('editor.senses.label')"
    :caption="$t('editor.senses.caption')"
  >
    <q-card class="q-pa-sm">
      <!-- 1. Header & Add Sense Dropdown -->
      <div class="row q-col-gutter-xs items-center q-mb-sm">
        <div class="col-12">
          <q-select
            v-model="selectedSenseToAdd"
            :options="availableSenseOptions"
            emit-value
            map-options
            label="Add Sense (Modular 5e Physiology)"
            dense
            outlined
            clearable
            @update:model-value="onSenseSelected"
          >
            <template #prepend>
              <q-icon name="visibility" color="primary" />
            </template>
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
      </div>

      <!-- 2. Active Modular Senses Cards -->
      <div v-if="monster.sensesList && monster.sensesList.length > 0" class="q-gutter-y-xs q-mb-sm">
        <div
          v-for="(sense, idx) in monster.sensesList"
          :key="sense.id || idx"
          class="q-pa-sm rounded-borders"
          style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);"
        >
          <div class="row items-center justify-between q-col-gutter-xs">
            <div class="col-auto row items-center q-gutter-xs">
              <q-badge color="teal-8" class="text-weight-bold text-subtitle2 q-px-sm q-py-xs">
                {{ sense.name }}
              </q-badge>
            </div>
            <div v-if="sense.name !== 'Detect Magic'" class="col-auto row items-center q-gutter-xs">
              <q-select
                :model-value="sense.range"
                :options="senseRangePresets"
                use-input
                fill-input
                hide-selected
                dense
                outlined
                label="Range"
                  v-help="'How far the sense reaches, in the unit chosen next to it.'"
                style="width: 105px;"
                new-value-mode="add-unique"
                @input-value="(val) => (sense.range = validateNumber(val, 0))"
                @update:model-value="(val) => (sense.range = validateNumber(val, 0))"
              />
              <q-select
                v-model="sense.rangeUnit"
                :options="['ft', 'miles']"
                dense
                outlined
                label="Unit"
                  v-help="'Feet for most senses; miles for very long ranges such as Life Sense.'"
                style="width: 85px;"
              />
            </div>
            <div class="col text-right">
              <q-btn
                dense
                flat
                round
                color="negative"
                icon="delete"
                size="sm"
                @click="removeSense(idx)"
              >
                <q-tooltip>Remove Sense</q-tooltip>
              </q-btn>
            </div>
          </div>

          <div v-if="sense.name === 'Detect Magic'" class="text-caption q-mt-xs">Can cast Detect Magic (V,S,R) At Will</div>
          <!-- Specific Modifiers Row -->
          <div v-else class="row q-col-gutter-sm items-center q-mt-xs">
            <!-- Universal Checkboxes for ranged senses -->
            <div class="col-auto">
              <q-checkbox
                v-model="sense.blindBeyond"
                dense
                label="Blind beyond it (Grimlock / Grell)"
                  v-help="'The creature is blind past this range, like a grimlock relying on blindsight.'"
                color="teal"
                class="text-caption"
              />
            </div>
            <div class="col-auto">
              <q-checkbox
                v-model="sense.acrossPlanes"
                dense
                label="Across Material & Ethereal planes"
                  v-help="'The sense also works into the Ethereal Plane, as with Ethereal Sight.'"
                color="indigo"
                class="text-caption"
              />
            </div>

            <!-- Blindsight (merged with Blindsense & Echolocation) -->
            <template v-if="sense.name.toLowerCase().includes('blindsight') || sense.name.toLowerCase().includes('echolocation')">
              <div class="col-auto">
                <q-checkbox
                  v-model="sense.echolocation"
                  dense
                  label="Echolocation / Can't while deafened (Bat)"
                  v-help="'Blindsight from echolocation: it does not work while the creature is deafened.'"
                  color="teal"
                  class="text-caption"
                />
              </div>
            </template>

            <!-- Darkvision -->
            <template v-if="sense.name.toLowerCase().includes('darkvision') || sense.name.toLowerCase().includes('devil')">
              <div class="col-auto">
                <q-checkbox
                  v-model="sense.devilsSight"
                  dense
                  label="Ignore Magical Darkness (Devil's Sight)"
                  v-help="'Sees normally in magical and nonmagical darkness within range.'"
                  color="purple"
                  class="text-caption"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="sense.lightImpairment"
                  :options="lightImpairmentOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Light Impairment"
                  v-help="'Sunlight or bright-light sensitivity that blinds or hinders the creature.'"
                />
              </div>
            </template>

            <!-- Sense Sentience -->
            <template v-if="sense.name.toLowerCase().includes('sentience')">
              <div class="col-12 col-sm-5">
                <q-select
                  v-model="sense.senseSentienceMode"
                  :options="senseSentienceOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Sentience Detection Scope"
                  v-help="'What the sense detects: any thinking creature or only some kinds.'"
                />
              </div>
            </template>

            <!-- Life Sense & Divine Sense -->
            <template v-if="sense.name.toLowerCase().includes('life') || sense.name.toLowerCase().includes('divine')">
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="sense.detectionMode"
                  :options="detectionModeOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Detection Mode"
                  v-help="'Presence only, or exact location of what it senses.'"
                />
              </div>
              <div class="col-12 col-sm-8">
                <q-select
                  v-model="sense.targetCreatureTypes"
                  :options="creatureTypeOptions"
                  multiple
                  use-chips
                  clearable
                  dense
                  outlined
                  label="Target Creature Types / Triggers"
                  v-help="'Creature types the sense reveals, such as celestials, fiends and undead.'"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="sense.perceivedStats"
                  :options="perceivedStatsOptions"
                  multiple
                  use-chips
                  clearable
                  dense
                  outlined
                  label="Gathered Info (Know Your Enemy / Analytical Sense)"
                  v-help="'Facts the creature learns about a target it studies.'"
                />
              </div>
              <div class="col-12 col-sm-3">
                <q-select
                  v-model="sense.perceptionPrecision"
                  :options="perceptionPrecisionOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Info Precision"
                  v-help="'How exact the learned facts are: rough, relative or exact.'"
                />
              </div>
              <div class="col-12 col-sm-3">
                <q-select
                  v-model="sense.observationRequirement"
                  :options="observationRequirementOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Observation Requirement"
                  v-help="'Whether the creature must watch the target first, and how.'"
                />
              </div>
              <div v-if="sense.observationRequirement && sense.observationRequirement !== 'none'" class="col-6 col-sm-2">
                <formula-field
                  :path="`sensesList[id=${encodeURIComponent(sense.id)}].observationMinutes`"
                  label="Minutes"
                  dense
                  outlined
                />
              </div>
              <div class="col-auto">
                <q-checkbox
                  v-model="sense.requiresStudyAction"
                  dense
                  label="Requires Study action"
                  v-help="'The creature must take the Study action to use this sense.'"
                  color="amber"
                  class="text-caption"
                />
              </div>
            </template>

            <!-- Web Sense -->
            <template v-if="sense.name.toLowerCase().includes('web')">
              <div class="col-auto">
                <q-checkbox
                  v-model="sense.webSense"
                  dense
                  label="While touching web, knows exact location of other creatures (Spider)"
                  color="amber"
                  class="text-caption"
                />
              </div>
            </template>

            <!-- Note -->
            <div class="col-12 col-sm">
              <mechanic-text-editor
                v-model="sense.note"
                dense
                outlined
                label="Condition / Custom Trigger"
                  v-help="'Any extra condition, written as it should read on the sheet.'"
                placeholder="e.g. while submerged, stone contact only"
              />
            </div>
          </div>
        </div>
      </div>
      <basic-riders-editor scope="senses" label="Senses riders" />
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import BasicRidersEditor from './BasicRidersEditor.vue'
import MechanicTextEditor from './MechanicTextEditor.vue'
import { computed, defineComponent, ref, watch } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { validateNumber } from './numberInput'
import FormulaField from '../kit/FormulaField.vue'
import { MonsterSenseItem } from 'src/components/models'
import { DndStat } from 'src/core/domain/types'

const LIGHT_IMPAIRMENT_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Blind on Bright Light', value: 'bright_light' },
  { label: 'Blind on Daylight', value: 'daylight' },
  { label: 'Blind on Dim and Bright Light', value: 'dim_and_bright' },
]

const SENSE_SENTIENCE_OPTIONS = [
  { label: 'Location of Intelligent creatures', value: 'location_intelligent' },
  { label: 'Presence of Intelligent creatures', value: 'presence_intelligent' },
  { label: 'Of creatures it can use its Telepathy', value: 'telepathy_creatures' },
]

const DETECTION_MODE_OPTIONS = [
  { label: 'Presence of creatures', value: 'presence' },
  { label: 'Exact location of creatures', value: 'location' },
  { label: 'Location and presence', value: 'both' },
  { label: "Identity (know if it's a specific creature)", value: 'identity' },
  { label: 'All (location, presence, and identity)', value: 'all' },
]

const PERCEIVED_STATS_OPTIONS = [
  'AC',
  'Current HP',
  'Fighter Class Levels',
  'Total Character Levels',
  'Class Levels',
  'Intelligence',
  'Wisdom',
  'Charisma',
  'Vulnerabilities',
  'Resistances',
  'Immunities',
]

const PERCEPTION_PRECISION_OPTIONS = [
  { label: 'Detailed (Exact Values)', value: 'detailed' },
  { label: 'Comparative (Superior / Inferior to Itself)', value: 'comparative' },
]

const OBSERVATION_REQUIREMENT_OPTIONS = [
  { label: 'Immediate (No Delay)', value: 'none' },
  { label: 'After observing for X minutes', value: 'observing' },
  { label: 'After fighting for X minutes', value: 'fighting' },
  { label: 'After observing or fighting for X minutes', value: 'both' },
]

const CREATURE_TYPE_OPTIONS = [
  'living creatures',
  'aberrations',
  'beasts',
  'celestials',
  'constructs',
  'dragons',
  'elementals',
  'fey',
  'fiends',
  'giants',
  'humanoids',
  'monstrosities',
  'oozes',
  'plants',
  'undead',
  'corpses',
  'creatures reduced to 0 hit points',
  'when a creature is reduced to 0 hit points',
  'when a creature makes a death saving throw',
  'when a creature fails its death saving throw',
  'portals',
  'creatures teleporting',
  'origin of a creature teleporting',
  'destination of a creature teleporting',
  'origin and destination of a creature teleporting',
  'when a creature casts a Necromancy spell',
  'creatures casting and concentrating on Necromancy spells',
  'frightened creatures',
  'charmed creatures',
  'poisoned creatures',
  'diseased creatures',
  'cursed creatures',
]

const SENSES_PRESETS: {
  name: string;
  category?: string;
  icon?: string;
  color?: string;
  defaultRange?: number;
  rangeUnit?: 'ft' | 'miles';
  blindBeyond?: boolean;
  acrossPlanes?: boolean;
  echolocation?: boolean;
  devilsSight?: boolean;
  webSense?: boolean;
  lifeSense?: boolean;
  senseSentienceMode?: 'location_intelligent' | 'presence_intelligent' | 'telepathy_creatures';
  detectionMode?: 'presence' | 'location' | 'both' | 'identity' | 'all';
  targetCreatureTypes?: string[];
}[] = [
  { name: 'Blindsight', category: 'Sight & Vibration', icon: 'radar', color: 'teal-4', defaultRange: 60, rangeUnit: 'ft', blindBeyond: false },
  { name: 'Darkvision', category: 'Sight & Vibration', icon: 'nights_stay', color: 'purple-4', defaultRange: 60, rangeUnit: 'ft' },
  { name: 'Ethereal Sight', category: 'Sight & Vibration', icon: 'blur_on', color: 'indigo-4', defaultRange: 60, rangeUnit: 'ft', acrossPlanes: true },
  { name: 'Tremorsense', category: 'Sight & Vibration', icon: 'waves', color: 'amber-5', defaultRange: 60, rangeUnit: 'ft' },
  { name: 'Truesight', category: 'Sight & Vibration', icon: 'visibility', color: 'cyan-4', defaultRange: 120, rangeUnit: 'ft' },
  { name: 'Web Sense', category: 'Sight & Vibration', icon: 'hub', color: 'amber-4', defaultRange: 60, rangeUnit: 'ft', webSense: true },
  { name: 'Detect Magic', category: 'Analytical & Aura', icon: 'auto_fix_high', color: 'purple-4', defaultRange: 0 },
  { name: 'Divine Sense', category: 'Analytical & Aura', icon: 'auto_awesome', color: 'yellow-6', defaultRange: 60, rangeUnit: 'ft', detectionMode: 'location', targetCreatureTypes: ['celestials', 'fiends', 'undead'] },
  { name: 'Life Sense', category: 'Analytical & Aura', icon: 'favorite', color: 'red-4', defaultRange: 5, rangeUnit: 'miles', lifeSense: true, detectionMode: 'presence', targetCreatureTypes: ['living creatures'] },
  { name: 'Sense Sentience', category: 'Analytical & Aura', icon: 'psychology', color: 'pink-4', defaultRange: 60, rangeUnit: 'ft', senseSentienceMode: 'location_intelligent' },
  { name: 'Custom Sense', category: 'Custom', icon: 'edit_note', color: 'grey-4', defaultRange: 30, rangeUnit: 'ft' },
]

export default defineComponent({
  name: 'SensesEditor',
  components: { BasicRidersEditor, MechanicTextEditor, FormulaField },
  setup() {
    const monster = useMonsterStore()
    const selectedSenseToAdd = ref<string | null>(null)

    if (!monster.sensesList) {
      monster.sensesList = []
    }

    // Automatically migrate any legacy numeric monster.senses into monster.sensesList and merge Echolocation/Blindsense into Blindsight
    watch(
      () => [monster.senses, monster.sensesList],
      () => {
        if (!monster.sensesList) monster.sensesList = []
        // Normalize any legacy Echolocation / Blindsense items into Blindsight
        for (const item of monster.sensesList) {
          if (item.name === 'Echolocation' || item.name === 'Blindsense') {
            if (item.name === 'Echolocation') item.echolocation = true
            item.name = 'Blindsight'
          }
        }
        if (monster.senses) {
          const legacyMap: { key: keyof typeof monster.senses; label: string }[] = [
            { key: 'blindsight', label: 'Blindsight' },
            { key: 'darkvision', label: 'Darkvision' },
            { key: 'tremorsense', label: 'Tremorsense' },
            { key: 'truesight', label: 'Truesight' },
          ]
          for (const { key, label } of legacyMap) {
            const val = monster.senses[key]
            if (val && val > 0) {
              const existing = monster.sensesList.find((s) => s.name.toLowerCase() === label.toLowerCase())
              if (!existing) {
                monster.sensesList.push({
                  id: `sense-${key}-${Date.now()}`,
                  name: label,
                  range: val,
                  rangeUnit: 'ft',
                  blindBeyond: false,
                  acrossPlanes: false,
                  echolocation: false,
                  devilsSight: false,
                  webSense: false,
                  lifeSense: false,
                  detectionMode: 'presence',
                  targetCreatureTypes: [],
                  lightImpairment: 'none',
                  note: '',
                })
              }
              monster.senses[key] = 0
            }
          }
        }
      },
      { immediate: true, deep: true }
    )

    const availableSenseOptions = computed(() => {
      const selectedNames = new Set((monster.sensesList || []).map((s) => s.name))
      return SENSES_PRESETS
        .filter((preset) => preset.name === 'Custom Sense' || !selectedNames.has(preset.name))
        .map((preset) => ({
          label: preset.name,
          value: preset.name,
          category: preset.category || 'Sense',
          icon: preset.icon || 'visibility',
          color: preset.color || 'teal-4',
        }))
    })

    const onSenseSelected = (senseName: string | null) => {
      if (!senseName) return
      if (!monster.sensesList) monster.sensesList = []

      const preset = SENSES_PRESETS.find((p) => p.name === senseName)
      const newItem: MonsterSenseItem = {
        id: `sense-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: senseName,
        range: preset?.defaultRange ?? 60,
        rangeUnit: preset?.rangeUnit ?? 'ft',
        blindBeyond: preset?.blindBeyond ?? false,
        acrossPlanes: preset?.acrossPlanes ?? false,
        echolocation: preset?.echolocation ?? false,
        devilsSight: preset?.devilsSight ?? false,
        webSense: preset?.webSense ?? false,
        lifeSense: preset?.lifeSense ?? false,
        senseSentienceMode: preset?.senseSentienceMode ?? 'location_intelligent',
        detectionMode: preset?.detectionMode ?? 'presence',
        targetCreatureTypes: preset?.targetCreatureTypes ? [...preset.targetCreatureTypes] : (senseName === 'Life Sense' ? ['living creatures'] : senseName === 'Divine Sense' ? ['celestials', 'fiends', 'undead'] : []),
        perceivedStats: [],
        perceptionPrecision: 'detailed',
        observationRequirement: 'none',
        observationMinutes: 1,
        requiresStudyAction: false,
        lightImpairment: 'none',
        note: '',
      }

      monster.sensesList.push(newItem)
      selectedSenseToAdd.value = null
    }

    const removeSense = (idx: number) => {
      if (monster.sensesList) {
        const removed = monster.sensesList.splice(idx, 1)[0]
        if (removed && monster.senses) {
          const lower = removed.name.toLowerCase()
          if (lower in monster.senses) {
            monster.senses[lower as keyof typeof monster.senses] = 0
          }
        }
      }
    }

    // Ensure actionOrientedPassives exists cleanly via watcher and sync skills with advantage/disadvantage
    watch(
      () => [monster.actionOrientedPassives, monster.skills],
      () => {
        if (!monster.actionOrientedPassives) {
          monster.actionOrientedPassives = {
            bonusActionSearch: false,
            bonusActionStudy: false,
            bonusActionHide: false,
            bonusActionInfluence: false,
            search: { perception: true, investigation: false, survival: false },
            study: { arcana: false, history: false, nature: false, religion: false },
            hide: { stealth: false },
            influence: { animalHandling: false, insight: false, deception: false, intimidation: false, persuasion: false },
            conditions: {},
          }
        }
        const p = monster.actionOrientedPassives
        const checkAdv = (key: string) => {
          const sk = monster.skills.find((s) => s.key === key)
          return !!(sk?.advantage || sk?.disadvantage)
        }
        if (p.search) {
          if (checkAdv('PERCEPTION')) p.search.perception = true
          if (checkAdv('INVESTIGATION')) p.search.investigation = true
          if (checkAdv('SURVIVAL')) p.search.survival = true
        }
        if (p.study) {
          if (checkAdv('ARCANA')) p.study.arcana = true
          if (checkAdv('HISTORY')) p.study.history = true
          if (checkAdv('NATURE')) p.study.nature = true
          if (checkAdv('RELIGION')) p.study.religion = true
        }
        if (p.hide) {
          if (checkAdv('STEALTH')) p.hide.stealth = true
        }
        if (p.influence) {
          if (checkAdv('ANIMAL')) p.influence.animalHandling = true
          if (checkAdv('INSIGHT')) p.influence.insight = true
          if (checkAdv('DECEPTION')) p.influence.deception = true
          if (checkAdv('INTIMIDATION')) p.influence.intimidation = true
          if (checkAdv('PERSUASION')) p.influence.persuasion = true
        }
      },
      { immediate: true, deep: true }
    )

    const fallbackPassives = {
      bonusActionSearch: false,
      bonusActionStudy: false,
      bonusActionHide: false,
      bonusActionInfluence: false,
      search: { perception: true, investigation: false, survival: false },
      study: { arcana: false, history: false, nature: false, religion: false },
      hide: { stealth: false },
      influence: { animalHandling: false, insight: false, deception: false, intimidation: false, persuasion: false },
      conditions: {},
    }

    const passives = computed(() => {
      const p = monster.actionOrientedPassives
      return {
        get bonusActionSearch() { return p?.bonusActionSearch ?? false },
        set bonusActionSearch(v: boolean) { if (p) p.bonusActionSearch = v },
        get bonusActionStudy() { return p?.bonusActionStudy ?? false },
        set bonusActionStudy(v: boolean) { if (p) p.bonusActionStudy = v },
        get bonusActionHide() { return p?.bonusActionHide ?? false },
        set bonusActionHide(v: boolean) { if (p) p.bonusActionHide = v },
        get bonusActionInfluence() { return p?.bonusActionInfluence ?? false },
        set bonusActionInfluence(v: boolean) { if (p) p.bonusActionInfluence = v },
        get search() {
          if (!p) return fallbackPassives.search
          if (!p.search) p.search = { perception: true, investigation: false, survival: false }
          return p.search
        },
        get study() {
          if (!p) return fallbackPassives.study
          if (!p.study) p.study = { arcana: false, history: false, nature: false, religion: false }
          return p.study
        },
        get hide() {
          if (!p) return fallbackPassives.hide
          if (!p.hide) p.hide = { stealth: false }
          return p.hide
        },
        get influence() {
          if (!p) return fallbackPassives.influence
          if (!p.influence) p.influence = { animalHandling: false, insight: false, deception: false, intimidation: false, persuasion: false }
          return p.influence
        },
        get conditions() {
          if (!p) return fallbackPassives.conditions
          if (!p.conditions) p.conditions = {}
          return p.conditions
        },
      }
    })

    const getPassive = (skillKey: string, fallbackStat: DndStat) => {
      const skill = monster.skills.find((s) => s.key === skillKey)
      const statMod = Math.floor(((monster.stats[fallbackStat] ?? 10) - 10) / 2)
      let bonus = statMod
      if (skill?.override && skill.overrideValue != null) {
        bonus = skill.overrideValue
      } else if (skill) {
        bonus = statMod + (skill.proficient ? monster.proficiency : 0) + (skill.expertise ? monster.proficiency : 0)
      }
      let passive = 10 + bonus
      if (skill?.advantage) passive += 5
      if (skill?.disadvantage) passive -= 5
      return passive
    }

    const senseRangePresets = ['10', '30', '60', '90', '120', '150', '300', '1000']

    return {
      monster,
      senseRangePresets,
      validateNumber,
      passives,
      getPassive,
      selectedSenseToAdd,
      availableSenseOptions,
      onSenseSelected,
      removeSense,
      lightImpairmentOptions: LIGHT_IMPAIRMENT_OPTIONS,
      detectionModeOptions: DETECTION_MODE_OPTIONS,
      senseSentienceOptions: SENSE_SENTIENCE_OPTIONS,
      creatureTypeOptions: CREATURE_TYPE_OPTIONS,
      perceivedStatsOptions: PERCEIVED_STATS_OPTIONS,
      perceptionPrecisionOptions: PERCEPTION_PRECISION_OPTIONS,
      observationRequirementOptions: OBSERVATION_REQUIREMENT_OPTIONS,
    }
  },
})
</script>
