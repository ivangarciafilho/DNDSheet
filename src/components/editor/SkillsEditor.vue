<template>
  <q-expansion-item
    expand-separator
    data-editor-section="skills"
    icon="fa-solid fa-dice-d20"
    :label="$t('editor.skills.label')"
    :caption="$t('editor.skills.caption')"
  >
    <q-card class="q-pa-xs">
      <!-- Section 1: Skill Proficiencies -->
      <skill-proficiencies-section />

      <q-separator class="q-my-sm" />

      <!-- Section 2: Tool Proficiencies Module -->
      <tool-proficiencies-section />

      <q-separator class="q-my-sm" />

      <!-- Section 3: Action-Oriented Passive & Active Scope Checks (Search, Study, Hide, Influence) -->
      <skill-scope-checks-section />
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SkillProficienciesSection from './skills/SkillProficienciesSection.vue'
import ToolProficienciesSection from './skills/ToolProficienciesSection.vue'
import SkillScopeChecksSection from './skills/SkillScopeChecksSection.vue'
import { useSkillsEditorState, provideSkillsEditorState } from './skills/useSkillsEditorState'

export default defineComponent({
  name: 'SkillsEditor',
  components: { SkillProficienciesSection, ToolProficienciesSection, SkillScopeChecksSection },
  setup() {
    // The parent template still binds its own toolbar to the shared state.
    return provideSkillsEditorState(useSkillsEditorState())
  },
})
</script>
