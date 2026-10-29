<template>
  <q-dialog v-model="isOpen">
    <q-card style="width: 720px; max-width: 95vw" class="q-pa-sm">
      <q-card-section class="row items-center q-pb-none">
        <div class="row items-center q-gutter-sm">
          <q-icon name="mdi-tune" size="28px" color="primary" />
          <div>
            <div class="text-h6 text-weight-bold">CR Auto-Tuner</div>
            <div class="text-caption text-grey-5">
              Target a Challenge Rating and automatically rebalance Hit Dice, AC, and Attack DPR
            </div>
          </div>
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="selectedCr"
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
              &nbsp;→&nbsp;
              Target CR:
              <strong class="text-secondary">{{ selectedCr }}</strong>
            </div>
          </div>
        </div>

        <div class="row q-gutter-sm q-mt-xs">
          <q-checkbox
            v-model="scaleAttacks"
            label="Scale attack damage dice proportionally"
            dense
          />
          <q-checkbox
            v-model="preserveStats"
            label="Preserve core ability scores"
            dense
          />
        </div>

        <q-separator class="q-my-md" />

        <div class="text-subtitle1 text-weight-bold q-mb-sm">
          Planned Rebalancing Adjustments ({{ recommendations.length }})
        </div>

        <div v-if="recommendations.length === 0" class="text-positive q-my-md row items-center">
          <q-icon name="check_circle" size="24px" class="q-mr-sm" />
          <span>Monster stats already match target CR {{ selectedCr }} specifications.</span>
        </div>

        <q-list v-else bordered separator class="rounded-borders">
          <q-item
            v-for="(rec, idx) in recommendations"
            :key="idx"
            class="q-py-sm"
          >
            <q-item-section avatar>
              <q-chip
                :color="categoryColor(rec.category)"
                text-color="white"
                dense
                class="text-weight-bold"
              >
                {{ rec.category }}
              </q-chip>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ rec.field }}:
                <span class="text-strike text-grey-5">{{ rec.currentValue }}</span>
                &nbsp;➔&nbsp;
                <strong class="text-primary">{{ rec.recommendedValue }}</strong>
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
          label="Apply Auto-Tune"
          :disable="recommendations.length === 0"
          @click="applyTuning"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useMonsterStore } from 'src/stores/monster-store'
import { CR } from 'src/core/domain/cr-tables'
import { generateAutoTunePlan, type AutoTunePlan } from 'src/core/usecases/AutoTuneCr'
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

    const currentCrLabel = computed(() => {
      const tier = CR[monsterStore.CR] || CR[0]
      return tier.cr
    })

    const plan = computed<AutoTunePlan>(() => {
      const monsterData = monsterStore.$state as unknown as Monster
      return generateAutoTunePlan(monsterData, selectedCr.value, {
        scaleAttacksProportionally: scaleAttacks.value,
        preserveAbilityScores: preserveStats.value,
      })
    })

    const recommendations = computed(() => plan.value.recommendations)

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
      try {
        const tuned = plan.value.tunedMonster
        // Copy back to monster store
        monsterStore.CR = tuned.CR
        monsterStore.proficiency = tuned.proficiency
        monsterStore.AC = tuned.AC
        monsterStore.HP.HD = tuned.HP.HD
        monsterStore.HP.modifier = tuned.HP.modifier
        if (scaleAttacks.value && tuned.attacks) {
          monsterStore.attacks = JSON.parse(JSON.stringify(tuned.attacks))
        }

        $q.notify({
          type: 'positive',
          message: `Successfully tuned monster to CR ${selectedCr.value}!`,
          icon: 'check',
        })
        isOpen.value = false
      } catch (e) {
        console.error(e)
        $q.notify({
          type: 'negative',
          message: 'Failed to apply auto-tune rebalancing.',
        })
      }
    }

    return {
      isOpen,
      crOptions,
      selectedCr,
      currentCrLabel,
      scaleAttacks,
      preserveStats,
      recommendations,
      categoryColor,
      applyTuning,
    }
  },
})
</script>
