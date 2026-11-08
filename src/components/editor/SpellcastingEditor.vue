<template>
  <q-expansion-item
    expand-separator
    icon="auto_fix_high"
    :label="$t('editor.spellcasting.label')"
    :caption="multiclassSummaryCaption || $t('editor.spellcasting.caption')"
  >
    <!-- Master Stacked Spellcasting Consolidation Panel (Unified Engine Housing All Systems) -->
    <div class="q-mx-sm q-my-xs q-pa-sm rounded-borders bg-grey-10 text-white" style="border: 2px solid #a855f7; box-shadow: 0 2px 10px rgba(168, 85, 247, 0.25);">
      <div class="row items-center justify-between q-mb-xs">
        <div class="row items-center q-gutter-x-sm">
          <q-icon name="hub" color="purple-3" size="sm" />
          <span class="text-subtitle2 text-weight-bold text-purple-2">Master Spellcasting Consolidation Engine</span>
        </div>
        <div class="row items-center q-gutter-x-xs">
          <q-chip dense color="purple-9" text-color="purple-1" icon="auto_fix_high">
            Combined Caster Level: <b>{{ combinedCasterLevel }}</b>
          </q-chip>
          <q-btn
            flat
            dense
            size="xs"
            color="amber-4"
            icon="filter_list"
            label="Restricted Cadence Filter"
            @click="showFilterPanel = !showFilterPanel"
          >
            <q-tooltip class="dnd-tip">Configure high-cadence / not-always-available spell filtering</q-tooltip>
          </q-btn>
          <q-btn flat round dense size="sm" icon="add" color="purple-2" @click="addNewCastingClass">
            <q-tooltip class="dnd-tip">Stack an additional spellcasting class or subclass</q-tooltip>
          </q-btn>
          <q-btn flat round dense size="sm" icon="library_add" color="cyan-3" @click="addSpell">
            <q-tooltip class="dnd-tip">{{ $t('editor.spellcasting.custom.create') }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div class="text-caption text-grey-4 q-mb-xs">
        Unified engine consolidating all stacked spell systems into the monster stat block. Each class manages its own stored spells, level cadences, and Action vs Bonus Action casting economy.
      </div>

      <!-- High-Cadence / Not Always Available Configuration Filter Panel -->
      <q-slide-transition>
        <div v-show="showFilterPanel || monster.spellcasting?.splitHighCadence" class="q-pa-xs q-my-xs rounded-borders bg-grey-9 text-caption" style="border: 1px dashed #a855f7;">
          <div class="row items-center justify-between q-mb-xs">
            <div class="row items-center q-gutter-x-xs">
              <q-toggle
                v-model="monster.spellcasting.splitHighCadence"
                dense
                color="purple-4"
                label="Split High-Cadence Spells into Appended Secondary Cell"
              />
            </div>
            <span class="text-grey-4 text-xs">Spells matching selected cadences append to bottom cell</span>
          </div>
          <div class="row items-center q-gutter-xs flex-wrap">
            <span class="text-weight-bold text-grey-3 q-mr-xs">Restricted Cadences:</span>
            <q-chip
              v-for="cadence in RESTRICTED_CADENCE_OPTIONS"
              :key="cadence"
              clickable
              dense
              size="sm"
              :color="isCadenceActiveFilter(cadence) ? 'purple-7' : 'grey-8'"
              :text-color="isCadenceActiveFilter(cadence) ? 'white' : 'grey-4'"
              @click="toggleCadenceFilter(cadence)"
            >
              {{ cadence }}
            </q-chip>
          </div>
        </div>
      </q-slide-transition>

      <!-- Stacked Systems Overview Grid -->
      <div class="row q-col-gutter-xs q-mt-xs q-mb-sm">
        <!-- Primary Class Card -->
        <div class="col-12 col-sm-6 col-md-4">
          <div class="q-pa-xs rounded-borders bg-grey-9 text-caption row items-center justify-between" style="border: 1.5px solid #a855f7;">
            <div class="col">
              <div class="text-weight-bold text-purple-3">Primary: {{ classDisplayValue || 'Custom Caster' }} Lvl {{ monster.spellcasting.level }}</div>
              <div class="text-grey-4 text-xs">{{ monster.spellcasting.stat }} · DC {{ spellSaveValue }} · Atk +{{ spellAttackValue }} · {{ primarySpellsCount }} Spells</div>
            </div>
            <div class="col-auto">
              <q-badge color="purple-8" label="Primary" />
            </div>
          </div>
        </div>

        <!-- Extra Stacked Classes Cards -->
        <div v-for="(clsEntry, cIdx) in stackedClasses" :key="clsEntry.id || cIdx" class="col-12 col-sm-6 col-md-4">
          <div class="q-pa-xs rounded-borders bg-grey-9 text-caption row items-center justify-between" style="border: 1px dashed #c084fc;">
            <div class="col">
              <div class="text-weight-bold text-cyan-3">{{ clsEntry.className }}{{ clsEntry.subclass ? ` (${clsEntry.subclass})` : '' }} Lvl {{ clsEntry.level }}</div>
              <div class="text-grey-4 text-xs">{{ clsEntry.stat || monster.spellcasting.stat }} · {{ (clsEntry.spells || []).length }} Spells</div>
            </div>
            <div class="col-auto">
              <q-btn flat round dense size="xs" color="red-4" icon="close" @click="removeStackedClass(cIdx)">
                <q-tooltip class="dnd-tip">Remove this stacked class</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Innate Casting Card -->
        <div v-if="monster.spellcasting?.atWill && monster.spellcasting.atWill.length > 0" class="col-12 col-sm-6 col-md-4">
          <div class="q-pa-xs rounded-borders bg-grey-9 text-caption row items-center justify-between" style="border: 1px solid rgba(255,255,255,0.2);">
            <div class="col">
              <div class="text-weight-bold text-amber-3">Innate Spellcasting</div>
              <div class="text-grey-4 text-xs">{{ monster.spellcasting.stat }} · {{ monster.spellcasting.atWill.length }} Innate Spells</div>
            </div>
            <div class="col-auto">
              <q-badge color="amber-9" label="Innate" />
            </div>
          </div>
        </div>
      </div>

      <!-- Integrated Primary & Stacked Casting Engine Cards -->
      <class-casting-editor />

      <!-- Integrated Innate Spellcasting Card -->
      <at-will-casting-editor />
    </div>
  </q-expansion-item>
</template>

<script lang="ts">
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, defineComponent, ref } from 'vue'
import { useStats } from 'src/data/STAT'
import { useClasses } from 'src/data/CLASS'
import { useSpellsStore } from 'src/stores/spells-store'
import { useQuasar } from 'quasar'
import NewSpellDialog from '../spell/NewSpellDialog.vue'
import ClassCastingEditor from './ClassCastingEditor.vue'
import AtWillCastingEditor from './AtWillCastingEditor.vue'

export default defineComponent({
  name: 'SpellcastingEditor',
  components: {
    ClassCastingEditor,
    AtWillCastingEditor,
  },
  setup() {
    const monster = useMonsterStore()
    const spells = useSpellsStore()
    const classes = useClasses()
    const { statOptionsShort } = useStats()
    const $q = useQuasar()

    const classDisplayValue = computed(() => {
      if (monster.spellcasting?.class == null) return ''

      return monster.spellcasting.class in classes.SrdClass.value
        ? classes.SrdClass.value[
            monster.spellcasting.class as keyof typeof classes.SrdClass.value
          ]
        : monster.spellcasting.class
    })

    const multiclassSummaryCaption = computed(() => {
      const multi = monster.spellcasting?.multiclass
      if (multi?.enabled && multi.classes?.length) {
        const primary = `${classDisplayValue.value || 'Class'} ${monster.spellcasting.level}`
        const extraList = multi.classes.map(c => `${c.className} ${c.level}`).join(' / ')
        return `Multiclass: ${primary} / ${extraList}`
      }
      return undefined
    })

    const spellSaveValue = computed(() =>
      monster.spellcasting?.save?.override
        ? monster.spellcasting.save.overrideValue
        : monster.defaultSpellSave(monster.spellcasting?.stat || 'INT')
    )
    const spellAttackValue = computed(() =>
      monster.spellcasting?.attack?.override
        ? monster.spellcasting.attack.overrideValue
        : monster.defaultSpellAttackModifier(monster.spellcasting?.stat || 'INT')
    )
    const spellModifierValue = computed(() =>
      monster.spellcasting?.modifier?.override
        ? monster.spellcasting.modifier.overrideValue
        : monster.defaultSpellModifier(monster.spellcasting?.stat || 'INT')
    )

    const addSpell = () => {
      $q.dialog({
        component: NewSpellDialog,
      })
    }

    const stackedClasses = computed(() => {
      return monster.spellcasting.classes || monster.spellcasting.multiclass?.classes || []
    })

    const combinedCasterLevel = computed(() => {
      const classesList = stackedClasses.value
      if (Array.isArray(classesList) && classesList.length > 0) {
        let full = 0, half = 0, third = 0, artificer = 0
        const categorize = (clsName: string, lvl: number) => {
          const c = (clsName || '').toLowerCase()
          if (['wizard', 'cleric', 'druid', 'sorcerer', 'bard'].includes(c)) full += lvl
          else if (['paladin', 'ranger'].includes(c)) half += lvl
          else if (['artificer'].includes(c)) artificer += lvl
          else if (['fighter', 'rogue'].includes(c)) third += lvl
          else full += lvl
        }
        categorize(monster.spellcasting.class || '', monster.spellcasting.level || 1)
        for (const extra of classesList) {
          categorize(extra.className, extra.level)
        }
        return Math.max(1, full + Math.floor(half / 2) + Math.ceil(artificer / 2) + Math.floor(third / 3))
      }
      return monster.spellcasting.level || 1
    })

    const primarySpellsCount = computed(() => {
      let count = 0
      for (let i = 0; i <= 9; i++) {
        count += monster.knownSpellsOfLevel(i).length
      }
      return count
    })

    const addNewCastingClass = () => {
      if (!monster.spellcasting.classes) {
        monster.spellcasting.classes = []
      }
      const newEntry = {
        id: 'class-' + Date.now(),
        className: 'Cleric',
        subclass: '',
        level: 3,
        stat: 'WIS' as const,
        spells: []
      }
      monster.spellcasting.classes.push(newEntry)
      if (!monster.spellcasting.multiclass) {
        monster.spellcasting.multiclass = {
          enabled: true,
          classes: monster.spellcasting.classes
        }
      } else {
        monster.spellcasting.multiclass.enabled = true
        monster.spellcasting.multiclass.classes = monster.spellcasting.classes
      }
    }

    const removeStackedClass = (index: number) => {
      if (monster.spellcasting.classes) {
        monster.spellcasting.classes.splice(index, 1)
      }
      if (monster.spellcasting.multiclass?.classes && monster.spellcasting.multiclass.classes !== monster.spellcasting.classes) {
        monster.spellcasting.multiclass.classes.splice(index, 1)
      }
    }

    const showFilterPanel = ref(false)
    const RESTRICTED_CADENCE_OPTIONS = [
      'Short Rest',
      'Long Rest',
      'Midnight',
      'Midday',
      'Dusk',
      'Dawn',
      'Downtime',
      'Ritual',
      'Weekly',
      'Monthly',
      'Yearly',
    ]

    const isCadenceActiveFilter = (cadence: string): boolean => {
      const activeList = monster.spellcasting?.restrictedCadences || []
      const c = cadence.toLowerCase()
      return activeList.some((x: string) => x.toLowerCase() === c)
    }

    const toggleCadenceFilter = (cadence: string) => {
      if (!Array.isArray(monster.spellcasting.restrictedCadences)) {
        monster.spellcasting.restrictedCadences = [
          'short rest',
          'long rest',
          'midnight',
          'midday',
          'dusk',
          'dawn',
          'downtime',
          'ritual',
          'weekly',
          'monthly',
          'yearly',
        ]
      }
      const c = cadence.toLowerCase()
      const idx = monster.spellcasting.restrictedCadences.findIndex((x: string) => x.toLowerCase() === c)
      if (idx >= 0) {
        monster.spellcasting.restrictedCadences.splice(idx, 1)
      } else {
        monster.spellcasting.restrictedCadences.push(c)
      }
    }

    return {
      monster,
      statOptions: statOptionsShort,
      spellSaveValue,
      spellAttackValue,
      spellModifierValue,
      classDisplayValue,
      multiclassSummaryCaption,
      combinedCasterLevel,
      stackedClasses,
      primarySpellsCount,
      showFilterPanel,
      RESTRICTED_CADENCE_OPTIONS,
      isCadenceActiveFilter,
      toggleCadenceFilter,
      addNewCastingClass,
      removeStackedClass,
      spellOptionsByLevel: computed(() => spells.spellOptionsByLevel),
      addSpell,
      ...classes,
    }
  },
})
</script>
