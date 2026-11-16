import type { useMonsterStore } from 'src/stores/monster-store'
import { computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { ALL_OFFICIAL_LANGUAGES } from 'src/data/LANGUAGES'
import { entryBindingPrefix, withoutEntryBindings } from 'src/core/domain/entry-bindings'
import { formatLanguagesList } from 'src/core/domain/defense-and-traits-utils'
import { MonsterLanguageItem } from '../../models'

// Language list state and special-language configs for the Basics editor, split from useBasicsContext.
export interface CreateLanguageEntriesDeps {
  monster: ReturnType<typeof useMonsterStore>
}

export function createLanguageEntries({ monster }: CreateLanguageEntriesDeps) {
  const availableLanguageEntries = computed(() => {
    const existing = new Set((monster.languagesList || []).map((l) => l.name.toLowerCase().trim()))
    return ALL_OFFICIAL_LANGUAGES
      .filter((l) => !existing.has(l.toLowerCase().trim()))
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name, group: 'Languages' }))
  })

  const syncLanguagesToString = () => {
    monster.languages = formatLanguagesList(monster.languagesList, monster.specialCommunicationArchetype)
  }

  const onLanguageSelected = (val: unknown) => {
    if (typeof val !== 'string' || !val.trim()) return
    const name = val.trim()
    const lower = name.toLowerCase()
    if ((monster.languagesList || []).some((l) => l.name.toLowerCase().trim() === lower)) return
    const isTele = lower.includes('telepathy')
    const item: MonsterLanguageItem = {
      id: uuidv4(),
      name,
      understandsOnly: false,
      telepathy: isTele,
      telepathyRange: isTele ? 120 : undefined,
      broadcast: false,
      noReply: false,
      languageRequirement: 'none',
      creatureTarget: 'all',
      simpleConceptsOnly: false,
      acrossPlanes: false,
      multiverseWide: false,
      learnDesires: false,
      readThoughts: false,
      senseEmotions: false,
      senseAlignment: false,
      senseIntentions: false,
      detectSincerity: false,
      accessMemories: false,
      shareOwnSenses: false,
      probeCreatureSenses: false,
      probeRequiresSave: false,
      probeSaveType: 'WIS',
      probeSaveDc: 13,
      probeSaveAwareness: 'unaware_on_fail',
      sensoryRequiresSave: false,
      sensorySaveType: 'WIS',
      sensorySaveDc: 13,
      syncSaves: true,
      requiresSave: false,
      saveType: 'WIS',
      saveDc: 13,
      saveAwareness: 'unaware_on_fail',
      disruptedByPsychicDamage: false,
      telepathicAwareness: false,
      concentration: 'none',
      animalHandling: (lower === 'handle animals' || lower.includes('animal handling'))
        ? {
            enabled: true,
            dc: 10,
            peacefulOutcome: 'calm/cease aggression',
            commandOutcome: 'convey basic commands',
            recruitOutcome: 'recruit aid/bond',
            customNotes: '',
          }
        : undefined,
      animalsConfig: lower === 'animals' ? { simpleConceptsOnly: true, specificSubtype: '', note: '' } : undefined,
      plantsConfig: lower === 'plants' ? { canQuestionPastDay: true, difficultTerrainNegotiation: false, note: '' } : undefined,
      undeadConfig: lower === 'undead' ? { commandMindless: true, telepathicRange: 60, note: '' } : undefined,
      deadConfig: lower.startsWith('dead')
        ? { maxQuestions: 5, corpseMustHaveMouth: true, answersCryptic: false, deadWithinYears: '', note: '' }
        : undefined,
    }
    if (!Array.isArray(monster.languagesList)) monster.languagesList = []
    monster.languagesList.push(item)
    syncLanguagesToString()
  }

  const removeLanguage = (index: number) => {
    const language = monster.languagesList?.[index]
    if (!language) return
    monster.$patch((state) => {
      state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('languagesList', language.id))
      state.languagesList?.splice(index, 1)
    })
    syncLanguagesToString()
  }

  const getAnimalHandling = (lang: MonsterLanguageItem) =>
    (lang.animalHandling ??= {
      enabled: true,
      dc: 10,
      peacefulOutcome: 'calm/cease aggression',
      commandOutcome: 'convey basic commands',
      recruitOutcome: 'recruit aid/bond',
      customNotes: '',
    })
  const getAnimalsConfig = (lang: MonsterLanguageItem) =>
    (lang.animalsConfig ??= { simpleConceptsOnly: true, specificSubtype: '', note: '' })
  const getPlantsConfig = (lang: MonsterLanguageItem) =>
    (lang.plantsConfig ??= { canQuestionPastDay: true, difficultTerrainNegotiation: false, note: '' })
  const getUndeadConfig = (lang: MonsterLanguageItem) =>
    (lang.undeadConfig ??= { commandMindless: true, telepathicRange: 60, note: '' })
  const getDeadConfig = (lang: MonsterLanguageItem) =>
    (lang.deadConfig ??= {
      maxQuestions: 5,
      corpseMustHaveMouth: true,
      answersCryptic: false,
      deadWithinYears: '',
      note: '',
    })

  return { availableLanguageEntries, syncLanguagesToString, onLanguageSelected, removeLanguage, getAnimalHandling, getAnimalsConfig, getPlantsConfig, getUndeadConfig, getDeadConfig }
}
