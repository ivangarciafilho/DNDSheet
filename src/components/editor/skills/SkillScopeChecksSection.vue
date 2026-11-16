<template>
  <div class="q-pa-xs">
    <div class="row items-center justify-between q-mb-xs">
      <div class="text-subtitle2 text-weight-bold text-amber-4">
        🎯 Action-Oriented Passive &amp; Active Scope Checks (Search, Study, Influence, Hide)
      </div>
      <div class="text-caption text-grey-5">
        Consolidated (Passive/Active) checks &amp; Action / Bonus Action scope routing
      </div>
    </div>

    <div class="row q-col-gutter-xs">
      <!-- SEARCH: Insight, Medicine, Perception, Survival -->
      <div class="col-12 col-md-6">
        <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
          <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
            <span class="text-caption text-weight-bold text-primary">🔍 Search Checks</span>
            <div class="row items-center q-gutter-x-xs editor-fit-wrap">
              <q-checkbox
                v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                :model-value="movesToActionGroup('search')"
                dense
                label="Move To Action Group"
                @update:model-value="setMoveToActionGroup('search', $event)"
              />
              <q-btn-toggle
                v-model="passives.searchActionType"
                v-help="'Choose whether moving this group places it under Actions or Bonus Actions.'"
                dense
                no-caps
                rounded
                unelevated
                size="xs"
                toggle-color="primary"
                color="grey-9"
                text-color="grey-4"
                :options="[
                  { label: 'Action', value: 'Action' },
                  { label: 'Bonus Action', value: 'Bonus Action' },
                ]"
              />
            </div>
          </div>
          <div class="q-mb-xs">
            <mechanic-text-editor
              v-model="passives.riders.search"
              v-help="'Extra wording for the Search action (Insight, Medicine, Perception, Survival).'"
              dense
              outlined
              dark label="Search Scope / Verbose Rider"
              placeholder="e.g. 60ft across Ethereal and Material Planes: Sense the Presence of Undeads..."
            >
              <template #append>
                <q-btn v-if="passives.riders.search" flat round dense size="xs" icon="close" @click="passives.riders.search = ''">
                  <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                </q-btn>
              </template>
              <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
            </mechanic-text-editor>
            <div class="row items-center q-gutter-xs q-mt-xs">
              <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                <q-list dense dark class="bg-grey-10">
                  <q-item v-for="(pr, prIdx) in riderPresets.search" :key="prIdx" v-close-popup clickable @click="applyRiderPreset('search', pr)">
                    <q-item-section class="text-caption">{{ pr }}</q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <q-btn v-help="$t('help.checks.chipEthereal')" dense flat size="xs" color="cyan-3" label="+ Ethereal (60ft)" @click="appendRiderTag('search', '60ft across Ethereal and Material Planes')" />
              <q-btn v-help="$t('help.checks.chipUndeadFiends')" dense flat size="xs" color="cyan-3" label="+ Undead/Fiends" @click="appendRiderTag('search', 'Sense Undead and Fiends')" />
              <q-btn v-help="$t('help.checks.chipSearchDc')" dense flat size="xs" color="cyan-3" label="+ DC 15" @click="appendRiderTag('search', 'DC 15 check')" />
            </div>
          </div>
          <div v-for="pKey in groupPassiveKeys('search')" :key="pKey" class="row items-center q-col-gutter-xs q-mb-xs">
            <div class="col-3 text-caption">{{ passiveLabel(pKey) }}</div>
            <div class="col-3">
              <q-btn-group spread flat dense>
                <q-btn
                  v-help="'Use the bonus computed from the ability modifier and proficiency.'"
                  dense
                  size="xs"
                  :color="!getPassive(pKey).override ? 'green-9' : 'grey-8'"
                  text-color="white" label="Auto"
                  @click="getPassive(pKey).override = false"
                />
                <q-btn
                  v-help="'Type a fixed bonus instead of the computed one.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).override ? 'amber-4' : 'grey-8'"
                  :text-color="getPassive(pKey).override ? 'grey-10' : 'white'" label="Ovr"
                  @click="getPassive(pKey).override = true"
                />
              </q-btn-group>
            </div>
            <div class="col-2">
              <q-btn-group spread flat dense>
                <q-btn
                  v-help="'Advantage: roll two d20s and keep the higher.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'" label="▲▲"
                  @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                />
                <q-btn
                  v-help="'Disadvantage: roll two d20s and keep the lower.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'" label="▼▼"
                  @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                />
              </q-btn-group>
            </div>
            <div v-if="getPassive(pKey).override" class="col-4">
              <q-select
                v-help="'Passive score: 10 + the skill bonus (+5 with advantage, −5 with disadvantage).'"
                dense
                outlined
                :model-value="getPassive(pKey).overrideValue ?? 10"
                :options="getPassiveOverrideOptions(pKey)"
                emit-value
                map-options
                use-input
                fill-input
                hide-selected label="Score"
                new-value-mode="add-unique"
                @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
              />
            </div>
            <div v-else class="col-4">
              <mechanic-text-editor
                v-model="getPassive(pKey).condition"
                dense
                outlined
                placeholder="Qualifier"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- STUDY: Arcana, History, Investigation, Nature, Religion -->
      <div class="col-12 col-md-6">
        <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
          <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
            <span class="text-caption text-weight-bold text-info">📖 Study Checks</span>
            <div class="row items-center q-gutter-x-xs editor-fit-wrap">
              <q-checkbox
                v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                :model-value="movesToActionGroup('study')"
                dense
                label="Move To Action Group"
                @update:model-value="setMoveToActionGroup('study', $event)"
              />
              <q-btn-toggle
                v-model="passives.studyActionType"
                v-help="'Choose whether moving this group places it under Actions or Bonus Actions.'"
                dense
                no-caps
                rounded
                unelevated
                size="xs"
                toggle-color="cyan-10"
                color="grey-9"
                text-color="grey-4"
                :options="[
                  { label: 'Action', value: 'Action' },
                  { label: 'Bonus Action', value: 'Bonus Action' },
                ]"
              />
            </div>
          </div>
          <div class="q-mb-xs">
            <mechanic-text-editor
              v-model="passives.riders.study"
              v-help="'Extra wording for the Study action (Arcana, History, Investigation, Nature, Religion).'"
              dense
              outlined
              dark label="Study Scope / Verbose Rider"
              placeholder="e.g. Touch: Learn target's Alignment, and if its either Charmed or Possessed..."
            >
              <template #append>
                <q-btn v-if="passives.riders.study" flat round dense size="xs" icon="close" @click="passives.riders.study = ''">
                  <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                </q-btn>
              </template>
              <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
            </mechanic-text-editor>
            <div class="row items-center q-gutter-xs q-mt-xs">
              <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                <q-list dense dark class="bg-grey-10">
                  <q-item v-for="(pr, prIdx) in riderPresets.study" :key="prIdx" v-close-popup clickable @click="applyRiderPreset('study', pr)">
                    <q-item-section class="text-caption">{{ pr }}</q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <q-btn v-help="$t('help.checks.chipTouch')" dense flat size="xs" color="cyan-3" label="+ Touch" @click="appendRiderTag('study', 'Touch: Learn target alignment')" />
              <q-btn v-help="$t('help.checks.chipResistances')" dense flat size="xs" color="cyan-3" label="+ Resistances" @click="appendRiderTag('study', 'Learn vulnerabilities, resistances, immunities')" />
              <q-btn v-help="$t('help.checks.chipStudyDc')" dense flat size="xs" color="cyan-3" label="+ DC 15" @click="appendRiderTag('study', 'DC 15 check')" />
            </div>
          </div>
          <div v-for="pKey in groupPassiveKeys('study')" :key="`study-${pKey}`" class="row items-center q-col-gutter-xs q-mb-xs">
            <div class="col-3 text-caption">{{ passiveLabel(pKey) }}</div>
            <div class="col-3">
              <q-btn-group spread flat dense>
                <q-btn
                  v-help="'Use the bonus computed from the ability modifier and proficiency.'"
                  dense
                  size="xs"
                  :color="!getPassive(pKey).override ? 'green-9' : 'grey-8'"
                  text-color="white" label="Auto"
                  @click="getPassive(pKey).override = false"
                />
                <q-btn
                  v-help="'Type a fixed bonus instead of the computed one.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).override ? 'amber-4' : 'grey-8'"
                  :text-color="getPassive(pKey).override ? 'grey-10' : 'white'" label="Ovr"
                  @click="getPassive(pKey).override = true"
                />
              </q-btn-group>
            </div>
            <div class="col-2">
              <q-btn-group spread flat dense>
                <q-btn
                  v-help="'Advantage: roll two d20s and keep the higher.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'" label="▲▲"
                  @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                />
                <q-btn
                  v-help="'Disadvantage: roll two d20s and keep the lower.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'" label="▼▼"
                  @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                />
              </q-btn-group>
            </div>
            <div v-if="getPassive(pKey).override" class="col-4">
              <q-select
                v-help="'Passive score: 10 + the skill bonus (+5 with advantage, −5 with disadvantage).'"
                dense
                outlined
                :model-value="getPassive(pKey).overrideValue ?? 10"
                :options="getPassiveOverrideOptions(pKey)"
                emit-value
                map-options
                use-input
                fill-input
                hide-selected label="Score"
                new-value-mode="add-unique"
                @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
              />
            </div>
            <div v-else class="col-4">
              <mechanic-text-editor
                v-model="getPassive(pKey).condition"
                dense
                outlined
                placeholder="Qualifier"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- INFLUENCE: Deception, Intimidation, Performance, Persuasion, Animal Handling -->
      <div class="col-12 col-md-6">
        <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
          <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
            <span class="text-caption text-weight-bold text-amber-4">🗣️ Influence Checks</span>
            <div class="row items-center q-gutter-x-xs editor-fit-wrap">
              <q-checkbox
                v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                :model-value="movesToActionGroup('influence')"
                dense
                label="Move To Action Group"
                @update:model-value="setMoveToActionGroup('influence', $event)"
              />
              <q-btn-toggle
                v-model="passives.influenceActionType"
                v-help="'Choose whether moving this group places it under Actions or Bonus Actions.'"
                dense
                no-caps
                rounded
                unelevated
                size="xs"
                toggle-color="amber-4"
                toggle-text-color="grey-10"
                color="grey-9"
                text-color="grey-4"
                :options="[
                  { label: 'Action', value: 'Action' },
                  { label: 'Bonus Action', value: 'Bonus Action' },
                ]"
              />
            </div>
          </div>
          <div class="q-mb-xs">
            <mechanic-text-editor
              v-model="passives.riders.influence"
              v-help="'Extra wording for the Influence action (Deception, Intimidation, Performance, Persuasion, Animal Handling).'"
              dense
              outlined
              dark label="Influence Scope / Verbose Rider"
              placeholder="e.g. De-escalate hostile creatures with DC 15 Charisma check..."
            >
              <template #append>
                <q-btn v-if="passives.riders.influence" flat round dense size="xs" icon="close" @click="passives.riders.influence = ''">
                  <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                </q-btn>
              </template>
              <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
            </mechanic-text-editor>
            <div class="row items-center q-gutter-xs q-mt-xs">
              <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                <q-list dense dark class="bg-grey-10">
                  <q-item v-for="(pr, prIdx) in riderPresets.influence" :key="prIdx" v-close-popup clickable @click="applyRiderPreset('influence', pr)">
                    <q-item-section class="text-caption">{{ pr }}</q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <q-btn v-help="$t('help.checks.chipInsightDc')" dense flat size="xs" color="cyan-3" label="+ DC 15" @click="appendRiderTag('influence', 'DC 15 Charisma check')" />
              <q-btn v-help="$t('help.checks.chipMustHear')" dense flat size="xs" color="cyan-3" label="+ Must Hear" @click="appendRiderTag('influence', 'Creature must hear and understand')" />
              <q-btn v-help="$t('help.checks.chipInfluenceRange')" dense flat size="xs" color="cyan-3" label="+ 30ft" @click="appendRiderTag('influence', 'within 30ft')" />
            </div>
          </div>
          <div v-for="pKey in groupPassiveKeys('influence')" :key="pKey" class="row items-center q-col-gutter-xs q-mb-xs">
            <div class="col-3 text-caption">{{ pKey === 'animalHandling' ? 'Animal Hdl.' : pKey.charAt(0).toUpperCase() + pKey.slice(1) }}</div>
            <div class="col-3">
              <q-btn-group spread flat dense>
                <q-btn
                  v-help="'Use the bonus computed from the ability modifier and proficiency.'"
                  dense
                  size="xs"
                  :color="!getPassive(pKey).override ? 'green-9' : 'grey-8'"
                  text-color="white" label="Auto"
                  @click="getPassive(pKey).override = false"
                />
                <q-btn
                  v-help="'Type a fixed bonus instead of the computed one.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).override ? 'amber-4' : 'grey-8'"
                  :text-color="getPassive(pKey).override ? 'grey-10' : 'white'" label="Ovr"
                  @click="getPassive(pKey).override = true"
                />
              </q-btn-group>
            </div>
            <div class="col-2">
              <q-btn-group spread flat dense>
                <q-btn
                  v-help="'Advantage: roll two d20s and keep the higher.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'" label="▲▲"
                  @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                />
                <q-btn
                  v-help="'Disadvantage: roll two d20s and keep the lower.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'" label="▼▼"
                  @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                />
              </q-btn-group>
            </div>
            <div v-if="getPassive(pKey).override" class="col-4">
              <q-select
                v-help="'Passive score: 10 + the skill bonus (+5 with advantage, −5 with disadvantage).'"
                dense
                outlined
                :model-value="getPassive(pKey).overrideValue ?? 10"
                :options="getPassiveOverrideOptions(pKey)"
                emit-value
                map-options
                use-input
                fill-input
                hide-selected label="Score"
                new-value-mode="add-unique"
                @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
              />
            </div>
            <div v-else class="col-4">
              <mechanic-text-editor
                v-model="getPassive(pKey).condition"
                dense
                outlined
                placeholder="Qualifier"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- HIDE: Acrobatics, Athletics, Sleight of Hand, Stealth -->
      <div class="col-12 col-md-6">
        <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
          <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
            <span class="text-caption text-weight-bold text-deep-purple-3">🥷 Hide Checks</span>
            <div class="row items-center q-gutter-x-xs editor-fit-wrap">
              <q-checkbox
                v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                :model-value="movesToActionGroup('hide')"
                dense
                label="Move To Action Group"
                @update:model-value="setMoveToActionGroup('hide', $event)"
              />
              <q-btn-toggle
                v-model="passives.hideActionType"
                v-help="'Choose whether moving this group places it under Actions or Bonus Actions.'"
                dense
                no-caps
                rounded
                unelevated
                size="xs"
                toggle-color="deep-purple-6"
                color="grey-9"
                text-color="grey-4"
                :options="[
                  { label: 'Action', value: 'Action' },
                  { label: 'Bonus Action', value: 'Bonus Action' },
                ]"
              />
            </div>
          </div>
          <div class="q-mb-xs">
            <mechanic-text-editor
              v-model="passives.riders.hide"
              v-help="'Extra wording for the Hide action (Stealth).'"
              dense
              outlined
              dark label="Hide Scope / Verbose Rider"
              placeholder="e.g. Can hide in dim light or darkness even while observed..."
            >
              <template #append>
                <q-btn v-if="passives.riders.hide" flat round dense size="xs" icon="close" @click="passives.riders.hide = ''">
                  <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                </q-btn>
              </template>
              <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
            </mechanic-text-editor>
            <div class="row items-center q-gutter-xs q-mt-xs">
              <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                <q-list dense dark class="bg-grey-10">
                  <q-item v-for="(pr, prIdx) in riderPresets.hide" :key="prIdx" v-close-popup clickable @click="applyRiderPreset('hide', pr)">
                    <q-item-section class="text-caption">{{ pr }}</q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <q-btn v-help="$t('help.checks.chipLightObscured')" dense flat size="xs" color="cyan-3" label="+ Light Obscurement" @click="appendRiderTag('hide', 'Must have light obscurement or 3/4 cover')" />
              <q-btn v-help="$t('help.checks.chipWhileObserved')" dense flat size="xs" color="cyan-3" label="+ While Observed" @click="appendRiderTag('hide', 'Can hide while observed in dim light')" />
              <q-btn v-help="$t('help.checks.chipHideInvisible')" dense flat size="xs" color="cyan-3" label="+ Invisible" @click="appendRiderTag('hide', 'Become invisible until start of next turn')" />
            </div>
          </div>
          <div v-for="pKey in groupPassiveKeys('hide')" :key="`hide-${pKey}`" class="row items-center q-col-gutter-xs q-mb-xs">
            <div class="col-3 text-caption">{{ passiveLabel(pKey) }}</div>
            <div class="col-3">
              <q-btn-group spread flat dense>
                <q-btn
                  v-help="'Use the bonus computed from the ability modifier and proficiency.'"
                  dense
                  size="xs"
                  :color="!getPassive(pKey).override ? 'green-9' : 'grey-8'"
                  text-color="white" label="Auto"
                  @click="getPassive(pKey).override = false"
                />
                <q-btn
                  v-help="'Type a fixed bonus instead of the computed one.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).override ? 'amber-4' : 'grey-8'"
                  :text-color="getPassive(pKey).override ? 'grey-10' : 'white'" label="Ovr"
                  @click="getPassive(pKey).override = true"
                />
              </q-btn-group>
            </div>
            <div class="col-2">
              <q-btn-group spread flat dense>
                <q-btn
                  v-help="'Advantage: roll two d20s and keep the higher.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'" label="▲▲"
                  @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                />
                <q-btn
                  v-help="'Disadvantage: roll two d20s and keep the lower.'"
                  dense
                  size="xs"
                  :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'" label="▼▼"
                  @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                />
              </q-btn-group>
            </div>
            <div v-if="getPassive(pKey).override" class="col-4">
              <q-select
                v-help="'Passive score: 10 + the skill bonus (+5 with advantage, −5 with disadvantage).'"
                dense
                outlined
                :model-value="getPassive(pKey).overrideValue ?? 10"
                :options="getPassiveOverrideOptions(pKey)"
                emit-value
                map-options
                use-input
                fill-input
                hide-selected label="Score"
                new-value-mode="add-unique"
                @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
              />
            </div>
            <div v-else class="col-4">
              <mechanic-text-editor
                v-model="getPassive(pKey).condition"
                dense
                outlined
                placeholder="Qualifier"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- USE TOOL: Artisan tools, kits, musical instruments -->
      <div class="col-12 col-md-6">
        <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
          <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
            <span class="text-caption text-weight-bold text-teal-4">🛠️ Use Tool Checks</span>
            <div class="row items-center q-gutter-x-xs editor-fit-wrap">
              <q-checkbox
                v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                :model-value="movesToActionGroup('tools')"
                dense
                label="Move To Action Group"
                @update:model-value="setMoveToActionGroup('tools', $event)"
              />
              <q-btn-toggle
                v-model="passives.toolsActionType"
                v-help="'Choose whether moving this group places it under Actions or Bonus Actions.'"
                dense
                no-caps
                rounded
                unelevated
                size="xs"
                toggle-color="teal-8"
                color="grey-9"
                text-color="grey-4"
                :options="[
                  { label: 'Action', value: 'Action' },
                  { label: 'Bonus Action', value: 'Bonus Action' },
                ]"
              />
            </div>
          </div>
          <div class="q-mb-xs">
            <mechanic-text-editor
              v-model="passives.riders.tools"
              v-help="'Extra wording for using a tool as an action.'"
              dense
              outlined
              dark label="Use Tool Scope / Verbose Rider"
              placeholder="e.g. Can craft or repair equipment during short rest..."
            >
              <template #append>
                <q-btn v-if="passives.riders.tools" flat round dense size="xs" icon="close" @click="passives.riders.tools = ''">
                  <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                </q-btn>
              </template>
              <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
            </mechanic-text-editor>
            <div class="row items-center q-gutter-xs q-mt-xs">
              <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                <q-list dense dark class="bg-grey-10">
                  <q-item v-for="(pr, prIdx) in riderPresets.tools" :key="prIdx" v-close-popup clickable @click="applyRiderPreset('tools', pr)">
                    <q-item-section class="text-caption">{{ pr }}</q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <q-btn v-help="$t('help.checks.chipToolTime')" dense flat size="xs" color="cyan-3" label="+ 1 min" @click="appendRiderTag('tools', 'in 1 minute')" />
              <q-btn v-help="$t('help.checks.chipToolBonus')" dense flat size="xs" color="cyan-3" label="+ Bonus Action" @click="appendRiderTag('tools', 'as a bonus action')" />
              <q-btn v-help="$t('help.checks.chipToolDc')" dense flat size="xs" color="cyan-3" label="+ DC 15" @click="appendRiderTag('tools', 'DC 15 tool check')" />
            </div>
          </div>
          <div v-if="monster.tools && monster.tools.length > 0" class="row q-gutter-xs q-mt-xs">
            <q-chip
              v-for="t in monster.tools"
              :key="t.id"
              dense
              size="sm"
              color="teal-9"
              text-color="teal-1"
            >
              {{ t.name }} ({{ t.stat }})
            </q-chip>
          </div>
          <div v-else class="text-caption text-grey-5 q-pa-xs">
            No tools configured yet. Add tools above in Section 2 to include them here.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MechanicTextEditor from '../MechanicTextEditor.vue'
import { injectSkillsEditorState } from './useSkillsEditorState'

export default defineComponent({
  name: 'SkillScopeChecksSection',
  components: { MechanicTextEditor },
  setup() {
    return injectSkillsEditorState()
  },
})
</script>
