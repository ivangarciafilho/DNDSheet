import { CURRENT_MONSTER_VERSION, migrateMonsterSchema } from 'src/core/usecases/MigrateMonsterSchema'
import { validate } from 'jsonschema'
import { useQuasar } from 'quasar'
import { SCHEMA } from 'src/data/SCHEMA'
import { createMonsterState, useMonsterStore } from 'src/stores/monster-store'
import { useCharacterStore } from 'src/stores/character-store'
import { useEditorStore } from 'src/stores/editor-store'
import { useMonsterSessionStore } from 'src/stores/monster-session'
import { importCharacter } from 'src/core/domain/character-import'
import { useSpellsStore } from 'src/stores/spells-store'
import { useI18n } from 'vue-i18n'
import { inspectMonsterPayload, stripDangerousKeys } from 'src/core/domain/file-payload-guard'
import { importFoundryActor, looksLikeFoundryActor } from 'src/core/domain/foundry-import'
import { importHomebreweryMarkdown, looksLikeHomebreweryMarkdown } from 'src/core/domain/homebrewery-import'
import { importImprovedInit, looksLikeImprovedInit } from 'src/core/domain/improved-init-import'
import { readSheetPresentation, readSheetSpells } from './native-monster-file'

export function useFileLoader() {
  const $q = useQuasar()
  const spellStore = useSpellsStore()
  const { t } = useI18n()

  const importRawTextStatblock = (rawText: string): boolean => {
    const trimmed = rawText.trim()
    if (!trimmed) {
      $q.notify({ message: t('io.error.unknown'), type: 'negative' })
      return false
    }

    if (looksLikeHomebreweryMarkdown(trimmed)) {
      const res = importHomebreweryMarkdown(trimmed)
      if (res.ok) {
        if (res.warnings.length > 0) {
          $q.notify({ type: 'warning', message: t('studio.fileLoader.coercionWarning', [res.warnings.join(' ')]) })
        }
        loadMonster(res.monster)
        return true
      }
      $q.notify({ type: 'negative', message: t('studio.offlineImport.errorToast', [res.error]) })
      return false
    }

    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      $q.notify({ message: t('io.error.unknown'), type: 'negative' })
      return false
    }

    try {
      const raw: unknown = JSON.parse(trimmed)

      // B4.17: a .character.json file loads into the character sheet instead of failing as a monster.
      const character = importCharacter(raw)
      if (character) {
        useCharacterStore().actor = character
        useEditorStore().activeMode = 'character'
        $q.notify({ type: 'positive', message: t('io.characterLoaded') })
        return true
      }

      if (looksLikeFoundryActor(raw)) {
        const res = importFoundryActor(raw)
        if (res.ok) {
          if (res.warnings.length > 0) {
            $q.notify({ type: 'warning', message: t('studio.fileLoader.coercionWarning', [res.warnings.join(' ')]) })
          }
          loadMonster(res.monster)
          return true
        }
        $q.notify({ type: 'negative', message: t('studio.offlineImport.errorToast', [res.error]) })
        return false
      }

      if (looksLikeImprovedInit(raw)) {
        const res = importImprovedInit(raw)
        if (res.ok) {
          if (res.warnings.length > 0) {
            $q.notify({ type: 'warning', message: t('studio.fileLoader.coercionWarning', [res.warnings.join(' ')]) })
          }
          loadMonster(res.monster)
          return true
        }
        $q.notify({ type: 'negative', message: t('studio.offlineImport.errorToast', [res.error]) })
        return false
      }

      // validate native or legacy monster JSON
      const inspection = inspectMonsterPayload(raw, Object.keys(SCHEMA))
      if (!inspection.ok) {
        $q.notify({ type: 'negative', message: t('io.error.version') })
        return false
      }
      const valid = validate(inspection.record, SCHEMA[inspection.saveVersion])
      if (valid.valid) {
        if (inspection.warnings.length > 0) {
          $q.notify({ type: 'warning', message: t('studio.fileLoader.coercionWarning', [inspection.warnings.join(' ')]) })
        }
        loadMonster(inspection.record)
        return true
      }
      $q.notify({
        message: t('io.error.validation', [inspection.saveVersion, valid.errors.map((err) => err.stack).join(', ')]),
        type: 'negative',
      })
      return false
    } catch (e) {
      console.log(e)
      $q.notify({ message: t('io.error.unknown'), type: 'negative' })
      return false
    }
  }

  const loadFile = (file: File) => {
    const reader = new FileReader()
    reader.addEventListener('load', (e) => {
      if (e.target != null && e.target.result != null) {
        importRawTextStatblock(e.target.result.toString())
      }
    })

    reader.addEventListener('error', () => {
      console.log('Upload error')

      $q.notify({
        message: t('io.error.upload'),
        color: 'negative',
        position: 'top',
      })
    })

    reader.readAsText(file)
  }

  const updateMonster = (monster: object) => {
    // File import, live validation and stored-library loading share one migration authority.
    Object.assign(monster, migrateMonsterSchema(monster))
  }
  const loadMonster = (data: unknown) => {
    const clean = stripDangerousKeys(data)
    if (!clean) {
      $q.notify({
        message: t('io.error.unknown'),
        type: 'negative',
      })
      return
    }
    const { sheetPresentation, sheetCustomSpells, ...record } = clean
    const monster = migrateMonsterSchema(record)
    const valid = validate(monster, SCHEMA[CURRENT_MONSTER_VERSION])

    if (!valid.valid) {
      console.error(valid.errors.map((e) => e.toString()))

      $q.notify({
        message: t('io.error.update'),
        type: 'negative',
      })

      $q.notify({
        message: t('io.error.validationList', [
          valid.errors.map((e) => e.toString()).join('\n'),
        ]),
        type: 'negative',
        timeout: 0,
        actions: [{ label: t('editor.ok'), color: 'white' }],
      })
    } else {
      const editor = useEditorStore()
      const presentation = readSheetPresentation(sheetPresentation, editor.$state)
      spellStore.import(readSheetSpells(sheetCustomSpells), true)

      const monsterStore = useMonsterStore()
      const next = { ...createMonsterState(), ...monster, bindings: monster.bindings ?? {} }
      monsterStore.$patch(state => {
        for (const key of Object.keys(state)) {
          if (!Object.hasOwn(next, key)) delete (state as unknown as Record<string, unknown>)[key]
        }
        Object.assign(state, next)
      })
      useMonsterSessionStore().ensureDistinctDocumentId(!monster.id || !String(monster.id).trim())
      editor.$patch({ ...presentation, a4PageMeasuredHeight: 0, activeMode: 'monster' })

      $q.notify({
        type: 'positive',
        message: t('io.success'),
      })
    }
  }

  return {
    loadFile,
    importRawTextStatblock,
    loadMonster,
    updateMonster,
  }
}
