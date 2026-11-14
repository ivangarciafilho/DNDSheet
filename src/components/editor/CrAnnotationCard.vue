<template>
  <div class="full-width">
    <q-card flat bordered>
      <q-card-section class="bg-indigo-10 row">
        <div class="col">
          <div class="text-overline text-uppercase">
            {{ $t('editor.crAnnotation.title') }}
          </div>
          <div class="text-subtitle">
            {{ printCrSummary(crData.crAnnotation) }}
          </div>
        </div>
        <div
          class="col-2"
          style="
            display: flex;
            justify-content: flex-end;
            justify-items: flex-end;
            align-items: center;
            align-content: flex-end;
          "
        >
          <q-btn-group push>
            <lock-toggle-button
              :locked="crData.crAnnotation.automatic"
              :lock-tooltip="$t('editor.crAnnotation.automatic')"
              :unlock-tooltip="$t('editor.crAnnotation.manual')"
              @click="
                () => {
                  crData.crAnnotation.automatic = !crData.crAnnotation.automatic
                  if (crData.crAnnotation.automatic)
                    autoUpdateCr(crData.description, crData.crAnnotation, actionContext)
                }
              "
            />
            <q-btn
              push
              :icon="crData.crAnnotation.include ? 'code' : 'code_off'"
              :color="crData.crAnnotation.include ? 'positive' : 'dark'"
              size="md"
              @click="
                crData.crAnnotation.include = !crData.crAnnotation.include
              "
            >
              <q-tooltip class="text-body2">
                {{
                  crData.crAnnotation.include
                    ? $t('editor.crAnnotation.include')
                    : $t('editor.crAnnotation.exclude')
                }}
              </q-tooltip>
            </q-btn>
          </q-btn-group>
        </div>
      </q-card-section>

      <q-slide-transition>
        <div v-show="!crData.crAnnotation.automatic">
          <q-separator />
          <q-card-section>
            <div class="row">
              <div class="col-12 col-sm-6 col-md-3 col-lg-2 q-pa-sm">
                <formula-field :path="`${field}[id=${encodeURIComponent(crData.id)}].crAnnotation.maxDamage`" :disable="crData.crAnnotation.automatic" :label="$t('editor.crAnnotation.maxDamage')" />
                <q-btn
                    push
                    :icon="
                      crData.crAnnotation.multitarget ? 'groups' : 'person'
                    "
                    color="primary"
                    @click="
                      crData.crAnnotation.multitarget =
                        !crData.crAnnotation.multitarget
                    "
                  >
                    <q-tooltip class="text-body2">
                      {{
                        crData.crAnnotation.multitarget
                          ? $t('editor.crAnnotation.multitarget')
                          : $t('editor.crAnnotation.singletarget')
                      }}
                    </q-tooltip>
                  </q-btn>
              </div>
              <div class="col-12 col-sm-6 col-md-3 col-lg-2 q-pa-sm">
                <formula-field :path="`${field}[id=${encodeURIComponent(crData.id)}].crAnnotation.maxSave`" :disable="crData.crAnnotation.automatic" :label="$t('editor.crAnnotation.maxSave')" />
              </div>
              <div class="col-12 col-sm-6 col-md-3 col-lg-2 q-pa-sm">
                <formula-field :path="`${field}[id=${encodeURIComponent(crData.id)}].crAnnotation.maxModifier`" :disable="crData.crAnnotation.automatic" :label="$t('editor.crAnnotation.maxModifier')" />
              </div>
              <div class="col-12 col-sm-6 col-md-3 col-lg-2 q-pa-sm">
                <formula-field :path="`${field}[id=${encodeURIComponent(crData.id)}].crAnnotation.ehpModifier`" :disable="crData.crAnnotation.automatic" :label="$t('editor.crAnnotation.ehpModifier')" />
              </div>
              <q-input
                :model-value="crData.crAnnotation.ehpMultiplier"
                type="number"
                :label="$t('editor.crAnnotation.ehpMultiplier')"
                :disable="crData.crAnnotation.automatic"
                min="0"
                class="col-12 col-sm-6 col-md-3 col-lg-2 q-pa-sm"
                @update:model-value="
                  (value: string | number | null) =>
                    (crData.crAnnotation.ehpMultiplier = validateNumber(
                      value,
                      1
                    ))
                "
              />
              <div class="col-12 col-sm-6 col-md-3 col-lg-2 q-pa-sm">
                <formula-field :path="`${field}[id=${encodeURIComponent(crData.id)}].crAnnotation.acModifier`" :disable="crData.crAnnotation.automatic" :label="$t('editor.crAnnotation.acModifier')" />
              </div>
            </div>
          </q-card-section>
        </div>
      </q-slide-transition>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/runtime-core'
import { useMonsterStore } from 'src/stores/monster-store'
import { useAutoUpdateCr } from './useAutoUpdateCr'
import LockToggleButton from '../LockToggleButton.vue'
import FormulaField from '../kit/FormulaField.vue'
import { Monster, MonsterAction, MonsterReaction, MonsterTrait, defaultCrAnnotation } from '../models'
import { validateNumber } from './numberInput'

export type CrAnnotatedField = MonsterTrait[] | MonsterAction[] | MonsterReaction[]

export default defineComponent({
  name: 'CrAnnotationCard',
  components: {
    LockToggleButton,
    FormulaField,
  },
  props: {
    field: {
      required: true,
      type: String as PropType<keyof Monster>,
    },
    index: {
      required: true,
      type: Number,
    },
  },
  setup(props) {
    const monster = useMonsterStore()

    const rawEntry = (monster[props.field] as CrAnnotatedField)[props.index]
    if (rawEntry && !rawEntry.crAnnotation) {
      rawEntry.crAnnotation = { ...defaultCrAnnotation(), include: false }
    }
    const crData = rawEntry as MonsterAction | MonsterTrait

    const actionContext = props.field === 'actions' || props.field === 'reactions' ? crData as MonsterAction : undefined

    return {
      crData,
      actionContext,
      validateNumber: validateNumber,
      ...useAutoUpdateCr(),
    }
  },
})
</script>
