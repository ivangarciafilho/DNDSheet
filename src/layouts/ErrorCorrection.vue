<template>
  <q-layout view="hHh lpR fFf" class="bg-dark text-white">
    <q-header elevated height-hint="64" class="bg-grey-10">
      <q-toolbar>
        <q-btn flat round icon="arrow_back" to="/" aria-label="Return to Editor">
          <q-tooltip>Return to Editor</q-tooltip>
        </q-btn>
        <q-toolbar-title shrink class="row items-center no-wrap">
          <span class="q-ml-sm">{{ $t('app.name') }}</span>
          <span class="text-caption text-grey-4 q-ml-md">— Data Recovery & Diagnostic Studio</span>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="flex items-center justify-center full-height full-width q-pa-md">
        <q-card
          bordered
          style="max-width: 650px; width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12);"
          class="q-mt-lg shadow-6 rounded-borders"
        >
          <q-card-section class="row items-center justify-between">
            <div class="text-h6 text-teal-4">
              <q-icon name="build" class="q-mr-xs" /> Reset & Diagnostic Tool
            </div>
            <q-btn flat dense icon="home" to="/" label="Home" color="teal-3" />
          </q-card-section>
          <q-separator style="background: rgba(255, 255, 255, 0.1);" />

          <q-card-section>
            <p class="text-body2 text-grey-3">
              {{ $t('error.message') }}
            </p>
            <p class="text-body2 text-grey-4">
              {{ $t('error.report') }}
            </p>
          </q-card-section>

          <!-- Recovery Backups Section -->
          <q-card-section class="q-pt-none">
            <div class="text-subtitle2 text-weight-bold text-grey-4 q-mb-xs">Export Diagnostic Snapshots</div>
            <div class="row q-col-gutter-xs">
              <div class="col-6 col-sm-3">
                <q-btn outline color="primary" class="full-width" @click="downloadFile">
                  Monster JSON
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn outline color="teal-4" class="full-width" @click="downloadCharacter">
                  Hero JSON
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn outline color="amber-4" class="full-width" @click="downloadSpells">
                  Spells JSON
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn outline color="purple-4" class="full-width" @click="downloadTemplates">
                  Templates JSON
                </q-btn>
              </div>
            </div>
          </q-card-section>

          <q-separator style="background: rgba(255, 255, 255, 0.1);" class="q-my-sm" />

          <!-- Reset / Purge Section -->
          <q-card-section class="q-pt-none">
            <div class="text-subtitle2 text-weight-bold text-negative q-mb-xs">Purge Corrupted Local Storage</div>
            <div class="row q-col-gutter-xs">
              <div class="col-6 col-sm-3">
                <q-btn color="negative" class="full-width" @click="clear">
                  Reset Monster
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn color="negative" class="full-width" @click="clearCharacter">
                  Reset Hero
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn color="negative" class="full-width" @click="clearSpells">
                  Reset Spells
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn color="negative" class="full-width" @click="clearTemplates">
                  Reset Templates
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-page-container>

    <q-footer elevated class="bg-grey-10 text-center q-py-xs text-caption text-grey-5">
      5e Monster Maker & Hero Sheet • 100% Offline PWA Diagnostic Safe Mode
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import { download } from '../components/file/download'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ErrorCorrectionLayout',
  setup() {
    const clear = () => {
      localStorage.removeItem('app.monster')
      window.location.assign(`${window.location.origin}${window.location.pathname}`)
    }

    const clearCharacter = () => {
      localStorage.removeItem('app.character')
      window.location.assign(`${window.location.origin}${window.location.pathname}`)
    }

    const clearSpells = () => {
      localStorage.removeItem('app.spells')
      window.location.assign(`${window.location.origin}${window.location.pathname}`)
    }

    const clearTemplates = () => {
      localStorage.removeItem('app.templates')
      window.location.assign(`${window.location.origin}${window.location.pathname}`)
    }

    const downloadFile = () => {
      const data = localStorage.getItem('app.monster')
      if (data) download(data, 'monster-error.json', 'application/json')
    }

    const downloadCharacter = () => {
      const data = localStorage.getItem('app.character')
      if (data) download(data, 'character-error.json', 'application/json')
    }

    const downloadSpells = () => {
      const data = localStorage.getItem('app.spells')
      if (data) download(data, 'spells-error.json', 'application/json')
    }

    const downloadTemplates = () => {
      const data = localStorage.getItem('app.templates')
      if (data) download(data, 'templates-error.json', 'application/json')
    }

    return {
      clear,
      clearCharacter,
      clearSpells,
      clearTemplates,
      downloadFile,
      downloadCharacter,
      downloadSpells,
      downloadTemplates,
    }
  },
})
</script>

<style scoped>
</style>
