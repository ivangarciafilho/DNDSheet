import { migrateMonsterSchema } from 'src/core/usecases/MigrateMonsterSchema'
import { validate } from 'jsonschema'
import { useQuasar } from 'quasar'
import { SCHEMA } from 'src/data/SCHEMA'
import { useMonsterStore } from 'src/stores/monster-store'
import { useCharacterStore } from 'src/stores/character-store'
import { useEditorStore } from 'src/stores/editor-store'
import { importCharacter } from 'src/core/domain/character-import'
import { useSpellsStore } from 'src/stores/spells-store'
import { useI18n } from 'vue-i18n'
import { Monster } from '../models'

export function useFileLoader() {
  const $q = useQuasar()
  const spellStore = useSpellsStore()
  const { t } = useI18n()

  const loadFile = (file: File) => {
    // we'll want to validate the loaded json against a schema eventually
    const reader = new FileReader()
    reader.addEventListener('load', (e) => {
      try {
        if (e.target != null && e.target.result != null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const monster: any = JSON.parse(e.target.result.toString())

          // B4.17: a .character.json file loads into the character sheet instead of failing as a monster.
          const character = importCharacter(monster)
          if (character) {
            useCharacterStore().actor = character
            useEditorStore().activeMode = 'character'
            $q.notify({ type: 'positive', message: t('io.characterLoaded') })
            return
          }

          // validate
          if (!monster.saveVersion) {
            $q.notify({
              type: 'negative',
              message: t('io.error.version'),
            })
          } else {
            const valid = validate(monster, SCHEMA[monster.saveVersion])

            if (valid.valid) {
              loadMonster(monster)
            } else {
              $q.notify({
                message: t('io.error.validation', [
                  monster.saveVersion,
                  valid.errors.map((e) => e.stack).join(', '),
                ]),
                type: 'negative',
              })
            }
          }
        }
      } catch (e) {
        console.log(e)

        $q.notify({
          message: t('io.error.unknown'),
          type: 'negative',
        })
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateMonster = (monster: any) => {
    // File import, live validation and stored-library loading share one migration authority.
    Object.assign(monster, migrateMonsterSchema(monster))
  }
  const validateSpells = (monster: Monster) => {
    // checks that the given keys exist in the spell list
    const invalid = monster.spellcasting.standard.filter(
      (id) => !(id in spellStore.allSpells)
    )

    monster.spellcasting.standard = monster.spellcasting.standard.filter(
      (id) => id in spellStore.allSpells
    )

    for (const atWill of monster.spellcasting.atWill) {
      const inv = atWill.spells.filter((id) => !(id in spellStore.allSpells))
      invalid.push(...inv)

      atWill.spells = atWill.spells.filter((id) => id in spellStore.allSpells)
    }

    if (invalid.length > 0) {
      $q.notify({
        message: t('io.warn.spell', [invalid.join(', ')]),
        timeout: 0,
        type: 'warning',
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        actions: [{ label: t('editor.ok'), color: 'white' }],
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadMonster = (data: any) => {
    updateMonster(data)

    // one more validation for the road, use the most recent version
    const monster = data as Monster
    const valid = validate(data, SCHEMA['9'])

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
      // VALIDATE SPELLS FIRST
      validateSpells(monster)

      // update the store
      const monsterStore = useMonsterStore()
      monsterStore.$state = { ...monster, bindings: monster.bindings ?? {} }

      $q.notify({
        type: 'positive',
        message: t('io.success'),
      })
    }
  }

  return {
    loadFile,
    loadMonster,
    updateMonster,
  }
}
