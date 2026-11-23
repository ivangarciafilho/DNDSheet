<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card
      class="bg-grey-10 text-white"
      style="width: 640px; max-width: 94vw"
      data-rules-conversion-dialog
    >
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div>
          <div class="text-h6 text-white">{{ $t('studio.rulesConversion.title') }}</div>
          <div class="text-caption text-grey-4">
            {{ $t('studio.rulesConversion.subtitle') }}
          </div>
        </div>
        <q-badge color="blue-9" text-color="white" class="q-px-sm q-py-xs">
          {{ $t('studio.rulesConversion.reversibleBadge') }}
        </q-badge>
      </q-card-section>

      <q-separator dark />

      <q-card-section class="q-gutter-y-sm">
        <div class="row items-center justify-between q-gutter-sm">
          <div>
            <div class="text-caption text-grey-4">{{ $t('studio.rulesConversion.currentEdition') }}</div>
            <q-badge
              color="grey-8"
              text-color="white"
              class="text-weight-bold q-mt-xs"
              data-conversion-from
            >
              {{ report.fromEdition }}
            </q-badge>
          </div>
          <div>
            <div class="text-caption text-grey-4 q-mb-xs">{{ $t('studio.rulesConversion.targetEdition') }}</div>
            <div class="row q-gutter-xs">
              <q-btn
                v-help="$t('studio.rulesConversion.edition2014')"
                dense
                no-caps
                size="sm"
                :unelevated="targetEdition === '2014'"
                :outline="targetEdition !== '2014'"
                :color="targetEdition === '2014' ? 'amber-4' : 'grey-4'"
                :text-color="targetEdition === '2014' ? 'grey-10' : 'grey-3'"
                :label="$t('studio.rulesConversion.edition2014')"
                data-convert-target="2014"
                @click="targetEdition = '2014'"
              />
              <q-btn
                v-help="$t('studio.rulesConversion.edition2024')"
                dense
                no-caps
                size="sm"
                :unelevated="targetEdition === '2024'"
                :outline="targetEdition !== '2024'"
                :color="targetEdition === '2024' ? 'deep-purple-8' : 'grey-4'"
                :text-color="targetEdition === '2024' ? 'white' : 'grey-3'"
                :label="$t('studio.rulesConversion.edition2024')"
                data-convert-target="2024"
                @click="targetEdition = '2024'"
              />
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-xs">
          <q-badge color="blue-9" text-color="white">
            {{ $t('studio.rulesConversion.summaryAdjustments', [report.changedCount]) }}
          </q-badge>
          <q-badge
            :color="report.warnings.length > 0 ? 'amber-4' : 'green-9'"
            :text-color="report.warnings.length > 0 ? 'grey-10' : 'white'"
          >
            {{ $t('studio.rulesConversion.summaryWarnings', [report.warnings.length]) }}
          </q-badge>
        </div>

        <div
          v-if="report.warnings.length > 0"
          class="q-pa-sm rounded-borders"
          style="background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(251, 191, 36, 0.45)"
        >
          <div class="text-caption text-weight-bold text-amber-3 q-mb-xs">
            {{ $t('studio.rulesConversion.warningsHeading') }}
          </div>
          <div
            v-for="warn in report.warnings"
            :key="`${warn.path}-${warn.code}`"
            class="text-caption text-white q-mb-xs"
            data-conversion-warning
          >
            <code>{{ warn.path }}</code> — {{ warn.message }}
          </div>
        </div>

        <div v-if="report.adjustments.length > 0">
          <div class="text-caption text-weight-bold text-grey-3 q-mb-xs">
            {{ $t('studio.rulesConversion.adjustmentsHeading') }}
          </div>
          <q-list dense bordered dark separator class="rounded-borders" style="max-height: 220px; overflow-y: auto">
            <q-item
              v-for="adj in report.adjustments"
              :key="`${adj.path}-${adj.kind}`"
              data-conversion-adjustment
            >
              <q-item-section>
                <q-item-label class="text-caption text-white">
                  <code>{{ adj.path }}</code>
                </q-item-label>
                <q-item-label caption class="text-grey-4">
                  {{ adj.before }} → {{ adj.after }} · {{ adj.note }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div v-else class="text-caption text-grey-4 q-py-sm">
          {{ $t('studio.rulesConversion.noChanges') }}
        </div>

        <div class="text-caption text-grey-3">
          {{ $t('studio.rulesConversion.confirmAcknowledge') }}
        </div>
      </q-card-section>

      <q-separator dark />

      <q-card-actions align="right" class="q-pa-sm">
        <q-btn
          v-close-popup
          flat
          no-caps
          color="grey-3"
          :label="$t('studio.rulesConversion.cancelButton')"
          data-cancel-rules-conversion
        />
        <q-btn
          unelevated
          no-caps
          color="blue-8"
          text-color="white"
          icon="swap_horiz"
          :label="$t('studio.rulesConversion.applyButton')"
          data-confirm-rules-conversion
          @click="applyConversion"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import type { RulesEdition } from 'src/core/domain/catalogs/metamagic'
import { previewRulesEditionConversion } from 'src/core/domain/rules-conversion'
import type { Monster } from 'src/core/domain/types'
import { applyMonsterRulesEditionConversion } from 'src/core/usecases/ApplyRulesEditionConversion'
import { useEditorStore } from 'src/stores/editor-store'
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'applied', edition: RulesEdition): void
}>()

const $q = useQuasar()
const { t } = useI18n()
const monsterStore = useMonsterStore()
const editorStore = useEditorStore()

const targetEdition = ref<RulesEdition>(editorStore.style === '2014' ? '2024' : '2014')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      targetEdition.value = editorStore.style === '2014' ? '2024' : '2014'
    }
  },
)

const report = computed(() =>
  previewRulesEditionConversion(
    monsterStore.$state as unknown as Partial<Monster>,
    targetEdition.value,
  ),
)

const applyConversion = () => {
  const result = applyMonsterRulesEditionConversion(targetEdition.value)
  $q.notify({
    type: 'positive',
    message: t('studio.rulesConversion.appliedToast', [
      targetEdition.value,
      result.changedCount,
    ]),
  })
  emit('applied', targetEdition.value)
  emit('update:modelValue', false)
}
</script>
