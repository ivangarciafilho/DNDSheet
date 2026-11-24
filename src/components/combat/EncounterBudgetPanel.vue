<template>
  <div class="q-pa-xs q-mx-sm q-mt-xs rounded-borders" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12)" data-encounter-budget-panel>
    <div class="row items-center justify-between q-gutter-xs q-mb-xs">
      <div class="text-caption text-weight-bold text-grey-2">{{ $t('studio.combat.budgetHeading') }}</div>
      <q-btn-toggle
        v-model="combatStore.encounterRuleset"
        v-help="$t('studio.rulesConversion.targetEdition')"
        dense
        no-caps
        size="xs"
        toggle-color="primary"
        color="grey-8"
        text-color="white"
        :options="[
          { label: '2014', value: '2014' },
          { label: '2024', value: '2024' },
        ]"
        data-encounter-ruleset
      />
    </div>
    <div class="row items-center q-gutter-xs q-mb-xs no-wrap">
      <q-input
        v-model.number="combatStore.partySize"
        v-help="$t('studio.combat.partySize')"
        type="number"
        dense
        filled
        dark
        :min="1"
        :max="12"
        :label="$t('studio.combat.partySize')"
        style="width: 66px"
        data-encounter-party-size
      />
      <q-input
        v-model.number="combatStore.partyLevel"
        v-help="$t('studio.combat.partyLevel')"
        type="number"
        dense
        filled
        dark
        :min="1"
        :max="20"
        :label="$t('studio.combat.partyLevel')"
        style="width: 66px"
        data-encounter-party-level
      />
      <q-input
        v-model.number="batchCount"
        v-help="$t('studio.combat.batchCount')"
        type="number"
        dense
        filled
        dark
        :min="1"
        :max="20"
        :label="$t('studio.combat.batchCount')"
        style="width: 64px"
        data-encounter-batch-count
      />
      <q-btn
        v-help="$t('studio.combat.addBatch', [safeBatchCount])"
        size="sm"
        dense
        unelevated
        color="primary"
        icon="group_add"
        :label="$t('studio.combat.addBatch', [safeBatchCount])"
        data-encounter-add-batch
        @click="combatStore.addMonsterBatch(safeBatchCount)"
      />
    </div>
    <div class="row items-center justify-between q-gutter-xs">
      <div class="row items-center q-gutter-xs">
        <q-badge :color="difficultyColor" text-color="white" class="text-weight-bold" data-encounter-difficulty>
          {{ $t(`studio.combat.difficulty.${budget.difficulty}`) }}
        </q-badge>
        <span class="text-caption text-grey-3" data-encounter-xp>
          {{ $t('studio.combat.xpSummary', [budget.rawXp, budget.xpPerCharacter]) }}
          <template v-if="budget.ruleset === '2014' && budget.multiplier !== 1">
            · {{ $t('studio.combat.adjustedXp', [budget.adjustedXp, budget.multiplier]) }}
          </template>
        </span>
      </div>
      <div class="row items-center q-gutter-xs">
        <q-btn
          v-help="$t('studio.combat.exportJson')"
          size="xs"
          flat
          dense
          color="cyan-3"
          icon="download"
          :label="$t('studio.combat.exportJson')"
          :disable="combatStore.sortedCombatants.length === 0"
          data-encounter-export-json
          @click="downloadJson"
        />
        <q-btn
          v-help="$t('studio.combat.copyMarkdown')"
          size="xs"
          flat
          dense
          color="amber-4"
          icon="content_copy"
          :label="$t('studio.combat.copyMarkdown')"
          :disable="combatStore.sortedCombatants.length === 0"
          data-encounter-copy-md
          @click="copyMarkdown"
        />
        <q-btn
          v-help="$t('studio.combat.importJson')"
          size="xs"
          flat
          dense
          color="light-green-4"
          icon="upload_file"
          :label="$t('studio.combat.importJson')"
          data-encounter-import-json
          @click="fileInput?.click()"
        />
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="hidden"
          @change="onFileSelected"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { copyToClipboard, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { download } from 'src/components/file/download'
import { safeFileName } from 'src/core/domain/file-name'
import { useCombatStore } from 'src/stores/combat-store'

const $q = useQuasar()
const { t } = useI18n()
const combatStore = useCombatStore()
const batchCount = ref(2)
const fileInput = ref<HTMLInputElement | null>(null)

const safeBatchCount = computed(() => Math.max(1, Math.min(20, Math.round(batchCount.value || 1))))
const budget = computed(() => combatStore.encounterBudget)

const difficultyColor = computed(() => {
  switch (budget.value.difficulty) {
    case 'deadly':
    case 'high':
      return 'negative'
    case 'hard':
    case 'moderate':
      return 'deep-orange-7'
    case 'medium':
    case 'low':
      return 'amber-9'
    default:
      return 'blue-grey-7'
  }
})

function downloadJson() {
  download(combatStore.exportEncounterJson(), safeFileName('encounter-roster', '.encounter.json'), 'application/json')
}

async function copyMarkdown() {
  await copyToClipboard(combatStore.exportEncounterMarkdown())
  $q.notify({ type: 'positive', message: t('studio.combat.copiedToast') })
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const res = combatStore.importEncounterRoster(text, 'replace')
    if (res.ok) {
      $q.notify({ type: 'positive', message: t('studio.combat.importedToast', [res.count]) })
    } else {
      $q.notify({ type: 'negative', message: t('studio.combat.importErrorToast', [res.error]) })
    }
  } finally {
    if (input) input.value = ''
  }
}
</script>
