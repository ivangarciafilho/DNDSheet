<template>
  <div>
    <!-- 10. Languages Smart List -->
    <q-expansion-item
      v-help="'Configure spoken and understood languages, telepathy, and special communication rules.'"
      dense
      dense-toggle
      expand-separator
      default-opened
      class="q-mt-sm rounded-borders"
      style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      icon="translate"
      label="Languages"
      caption="Select official D&D languages, configure telepathy and understand-only options"
    >
      <div class="q-pa-sm">
        <!-- Racial / Class Communication Archetypes (Mutually Exclusive) -->
        <div
          class="q-pa-xs rounded-borders q-mb-sm"
          style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.07);"
        >
          <div class="row items-center justify-between q-mb-xs">
            <span class="text-caption text-weight-bold text-grey-3">Universal / Archetype Communication:</span>
            <span class="text-caption text-grey-5">(Mutually Exclusive)</span>
          </div>
          <div class="editor-fit-wrap">
            <q-btn-toggle
              v-model="monster.specialCommunicationArchetype"
              v-help="'Apply an innate universal speech trait such as Firbolg Speech of Beast and Leaf or Monk Tongue of Sun and Moon.'"
              dense
              toggle-color="primary"
              color="dark"
              text-color="grey-4"
              size="sm"
              no-caps
              :options="[
                { label: 'Standard (None)', value: 'none' },
                { label: 'Firbolg: Beast & Leaf', value: 'firbolg' },
                { label: 'Monk: Sun & Moon', value: 'monk' },
              ]"
              @update:model-value="syncLanguagesToString"
            />
          </div>
        </div>

        <!-- Add Language via Dropdown (no add button) -->
        <div class="row q-col-gutter-xs items-center q-mb-sm">
          <catalog-select
            v-help="'Choose an official D&D language or type a custom language and press Enter to add it.'"
            :model-value="null"
            :entries="availableLanguageEntries"
            allow-custom
            label="Select or Type Language to Add"
            class="col-12"
            @update:model-value="onLanguageSelected"
          >
            <template #prepend>
              <q-icon name="add" />
            </template>
          </catalog-select>
        </div>

        <!-- Active Languages List -->
        <div v-if="monster.languagesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No languages configured. Select a language above or type custom.
        </div>

        <div
          v-for="(lang, idx) in monster.languagesList"
          :key="lang.id || idx"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
        >
          <!-- Telepathy Language Card -->
          <div v-if="lang.name.toLowerCase() === 'telepathy' || lang.telepathy">
            <div class="row q-col-gutter-xs items-center justify-between">
              <div class="editor-fit-wrap items-center">
                <q-chip dense outline color="accent" class="q-ma-none text-weight-bold">
                  Telepathy
                </q-chip>
                <formula-field
                  v-help="'Maximum telepathic communication range in feet.'"
                  :path="`languagesList[id=${encodeURIComponent(lang.id)}].telepathyRange`"
                  label="Range (ft)"
                  dense
                  outlined
                  @applied="syncLanguagesToString"
                />
              </div>
              <div class="row items-center q-gutter-x-xs">
                <swap-buttons field="languagesList" :idx="idx" flat dense />
                <q-btn
                  v-help="'Remove this language entry from the creature.'"
                  flat
                  dense
                  round
                  size="sm"
                  color="negative"
                  icon="delete"
                  @click="removeLanguage(idx)"
                />
              </div>
            </div>

            <!-- Telepathy Configuration Studio -->
            <div class="q-mt-xs q-gutter-y-xs text-caption">
              <div class="row q-col-gutter-xs items-center">
                <div class="col-12 col-sm-4 text-grey-4 text-weight-medium">
                  Language Requirement:
                </div>
                <div class="col-12 col-sm-8 editor-fit-wrap">
                  <q-btn-toggle
                    v-model="lang.languageRequirement"
                    v-help="'Specify whether targets must share a language or understand a language to reply telepathically.'"
                    dense
                    toggle-color="primary"
                    color="dark"
                    text-color="grey-4"
                    size="sm"
                    no-caps
                    :options="LANGUAGE_REQUIREMENT_ENTRIES"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-xs items-center">
                <div class="col-12 col-sm-4 text-grey-4 text-weight-medium">
                  Creature Target:
                </div>
                <div class="col-12 col-sm-8 editor-fit-wrap">
                  <q-btn-toggle
                    v-model="lang.creatureTarget"
                    v-help="'Restrict telepathic links to allies, willing creatures, or any creature in range.'"
                    dense
                    toggle-color="secondary"
                    color="dark"
                    text-color="grey-4"
                    size="sm"
                    no-caps
                    :options="CREATURE_TARGET_ENTRIES"
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
              </div>

              <!-- Transmission & Reach Modifiers -->
              <div class="row q-col-gutter-xs items-center">
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.broadcast"
                    v-help="$t('help.languages.broadcast')"
                    label="Broadcast to all creatures in range"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.noReply"
                    v-help="$t('help.languages.oneWay')"
                    label="One-way only (target cannot reply)"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.simpleConceptsOnly"
                    v-help="$t('help.languages.simpleIdeas')"
                    label="Only simple ideas and concepts"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.acrossPlanes"
                    v-help="$t('help.languages.planarBridge')"
                    label="Across ethereal & material planes"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.multiverseWide"
                    v-help="$t('help.languages.multiverse')"
                    label="Multiverse wide reach"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.telepathicAwareness"
                    v-help="$t('help.languages.unseenMinds')"
                    label="Telepathic Awareness (perceives unseen minds)"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.sensesSentient"
                    v-help="$t('help.languages.senseSentient')"
                    label="Senses sentient creatures in range"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.locatesSentient"
                    v-help="$t('help.languages.locateSentient')"
                    label="Locates exact location of sentient creatures"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="lang.telepathicEavesdrop"
                    v-help="$t('help.languages.eavesdrop')"
                    label="Eavesdrops telepathic conversations in range"
                    dense
                    @update:model-value="syncLanguagesToString"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <catalog-select
                    v-help="$t('help.languages.concentrationFilter')"
                    :model-value="lang.creatureConcentrationFilter"
                    :entries="CONCENTRATION_FILTER_ENTRIES"
                    preserve-order
                    :searchable="false"
                    label="Target Concentration Filter"
                    @update:model-value="(val) => { lang.creatureConcentrationFilter = String(val || 'any') as typeof lang.creatureConcentrationFilter; syncLanguagesToString() }"
                  />
                </div>
              </div>

              <!-- Deep Probing Matrix -->
              <q-expansion-item
                v-help="'Configure surface thought reading, emotion sensing, and resistance saving throws.'"
                dense
                dense-toggle
                icon="psychology"
                label="Deep Probing & Mental Exploration"
                caption="Detect thoughts, desires, alignment, memories, centralized save DC"
                header-class="text-caption text-primary q-pa-none"
                class="rounded-borders q-pa-xs"
                style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);"
              >
                <div class="row q-col-gutter-xs items-center q-pt-xs">
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.learnDesires"
                      v-help="$t('help.languages.learnDesires')"
                      label="Learns greatest desires"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.readThoughts"
                      v-help="$t('help.languages.readSurfaceThoughts')"
                      label="Reads surface / active thoughts"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.senseEmotions"
                      v-help="$t('help.languages.senseEmotions')"
                      label="Senses emotions & turmoil"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.senseAlignment"
                      v-help="$t('help.languages.senseAlignment')"
                      label="Senses moral/ethical alignment"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.senseIntentions"
                      v-help="$t('help.languages.senseTacticalIntent')"
                      label="Senses tactical intentions"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.detectSincerity"
                      v-help="$t('help.languages.detectDeception')"
                      label="Detects truth & deception"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.accessMemories"
                      v-help="$t('help.languages.accessDeepMemory')"
                      label="Accesses deep memories"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>

                  <div class="col-12 q-mt-xs">
                    <q-checkbox
                      v-model="lang.requiresSave"
                      v-help="$t('help.languages.probeSave')"
                      label="Requires saving throw to resist mental probing or sensory connection"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <template v-if="lang.requiresSave">
                    <div class="col-12 col-sm-4">
                      <catalog-select
                        v-help="'Ability score used for the saving throw against telepathic intrusion.'"
                        :model-value="lang.saveType"
                        :entries="MENTAL_SAVE_STAT_ENTRIES"
                        preserve-order
                        :searchable="false"
                        label="Save Type"
                        @update:model-value="(val) => { lang.saveType = String(val || 'WIS') as typeof lang.saveType; syncLanguagesToString() }"
                      />
                    </div>
                    <div class="col-12 col-sm-4">
                      <formula-field
                        v-help="'Difficulty Class targets must beat to resist this special communication ability.'"
                        :path="`languagesList[id=${encodeURIComponent(lang.id)}].saveDc`"
                        label="Save DC"
                        dense
                        outlined
                        clearable
                        @applied="syncLanguagesToString"
                      />
                    </div>
                    <div class="col-12 col-sm-4">
                      <catalog-select
                        v-help="$t('help.languages.targetAwareness')"
                        :model-value="lang.saveAwareness"
                        :entries="SAVE_AWARENESS_ENTRIES"
                        preserve-order
                        :searchable="false"
                        label="Target Awareness"
                        @update:model-value="(val) => { lang.saveAwareness = String(val || 'unaware_on_fail') as typeof lang.saveAwareness; syncLanguagesToString() }"
                      />
                    </div>
                  </template>
                </div>
              </q-expansion-item>

              <!-- Sensory Links & Disruption Matrix -->
              <q-expansion-item
                v-help="'Configure shared senses, Psychic damage disruption, and Concentration rules.'"
                dense
                dense-toggle
                icon="visibility"
                label="Sensory Links & Psychic Disruption"
                caption="Share senses, psychic disruption, concentration"
                header-class="text-caption text-secondary q-pa-none"
                class="rounded-borders q-pa-xs"
                style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);"
              >
                <div class="row q-col-gutter-xs items-center q-pt-xs">
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.shareOwnSenses"
                      v-help="$t('help.languages.shareOwnSenses')"
                      label="Shares own senses (sight/hearing)"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.probeCreatureSenses"
                      v-help="$t('help.languages.probeCreatureSenses')"
                      label="Perceives through creature's senses"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox
                      v-model="lang.disruptedByPsychicDamage"
                      v-help="$t('help.languages.psychicDisruption')"
                      label="Disrupted when creature takes psychic damage"
                      dense
                      @update:model-value="syncLanguagesToString"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <catalog-select
                      v-help="'Specify how telepathic scanning interacts with an existing concentration effect.'"
                      :model-value="lang.concentrationMode"
                      :entries="CONCENTRATION_MODE_ENTRIES"
                      preserve-order
                      :searchable="false"
                      label="Concentration Interaction"
                      @update:model-value="(val) => { lang.concentrationMode = String(val || 'none') as typeof lang.concentrationMode; syncLanguagesToString() }"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <catalog-select
                      v-help="'Specify whether maintaining this telepathic bond requires concentration.'"
                      :model-value="lang.concentration"
                      :entries="CONCENTRATION_ENTRIES"
                      preserve-order
                      :searchable="false"
                      label="Requires Concentration"
                      @update:model-value="(val) => { lang.concentration = String(val || 'none') as typeof lang.concentration; syncLanguagesToString() }"
                    />
                  </div>
                </div>
              </q-expansion-item>

              <div class="col-12 q-mt-xs">
                <mechanic-text-editor
                  v-model="lang.note"
                  v-help="$t('help.languages.extraNote')"
                  label="Additional Note"
                  dense
                  outlined
                  placeholder="e.g. within visual line of sight"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
            </div>
          </div>

          <!-- Handle Animals Ruling Card -->
          <div
            v-else-if="lang.name.toLowerCase() === 'handle animals' || lang.animalHandling?.enabled"
            class="q-pa-xs"
          >
            <div class="row q-col-gutter-xs items-center justify-between q-mb-xs">
              <div class="editor-fit-wrap items-center">
                <q-chip dense outline color="secondary" class="q-ma-none text-weight-bold">
                  Handle Animals
                </q-chip>
                <formula-field
                  v-help="'Base Difficulty Class to calm or influence beasts.'"
                  :path="`languagesList[id=${encodeURIComponent(lang.id)}].animalHandling.dc`"
                  label="Base DC"
                  dense
                  outlined
                  @applied="syncLanguagesToString"
                />
              </div>
              <div class="row items-center q-gutter-x-xs no-wrap">
                <swap-buttons field="languagesList" :idx="idx" flat dense />
                <q-btn
                  v-help="'Remove this language entry from the creature.'"
                  flat
                  dense
                  round
                  size="sm"
                  color="negative"
                  icon="delete"
                  @click="removeLanguage(idx)"
                />
              </div>
            </div>

            <div class="row q-col-gutter-xs items-center text-caption q-mt-xs">
              <div class="col-12 col-sm-4">
                <mechanic-text-editor
                  v-model="getAnimalHandling(lang).peacefulOutcome"
                  v-help="$t('help.languages.beastCalmDc')"
                  label="DC (Calm / Cease Aggression)"
                  dense
                  outlined
                  placeholder="calm/cease aggression"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-4">
                <mechanic-text-editor
                  v-model="getAnimalHandling(lang).commandOutcome"
                  v-help="$t('help.languages.beastCommandDc')"
                  label="DC+5 (Basic Commands)"
                  dense
                  outlined
                  placeholder="convey basic commands"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-4">
                <mechanic-text-editor
                  v-model="getAnimalHandling(lang).recruitOutcome"
                  v-help="$t('help.languages.beastBondDc')"
                  label="DC+10 (Recruit / Bond)"
                  dense
                  outlined
                  placeholder="recruit aid/bond"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 q-mt-xs">
                <mechanic-text-editor
                  v-model="getAnimalHandling(lang).customNotes"
                  v-help="$t('help.languages.beastCustomNote')"
                  label="Custom Ruling Note"
                  dense
                  outlined
                  placeholder="e.g. beasts of CR 1 or lower"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
            </div>
          </div>

          <!-- Animals (Speak with Animals) Card -->
          <div
            v-else-if="lang.name.toLowerCase() === 'animals' || lang.animalsConfig"
            class="q-pa-xs"
          >
            <div class="row items-center justify-between q-mb-xs">
              <q-chip dense outline color="primary" class="q-ma-none text-weight-bold">
                Animals (Speak with Animals)
              </q-chip>
              <div class="row items-center q-gutter-x-xs no-wrap">
                <swap-buttons field="languagesList" :idx="idx" flat dense />
                <q-btn
                  v-help="'Remove this language entry from the creature.'"
                  flat
                  dense
                  round
                  size="sm"
                  color="negative"
                  icon="delete"
                  @click="removeLanguage(idx)"
                />
              </div>
            </div>
            <div class="row q-col-gutter-xs items-center text-caption">
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="getAnimalsConfig(lang).simpleConceptsOnly"
                  v-help="$t('help.languages.beastSimpleIdeas')"
                  label="Simple concepts, needs, and emotions only"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="lang.understandsOnly"
                  v-help="$t('help.languages.beastUnderstandOnly')"
                  label="Understands beasts but cannot speak"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="getAnimalsConfig(lang).specificSubtype"
                  v-help="$t('help.languages.beastSubtypes')"
                  label="Specific Subtypes"
                  dense
                  outlined
                  placeholder="e.g. birds and rodents only"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <mechanic-text-editor
                  v-model="getAnimalsConfig(lang).note"
                  v-help="'Extra qualifier printed beside Speak with Animals.'"
                  label="Note"
                  dense
                  outlined
                  placeholder="e.g. within 30 ft."
                  @update:model-value="syncLanguagesToString"
                />
              </div>
            </div>
          </div>

          <!-- Plants (Speak with Plants) Card -->
          <div
            v-else-if="lang.name.toLowerCase() === 'plants' || lang.plantsConfig"
            class="q-pa-xs"
          >
            <div class="row items-center justify-between q-mb-xs">
              <q-chip dense outline color="positive" class="q-ma-none text-weight-bold">
                Plants (Speak with Plants)
              </q-chip>
              <div class="row items-center q-gutter-x-xs no-wrap">
                <swap-buttons field="languagesList" :idx="idx" flat dense />
                <q-btn
                  v-help="'Remove this language entry from the creature.'"
                  flat
                  dense
                  round
                  size="sm"
                  color="negative"
                  icon="delete"
                  @click="removeLanguage(idx)"
                />
              </div>
            </div>
            <div class="row q-col-gutter-xs items-center text-caption">
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="getPlantsConfig(lang).canQuestionPastDay"
                  v-help="$t('help.languages.plantQuestion')"
                  label="Question plants about events of past day"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="getPlantsConfig(lang).difficultTerrainNegotiation"
                  v-help="$t('help.languages.plantTerrain')"
                  label="Negotiate difficult terrain"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="lang.understandsOnly"
                  v-help="$t('help.languages.plantUnderstandOnly')"
                  label="Understands plants but cannot speak"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <mechanic-text-editor
                  v-model="getPlantsConfig(lang).note"
                  v-help="'Extra qualifier printed beside Speak with Plants.'"
                  label="Note"
                  dense
                  outlined
                  placeholder="e.g. ordinary and plant creatures"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
            </div>
          </div>

          <!-- Undead (Command / Speak with Undead) Card -->
          <div
            v-else-if="lang.name.toLowerCase() === 'undead' || lang.undeadConfig"
            class="q-pa-xs"
          >
            <div class="row items-center justify-between q-mb-xs">
              <div class="editor-fit-wrap items-center">
                <q-chip dense outline color="purple" class="q-ma-none text-weight-bold">
                  Undead (Command / Speak)
                </q-chip>
                <formula-field
                  v-help="'Maximum range in feet to command or communicate with undead.'"
                  :path="`languagesList[id=${encodeURIComponent(lang.id)}].undeadConfig.telepathicRange`"
                  label="Range (ft)"
                  dense
                  outlined
                  @applied="syncLanguagesToString"
                />
              </div>
              <div class="row items-center q-gutter-x-xs no-wrap">
                <swap-buttons field="languagesList" :idx="idx" flat dense />
                <q-btn
                  v-help="'Remove this language entry from the creature.'"
                  flat
                  dense
                  round
                  size="sm"
                  color="negative"
                  icon="delete"
                  @click="removeLanguage(idx)"
                />
              </div>
            </div>
            <div class="row q-col-gutter-xs items-center text-caption">
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="getUndeadConfig(lang).commandMindless"
                  v-help="$t('help.languages.undeadCommand')"
                  label="Issue mental commands to mindless undead"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="lang.understandsOnly"
                  v-help="$t('help.languages.undeadUnderstandOnly')"
                  label="Understands undead languages but cannot speak"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12">
                <mechanic-text-editor
                  v-model="getUndeadConfig(lang).note"
                  v-help="'Extra qualifier printed beside Undead communication.'"
                  label="Note"
                  dense
                  outlined
                  placeholder="e.g. skeletons and zombies under its command"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
            </div>
          </div>

          <!-- Dead (Speak with Dead) Card -->
          <div
            v-else-if="lang.name.toLowerCase().startsWith('dead') || lang.deadConfig"
            class="q-pa-xs"
          >
            <div class="row items-center justify-between q-mb-xs">
              <div class="editor-fit-wrap items-center">
                <q-chip dense outline color="brown" class="q-ma-none text-weight-bold">
                  Dead (Speak with Dead)
                </q-chip>
                <formula-field
                  v-help="'Maximum number of questions a corpse can answer.'"
                  :path="`languagesList[id=${encodeURIComponent(lang.id)}].deadConfig.maxQuestions`"
                  label="Questions"
                  dense
                  outlined
                  @applied="syncLanguagesToString"
                />
              </div>
              <div class="row items-center q-gutter-x-xs no-wrap">
                <swap-buttons field="languagesList" :idx="idx" flat dense />
                <q-btn
                  v-help="'Remove this language entry from the creature.'"
                  flat
                  dense
                  round
                  size="sm"
                  color="negative"
                  icon="delete"
                  @click="removeLanguage(idx)"
                />
              </div>
            </div>
            <div class="row q-col-gutter-xs items-center text-caption">
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="getDeadConfig(lang).corpseMustHaveMouth"
                  v-help="$t('help.languages.corpseMouth')"
                  label="Corpse must have a mouth"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="getDeadConfig(lang).answersCryptic"
                  v-help="$t('help.languages.corpseCryptic')"
                  label="Answers may be brief, cryptic, or repetitive"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="getDeadConfig(lang).deadWithinYears"
                  v-help="$t('help.languages.corpseRecency')"
                  label="Deceased Within"
                  dense
                  outlined
                  placeholder="e.g. 10 days, 100 years"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
              <div class="col-12 col-sm-6">
                <mechanic-text-editor
                  v-model="getDeadConfig(lang).note"
                  v-help="'Extra qualifier printed beside Speak with Dead.'"
                  label="Note"
                  dense
                  outlined
                  placeholder="e.g. requires 10-minute ritual"
                  @update:model-value="syncLanguagesToString"
                />
              </div>
            </div>
          </div>

          <!-- Standard Language Row -->
          <div v-else>
            <div class="row q-col-gutter-xs items-center justify-between">
              <div class="col-12 col-sm-3 text-weight-bold text-subtitle2">
                <q-chip dense outline color="primary" class="q-ma-none">
                  {{ lang.name }}
                </q-chip>
              </div>

              <div class="col-12 col-sm-4">
                <q-checkbox
                  v-model="lang.understandsOnly"
                  v-help="$t('help.languages.understandOnly')"
                  :label="/manufacturer|creator|maker/i.test(lang.name || '') ? 'However, can\u2019t speak' : 'Understands but cannot speak'"
                  dense
                  @update:model-value="syncLanguagesToString"
                />
              </div>

              <div class="col-10 col-sm-3">
                <mechanic-text-editor
                  v-model="lang.note"
                  v-help="'Optional qualifier printed beside this language (for example with allies).'"
                  label="Note"
                  dense
                  outlined
                  placeholder="e.g. with allies"
                  @update:model-value="syncLanguagesToString"
                />
              </div>

              <div class="col-2 col-sm-2 text-right row items-center justify-end q-gutter-x-xs">
                <swap-buttons field="languagesList" :idx="idx" flat dense />
                <q-btn
                  v-help="'Remove this language entry from the creature.'"
                  flat
                  dense
                  round
                  size="sm"
                  color="negative"
                  icon="delete"
                  @click="removeLanguage(idx)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Formatted String & Raw Override Option -->
        <div class="row items-center justify-between q-mt-xs">
          <div class="text-caption text-grey-5">
            Live Preview: <em>{{ monster.languages || '&mdash;' }}</em>
          </div>
          <q-btn
            v-help="$t('help.languages.plainFallback')"
            flat
            dense
            size="xs"
            color="grey-5"
            :label="showManualLangEdit ? 'Hide Manual Input' : 'Edit Raw Text'"
            @click="showManualLangEdit = !showManualLangEdit"
          />
        </div>

        <div v-if="showManualLangEdit" class="q-mt-xs">
          <q-input
            v-model="monster.languages"
            v-help="$t('help.languages.plainFallback')"
            label="Raw Languages String"
            outlined
            dense
          />
        </div>
      </div>
      <basic-riders-editor scope="languages" label="Language riders" />
    </q-expansion-item>
    <database-studio class="q-mt-sm" />
  </div>
</template>

<script setup lang="ts">
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import FormulaField from 'src/components/kit/FormulaField.vue'
import BasicRidersEditor from '../BasicRidersEditor.vue'
import DatabaseStudio from '../DatabaseStudio.vue'
import MechanicTextEditor from '../MechanicTextEditor.vue'
import SwapButtons from '../widgets/SwapButtons.vue'
import {
  CONCENTRATION_ENTRIES,
  CONCENTRATION_FILTER_ENTRIES,
  CONCENTRATION_MODE_ENTRIES,
  CREATURE_TARGET_ENTRIES,
  LANGUAGE_REQUIREMENT_ENTRIES,
  MENTAL_SAVE_STAT_ENTRIES,
  SAVE_AWARENESS_ENTRIES,
} from './basics-catalogs'
import { useBasicsContext } from './useBasicsContext'

const {
  monster,
  availableLanguageEntries,
  showManualLangEdit,
  syncLanguagesToString,
  onLanguageSelected,
  removeLanguage,
  getAnimalHandling,
  getAnimalsConfig,
  getPlantsConfig,
  getUndeadConfig,
  getDeadConfig,
} = useBasicsContext()
</script>
