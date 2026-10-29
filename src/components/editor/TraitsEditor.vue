<template>
  <q-expansion-item
    expand-separator
    icon="auto_awesome"
    :label="$t('editor.traits.label')"
    :caption="$t('editor.traits.caption')"
  >
    <q-card class="q-pa-xs">
      <q-card-section>
        <q-list>
          <q-expansion-item
            v-for="(trait, idx) in traits"
            :key="trait.id"
            group="traits"
            dense
            dense-toggle
            expand-separator
            header-class="text-body2"
          >
            <template #header>
              <q-item-section>
                <div class="row items-center q-gutter-x-xs">
                  <span class="text-weight-bold">{{ trait.name ? trait.name : $t('editor.trait.default') }}</span>
                  <q-badge
                    v-if="getTraitPreview(trait)"
                    color="primary"
                    outline
                    class="q-ml-xs"
                  >
                    ({{ getTraitPreview(trait) }})
                  </q-badge>
                  <q-badge
                    v-if="(monster.paragonConfig?.enabled || monster.paragonConfig?.poolCount > 1) && trait.stagePool && trait.stagePool !== 'all'"
                    color="deep-purple-3"
                    class="q-ml-xs"
                  >
                    {{ monster.paragonConfig?.phaseName || 'Pool' }} {{ trait.stagePool }}
                  </q-badge>
                  <q-badge
                    v-if="trait.renderInRechargeSection"
                    color="secondary"
                    class="q-ml-xs"
                  >
                    Section: {{ trait.rechargeSection || 'Recharge' }}
                  </q-badge>
                  <q-badge
                    v-if="trait.isConditional"
                    color="accent"
                    class="q-ml-xs"
                  >
                    Condition: {{ trait.conditionalTrigger || 'Conditional' }}
                  </q-badge>
                  <q-badge
                    v-if="trait.customPreamble"
                    color="info"
                    class="q-ml-xs"
                  >
                    {{ $t('editor.trait.customPreambleBadge') }}
                  </q-badge>
                </div>
              </q-item-section>

              <q-item-section v-if="!monster.alphaTraits" side>
                <swap-buttons field="traits" :idx="idx" />
              </q-item-section>
            </template>

            <q-card>
              <q-card-section class="row q-col-gutter-xs">
                <q-input
                  v-model="trait.name"
                  :label="$t('monster.trait.name')"
                  class="col-12 col-sm-6"
                  outlined
                  dense
                />
                <q-select
                  v-if="monster.paragonConfig?.enabled || monster.paragonConfig?.poolCount > 1"
                  v-model="trait.stagePool"
                  :options="paragonStageOptions"
                  label="Paragon Stage / Pool"
                  dense
                  outlined
                  emit-value
                  map-options
                  class="col-12 col-sm-6"
                />
                <q-input
                  :model-value="trait.limitedUse.count"
                  type="number"
                  min="0"
                  class="col-6 col-sm-2"
                  outlined
                  dense
                  :label="$t('monster.trait.limitedUse.count')"
                  @update:model-value="
                    (value: string | number | null) =>
                      (trait.limitedUse.count = validateNumber(value, 0))
                  "
                />
                <q-select
                  v-model="trait.limitedUse.rate"
                  :display-value="$t(`recharge.${trait.limitedUse.rate}`)"
                  :options="rechargeTimeOptions"
                  emit-value
                  outlined
                  dense
                  :label="$t('monster.trait.limitedUse.rate')"
                  class="col-6 col-sm-4"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps" dense>
                      <q-item-section avatar style="min-width: 28px; padding-right: 8px;">
                        <q-icon :name="scope.opt.icon || 'fa-solid fa-clock'" :color="scope.opt.color || 'primary'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section side v-if="scope.opt.category">
                        <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template #append>
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      icon="save"
                      color="primary"
                      @click="addTemplate(trait)"
                    >
                      <q-tooltip class="text-body2">{{
                        $t('monster.trait.save')
                      }}</q-tooltip>
                    </q-btn>
                  </template>
                </q-select>

                <!-- Consolidated Recharge Timing, Sub-Sections & Conditionals -->
                <div
                  class="col-12 q-mt-xs q-pa-sm rounded-borders"
                  style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
                >
                  <div class="row items-center justify-between q-mb-xs">
                    <div class="text-caption text-weight-bold text-primary">
                      Recharge Timing & Labeled Sub-Sections
                    </div>
                    <div v-if="getTraitPreview(trait)" class="text-caption text-grey-4">
                      Tag Preview: <strong>({{ getTraitPreview(trait) }})</strong>
                    </div>
                  </div>

                  <!-- Recharge Timing Select & Section Checkbox -->
                  <div class="row q-col-gutter-sm items-center q-mb-xs">
                    <div class="col-12 col-sm-6">
                      <q-select
                        :model-value="trait.rechargeTiming || ''"
                        :options="traitRechargeOptions"
                        emit-value
                        map-options
                        dense
                        outlined
                        clearable
                        label="Specific Recharge Timing"
                        @update:model-value="(val) => onRechargeTimingChange(trait, val)"
                      >
                        <template #option="scope">
                          <q-item v-bind="scope.itemProps" dense>
                            <q-item-section avatar style="min-width: 28px; padding-right: 8px;">
                              <q-icon :name="scope.opt.icon || 'fa-solid fa-clock'" :color="scope.opt.color || 'primary'" size="xs" />
                            </q-item-section>
                            <q-item-section>
                              <q-item-label>{{ scope.opt.label }}</q-item-label>
                            </q-item-section>
                            <q-item-section side v-if="scope.opt.category">
                              <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="trait.rechargeTagOverride"
                        dense
                        outlined
                        clearable
                        label="Tag Override (replaces parenthetical tag)"
                        placeholder="e.g. Recharge 5–6; Bloodied only"
                      />
                    </div>
                  </div>

                  <!-- Dedicated Recharge Sub-Section Option -->
                  <div class="row q-col-gutter-sm items-center q-mb-xs">
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="trait.renderInRechargeSection"
                        dense
                        label="Render under Dedicated Recharge Section on Stat Block"
                        color="secondary"
                        @update:model-value="(val) => onToggleRechargeSection(trait, val)"
                      />
                    </div>
                    <div v-if="trait.renderInRechargeSection" class="col-12 col-sm-6">
                      <q-input
                        v-model="trait.rechargeSection"
                        dense
                        outlined
                        label="Section Header Label"
                        placeholder="e.g. On Short Rest, At Dawn, Daily"
                      />
                    </div>
                  </div>

                  <q-separator class="q-my-xs" />

                  <!-- Conditional Sub-Section Option (e.g. Bloodied) -->
                  <div class="row q-col-gutter-sm items-center">
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        v-model="trait.isConditional"
                        dense
                        label="Render under Conditionals Section (e.g. Bloodied)"
                        color="accent"
                        @update:model-value="(val) => onToggleConditional(trait, val)"
                      />
                    </div>
                    <div v-if="trait.isConditional" class="col-12 col-sm-6">
                      <q-select
                        v-model="trait.conditionalTrigger"
                        :options="traitConditionalOptions"
                        dense
                        outlined
                        use-input
                        new-value-mode="add-unique"
                        emit-value
                        map-options
                        label="Conditional Header / Trigger"
                        placeholder="e.g. Bloodied (bloodied hit points)"
                      />
                    </div>
                  </div>
                </div>

                <div class="col-12 q-mt-xs">
                  <monster-text-editor
                    :field="trait.description"
                    i18n-label-key="monster.trait.description"
                    token-category="trait"
                    @update:model-value="
                      (value: string) => {
                        trait.description = value
                        autoUpdateCr(trait.description, trait.crAnnotation)
                      }
                    "
                  />
                </div>
                <cr-annotation-card field="traits" :index="idx" />
              </q-card-section>
              <q-card-actions align="center">
                <q-btn
                  color="negative"
                  class="full-width"
                  :label="$t('editor.deleteTrait')"
                  @click="() => monster.deleteTrait(trait.id)"
                />
              </q-card-actions>
            </q-card>
          </q-expansion-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          color="positive"
          class="full-width"
          :label="$t('editor.addTrait')"
          @click="monster.addTrait"
        />
      </q-card-actions>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { useRechargeTimes } from 'src/data/RECHARGE_TIME'
import { useMonsterStore } from 'src/stores/monster-store'
import { defineComponent, computed } from 'vue'
import MonsterTextEditor from './MonsterTextEditor.vue'
import { useAutoUpdateCr } from './useAutoUpdateCr'
import CrAnnotationCard from './CrAnnotationCard.vue'
import { useQuasar } from 'quasar'
import { useTemplatesStore } from 'src/stores/templates-store'
import { useI18n } from 'vue-i18n'
import { MonsterTrait } from '../models'
import NewTemplateDialog from './widgets/NewTemplateDialog.vue'
import { validateNumber } from './numberInput'
import SwapButtons from './widgets/SwapButtons.vue'
import {
  computeTraitTag,
  TRAIT_RECHARGE_OPTIONS,
  TRAIT_CONDITIONAL_OPTIONS,
} from 'src/core/domain/defense-and-traits-utils'

export default defineComponent({
  name: 'TraitsEditor',
  components: { MonsterTextEditor, CrAnnotationCard, SwapButtons },
  setup() {
    const monster = useMonsterStore()
    const { rechargeTimeOptions } = useRechargeTimes()
    const { autoUpdateCr, printCrSummary } = useAutoUpdateCr()

    const $q = useQuasar()
    const { t } = useI18n()
    const templateStore = useTemplatesStore()

    const getTraitPreview = (trait: MonsterTrait): string => {
      return computeTraitTag(trait)
    }

    const onRechargeTimingChange = (trait: MonsterTrait, val: string | null) => {
      trait.rechargeTiming = val || ''
      const found = TRAIT_RECHARGE_OPTIONS.find((opt) => opt.value === val)
      if (found && found.sectionName && trait.renderInRechargeSection) {
        trait.rechargeSection = found.sectionName
      }
    }

    const onToggleRechargeSection = (trait: MonsterTrait, isEnabled: boolean) => {
      if (isEnabled && (!trait.rechargeSection || !trait.rechargeSection.trim())) {
        const found = TRAIT_RECHARGE_OPTIONS.find((opt) => opt.value === trait.rechargeTiming)
        trait.rechargeSection = found?.sectionName || 'Recharging Traits'
      }
    }

    const onToggleConditional = (trait: MonsterTrait, isEnabled: boolean) => {
      if (isEnabled && (!trait.conditionalTrigger || !trait.conditionalTrigger.trim())) {
        trait.conditionalTrigger = 'Bloodied (bloodied hit points)'
      }
    }

    const addTemplate = (target: MonsterTrait) => {
      $q.dialog({
        component: NewTemplateDialog,
        componentProps: {
          targetName: target.name,
        },
      }).onOk(({ name, icon }: { name: string; icon: string }) => {
        templateStore.addCustomTrait(target, name, icon)

        $q.notify({
          message: t('editor.template.added', [name]),
          type: 'positive',
        })
      })
    }

    const paragonStageOptions = computed(() => {
      const count = monster.paragonConfig?.poolCount || 2
      const opts = [{ label: 'All Stages', value: 'all' }]
      for (let i = 1; i <= count; i++) {
        opts.push({ label: `Stage / Pool ${i} Only`, value: i as any })
      }
      return opts
    })

    return {
      monster,
      traits: computed(() => monster.traits),
      rechargeTimeOptions,
      traitRechargeOptions: TRAIT_RECHARGE_OPTIONS,
      traitConditionalOptions: TRAIT_CONDITIONAL_OPTIONS,
      getTraitPreview,
      onRechargeTimingChange,
      onToggleRechargeSection,
      onToggleConditional,
      autoUpdateCr,
      printCrSummary,
      addTemplate,
      validateNumber,
      paragonStageOptions,
    }
  },
})
</script>
