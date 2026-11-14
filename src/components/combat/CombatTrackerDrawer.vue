<template>
  <q-drawer
    v-model="isOpen"
    side="right"
    overlay
    elevated
    :width="420"
    class="bg-dark text-white"
  >
    <div class="column full-height">
      <!-- Header -->
      <div class="bg-primary text-white q-pa-md row items-center no-wrap">
        <q-icon name="mdi-sword-cross" size="md" class="q-mr-sm" />
        <div>
          <div class="text-subtitle1 text-weight-bold">Combat HUD</div>
          <div class="text-caption text-blue-1">
            Round {{ combatStore.currentRound }} • Turn {{ combatStore.activeTurnIndex + 1 }}
          </div>
        </div>
        <q-space />
        <q-btn flat round dense icon="close" @click="isOpen = false" />
      </div>

      <!-- Action Toolbar -->
      <div class="q-pa-sm row items-center q-gutter-xs" style="background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
        <q-btn
          size="sm"
          unelevated
          color="primary"
          icon="add"
          label="Add Current Monster"
          @click="combatStore.addMonsterCombatant()"
        />
        <q-btn
          size="sm"
          outline
          color="secondary"
          icon="person_add"
          label="Add Hero"
          @click="promptAddHero"
        />
        <q-space />
        <q-btn
          size="sm"
          flat
          round
          icon="mdi-step-backward"
          :disable="combatStore.sortedCombatants.length === 0"
          @click="combatStore.prevTurn()"
        >
          <q-tooltip>Previous Turn</q-tooltip>
        </q-btn>
        <q-btn
          size="sm"
          unelevated
          color="positive"
          icon="mdi-step-forward"
          label="Next"
          :disable="combatStore.sortedCombatants.length === 0"
          @click="combatStore.nextTurn()"
        >
          <q-tooltip>Next Turn</q-tooltip>
        </q-btn>
        <q-btn
          size="sm"
          flat
          round
          color="negative"
          icon="restart_alt"
          @click="combatStore.resetEncounter()"
        >
          <q-tooltip>Clear Encounter</q-tooltip>
        </q-btn>
      </div>

      <!-- Combatants List -->
      <div class="col scroll q-pa-sm q-gutter-y-sm">
        <div v-if="combatStore.sortedCombatants.length === 0" class="text-center q-pa-xl text-grey-6">
          <q-icon name="mdi-shield-sword" size="4rem" class="q-mb-sm" />
          <div class="text-body1">No combatants in active encounter.</div>
          <div class="text-caption">Click "Add Current Monster" or "Add Hero" to begin.</div>
        </div>

        <q-card
          v-for="(combatant, idx) in combatStore.sortedCombatants"
          :key="combatant.id"
          bordered
          :class="[
            'combatant-card',
            idx === combatStore.activeTurnIndex ? 'active-turn' : ''
          ]"
        >
          <q-card-section class="q-pa-sm">
            <div class="row items-center no-wrap">
              <q-badge
                :color="idx === combatStore.activeTurnIndex ? 'amber-9' : 'blue-grey-7'"
                class="text-weight-bolder q-mr-sm"
              >
                Init {{ combatant.initiative }}
              </q-badge>
              <div class="text-subtitle2 ellipsis" :title="combatant.name">
                {{ combatant.name }}
              </div>
              <q-badge
                v-if="combatant.sourceSnapshot"
                outline
                color="cyan-3"
                class="q-ml-xs text-caption"
                data-combat-snapshot-badge
              >
                AC {{ combatant.sourceSnapshot.ac }}<template v-if="combatant.sourceRevision"> · rev #{{ combatant.sourceRevision }}</template>
                <q-tooltip>Captured snapshot ({{ combatant.sourceKind || 'source' }}). Edits to the live sheet never alter active combatants.</q-tooltip>
              </q-badge>
              <q-space />
              <q-btn
                flat
                dense
                round
                size="xs"
                color="negative"
                icon="close"
                @click="combatStore.removeCombatant(combatant.id)"
              />
            </div>

            <!-- HP Progress -->
            <div class="q-mt-xs">
              <div class="row items-center text-caption justify-between">
                <span>
                  <strong>HP:</strong> {{ combatant.currentHp }} / {{ combatant.maxHp }}
                  <span v-if="combatant.tempHp > 0" class="text-blue-8 text-weight-bold">
                    (+{{ combatant.tempHp }} temp)
                  </span>
                </span>
                <span :class="combatant.currentHp === 0 ? 'text-negative text-weight-bolder' : 'text-grey-7'">
                  {{ combatant.currentHp === 0 ? 'UNCONSCIOUS' : Math.round((combatant.currentHp / combatant.maxHp) * 100) + '%' }}
                </span>
              </div>
              <q-linear-progress
                :value="Math.max(0, Math.min(1, combatant.currentHp / combatant.maxHp))"
                :color="combatant.currentHp === 0 ? 'negative' : combatant.currentHp < combatant.maxHp / 2 ? 'warning' : 'positive'"
                track-color="grey-4"
                rounded
                size="8px"
                class="q-mt-xs"
              />
            </div>

            <!-- Quick HP Delta Controls -->
            <div class="row items-center q-gutter-xs q-mt-xs">
              <q-btn
                size="xs"
                dense
                unelevated
                color="red-8"
                label="-5"
                @click="combatStore.damage(combatant.id, 5)"
              />
              <q-btn
                size="xs"
                dense
                unelevated
                color="red-8"
                label="-1"
                @click="combatStore.damage(combatant.id, 1)"
              />
              <q-btn
                size="xs"
                dense
                unelevated
                color="green-8"
                label="+1"
                @click="combatStore.heal(combatant.id, 1)"
              />
              <q-btn
                size="xs"
                dense
                unelevated
                color="green-8"
                label="+5"
                @click="combatStore.heal(combatant.id, 5)"
              />
              <q-space />
              <!-- Condition Trigger Menu -->
              <q-btn-dropdown
                size="xs"
                dense
                flat
                color="deep-orange"
                label="Condition"
                icon="mdi-alert-circle-outline"
              >
                <q-list dense>
                  <q-item
                    v-for="cond in conditionsList"
                    :key="cond"
                    v-close-popup
                    clickable
                    @click="combatStore.toggleCond(combatant.id, cond)"
                  >
                    <q-item-section side>
                      <q-icon
                        :name="combatant.conditions.includes(cond) ? 'check_box' : 'check_box_outline_blank'"
                        :color="combatant.conditions.includes(cond) ? 'primary' : 'grey'"
                        size="xs"
                      />
                    </q-item-section>
                    <q-item-section>{{ cond }}</q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>

            <!-- Active Conditions Badges -->
            <div v-if="combatant.conditions.length > 0" class="row q-gutter-xs q-mt-xs">
              <q-chip
                v-for="cond in combatant.conditions"
                :key="cond"
                dense
                removable
                color="purple-9"
                text-color="white"
                size="xs"
                @remove="combatStore.toggleCond(combatant.id, cond)"
              >
                {{ cond }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-drawer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { STANDARD_CONDITIONS, useCombatStore } from 'src/stores/combat-store'

export default defineComponent({
  name: 'CombatTrackerDrawer',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const $q = useQuasar()
    const combatStore = useCombatStore()

    const isOpen = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val),
    })

    const promptAddHero = () => {
      $q.dialog({
        title: 'Add Hero / Adventurer',
        message: 'Name:',
        prompt: {
          model: 'Adventurer',
          type: 'text',
        },
        cancel: true,
        persistent: true,
      }).onOk((data: string) => {
        $q.dialog({
          title: `${data}'s Stats`,
          message: 'Max HP:',
          prompt: {
            model: '25',
            type: 'number',
          },
          cancel: true,
        }).onOk((hpStr: string) => {
          const hp = parseInt(hpStr, 10) || 20
          combatStore.addCustomCombatant(data, hp, Math.floor(Math.random() * 20) + 1, false)
        })
      })
    }

    return {
      isOpen,
      combatStore,
      conditionsList: STANDARD_CONDITIONS,
      promptAddHero,
    }
  },
})
</script>

<style scoped>
.combatant-card {
  transition: all 0.2s ease-in-out;
}
.active-turn {
  border-left: 6px solid #f59e0b !important;
  background: rgba(245, 158, 11, 0.15) !important;
}
</style>
