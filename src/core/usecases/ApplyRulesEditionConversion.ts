import type { RulesEdition } from 'src/core/domain/catalogs/metamagic'
import {
  convertMonsterRulesEdition,
  type RulesConversionReport,
} from 'src/core/domain/rules-conversion'
import type { Monster } from 'src/core/domain/types'
import { useEditorStore } from 'src/stores/editor-store'
import { useMonsterSessionStore } from 'src/stores/monster-session'
import { useMonsterStore } from 'src/stores/monster-store'

/**
 * Applies a 2014 <-> 2024 rules edition conversion inside a single atomic
 * undoable command so creators can revert with one Ctrl+Z step.
 */
export function applyMonsterRulesEditionConversion(
  targetEdition: RulesEdition,
): RulesConversionReport {
  const monsterStore = useMonsterStore()
  const sessionStore = useMonsterSessionStore()
  const editorStore = useEditorStore()

  const { monster: converted, report } = convertMonsterRulesEdition(
    monsterStore.$state as unknown as Monster,
    targetEdition,
  )

  sessionStore.runSingleUndoCommand(
    `Convert rules edition to ${targetEdition}`,
    sessionStore.contentRevision,
    () => {
      monsterStore.$patch((state) => {
        state.provenance = converted.provenance
        if (converted.spellcasting) {
          state.spellcasting = converted.spellcasting
        }
      })
      monsterStore.provenance = converted.provenance
    },
  )

  editorStore.style = targetEdition
  return report
}
