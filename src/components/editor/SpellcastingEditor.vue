<template>
  <q-expansion-item
    expand-separator
    icon="auto_fix_high"
    :label="$t('editor.spellcasting.label')"
    :caption="$t('editor.spellcasting.caption')"
    
  >
    <div class="row no-wrap items-center">
      <q-select
        v-model="monster.spellcasting.stat"
        :options="statOptions"
        :label="$t('monster.spellcasting.stat')"
        map-options
        emit-value
        class="col-2 q-pa-sm"
      />
      <q-input
        :model-value="spellSaveValue"
        :label="$t('monster.spellcasting.save')"
        type="number"
        :disable="!monster.spellcasting?.save?.override"
        class="col q-pa-sm"
        @update:model-value="
          (v: string | number | null) => {
            if (!monster.spellcasting.save) monster.spellcasting.save = { override: false, overrideValue: 0 }
            monster.spellcasting.save.overrideValue = parseInt(`${v}`) || 0
          }
        "
      >
        <template #after>
          <lock-toggle-button
            :locked="!monster.spellcasting?.save?.override"
            :lock-tooltip="$t('monster.spellcasting.lockSave')"
            :unlock-tooltip="$t('monster.spellcasting.unlockSave')"
            @click="
              if (!monster.spellcasting.save) monster.spellcasting.save = { override: false, overrideValue: 0 };
              monster.spellcasting.save.override = !monster.spellcasting.save.override
            "
          />
        </template>
      </q-input>
      <q-input
        :model-value="spellAttackValue"
        :label="$t('monster.spellcasting.attack')"
        type="number"
        :disable="!monster.spellcasting?.attack?.override"
        class="col q-pa-sm"
        @update:model-value="
          (v: string | number | null) => {
            if (!monster.spellcasting.attack) monster.spellcasting.attack = { override: false, overrideValue: 0 }
            monster.spellcasting.attack.overrideValue = parseInt(`${v}`) || 0
          }
        "
      >
        <template #after>
          <lock-toggle-button
            :locked="!monster.spellcasting?.attack?.override"
            :lock-tooltip="$t('monster.spellcasting.lockAttack')"
            :unlock-tooltip="$t('monster.spellcasting.unlockAttack')"
            @click="
              if (!monster.spellcasting.attack) monster.spellcasting.attack = { override: false, overrideValue: 0 };
              monster.spellcasting.attack.override = !monster.spellcasting.attack.override
            "
          />
        </template>
      </q-input>
      <q-input
        :model-value="spellModifierValue"
        :label="$t('monster.spellcasting.modifier')"
        type="number"
        :disable="!monster.spellcasting?.modifier?.override"
        class="col q-pa-sm"
        @update:model-value="
          (v: string | number | null) => {
            if (!monster.spellcasting.modifier) monster.spellcasting.modifier = { override: false, overrideValue: 0 }
            monster.spellcasting.modifier.overrideValue = parseInt(`${v}`) || 0
          }
        "
      >
        <template #after>
          <lock-toggle-button
            :locked="!monster.spellcasting?.modifier?.override"
            :lock-tooltip="$t('monster.spellcasting.lockModifier')"
            :unlock-tooltip="$t('monster.spellcasting.unlockModifier')"
            @click="
              if (!monster.spellcasting.modifier) monster.spellcasting.modifier = { override: false, overrideValue: 0 };
              monster.spellcasting.modifier.override = !monster.spellcasting.modifier.override
            "
          />
          <q-btn
            icon="add"
            round
            flat
            @click="addSpell"
          >
            <q-tooltip>{{ $t('editor.spellcasting.custom.create') }}</q-tooltip>
          </q-btn>
        </template>
      </q-input>
    </div>
    <q-list class="q-pa-md">
      <!-- Standard Spellcasting -->
      <class-casting-editor />

      <!-- Innate / At-Will Spellcasting -->
      <at-will-casting-editor />
    </q-list>
  </q-expansion-item>
</template>

<script lang="ts">
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, defineComponent } from 'vue'
import { useStats } from 'src/data/STAT'
import { useClasses } from 'src/data/CLASS'
import { useSpellsStore } from 'src/stores/spells-store'
import LockToggleButton from '../LockToggleButton.vue'
import { useQuasar } from 'quasar'
import NewSpellDialog from '../spell/NewSpellDialog.vue'
import ClassCastingEditor from './ClassCastingEditor.vue'
import AtWillCastingEditor from './AtWillCastingEditor.vue'

export default defineComponent({
  name: 'SpellcastingEditor',
  components: {
    LockToggleButton,
    ClassCastingEditor,
    AtWillCastingEditor,
  },
  setup() {
    const monster = useMonsterStore()
    const spells = useSpellsStore()
    const classes = useClasses()
    const { statOptionsShort } = useStats()
    const $q = useQuasar()

    const classDisplayValue = computed(() => {
      if (monster.spellcasting?.class == null) return ''

      return monster.spellcasting.class in classes.SrdClass.value
        ? classes.SrdClass.value[
            monster.spellcasting.class as keyof typeof classes.SrdClass.value
          ]
        : monster.spellcasting.class
    })

    const spellSaveValue = computed(() =>
      monster.spellcasting?.save?.override
        ? monster.spellcasting.save.overrideValue
        : monster.defaultSpellSave(monster.spellcasting?.stat || 'INT')
    )
    const spellAttackValue = computed(() =>
      monster.spellcasting?.attack?.override
        ? monster.spellcasting.attack.overrideValue
        : monster.defaultSpellAttackModifier(monster.spellcasting?.stat || 'INT')
    )
    const spellModifierValue = computed(() =>
      monster.spellcasting?.modifier?.override
        ? monster.spellcasting.modifier.overrideValue
        : monster.defaultSpellModifier(monster.spellcasting?.stat || 'INT')
    )

    const addSpell = () => {
      $q.dialog({
        component: NewSpellDialog,
      })
    }

    return {
      monster,
      statOptions: statOptionsShort,
      spellSaveValue,
      spellAttackValue,
      spellModifierValue,
      classDisplayValue,
      spellOptionsByLevel: computed(() => spells.spellOptionsByLevel),
      addSpell,
      ...classes,
    }
  },
})
</script>
