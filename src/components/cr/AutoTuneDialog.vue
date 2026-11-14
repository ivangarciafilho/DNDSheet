<template>
  <q-dialog v-model="isOpen">
    <q-card style="width: 760px; max-width: 95vw" class="q-pa-sm" data-autotune-dialog>
      <q-card-section class="row items-center q-pb-none">
        <div class="row items-center q-gutter-sm">
          <q-icon name="mdi-tune" size="28px" color="primary" />
          <div>
            <div class="text-h6 text-weight-bold">CR Auto-Tuner</div>
            <div class="text-caption text-grey-5">
              Preview-first, source-first rebalancing · Evaluated rev #{{ session.sourceRevision }} · Live rev #{{ currentRevision }}
            </div>
          </div>
        </div>
        <q-space />
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="refresh"
          label="Refresh"
          data-autotune-refresh
          class="q-mr-xs"
          @click="rebuildPlan()"
        />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-banner
          v-if="session.stale"
          dense
          rounded
          class="bg-warning text-dark q-mb-md"
          data-autotune-stale-banner
        >
          Preview is from revision #{{ session.sourceRevision }}, but the statblock is now at revision #{{ currentRevision }}. Refresh before applying changes.
          <template #action>
            <q-btn flat color="dark" label="Refresh Preview" @click="rebuildPlan()" />
          </template>
        </q-banner>

        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="selectedCr"
              v-help="'Desired Challenge Rating target used to compute Defensive and Offensive adjustments.'"
              filled
              dense
              emit-value
              map-options
              :options="crOptions"
              label="Target Challenge Rating (CR)"
            >
              <template #prepend>
                <q-icon name="mdi-sword-cross" color="red-9" />
              </template>
            </q-select>
          </div>
          <div class="col-12 col-sm-6 text-body2">
            <div>
              Current CR:
              <strong class="text-primary">{{ currentCrLabel }}</strong>
              <span> → </span>
              Target CR:
              <strong class="text-secondary">{{ selectedCr }}</strong>
            </div>
            <div class="text-caption text-grey-4" data-autotune-cr-delta>
              Estimated CR: {{ plan.originalCr }} → {{ plan.projectedCr }}
              · eHP {{ Math.round(plan.currentEvaluation.ehp) }} → {{ Math.round(plan.projectedEvaluation.ehp) }}
              · DPR {{ Math.round(plan.currentEvaluation.damagePerRound) }} → {{ Math.round(plan.projectedEvaluation.damagePerRound) }}
            </div>
          </div>
        </div>

        <div class="row q-gutter-sm q-mt-xs">
          <q-checkbox
            v-model="scaleAttacks"
            v-help="'Proportionally adjust attack damage dice to meet the target DPR.'"
            label="Scale attack damage dice proportionally"
            dense
          />
          <q-checkbox
            v-model="preserveStats"
            v-help="'Keep ability scores fixed and adjust proficiency, HP, AC, and attacks instead.'"
            label="Preserve core ability scores"
            dense
          />
        </div>

        <q-banner
          v-if="plan.bindingWarnings.length > 0"
          dense
          rounded
          class="bg-blue-grey-10 text-grey-2 q-mt-md"
          data-autotune-binding-warnings
        >
          <div v-for="(warning, idx) in plan.bindingWarnings" :key="idx" class="text-caption">
            {{ warning }}
          </div>
        </q-banner>

        <q-separator class="q-my-md" />

        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle1 text-weight-bold">
            Planned Rebalancing Adjustments ({{ selectedCount }}/{{ actionableCount }} selected)
          </div>
          <div v-if="actionableCount > 0" class="row q-gutter-xs">
            <q-btn flat dense no-caps size="sm" label="Select All" @click="selectAll" />
            <q-btn flat dense no-caps size="sm" label="Clear" @click="clearSelection" />
          </div>
        </div>

        <div v-if="plan.recommendations.length === 0" class="text-positive q-my-md row items-center">
          <q-icon name="check_circle" size="24px" class="q-mr-sm" />
          <span>Monster stats already match target CR {{ selectedCr }} specifications.</span>
        </div>

        <q-list v-else bordered separator class="rounded-borders">
          <q-item
            v-for="rec in plan.recommendations"
            :key="rec.id"
            class="q-py-sm"
            :data-autotune-rec="rec.id"
          >
            <q-item-section avatar>
              <q-checkbox
                v-if="!rec.advisoryOnly"
                v-help="'Include or exclude this individual recommendation from the applied batch.'"
                :model-value="selectedFieldIds.includes(rec.id)"
                dense
                @update:model-value="val => toggleField(rec.id, val)"
              />
              <q-icon v-else name="link" color="amber-6" size="20px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium row items-center q-gutter-xs">
                <q-chip
                  :color="categoryColor(rec.category)"
                  text-color="white"
                  dense
                  size="sm"
                  class="text-weight-bold"
                >
                  {{ rec.category }}
                </q-chip>
                <span>{{ rec.field }}:</span>
                <span class="text-strike text-grey-5">{{ rec.currentValue }}</span>
                <span>→</span>
                <strong class="text-primary">{{ rec.recommendedValue }}</strong>
                <q-badge v-if="rec.sourceBacked" color="teal-7" label="Source-First" />
                <q-badge v-if="rec.boundPath" color="amber-8" :label="`Bound: ${rec.boundPath}`" />
              </q-item-label>
              <q-item-label caption>
                {{ rec.explanation }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn v-close-popup flat label="Cancel" color="grey-6" />
        <q-btn
          unelevated
          color="primary"
          icon="mdi-auto-fix"
          :label="`Apply ${selectedCount || 1} Adjustment(s) (Single Undo)`"
          :disable="session.stale || (actionableCount > 0 && selectedCount === 0 && plan.tunedMonster.CR === monsterStore.CR)"
          data-autotune-apply
          @click="applyTuning"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useMonsterStore } from 'src/stores/monster-store'
import { useMonsterSessionStore } from 'src/stores/monster-session'
import { CR } from 'src/core/domain/cr-tables'
import {
  applyAutoTuneSession,
  createAutoTuneSession,
  markAutoTuneSessionStale,
  type AutoTuneSession,
} from 'src/core/usecases/AutoTuneCr'
import type { Monster } from 'src/core/domain/types'

export default defineComponent({
  name: 'AutoTuneDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const $q = useQuasar()
    const monsterStore = useMonsterStore()
    const monsterSession = useMonsterSessionStore()

    const isOpen = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val),
    })

    const crOptions = CR.map((tier) => ({
      label: `CR ${tier.cr} (${tier.xp.toLocaleString()} XP)`,
      value: tier.cr,
    }))

    const initialTier = CR[monsterStore.CR] || CR[0]
    const selectedCr = ref<string>(initialTier.cr)
    const scaleAttacks = ref<boolean>(true)
    const preserveStats = ref<boolean>(false)
    const selectedFieldIds = ref<string[]>([])
    let selectionInitialized = false
    let applyingTune = false

    const currentRevision = computed(() => monsterSession.contentRevision)
    const currentCrLabel = computed(() => (CR[monsterStore.CR] || CR[0]).cr)

    const buildSession = (customSelection?: string[]): AutoTuneSession => {
      const monsterData = monsterStore.$state as unknown as Monster
      const rev = monsterSession.contentRevision
      const base = createAutoTuneSession(monsterData, selectedCr.value, rev, {
        scaleAttacksProportionally: scaleAttacks.value,
        preserveAbilityScores: preserveStats.value,
        selectedIds: customSelection,
      })
      if (!customSelection && !selectionInitialized) {
        selectedFieldIds.value = base.plan.recommendations
          .filter((r) => !r.advisoryOnly)
          .map((r) => r.id)
        selectionInitialized = true
      }
      return base
    }

    const session = ref<AutoTuneSession>(buildSession())

    const rebuildPlan = (resetSelection = false) => {
      if (resetSelection) selectionInitialized = false
      session.value = buildSession(resetSelection ? undefined : selectedFieldIds.value)
      if (resetSelection) {
        selectedFieldIds.value = session.value.plan.recommendations
          .filter((r) => !r.advisoryOnly)
          .map((r) => r.id)
      }
    }

    watch(
      () => props.modelValue,
      (open) => {
        if (open) {
          selectedCr.value = (CR[monsterStore.CR] || CR[0]).cr
          rebuildPlan(true)
        }
      },
      { immediate: true }
    )

    watch([selectedCr, scaleAttacks, preserveStats], () => {
      if (props.modelValue) rebuildPlan(true)
    })

    watch(
      () => monsterSession.contentRevision,
      (nextRev) => {
        if (!props.modelValue || applyingTune) return
        session.value = markAutoTuneSessionStale(session.value, nextRev)
      }
    )

    const toggleField = (id: string, checked: boolean) => {
      const next = new Set(selectedFieldIds.value)
      if (checked) next.add(id)
      else next.delete(id)
      selectedFieldIds.value = [...next]
      rebuildPlan(false)
    }

    const selectAll = () => {
      selectedFieldIds.value = session.value.plan.recommendations
        .filter((r) => !r.advisoryOnly)
        .map((r) => r.id)
      rebuildPlan(false)
    }

    const clearSelection = () => {
      selectedFieldIds.value = []
      rebuildPlan(false)
    }

    const plan = computed(() => session.value.plan)
    const actionableCount = computed(
      () => plan.value.recommendations.filter((r) => !r.advisoryOnly).length
    )
    const selectedCount = computed(
      () => plan.value.recommendations.filter((r) => !r.advisoryOnly && selectedFieldIds.value.includes(r.id)).length
    )

    const categoryColor = (cat: string) => {
      switch (cat) {
        case 'DEFENSE':
          return 'green-9'
        case 'OFFENSE':
          return 'red-9'
        case 'PROFICIENCY':
          return 'indigo-9'
        default:
          return 'teal-9'
      }
    }

    const applyTuning = () => {
      applyingTune = true
      try {
        applyAutoTuneSession(session.value, monsterSession.contentRevision, (tuned) =>
          monsterSession.runSingleUndoCommand(
            `Auto-tune monster to CR ${selectedCr.value}`,
            session.value.sourceRevision,
            () => {
              monsterStore.CR = tuned.CR
              monsterStore.proficiency = tuned.proficiency
              monsterStore.AC = tuned.AC
              monsterStore.HP.HD = tuned.HP.HD
              monsterStore.HP.modifier = tuned.HP.modifier
              monsterStore.stats = JSON.parse(JSON.stringify(tuned.stats))
              if (tuned.attacks) {
                monsterStore.attacks = JSON.parse(JSON.stringify(tuned.attacks))
              }
            }
          )
        )

        $q.notify({
          type: 'positive',
          message: `Tuned monster toward CR ${selectedCr.value} in a single undoable step!`,
          icon: 'check',
        })
        isOpen.value = false
      } catch (e) {
        console.error(e)
        session.value = markAutoTuneSessionStale(session.value, monsterSession.contentRevision)
        $q.notify({
          type: 'negative',
          message: e instanceof Error ? e.message : 'Failed to apply auto-tune rebalancing.',
        })
      } finally {
        applyingTune = false
      }
    }

    return {
      isOpen,
      monsterStore,
      crOptions,
      selectedCr,
      currentCrLabel,
      currentRevision,
      scaleAttacks,
      preserveStats,
      session,
      plan,
      selectedFieldIds,
      actionableCount,
      selectedCount,
      categoryColor,
      toggleField,
      selectAll,
      clearSelection,
      rebuildPlan,
      applyTuning,
    }
  },
})
</script>
