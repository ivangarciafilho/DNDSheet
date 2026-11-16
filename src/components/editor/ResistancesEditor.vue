<template>
  <q-expansion-item
    expand-separator
    data-editor-section="resistances"
    icon="shield"
    :label="$t('editor.resistances.label')"
    :caption="$t('editor.resistances.caption')"
  >
    <q-card class="q-pa-sm q-gutter-y-md">
      <!-- Category Row Splitting & Order Controls -->
      <defense-list-controls />

      <!-- 1. Damage Vulnerabilities -->
      <damage-vulnerabilities-section />

      <!-- 2. Condition Vulnerabilities -->
      <condition-vulnerabilities-section />

      <!-- 3. Damage Resistances -->
      <damage-resistances-section />

      <!-- 4. Condition Resistances -->
      <condition-resistances-section />

      <!-- 5. Damage Immunities -->
      <damage-immunities-section />

      <!-- 6. Condition Immunities -->
      <condition-immunities-section />
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DefenseListControls from './defenses/DefenseListControls.vue'
import DamageVulnerabilitiesSection from './defenses/DamageVulnerabilitiesSection.vue'
import ConditionVulnerabilitiesSection from './defenses/ConditionVulnerabilitiesSection.vue'
import DamageResistancesSection from './defenses/DamageResistancesSection.vue'
import ConditionResistancesSection from './defenses/ConditionResistancesSection.vue'
import DamageImmunitiesSection from './defenses/DamageImmunitiesSection.vue'
import ConditionImmunitiesSection from './defenses/ConditionImmunitiesSection.vue'
import { useResistancesEditorState, provideResistancesEditorState } from './defenses/useResistancesEditorState'

export default defineComponent({
  name: 'ResistancesEditor',
  components: { DefenseListControls, DamageVulnerabilitiesSection, ConditionVulnerabilitiesSection, DamageResistancesSection, ConditionResistancesSection, DamageImmunitiesSection, ConditionImmunitiesSection },
  setup() {
    // The parent template still binds its own toolbar to the shared state.
    return provideResistancesEditorState(useResistancesEditorState())
  },
})
</script>
