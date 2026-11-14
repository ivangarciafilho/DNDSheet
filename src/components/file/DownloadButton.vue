<template>
  <q-btn round flat icon="download">
    <q-menu>
      <q-list v-if="editorStore.activeMode === 'character'">
        <q-item v-close-popup clickable @click="saveCharJson()">
          <q-item-section>Export Character JSON (.json)</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="saveCharMd()">
          <q-item-section>Export Character Markdown (.md)</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="saveCharTxt()">
          <q-item-section>Export Character Plain Text (.txt)</q-item-section>
        </q-item>
        <q-separator />
        <q-item v-close-popup clickable @click="savePng()">
          <q-item-section>Save Sheet as PNG</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="copyCharMd()">
          <q-item-section>Copy Character Markdown</q-item-section>
        </q-item>
      </q-list>
      <q-list v-else>
        <q-item v-close-popup clickable @click="save5emm()">
          <q-item-section>{{ $t('io.export.default') }}</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="saveMd3()">
          <q-item-section>{{ $t('io.export.md3') }}</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="saveImprovedInit()">
          <q-item-section>{{ $t('io.export.improvedInit') }}</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="saveLatex()">
          <q-item-section>{{ $t('io.export.latex') }}</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="saveTio()">
          <q-item-section>{{ $t('io.export.tarrasque') }}</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="saveMd()">
          <q-item-section>{{ $t('io.export.md') }}</q-item-section>
        </q-item>
        <q-separator />
        <q-item v-close-popup clickable @click="exportFoundry()">
          <q-item-section>Foundry VTT (Actor5e JSON)</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="exportPlainText()">
          <q-item-section>Plain Text (.txt)</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="exportHtml()">
          <q-item-section>HTML Snippet (.html)</q-item-section>
        </q-item>
        <q-separator />
        <q-item v-close-popup clickable @click="savePng()">
          <q-item-section>{{ $t('io.export.png') }}</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="copyMd()">
          <q-item-section>{{ $t('io.export.mdClip') }}</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="copyLink()">
          <q-item-section>{{ $t('io.export.link') }}</q-item-section>
        </q-item>
        <q-separator />
        <q-item
          v-close-popup
          clickable
          data-export-preview-open
          @click="openExportPreview()"
        >
          <q-item-section>Export Preview &amp; Capabilities...</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>

  <q-dialog v-model="exportPreviewOpen" data-export-preview-dialog>
    <q-card style="min-width: 680px; max-width: 92vw;">
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div>
          <div class="text-h6">Export Preview &amp; Capabilities</div>
          <div class="text-caption text-grey-7">
            Source rev #{{ exportPreviewResult.sourceRevision }} · {{ exportPreviewResult.capability.lossless ? 'Lossless Canonical Save' : 'Derived Projection' }}
          </div>
        </div>
        <q-chip
          dense
          :color="exportPreviewResult.capability.supports2024Grammar ? 'positive' : 'warning'"
          text-color="white"
        >
          {{ exportPreviewResult.capability.supports2024Grammar ? '2024 Grammar' : '2014 Schema' }}
        </q-chip>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-sm">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="selectedExportTarget"
              v-help="'Choose export target format to inspect capabilities, omissions, and generated output.'"
              :options="exportTargetOptions"
              emit-value
              map-options
              outlined
              dense
              label="Target Format"
              data-export-target-select
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="editorStore.spellcastingPlacement"
              v-help="'Control where Spellcasting appears relative to Traits and Actions in web and text/HTML exports.'"
              :options="spellcastingPlacementOptions"
              emit-value
              map-options
              outlined
              dense
              :disable="!exportPreviewResult.capability.supportsSpellcastingPlacement"
              label="Spellcasting Placement"
              data-export-spell-placement
            />
          </div>
        </div>

        <q-banner
          v-if="exportPolicy.blockingErrors.length > 0"
          dense
          rounded
          class="bg-red-1 text-negative"
          data-export-blocking-banner
        >
          <div class="text-weight-bold">
            Export blocked by {{ exportPolicy.blockingErrors.length }} critical check error(s)
          </div>
          <ul class="q-pl-md q-my-xs">
            <li v-for="(err, idx) in exportPolicy.blockingErrors" :key="err.code + '-' + (err.fieldPath || err.targetId || idx)">
              <strong>[{{ err.code }}]</strong> {{ err.message }}
            </li>
          </ul>
          <q-checkbox
            v-model="allowBlockingOverride"
            v-help="'Bypass blocking lint errors to copy or download the draft export anyway.'"
            dense
            color="negative"
            label="Override blocking lint errors and export anyway"
            data-export-override-checkbox
          />
        </q-banner>

        <q-banner
          v-if="exportPreviewResult.omissions.length > 0"
          dense
          rounded
          class="bg-amber-1 text-amber-10"
          data-export-omissions-banner
        >
          <div class="text-weight-bold q-mb-xs">
            Format Omissions ({{ exportPreviewResult.omissions.length }})
          </div>
          <div
            v-for="om in exportPreviewResult.omissions"
            :key="om.feature"
            class="text-caption"
          >
            <strong>{{ om.feature }}:</strong> {{ om.reason }}
          </div>
        </q-banner>

        <div class="row q-gutter-xs items-center">
          <q-chip
            v-for="feat in exportPreviewResult.capability.supportedFeatures"
            :key="feat"
            dense
            size="sm"
            color="blue-grey-1"
            text-color="blue-grey-9"
          >
            {{ feat }}
          </q-chip>
        </div>

        <q-input
          v-help="'Read-only generated output matching the selected export target and document revision.'"
          :model-value="previewContent"
          type="textarea"
          readonly
          outlined
          autogrow
          input-style="font-family: monospace; font-size: 12px; max-height: 280px;"
          data-export-preview-text
        />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn v-close-popup flat label="Close" />
        <q-btn
          outline
          color="primary"
          label="Copy Preview"
          :disable="!exportPolicy.allowed || selectedExportTarget === 'png'"
          data-export-preview-copy
          @click="copySelectedExport()"
        />
        <q-btn
          unelevated
          color="primary"
          label="Download Export"
          :disable="!exportPolicy.allowed"
          data-export-preview-download
          @click="downloadSelectedExport()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { useMdRenderer } from '../rendering/useMdRenderer'
import { useMd3Renderer } from '../rendering/useHomebrewery3Renderer'
import { useMonsterStore } from '../../stores/monster-store'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { download, saveJson } from './download'
import { nativeMonsterFile } from './native-monster-file'
import { useSpellsStore } from 'src/stores/spells-store'
import { useMonsterSessionStore } from 'src/stores/monster-session'
import { evaluateExportPolicy } from 'src/core/domain/check-session'
import {
  buildExportResult,
  EXPORT_CAPABILITIES,
  SPELLCASTING_PLACEMENT_OPTIONS,
  type ExportTargetId,
} from 'src/core/domain/export-contract'
import { safeFileName } from 'src/core/domain/file-name'
import copy from 'copy-to-clipboard'
import { useLatexRenderer } from '../rendering/useLatexRenderer'
import { useTarrasqueRenderer } from '../rendering/useTarrasqueRenderer'
import { useImprovedInitRenderer } from '../rendering/useImprovedInitRenderer'
import { snapdom } from '@zumer/snapdom'

import jsonurl from 'json-url'
import { useEditorStore } from 'src/stores/editor-store'
import { useCharacterStore } from 'src/stores/character-store'
import {
  exportToFoundryJson,
  exportToHtml,
  exportToPlainText,
  exportCharacterToMarkdown,
  exportCharacterToPlainText,
  exportCharacterToJson,
} from 'src/core/usecases/ExportStatblock'
import type { Monster } from 'src/core/domain/types'

export default defineComponent({
  name: 'DownloadButton',
  setup() {
    const monster = useMonsterStore()
    const $q = useQuasar()
    const { t } = useI18n()
    const { renderMarkdown } = useMdRenderer()
    const { renderMarkdownV3 } = useMd3Renderer()
    const { renderLatex } = useLatexRenderer()
    const { renderTarrasqueJson } = useTarrasqueRenderer()
    const { renderImprovedInitJson } = useImprovedInitRenderer()
    const codec = jsonurl('lzma')
    const editorStore = useEditorStore()
    const spellsStore = useSpellsStore()
    const monsterSession = useMonsterSessionStore()

    const exportPreviewOpen = ref(false)
    const selectedExportTarget = ref<ExportTargetId>('homebrewery_v3')
    const allowBlockingOverride = ref(false)
    const previewContent = ref('')
    const exportTargetOptions = EXPORT_CAPABILITIES.map((cap) => ({
      label: cap.label,
      value: cap.id,
    }))
    const spellcastingPlacementOptions = SPELLCASTING_PLACEMENT_OPTIONS

    const exportPolicy = computed(() =>
      evaluateExportPolicy(monster.$state as unknown as Monster, spellsStore.allSpells, {
        allowBlockingIssues: allowBlockingOverride.value,
      }),
    )

    const refreshPreview = async () => {
      if (!exportPreviewOpen.value || editorStore.activeMode === 'character') return
      const m = monster.$state as unknown as Monster
      const style = editorStore.style as '2014' | '2024'
      const opts = {
        spellcastingPlacement: editorStore.spellcastingPlacement,
        spells: spellsStore.allSpells,
      }
      try {
        switch (selectedExportTarget.value) {
          case '5emm_json':
            previewContent.value = JSON.stringify(
              nativeMonsterFile(monster.$state, editorStore.$state, spellsStore.customSpells),
              null,
              2,
            )
            break
          case 'homebrewery_v3':
            previewContent.value = renderMarkdownV3(editorStore.statBlockColumns === 2)
            break
          case 'homebrewery_legacy':
            previewContent.value = renderMarkdown(editorStore.statBlockColumns === 2)
            break
          case 'latex':
            previewContent.value = renderLatex(editorStore.statBlockColumns === 2)
            break
          case 'improved_initiative':
            previewContent.value = await renderImprovedInitJson()
            break
          case 'tarrasque_io':
            previewContent.value = renderTarrasqueJson()
            break
          case 'foundry_vtt':
            previewContent.value = exportToFoundryJson(m)
            break
          case 'plain_text':
            previewContent.value = exportToPlainText(m, style, opts)
            break
          case 'html_snippet':
            previewContent.value = exportToHtml(m, style, opts)
            break
          case 'png':
            previewContent.value = 'PNG raster snapshot is captured live from the active statblock viewport when Download Export is clicked.'
            break
        }
      } catch (e) {
        previewContent.value = `Preview generation failed: ${String(e)}`
      }
    }

    watch(
      [
        exportPreviewOpen,
        selectedExportTarget,
        () => monsterSession.contentRevision,
        () => editorStore.style,
        () => editorStore.spellcastingPlacement,
        () => editorStore.statBlockColumns,
      ],
      () => {
        void refreshPreview()
      },
      { immediate: true },
    )

    const exportPreviewResult = computed(() =>
      buildExportResult({
        monster: monster.$state as unknown as Monster,
        spells: spellsStore.allSpells,
        targetId: selectedExportTarget.value,
        sourceDocumentId: monsterSession.documentId,
        sourceRevision: monsterSession.contentRevision,
        style: editorStore.style as '2014' | '2024',
        spellcastingPlacement: editorStore.spellcastingPlacement,
        content: previewContent.value,
      }),
    )

    const openExportPreview = (targetId: ExportTargetId = 'homebrewery_v3') => {
      selectedExportTarget.value = targetId
      allowBlockingOverride.value = false
      exportPreviewOpen.value = true
      void refreshPreview()
    }

    const guardExport = (targetId: ExportTargetId): boolean => {
      if (editorStore.activeMode === 'character') return true
      const decision = evaluateExportPolicy(monster.$state as unknown as Monster, spellsStore.allSpells, {
        allowBlockingIssues: false,
      })
      if (decision.allowed) return true
      $q.notify({
        message: `Export blocked by ${decision.blockingErrors.length} critical check error(s). Review or override in Export Preview.`,
        type: 'warning',
      })
      openExportPreview(targetId)
      return false
    }

    // who needs a library i guess
    const shorten = async (url: string) => {
      const data = await fetch(
        'https://tinyurl.com/api-create.php?url=' + encodeURIComponent(url)
      )

      const short = (await data.text()).trim()
      // An error page is not a link: only accept a real https URL from the shortener.
      if (!data.ok || !/^https:\/\/\S+$/.test(short)) throw new Error(`shortener answered ${data.status}`)
      return short
    }

    const save5emm = (bypassGate = false) => {
      if (!bypassGate && !guardExport('5emm_json')) return
      try {
        saveJson(nativeMonsterFile(monster.$state, editorStore.$state, spellsStore.customSpells), `${monster.name}.5emm.json`)
      } catch (e) {
        console.error(e)

        $q.notify({
          message: t('io.error.json', [e]),
          type: 'negative',
        })
      }
    }

    const saveMd = (bypassGate = false) => {
      if (!bypassGate && !guardExport('homebrewery_legacy')) return
      try {
        download(
          renderMarkdown(editorStore.statBlockColumns === 2),
          `${monster.name}.md`,
          'text/markdown'
        )
      } catch (e) {
        console.error(e)

        $q.notify({
          message: t('io.error.md', [e]),
          type: 'negative',
        })
      }
    }

    const saveMd3 = (bypassGate = false) => {
      if (!bypassGate && !guardExport('homebrewery_v3')) return
      try {
        download(
          renderMarkdownV3(editorStore.statBlockColumns === 2),
          `${monster.name}.md`,
          'text/markdown'
        )
      } catch (e) {
        console.error(e)

        $q.notify({
          message: t('io.error.md', [e]),
          type: 'negative',
        })
      }
    }

    const copyMd = () => {
      if (!guardExport('homebrewery_v3')) return
      try {
        copy(renderMarkdownV3(editorStore.statBlockColumns === 2))
        $q.notify({
          message: t('io.copyMd'),
          type: 'positive',
        })
      } catch (e) {
        console.error(e)

        $q.notify({
          message: t('io.error.md', [e]),
          type: 'negative',
        })
      }
    }

    const saveLatex = (bypassGate = false) => {
      if (!bypassGate && !guardExport('latex')) return
      download(
        renderLatex(editorStore.statBlockColumns === 2),
        `${monster.name}.tex`,
        'text/latex'
      )
    }

    const saveTio = (bypassGate = false) => {
      if (!bypassGate && !guardExport('tarrasque_io')) return
      download(
        renderTarrasqueJson(),
        `${monster.name}.tio.json`,
        'application/json'
      )
    }

    const charStore = useCharacterStore()

    const saveCharJson = () => {
      try {
        const json = exportCharacterToJson(charStore.actor)
        download(json, `${charStore.actor.name || 'Hero'}.character.json`, 'application/json')
        $q.notify({
          message: 'Exported Character JSON',
          type: 'positive',
        })
      } catch (e) {
        console.error(e)
        $q.notify({ message: 'Failed to export Character JSON', type: 'negative' })
      }
    }

    const saveCharMd = () => {
      try {
        const md = exportCharacterToMarkdown(charStore.actor)
        download(md, `${charStore.actor.name || 'Hero'}.md`, 'text/markdown')
        $q.notify({
          message: 'Exported Character Markdown',
          type: 'positive',
        })
      } catch (e) {
        console.error(e)
        $q.notify({ message: 'Failed to export Character Markdown', type: 'negative' })
      }
    }

    const saveCharTxt = () => {
      try {
        const txt = exportCharacterToPlainText(charStore.actor)
        download(txt, `${charStore.actor.name || 'Hero'}.txt`, 'text/plain')
        $q.notify({
          message: 'Exported Character Plain Text',
          type: 'positive',
        })
      } catch (e) {
        console.error(e)
        $q.notify({ message: 'Failed to export Character Plain Text', type: 'negative' })
      }
    }

    const copyCharMd = () => {
      try {
        const md = exportCharacterToMarkdown(charStore.actor)
        copy(md)
        $q.notify({
          message: 'Copied Character Markdown to Clipboard',
          type: 'positive',
        })
      } catch (e) {
        console.error(e)
        $q.notify({ message: 'Failed to copy Character Markdown', type: 'negative' })
      }
    }

    const captureMonsterPng = async (page: HTMLElement) => {
      const copy = page.cloneNode(true) as HTMLElement
      // Keep the copy under the same layout and theme selectors while measuring its rows.
      const isA4 = page.matches('.a4-page-sheet')
      const width = isA4 ? page.offsetWidth : Math.max(page.offsetWidth, 1120)
      Object.assign(copy.style, { position: 'absolute', inset: '0 auto auto -100000px', width: width + 'px', pointerEvents: 'none' })
      copy.inert = true
      page.after(copy)
      try {
        const fonts = [copy, ...copy.querySelectorAll<HTMLElement>('*')].flatMap(element => {
          const style = getComputedStyle(element)
          if (!style.fontFamily.includes('ff-scala-sans-pro')) return []
          const bold = Number(style.fontWeight) >= 600
          const italic = style.fontStyle !== 'normal'
          return [{ element, family: 'ScalySans' + (bold ? 'Bold' : '') + (italic ? 'Italic' : '') }]
        })
        // Use the bundled faces in both measurement and rasterization. The SVG
        // image cannot rely on the page's externally loaded Typekit fonts.
        for (const { element, family } of fonts) {
          element.style.setProperty('font-family', family + ', sans-serif', 'important')
          element.style.setProperty('font-weight', '400', 'important')
          element.style.setProperty('font-style', 'normal', 'important')
        }
        await document.fonts.ready
        const block = copy.querySelector<HTMLElement>('.statblock')
        if (block && !block.closest('.a4-fit-active') && block.offsetWidth < 560) block.style.setProperty('column-count', '1', 'important')
        const portrait = copy.querySelector<HTMLElement>('.monster-portrait')
        if (portrait && !isA4 && block) portrait.style.height = block.offsetHeight + 'px'
        return await snapdom.toBlob(copy, {
          embedFonts: true,
          scale: 2,
          type: 'png',
          outerShadows: false,
          plugins: [{
            name: 'statblock-flow',
            afterClone({ clone }) {
              for (const cell of clone?.querySelectorAll<HTMLElement>('.statblock, .statblock-wrapper, .sb-plate, .sb-row, .sb-cell, .sb-text, .sb-body') ?? []) {
                cell.style.setProperty('height', 'auto', 'important')
                cell.style.setProperty('block-size', 'auto', 'important')
              }
            },
          }],
        })
      } finally {
        copy.remove()
      }
    }

    const savePng = async (bypassGate = false) => {
      if (!bypassGate && !guardExport('png')) return
      const isChar = editorStore.activeMode === 'character'
      const node = isChar
        ? document.getElementById('char-sheet')
        : editorStore.a4PreviewMode
          ? document.getElementById('render')?.closest<HTMLElement>('.a4-page-sheet')
          : document.getElementById('render')
      const targetName = isChar ? (charStore.actor.name || 'Hero') : monster.name

      if (node != null) {
        if (
          !isChar &&
          editorStore.statBlockColumns > 1 &&
          window.navigator.userAgent.includes('Firefox')
        ) {
          $q.notify({
            message: t('editor.ffMulticolPngWarning'),
            type: 'warning',
          })
        }

        try {
          await document.fonts?.ready
          await Promise.allSettled(Array.from(node.querySelectorAll('img'), image => image.decode()))
          const result = !isChar
            ? await captureMonsterPng(node)
            : await snapdom.toBlob(node, { embedFonts: true, scale: 2, type: 'png' })
          const blobUrl = URL.createObjectURL(result)
          const link = document.createElement('a')
          link.download = safeFileName(targetName, '.png')
          link.href = blobUrl
          link.click()
          window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
        } catch (error) {
          console.error(error)
          $q.notify({ message: 'Could not export PNG. Try again after the artwork loads.', type: 'negative' })
        }
      }
    }

    const saveImprovedInit = async (bypassGate = false) => {
      if (!bypassGate && !guardExport('improved_initiative')) return
      download(
        await renderImprovedInitJson(),
        `${monster.name}.improved-initiative.json`,
        'application/json'
      )
    }

    const copyLink = async () => {
      try {
        const b64 = await codec.compress(JSON.stringify(monster.$state))
        const url = `${window.location.origin}${window.location.pathname}#/?data=${b64}`

        try {
          const short = await shorten(url)
          copy(short)
          $q.notify({
            message: t('io.link.copiedShort'),
            caption: t('io.link.shortenerNotice'),
            type: 'positive',
          })
        } catch (e) {
          $q.notify({
            message: t('io.link.copiedLong'),
            type: 'warning',
          })
          console.log(e)

          copy(url)
        }
      } catch (e) {
        $q.notify({
          message: 'Error encoding url. Check console for details.',
          type: 'negative',
        })

        console.log(e)
      }
    }

    const exportFoundry = (bypassGate = false) => {
      if (!bypassGate && !guardExport('foundry_vtt')) return
      try {
        const jsonStr = exportToFoundryJson(
          monster.$state as unknown as Monster
        )
        download(jsonStr, `${monster.name}.foundry.json`, 'application/json')
        $q.notify({
          message: 'Exported Foundry VTT Actor5e JSON',
          type: 'positive',
        })
      } catch (e) {
        console.error(e)
        $q.notify({
          message: 'Failed to export Foundry VTT JSON',
          type: 'negative',
        })
      }
    }

    const exportPlainText = (bypassGate = false) => {
      if (!bypassGate && !guardExport('plain_text')) return
      try {
        const txt = exportToPlainText(
          monster.$state as unknown as Monster,
          editorStore.style as '2014' | '2024',
          {
            spellcastingPlacement: editorStore.spellcastingPlacement,
            spells: spellsStore.allSpells,
          },
        )
        download(txt, `${monster.name}.txt`, 'text/plain')
        $q.notify({
          message: 'Exported plain text statblock',
          type: 'positive',
        })
      } catch (e) {
        console.error(e)
        $q.notify({
          message: 'Failed to export plain text',
          type: 'negative',
        })
      }
    }

    const exportHtml = (bypassGate = false) => {
      if (!bypassGate && !guardExport('html_snippet')) return
      try {
        const html = exportToHtml(
          monster.$state as unknown as Monster,
          editorStore.style as '2014' | '2024',
          {
            spellcastingPlacement: editorStore.spellcastingPlacement,
            spells: spellsStore.allSpells,
          },
        )
        download(html, `${monster.name}.html`, 'text/html')
        $q.notify({
          message: 'Exported HTML statblock',
          type: 'positive',
        })
      } catch (e) {
        console.error(e)
        $q.notify({
          message: 'Failed to export HTML',
          type: 'negative',
        })
      }
    }

    const copySelectedExport = () => {
      if (!exportPolicy.value.allowed || selectedExportTarget.value === 'png') return
      copy(previewContent.value)
      $q.notify({
        message: `Copied ${exportPreviewResult.value.capability.label} preview to clipboard`,
        type: 'positive',
      })
    }

    const downloadSelectedExport = () => {
      if (!exportPolicy.value.allowed) return
      switch (selectedExportTarget.value) {
        case '5emm_json': save5emm(true); break
        case 'homebrewery_v3': saveMd3(true); break
        case 'homebrewery_legacy': saveMd(true); break
        case 'latex': saveLatex(true); break
        case 'improved_initiative': void saveImprovedInit(true); break
        case 'tarrasque_io': saveTio(true); break
        case 'foundry_vtt': exportFoundry(true); break
        case 'plain_text': exportPlainText(true); break
        case 'html_snippet': exportHtml(true); break
        case 'png': void savePng(true); break
      }
    }

    return {
      editorStore,
      exportPreviewOpen,
      selectedExportTarget,
      allowBlockingOverride,
      previewContent,
      exportTargetOptions,
      spellcastingPlacementOptions,
      exportPolicy,
      exportPreviewResult,
      openExportPreview,
      copySelectedExport,
      downloadSelectedExport,
      save5emm,
      saveMd,
      saveMd3,
      copyMd,
      saveLatex,
      saveTio,
      savePng,
      saveImprovedInit,
      copyLink,
      exportFoundry,
      exportPlainText,
      exportHtml,
      saveCharJson,
      saveCharMd,
      saveCharTxt,
      copyCharMd,
    }
  },
})
</script>
