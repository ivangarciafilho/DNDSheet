<template>
  <q-dialog v-model="isOpen">
    <q-card style="width: 760px; max-width: 95vw" class="q-pa-sm" data-lint-dialog>
      <q-card-section class="row items-center q-pb-none">
        <div class="row items-center q-gutter-sm">
          <q-icon
            :name="session.issues.length === 0 ? 'mdi-shield-check' : 'mdi-shield-alert'"
            size="28px"
            :color="session.issues.length === 0 ? 'positive' : errorCount > 0 ? 'negative' : 'warning'"
          />
          <div>
            <div class="text-h6 text-weight-bold">Statblock Health & Linter</div>
            <div class="text-caption text-grey-5">
              Checked rev #{{ session.sourceRevision }} · Live rev #{{ currentRevision }} ·
              <span data-check-status>{{ session.status }}</span>
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
          label="Re-check"
          data-lint-recheck
          class="q-mr-xs"
          @click="recheck()"
        />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <!-- Honest Session State Banners -->
        <q-banner
          v-if="session.status === 'stale'"
          dense
          rounded
          class="bg-warning text-dark q-mb-md"
          data-check-banner="stale"
        >
          Check results are from revision #{{ session.sourceRevision }}, but the statblock is now at revision #{{ currentRevision }}. Re-check before applying repairs.
          <template #action>
            <q-btn flat color="dark" label="Re-check Now" @click="recheck()" />
          </template>
        </q-banner>

        <q-banner
          v-else-if="session.status === 'failed'"
          dense
          rounded
          class="bg-negative text-white q-mb-md"
          data-check-banner="failed"
        >
          Statblock checks failed: {{ session.errorMessage || 'Unknown validation error.' }}
        </q-banner>

        <q-banner
          v-else-if="session.status === 'repaired'"
          dense
          rounded
          class="bg-positive text-white q-mb-md"
          data-check-banner="repaired"
        >
          Safe repairs applied at revision #{{ session.sourceRevision }} in one undoable command.{{ session.issues.length > 0 ? ' Review remaining issues below.' : '' }}
        </q-banner>

        <!-- Summary Badges -->
        <div class="row items-center q-gutter-sm q-mb-md">
          <q-chip
            :color="session.issues.length === 0 ? 'positive' : 'grey-8'"
            text-color="white"
            dense
            icon="mdi-check-all"
          >
            Total Issues: {{ session.issues.length }}
          </q-chip>
          <q-chip
            v-if="errorCount > 0"
            color="negative"
            text-color="white"
            dense
            icon="mdi-alert-circle"
          >
            Blocking Errors: {{ errorCount }}
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
          <q-space />
          <q-btn
            v-if="fixableCount > 0"
            flat
            dense
            no-caps
            color="secondary"
            :icon="showRepairPreview ? 'expand_less' : 'preview'"
            :label="showRepairPreview ? 'Hide Repair Diff' : 'Preview Repair Diff'"
            data-lint-preview-toggle
            @click="showRepairPreview = !showRepairPreview"
          />
        </div>

        <!-- Repair Diff Preview (B2.4) -->
        <q-card
          v-if="showRepairPreview && session.repairPlan && session.repairPlan.changes.length > 0"
          flat
          bordered
          class="q-mb-md q-pa-sm bg-grey-10"
          data-lint-repair-preview
        >
          <div class="text-subtitle2 text-weight-bold q-mb-xs">
            Safe Repair Preview ({{ session.repairPlan.fixedCount }} fixable change(s), single Undo step)
          </div>
          <div
            v-for="(change, idx) in session.repairPlan.changes"
            :key="idx"
            class="text-caption q-py-xs"
          >
            <strong>{{ change.fieldPath }}</strong>: {{ change.description }} —
            <span class="text-strike text-grey-5">{{ change.before }}</span>
            <span> → </span>
            <strong class="text-secondary">{{ change.after }}</strong>
          </div>
        </q-card>

        <!-- Clean Statblock State -->
        <div
          v-if="session.issues.length === 0 && session.status !== 'failed'"
          class="q-pa-lg text-center column items-center justify-center text-positive"
          data-check-empty-state
        >
          <q-icon name="mdi-check-decagram" size="56px" color="positive" class="q-mb-sm" />
          <div class="text-h6">No Issues Found</div>
          <div class="text-body2 text-grey-5">
            Zero broken bindings, orphan references, unresolved macros, or spellcasting limit errors at rev #{{ session.sourceRevision }}.
          </div>
        </div>

        <!-- Issue List -->
        <q-list v-else-if="session.issues.length > 0" bordered separator class="rounded-borders">
          <q-item
            v-for="(issue, idx) in session.issues"
            :key="`${issue.code}:${issue.targetId || idx}`"
            class="q-py-sm"
            :data-lint-code="issue.code"
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
                <q-badge v-if="issue.section" color="blue-grey-7" :label="issue.section" />
                <q-badge v-if="issue.fixable" color="secondary" label="Safe Auto-Repair" />
              </q-item-label>
              <q-item-label caption class="q-mt-xs">
                {{ issue.message }}
              </q-item-label>
              <q-item-label v-if="issue.fieldPath" caption class="text-grey-5">
                Path: <code>{{ issue.fieldPath }}</code>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                icon="my_location"
                label="Locate"
                data-lint-locate
                @click="locateIssue(issue)"
              />
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
          :disable="session.status === 'stale' || !session.repairPlan || session.repairPlan.fixedCount === 0"
          :label="`Apply ${fixableCount} Safe Repair(s)`"
          data-lint-apply-repair
          @click="runAutoFix"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import {
  applyCheckSessionRepairs,
  createCheckSession,
  markCheckSessionStale,
  resolveLintTarget,
  type CheckSession,
} from 'src/core/domain/check-session'
import { useMonsterStore } from 'src/stores/monster-store'
import { useMonsterSessionStore } from 'src/stores/monster-session'
import { useSpellsStore } from 'src/stores/spells-store'
import type { LintSeverity, MonsterLintIssue } from 'src/core/usecases/LintMonster'
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
    const monsterSession = useMonsterSessionStore()
    const spellsStore = useSpellsStore()

    const isOpen = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val),
    })

    const currentRevision = computed(() => monsterSession.contentRevision)
    const showRepairPreview = ref(false)
    const lastRepairedRevision = ref<number | undefined>(undefined)
    let applyingRepair = false

    const buildSession = (repairedRev?: number): CheckSession =>
      createCheckSession(
        monsterStore.$state as unknown as Monster,
        spellsStore.allSpells,
        monsterSession.contentRevision,
        {
          currentRevision: monsterSession.contentRevision,
          lastRepairedRevision: repairedRev ?? lastRepairedRevision.value,
        }
      )

    const session = ref<CheckSession>(buildSession())

    const runCheck = (repairedRev?: number) => {
      session.value = buildSession(repairedRev)
    }

    const recheck = () => {
      lastRepairedRevision.value = undefined
      runCheck()
    }

    watch(
      () => props.modelValue,
      (open) => {
        if (open) {
          lastRepairedRevision.value = undefined
          runCheck()
        }
      },
      { immediate: true }
    )

    watch(
      () => monsterSession.contentRevision,
      (nextRev) => {
        if (!props.modelValue || applyingRepair) return
        if (showRepairPreview.value && session.value.repairPlan) {
          session.value = markCheckSessionStale(session.value, nextRev)
          return
        }
        runCheck(lastRepairedRevision.value === nextRev ? nextRev : undefined)
      }
    )

    const errorCount = computed(() => session.value.issues.filter((i) => i.severity === 'ERROR').length)
    const warningCount = computed(() => session.value.issues.filter((i) => i.severity === 'WARNING').length)
    const infoCount = computed(() => session.value.issues.filter((i) => i.severity === 'INFO').length)
    const fixableCount = computed(() => session.value.issues.filter((i) => i.fixable).length)

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

    const locateIssue = async (issue: MonsterLintIssue) => {
      const target = resolveLintTarget(issue)
      isOpen.value = false
      await nextTick()
      window.setTimeout(() => {
        const panel = document.querySelector<HTMLElement>(target.sectionSelector)
        if (!panel) {
          $q.notify({
            type: 'warning',
            message: `Located ${target.label}, but its editor panel is not currently mounted.`,
          })
          return
        }
        const header = panel.querySelector<HTMLElement>('.q-expansion-item__container > .q-item')
        const isCollapsed =
          panel.classList.contains('q-expansion-item--collapsed') ||
          header?.getAttribute('aria-expanded') === 'false'
        if (isCollapsed && header) {
          header.click()
        }
        window.setTimeout(() => {
          panel.scrollIntoView({ behavior: 'smooth', block: 'center' })
          panel.setAttribute('data-lint-located', target.fieldPath || target.sectionKey)
          const escapedPath = target.fieldPath ? CSS.escape(target.fieldPath) : ''
          const focusEl =
            (escapedPath
              ? panel.querySelector<HTMLElement>(
                  `[data-formula-field="${escapedPath}"] input, [data-formula-field="${escapedPath}"] textarea, [data-field-path="${escapedPath}"] input, [data-field-path="${escapedPath}"] textarea, [data-formula-field="${escapedPath}"]`
                )
              : null) ||
            panel.querySelector<HTMLElement>(`.q-expansion-item__content ${target.focusSelector}`) ||
            header
          focusEl?.focus?.({ preventScroll: true })
          window.setTimeout(() => {
            if (panel.getAttribute('data-lint-located')) panel.removeAttribute('data-lint-located')
          }, 1800)
        }, 120)
      }, 80)
    }

    const runAutoFix = () => {
      applyingRepair = true
      try {
        const { nextRevision, fixedCount } = applyCheckSessionRepairs(
          session.value,
          monsterSession.contentRevision,
          (repaired) =>
            monsterSession.runSingleUndoCommand(
              'Apply statblock lint repairs',
              session.value.sourceRevision,
              () => {
                monsterStore.multiattacks = JSON.parse(JSON.stringify(repaired.multiattacks || []))
                monsterStore.traits = JSON.parse(JSON.stringify(repaired.traits || []))
                monsterStore.attacks = JSON.parse(JSON.stringify(repaired.attacks || []))
                monsterStore.actions = JSON.parse(JSON.stringify(repaired.actions || []))
                monsterStore.reactions = JSON.parse(JSON.stringify(repaired.reactions || []))
                monsterStore.legendaryActions = JSON.parse(JSON.stringify(repaired.legendaryActions))
                monsterStore.mythicActions = JSON.parse(JSON.stringify(repaired.mythicActions))
                monsterStore.lairActions = JSON.parse(JSON.stringify(repaired.lairActions))
              }
            )
        )
        showRepairPreview.value = false
        lastRepairedRevision.value = nextRevision
        runCheck(nextRevision)
        $q.notify({
          type: 'positive',
          message: `Cleaned and resolved ${fixedCount} issue(s) in one undoable command!`,
          icon: 'check',
        })
      } catch (e) {
        console.error(e)
        runCheck()
        $q.notify({
          type: 'negative',
          message: e instanceof Error ? e.message : 'Failed to auto-fix issues.',
        })
      } finally {
        applyingRepair = false
      }
    }

    return {
      isOpen,
      session,
      currentRevision,
      showRepairPreview,
      errorCount,
      warningCount,
      infoCount,
      fixableCount,
      severityColor,
      severityIcon,
      runCheck,
      recheck,
      locateIssue,
      runAutoFix,
    }
  },
})
</script>
