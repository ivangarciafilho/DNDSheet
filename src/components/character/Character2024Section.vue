<template>
  <q-expansion-item
    group="char-group"
    icon="rule"
    :label="$t('studio.character.provenance2024Heading')"
    header-class="text-weight-bold text-teal-4"
    class="q-mb-sm rounded-borders border-subtle"
    data-character-2024-section
  >
    <q-card>
      <q-card-section class="q-gutter-y-sm">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-sm-6">
            <div class="text-caption text-weight-bold q-mb-xs">{{ $t('studio.character.rulesetLabel') }}</div>
            <q-btn-toggle
              v-help="$t('studio.rulesConversion.targetEdition')"
              :model-value="ruleset"
              dense
              no-caps
              toggle-color="primary"
              :options="[
                { label: $t('studio.character.rules2014Short'), value: '2014' },
                { label: $t('studio.character.rules2024Short'), value: '2024' },
              ]"
              data-character-ruleset-toggle
              @update:model-value="(val) => charStore.setRuleset(val)"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-help="$t('studio.character.rulesetSource')"
              :model-value="actor.provenance?.source ?? ''"
              :label="$t('studio.character.rulesetSource')"
              dense
              outlined
              data-character-ruleset-source
              @update:model-value="(val) => charStore.setRuleset(ruleset, String(val ?? ''))"
            />
          </div>
        </div>

        <q-separator />

        <div class="row items-center justify-between">
          <span class="text-caption text-weight-bold text-teal-3">{{ $t('studio.character.originFeatsHeading') }}</span>
          <q-btn
            v-help="$t('studio.character.addOriginFeat')"
            size="sm"
            color="primary"
            icon="add"
            :label="$t('studio.character.addOriginFeat')"
            data-add-origin-feat
            @click="charStore.addOriginFeat()"
          />
        </div>
        <div v-for="feat in actor.originFeats || []" :key="feat.id" class="row q-col-gutter-xs items-center">
          <div class="col-5">
            <catalog-select
              v-model="feat.name"
              v-help="$t('studio.character.originFeatName')"
              :entries="originFeatEntries"
              preserve-order
              :label="$t('studio.character.originFeatName')"
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="feat.notes"
              v-help="$t('studio.character.originFeatNotes')"
              :label="$t('studio.character.originFeatNotes')"
              dense
              outlined
            />
          </div>
          <div class="col-1 text-right">
            <q-btn
              v-help="$t('editor.delete')"
              flat
              round
              dense
              size="xs"
              color="negative"
              icon="delete"
              @click="charStore.removeOriginFeat(feat.id)"
            />
          </div>
        </div>

        <q-separator />

        <div class="row items-center justify-between">
          <span class="text-caption text-weight-bold text-teal-3">{{ $t('studio.character.weaponMasteryHeading') }}</span>
          <q-btn
            v-help="$t('studio.character.addWeaponMastery')"
            size="sm"
            color="primary"
            icon="add"
            :label="$t('studio.character.addWeaponMastery')"
            data-add-weapon-mastery
            @click="charStore.addWeaponMastery()"
          />
        </div>
        <div v-for="wm in actor.weaponMasteries || []" :key="wm.id" class="row q-col-gutter-xs items-center">
          <div class="col-4">
            <q-input
              v-model="wm.weapon"
              v-help="$t('studio.character.weaponName')"
              :label="$t('studio.character.weaponName')"
              dense
              outlined
            />
          </div>
          <div class="col-4">
            <catalog-select
              v-model="wm.mastery"
              v-help="$t('studio.character.masteryProperty')"
              :entries="masteryEntries"
              preserve-order
              :searchable="false"
              :label="$t('studio.character.masteryProperty')"
            />
          </div>
          <div class="col-3">
            <q-input
              v-model="wm.notes"
              v-help="$t('studio.character.masteryNotes')"
              :label="$t('studio.character.masteryNotes')"
              dense
              outlined
            />
          </div>
          <div class="col-1 text-right">
            <q-btn
              v-help="$t('editor.delete')"
              flat
              round
              dense
              size="xs"
              color="negative"
              icon="delete"
              @click="charStore.removeWeaponMastery(wm.id)"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import { ORIGIN_FEAT_SUGGESTIONS, WEAPON_MASTERY_PROPERTIES } from 'src/core/domain/character-2024'
import { useCharacterStore } from 'src/stores/character-store'

const charStore = useCharacterStore()
const actor = computed(() => charStore.actor)
const ruleset = computed(() => actor.value.provenance?.ruleset ?? '2014')

const originFeatEntries = ORIGIN_FEAT_SUGGESTIONS.map((name) => ({ label: name, value: name }))
const masteryEntries = WEAPON_MASTERY_PROPERTIES.map((m) => ({ label: m.label, value: m.value, description: m.summary }))
</script>
