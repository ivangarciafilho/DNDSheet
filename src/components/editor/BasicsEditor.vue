<template>
  <q-expansion-item
    expand-separator
    default-opened
    data-editor-section="basics"
    icon="info"
    :label="$t('editor.basics.label')"
    :caption="$t('editor.basics.caption')"
  >
    <q-card class="q-pa-sm editor-fit">
      <identity-section />
      <abilities-section />
      <defenses-section />
      <hit-points-section />
      <paragon-section />
      <lore-section />
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import AbilitiesSection from './basics/AbilitiesSection.vue'
import DefensesSection from './basics/DefensesSection.vue'
import HitPointsSection from './basics/HitPointsSection.vue'
import IdentitySection from './basics/IdentitySection.vue'
import LoreSection from './basics/LoreSection.vue'
import ParagonSection from './basics/ParagonSection.vue'
import { provideBasicsContext } from './basics/useBasicsContext'

provideBasicsContext()
</script>
