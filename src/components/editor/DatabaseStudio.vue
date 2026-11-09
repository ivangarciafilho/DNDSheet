<template>
  <q-expansion-item
    expand-separator
    icon="data_object"
    label="Database & Custom Presets Studio"
    caption="Define custom parameters, variables, macros, formulas, species, and trait presets"
  >
    <div class="q-pa-md bg-grey-10 text-white rounded-borders">
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey-4 q-mb-md"
        active-color="purple-3"
        indicator-color="purple-4"
        align="left"
      >
        <q-tab name="variables" icon="tune" label="Variables & Parameters" />
        <q-tab name="macros" icon="functions" label="Macros & Formulas" />
        <q-tab name="presets" icon="bookmarks" label="Species & Feature Presets" />
        <q-tab name="backup" icon="sync_alt" label="Export / Import Database" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" animated class="bg-transparent">
        <!-- Variables & Parameters Panel -->
        <q-tab-panel name="variables" class="q-pa-none">
          <div class="text-caption text-grey-4 q-mb-sm">
            Define custom parameters and dynamic variables. Use them anywhere in actions, traits, or descriptions via <code>{VAR_NAME}</code>.
          </div>

          <div class="row q-col-gutter-xs items-center q-mb-sm">
            <q-input
              v-model="newVarKey"
              dense
              outlined
              dark
              label="Variable Key"
              placeholder="e.g. DIVINE_POWER"
              class="col-12 col-sm-4"
              @keyup.enter="addVariable"
            />
            <q-input
              v-model="newVarVal"
              dense
              outlined
              dark
              label="Value / Formula"
              placeholder="e.g. 15 or 2d6 + 4"
              class="col-12 col-sm-6"
              @keyup.enter="addVariable"
            />
            <div class="col-12 col-sm-2">
              <q-btn
                dense
                color="purple-5"
                icon="add"
                label="Add"
                class="full-width"
                :disable="!newVarKey.trim()"
                @click="addVariable"
              />
            </div>
          </div>

          <!-- Existing Variables List -->
          <div v-if="variableEntries.length" class="column q-gutter-y-xs q-mt-xs">
            <div
              v-for="[vKey, vVal] in variableEntries"
              :key="vKey"
              class="row items-center justify-between q-pa-xs bg-grey-9 rounded-borders"
            >
              <div class="row items-center q-gutter-x-sm">
                <q-chip dense color="purple-9" text-color="purple-1" icon="code">
                  {{ '{' + vKey + '}' }}
                </q-chip>
                <span class="text-weight-bold text-amber-3">= {{ vVal }}</span>
              </div>
              <div class="row items-center q-gutter-x-xs">
                <q-btn
                  flat
                  round
                  dense
                  size="xs"
                  icon="content_copy"
                  color="grey-4"
                  @click="copyToken(vKey)"
                >
                  <q-tooltip class="dnd-tip">Copy {{ "{" + vKey + "}" }} to clipboard</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  size="xs"
                  icon="delete"
                  color="negative"
                  @click="removeVariable(vKey)"
                />
              </div>
            </div>
          </div>
          <div v-else class="text-caption text-grey-6 text-center q-pa-md">
            No custom variables defined yet. Add variables above to evaluate dynamically in text.
          </div>
        </q-tab-panel>

        <!-- Macros & Formulas Panel -->
        <q-tab-panel name="macros" class="q-pa-none">
          <div class="text-caption text-grey-4 q-mb-sm">
            Create reusable effect macros and formulas. Referenced in stat blocks as <code>{MACRO_NAME}</code>, expanding into complete formatted phrases.
          </div>

          <div class="row q-col-gutter-xs items-center q-mb-sm">
            <q-input
              v-model="newMacroKey"
              dense
              outlined
              dark
              label="Macro Identifier"
              placeholder="e.g. SMITE_EFFECT"
              class="col-12 col-sm-4"
              @keyup.enter="addMacro"
            />
            <q-input
              v-model="newMacroVal"
              dense
              outlined
              dark
              label="Expansion Phrase / Effect"
              placeholder="e.g. takes 14 (3d8) Radiant damage and is Blinded until end of next turn"
              class="col-12 col-sm-6"
              @keyup.enter="addMacro"
            />
            <div class="col-12 col-sm-2">
              <q-btn
                dense
                color="purple-5"
                icon="add"
                label="Add"
                class="full-width"
                :disable="!newMacroKey.trim()"
                @click="addMacro"
              />
            </div>
          </div>

          <!-- Existing Macros List -->
          <div v-if="macroEntries.length" class="column q-gutter-y-xs q-mt-xs">
            <div
              v-for="[mKey, mVal] in macroEntries"
              :key="mKey"
              class="row items-center justify-between q-pa-xs bg-grey-9 rounded-borders"
            >
              <div class="col">
                <div class="row items-center q-gutter-x-sm">
                  <q-chip dense color="deep-purple-9" text-color="deep-purple-1" icon="bolt">
                    {{ '{' + mKey + '}' }}
                  </q-chip>
                  <span class="text-caption text-grey-3">{{ mVal }}</span>
                </div>
              </div>
              <div class="col-auto row items-center q-gutter-x-xs">
                <q-btn
                  flat
                  round
                  dense
                  size="xs"
                  icon="content_copy"
                  color="grey-4"
                  @click="copyToken(mKey)"
                >
                  <q-tooltip class="dnd-tip">Copy {{ "{" + mKey + "}" }} to clipboard</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  size="xs"
                  icon="delete"
                  color="negative"
                  @click="removeMacro(mKey)"
                />
              </div>
            </div>
          </div>
          <div v-else class="text-caption text-grey-6 text-center q-pa-md">
            No custom macros configured. Add macro templates above to streamline action building.
          </div>
        </q-tab-panel>

        <!-- Species & Feature Presets Panel -->
        <q-tab-panel name="presets" class="q-pa-none">
          <div class="text-caption text-grey-4 q-mb-sm">
            Snapshot and save custom species, racial lineages, or monster archetypes as reusable presets.
          </div>

          <div class="row q-gutter-x-sm items-center q-mb-md">
            <q-input
              v-model="newPresetName"
              dense
              outlined
              dark
              label="Preset Name"
              placeholder="e.g. Celestial Archon Lineage"
              class="col"
            />
            <q-btn
              dense
              color="amber-9"
              icon="bookmark_add"
              label="Save Current Monster as Preset"
              :disable="!newPresetName.trim()"
              @click="saveCurrentAsPreset"
            />
          </div>

          <!-- Saved Presets List -->
          <div v-if="savedPresets.length" class="column q-gutter-y-xs">
            <div
              v-for="(preset, pIdx) in savedPresets"
              :key="preset.id || pIdx"
              class="row items-center justify-between q-pa-sm bg-grey-9 rounded-borders"
            >
              <div>
                <div class="text-weight-bold text-purple-2">{{ preset.name }}</div>
                <div class="text-xs text-grey-4">
                  {{ preset.type }} ({{ preset.subtype || 'none' }}) · {{ preset.traits?.length || 0 }} Traits · Speeds: {{ formatSpeeds(preset.speeds) }}
                </div>
              </div>
              <div class="row items-center q-gutter-x-xs">
                <q-btn
                  dense
                  size="sm"
                  color="primary"
                  icon="play_arrow"
                  label="Apply"
                  @click="applyPreset(preset)"
                />
                <q-btn
                  flat
                  round
                  dense
                  size="xs"
                  icon="delete"
                  color="negative"
                  v-if="!preset.isBuiltin" @click="deletePreset(pIdx)"
                />
              </div>
            </div>
          </div>
          <div v-else class="text-caption text-grey-6 text-center q-pa-md">
            No custom presets saved in your local database. Click above to save the current monster configuration.
          </div>
        </q-tab-panel>

        <!-- Backup & Migration Panel -->
        <q-tab-panel name="backup" class="q-pa-none">
          <div class="text-caption text-grey-4 q-mb-sm">
            Export and import your custom database (variables, macros, and presets) as JSON to share across campaigns or preserve between sessions.
          </div>

          <div class="row q-gutter-sm items-center q-mb-md">
            <q-btn
              dense
              color="positive"
              icon="download"
              label="Export Database JSON"
              @click="exportDatabase"
            />
            <q-btn
              dense
              outline
              color="cyan-3"
              icon="upload"
              label="Import Database JSON"
              @click="triggerImport"
            />
            <input
              ref="fileInputRef"
              type="file"
              accept=".json"
              style="display: none"
              @change="handleFileImport"
            />
          </div>

          <q-input
            v-model="databaseJsonPreview"
            type="textarea"
            rows="6"
            outlined
            dark
            readonly
            label="Database JSON Payload"
            class="text-mono text-xs"
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { useQuasar } from 'quasar'


export const BUILTIN_PRESETS = [
  {
    id: 'preset-ezra-meridian',
    name: 'Ezra Meridian Aethelgard (Master Celestial Archetype)',
    isBuiltin: true,
    type: 'Celestial',
    subtype: '',
    size: 'Medium',
    alignment: 'Lawful Good',
    CR: 3,
    proficiency: 2,
    AC: 15,
    ACType: 'Attacker must Succeed on a Wisdom Saving Throw DC 15, On Failure Knocks Prone',
    HP: { HD: 15, type: 'd8', modifier: 45 },
    hpModifierOverride: true,
    hpNotes: 'Bloodied (56); Returns with 1 hit point if Not Reduced to 0 by necrotic',
    speeds: [{ type: 'walk', speed: 30 }, { type: 'tracking', speed: 30 }],
    sensesList: [
      { name: 'Divine Sense', acrossPlanes: true, range: 60, rangeUnit: 'ft', customText: 'presence of celestials, fiends, undead' },
      { name: 'Darkvision', range: 60, rangeUnit: 'ft', customText: 'ignore Magical Darkness' }
    ],
    languages: 'Common, Celestial, Dead (as Speak with Dead; up to 5 questions, corpse must have a mouth, dead within 10 days, answers may be brief or cryptic)',
    resistances: ['radiant', 'charmed ^^', 'frightened ^^'],
    vulnerabilities: ['poison vv', 'necrotic vv'],
    stats: { STR: 8, DEX: 12, CON: 16, INT: 12, WIS: 16, CHA: 20 },
    saves: {
      STR: { proficient: true, override: false, overrideValue: 0 },
      DEX: { proficient: true, override: false, overrideValue: 0 },
      CON: { proficient: true, override: false, overrideValue: 0 },
      INT: { proficient: true, override: false, overrideValue: 0 },
      WIS: { proficient: true, override: false, overrideValue: 0 },
      CHA: { proficient: true, override: false, overrideValue: 0 }
    },
    initiative: {
      advantage: false,
      disadvantage: true,
      notes: 'can cast Thaumaturgy, can cast Compelled Duel'
    },
    compactNameplate: true,
    showXp: true,
    actions: [
      {
        id: 'astral-binding',
        name: 'Astral Binding',
        spellLevel: 'Cantrip',
        school: 'Evocation',
        components: ['V', 'S'],
        recharge: '4–12',
        targeting: { count: 3, kind: 'enemies', range: 60, context: 'you can see 60 ft. of you across the Material and Ethereal Planes' },
        attackBonus: 7,
        attackType: 'Ranged Spell Attack',
        description: 'On Hit: 9 (1d8 + 5) Speed reduced by 10ft, if 0ft at End Of Turn, its knocked Prone.'
      }
    ],
    bonusActions: [
      {
        id: 'exorcise',
        name: 'Exorcise',
        spellLevel: 'Cantrip',
        school: 'Abjuration',
        components: ['V', 'S'],
        duration: '1 round',
        recharge: '6–12',
        targeting: { kind: 'enemies', range: 20, context: 'enemies 20 ft. of you across the Ethereal and Material Planes' },
        saveDc: 15,
        saveStat: 'Charisma',
        description: 'On Success: takes 13 (3d8) Radiant, otherwise, double and until End Of Turn, Suppresses its effects leaving one or more creatures Possessed or Charmed by it, brought into the Material Plane if on the Ethereal Plane to closest unoccupied space, without Immunity to being Grappled and Prone.'
      }
    ],
    spellcasting: {
      standard: ['Prestidigitation', 'Mage Hand', 'Protection from Evil and Good', 'Hellish Rebuke', 'Invisibility', 'Hold Person', 'Misty Step', 'Remove Curse', 'Counterspell', 'Dispel Magic', 'Magic Circle'],
      class: 'Warlock',
      level: 8,
      stat: 'CHA',
      resourceType: 'pact',
      slots: [0, 0, 3, 0, 0, 0, 0, 0, 0],
      refreshRate: 'Short Rest',
      spellCadenceMap: {
        'Misty Step': 'Long Rest',
        'Magic Circle': 'Long Rest'
      },
      metamagic: {
        enabled: true,
        points: 4,
        refreshRate: 'Long Rest',
        options: ['Quickened Spell', 'Twinned Spell']
      }
    }
  }
];

export default defineComponent({
  name: 'DatabaseStudio',
  setup() {
    const monster = useMonsterStore()
    const $q = useQuasar()
    const activeTab = ref('variables')

    // Variables state
    const newVarKey = ref('')
    const newVarVal = ref('')
    const variableEntries = computed(() => {
      return Object.entries(monster.customVariables || {})
    })

    const addVariable = () => {
      const key = newVarKey.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
      if (!key) return
      if (!monster.customVariables) monster.customVariables = {}
      monster.customVariables[key] = newVarVal.value.trim()
      newVarKey.value = ''
      newVarVal.value = ''
      $q.notify({ type: 'positive', message: `Added parameter {${key}}` })
    }

    const removeVariable = (key: string) => {
      if (monster.customVariables) {
        delete monster.customVariables[key]
        $q.notify({ type: 'info', message: `Removed parameter {${key}}` })
      }
    }

    // Macros state
    const newMacroKey = ref('')
    const newMacroVal = ref('')
    const macroEntries = computed(() => {
      return Object.entries(monster.customMacros || {})
    })

    const addMacro = () => {
      const key = newMacroKey.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
      if (!key) return
      if (!monster.customMacros) monster.customMacros = {}
      monster.customMacros[key] = newMacroVal.value.trim()
      newMacroKey.value = ''
      newMacroVal.value = ''
      $q.notify({ type: 'positive', message: `Added macro {${key}}` })
    }

    const removeMacro = (key: string) => {
      if (monster.customMacros) {
        delete monster.customMacros[key]
        $q.notify({ type: 'info', message: `Removed macro {${key}}` })
      }
    }

    const copyToken = (token: string) => {
      navigator.clipboard.writeText(`{${token}}`)
      $q.notify({ type: 'positive', message: `Copied {${token}} to clipboard` })
    }

    // Presets state
    const newPresetName = ref('')
    const savedPresets = computed({
      get: () => {
        const userPresets = (monster.customDatabase?.presets as any[]) || []
        return [...BUILTIN_PRESETS, ...userPresets]
      },
      set: (val: any[]) => {
        if (!monster.customDatabase) monster.customDatabase = {}
        monster.customDatabase.presets = val.filter((p) => !p.isBuiltin)
      }
    })

    const formatSpeeds = (speeds: any[]) => {
      if (!Array.isArray(speeds)) return '30 ft.'
      return speeds.map((s) => `${s.type ? s.type + ' ' : ''}${s.speed} ft.`).join(', ')
    }

    const saveCurrentAsPreset = () => {
      const name = newPresetName.value.trim()
      if (!name) return
      const preset = {
        id: `preset-${Date.now()}`,
        name,
        type: monster.type,
        subtype: monster.subtype,
        size: monster.size,
        speeds: JSON.parse(JSON.stringify(monster.speeds || [])),
        senses: JSON.parse(JSON.stringify(monster.senses || {})),
        resistances: [...(monster.resistances || [])],
        immunities: [...(monster.immunities || [])],
        vulnerabilities: [...(monster.vulnerabilities || [])],
        traits: JSON.parse(JSON.stringify(monster.traits || [])),
        languages: monster.languages,
      }
      if (!monster.customDatabase) monster.customDatabase = {}
      if (!monster.customDatabase.presets) monster.customDatabase.presets = []
      monster.customDatabase.presets.push(preset)
      newPresetName.value = ''
      $q.notify({ type: 'positive', message: `Saved preset "${name}" to database` })
    }

    const applyPreset = (preset: any) => {
      $q.dialog({
        title: `Apply Preset "${preset.name}"?`,
        message: preset.isBuiltin
          ? 'This will load the complete monster archetype with stats, abilities, spellcasting, and compact nameplate.'
          : 'This will merge species traits, speeds, and defenses into your monster.',
        ok: 'Apply',
        cancel: true,
      }).onOk(() => {
        monster.$patch((state) => {
          if (preset.name && preset.isBuiltin) state.name = preset.name.replace(/\s*\(Master.*\)$/, '')
          if (preset.type) state.type = preset.type
          if (preset.subtype !== undefined) state.subtype = preset.subtype
          if (preset.size) state.size = preset.size
          if (preset.alignment) state.alignment = preset.alignment
          if (preset.CR !== undefined) state.CR = preset.CR
          if (preset.AC !== undefined) state.AC = preset.AC
          if (preset.ACType !== undefined) state.ACType = preset.ACType
          if (preset.HP) state.HP = JSON.parse(JSON.stringify(preset.HP))
          if (preset.hpNotes) (state as any).hpNotes = preset.hpNotes
          if (preset.speeds) state.speeds = JSON.parse(JSON.stringify(preset.speeds))
          if (preset.senses) state.senses = JSON.parse(JSON.stringify(preset.senses))
          if (preset.sensesList) (state as any).sensesList = JSON.parse(JSON.stringify(preset.sensesList))
          if (preset.languages) state.languages = preset.languages
          if (preset.stats) state.stats = JSON.parse(JSON.stringify(preset.stats))
          if (preset.saves) state.saves = JSON.parse(JSON.stringify(preset.saves))
          if (preset.initiative) (state as any).initiative = JSON.parse(JSON.stringify(preset.initiative))
          if (preset.compactNameplate !== undefined) state.compactNameplate = preset.compactNameplate
          if (preset.showXp !== undefined) state.showXp = preset.showXp
          if (preset.actions) state.actions = JSON.parse(JSON.stringify(preset.actions))
          if (preset.bonusActions && Array.isArray((state as any).bonusActions)) (state as any).bonusActions = JSON.parse(JSON.stringify(preset.bonusActions))
          if (preset.spellcasting) state.spellcasting = JSON.parse(JSON.stringify(preset.spellcasting))
          if (preset.traits && Array.isArray(preset.traits)) {
            for (const t of preset.traits) {
              if (!state.traits.some((ex) => ex.name.toLowerCase() === t.name.toLowerCase())) {
                state.traits.push(JSON.parse(JSON.stringify(t)))
              }
            }
          }
          if (preset.resistances && Array.isArray(preset.resistances)) {
            for (const r of preset.resistances) {
              if (!state.resistances.includes(r)) state.resistances.push(r)
            }
          }
          if (preset.vulnerabilities && Array.isArray(preset.vulnerabilities)) {
            for (const v of preset.vulnerabilities) {
              if (!state.vulnerabilities.includes(v)) state.vulnerabilities.push(v)
            }
          }
        })
        $q.notify({ type: 'positive', message: `Applied preset "${preset.name}"` })
      })
    }

    const deletePreset = (idx: number) => {
      if (monster.customDatabase?.presets) {
        monster.customDatabase.presets.splice(idx, 1)
        $q.notify({ type: 'info', message: 'Preset deleted' })
      }
    }

    // Export & Import
    const fileInputRef = ref<HTMLInputElement | null>(null)
    const databaseJsonPreview = computed(() => {
      return JSON.stringify(
        {
          variables: monster.customVariables || {},
          macros: monster.customMacros || {},
          presets: monster.customDatabase?.presets || [],
        },
        null,
        2
      )
    })

    const exportDatabase = () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(databaseJsonPreview.value)
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `dndsheet-database-${Date.now()}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      $q.notify({ type: 'positive', message: 'Database exported as JSON' })
    }

    const triggerImport = () => {
      fileInputRef.value?.click()
    }

    const handleFileImport = (event: Event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string)
          if (parsed.variables) {
            monster.customVariables = { ...(monster.customVariables || {}), ...parsed.variables }
          }
          if (parsed.macros) {
            monster.customMacros = { ...(monster.customMacros || {}), ...parsed.macros }
          }
          if (parsed.presets && Array.isArray(parsed.presets)) {
            if (!monster.customDatabase) monster.customDatabase = {}
            monster.customDatabase.presets = [...(monster.customDatabase.presets || []), ...parsed.presets]
          }
          $q.notify({ type: 'positive', message: 'Database imported successfully!' })
        } catch (err: any) {
          $q.notify({ type: 'negative', message: `Failed to import JSON: ${err.message}` })
        }
      }
      reader.readAsText(file)
      target.value = ''
    }

    return {
      activeTab,
      newVarKey,
      newVarVal,
      variableEntries,
      addVariable,
      removeVariable,
      newMacroKey,
      newMacroVal,
      macroEntries,
      addMacro,
      removeMacro,
      copyToken,
      newPresetName,
      savedPresets,
      formatSpeeds,
      saveCurrentAsPreset,
      applyPreset,
      deletePreset,
      fileInputRef,
      databaseJsonPreview,
      exportDatabase,
      triggerImport,
      handleFileImport,
    }
  },
})
</script>
