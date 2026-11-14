<template>
  <q-dialog v-model="isOpen">
    <q-card style="width: 720px; max-width: 95vw" class="q-pa-sm">
      <q-card-section class="row items-center q-pb-none">
        <div class="row items-center q-gutter-sm">
          <q-icon
            :name="issues.length === 0 ? 'mdi-shield-check' : 'mdi-shield-alert'"
            size="28px"
            :color="issues.length === 0 ? 'positive' : errorCount > 0 ? 'negative' : 'warning'"
          />
          <div>
            <div class="text-h6 text-weight-bold">Statblock Health & Linter</div>
            <div class="text-caption text-grey-5">
              Inspect multiattack validity, CR divergence, and data integrity
            </div>
          </div>
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <!-- Summary Badges -->
        <div class="row q-gutter-sm q-mb-md">
          <q-chip
            :color="issues.length === 0 ? 'positive' : 'grey-8'"
            text-color="white"
            dense
            icon="mdi-check-all"
          >
            Total Issues: {{ issues.length }}
          </q-chip>
          <q-chip
            v-if="errorCount > 0"
            color="negative"
            text-color="white"
            dense
            icon="mdi-alert-circle"
          >
            Errors: {{ errorCount }}
          </q-chip>
          <q-chip
            v-if="warningCount > 0"
            color="warning"
            text-color="dark"
            dense
            icon="mdi-alert"
          >
            Warnings: {{ warningCount }}
          </q-chip>
          <q-chip
            v-if="infoCount > 0"
            color="info"
            text-color="white"
            dense
            icon="mdi-information"
          >
            Info: {{ infoCount }}
          </q-chip>
        </div>

        <!-- Clean Statblock State -->
        <div
          v-if="issues.length === 0"
          class="q-pa-lg text-center column items-center justify-center text-positive"
        >
          <q-icon name="mdi-check-decagram" size="64px" color="positive" class="q-mb-sm" />
          <div class="text-h6">Statblock is 100% Healthy!</div>
          <div class="text-body2 text-grey-5">
            Zero integrity issues, orphan attack IDs, or multiattack discrepancies detected.
          </div>
        </div>

        <!-- Issue List -->
        <q-list v-else bordered separator class="rounded-borders">
          <q-item
            v-for="(issue, idx) in issues"
            :key="idx"
            class="q-py-sm"
          >
            <q-item-section avatar>
              <q-icon
                :name="severityIcon(issue.severity)"
                :color="severityColor(issue.severity)"
                size="24px"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold row items-center q-gutter-xs">
                <span>{{ issue.code }}</span>
                <q-badge :color="severityColor(issue.severity)" :label="issue.category" />
                <q-badge v-if="issue.fixable" color="secondary" label="Auto-Fixable" />
              </q-item-label>
              <q-item-label caption class="q-mt-xs">
                {{ issue.message }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn v-close-popup flat label="Close" color="grey-6" />
        <q-btn
          v-if="fixableCount > 0"
          unelevated
          color="secondary"
          icon="mdi-wrench"
          :label="`Auto-Fix ${fixableCount} Issue(s)`"
          @click="runAutoFix"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useMonsterStore } from 'src/stores/monster-store'
import { useSpellsStore } from 'src/stores/spells-store'
import { autoFixMonster, lintMonster, type LintSeverity, type MonsterLintIssue } from 'src/core/usecases/LintMonster'
import type { Monster } from 'src/core/domain/types'

export default defineComponent({
  name: 'MonsterLintDialog',
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
    const spellsStore = useSpellsStore()

    const isOpen = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val),
    })

    const issues = computed<MonsterLintIssue[]>(() => {
      const monsterData = monsterStore.$state as unknown as Monster
      return lintMonster(monsterData, spellsStore.allSpells)
    })

    const errorCount = computed(() => issues.value.filter((i) => i.severity === 'ERROR').length)
    const warningCount = computed(() => issues.value.filter((i) => i.severity === 'WARNING').length)
    const infoCount = computed(() => issues.value.filter((i) => i.severity === 'INFO').length)
    const fixableCount = computed(() => issues.value.filter((i) => i.fixable).length)

    const severityColor = (sev: LintSeverity) => {
      switch (sev) {
        case 'ERROR':
          return 'negative'
        case 'WARNING':
          return 'warning'
        case 'INFO':
          return 'info'
      }
    }

    const severityIcon = (sev: LintSeverity) => {
      switch (sev) {
        case 'ERROR':
          return 'mdi-alert-circle'
        case 'WARNING':
          return 'mdi-alert'
        case 'INFO':
          return 'mdi-information'
      }
    }

    const runAutoFix = () => {
      try {
        const monsterData = monsterStore.$state as unknown as Monster
        const { fixedCount, monster: fixed } = autoFixMonster(monsterData)

        monsterStore.multiattacks = JSON.parse(JSON.stringify(fixed.multiattacks || []))

        $q.notify({
          type: 'positive',
          message: `Cleaned and resolved ${fixedCount} issue(s) successfully!`,
          icon: 'check',
        })
      } catch (e) {
        console.error(e)
        $q.notify({
          type: 'negative',
          message: 'Failed to auto-fix issues.',
        })
      }
    }

    return {
      isOpen,
      issues,
      errorCount,
      warningCount,
      infoCount,
      fixableCount,
      severityColor,
      severityIcon,
      runAutoFix,
    }
  },
})
</script>
