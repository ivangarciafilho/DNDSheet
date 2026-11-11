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
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { useMdRenderer } from '../rendering/useMdRenderer'
import { useMd3Renderer } from '../rendering/useHomebrewery3Renderer'
import { useMonsterStore } from '../../stores/monster-store'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { download, saveJson } from './download'
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

    const save5emm = () => {
      try {
        saveJson(monster.$state, `${monster.name}.5emm.json`)
      } catch (e) {
        console.error(e)

        $q.notify({
          message: t('io.error.json', [e]),
          type: 'negative',
        })
      }
    }

    const saveMd = () => {
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

    const saveMd3 = () => {
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

    const saveLatex = () => {
      download(
        renderLatex(editorStore.statBlockColumns === 2),
        `${monster.name}.tex`,
        'text/latex'
      )
    }

    const saveTio = () => {
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

    const captureA4Png = async (page: HTMLElement) => {
      const copy = page.cloneNode(true) as HTMLElement
      // Keep the copy under the same layout and theme selectors while measuring its rows.
      Object.assign(copy.style, { position: 'absolute', inset: '0 auto auto -100000px', pointerEvents: 'none' })
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
        return await snapdom.toBlob(copy, {
          embedFonts: true,
          scale: 2,
          type: 'png',
          outerShadows: false,
          plugins: [{
            name: 'statblock-flow',
            afterClone({ clone }) {
              for (const cell of clone?.querySelectorAll<HTMLElement>('.statblock, .statblock-wrapper, .sb-plate, .sb-row, .sb-cell') ?? []) {
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

    const savePng = async () => {
      const isChar = editorStore.activeMode === 'character'
      const node = isChar
        ? document.getElementById('char-sheet')
        : editorStore.a4PreviewMode
          ? document.getElementById('render')?.closest<HTMLElement>('.a4-page-sheet')
          : document.getElementById('renderer')
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
          const result = node.matches('.a4-page-sheet')
            ? await captureA4Png(node)
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

    const saveImprovedInit = async () => {
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

    const exportFoundry = () => {
      try {
        const jsonStr = exportToFoundryJson(
          monster.$state as unknown as Monster,
          editorStore.style as '2014' | '2024'
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

    const exportPlainText = () => {
      try {
        const txt = exportToPlainText(
          monster.$state as unknown as Monster,
          editorStore.style as '2014' | '2024'
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

    const exportHtml = () => {
      try {
        const html = exportToHtml(
          monster.$state as unknown as Monster,
          editorStore.style as '2014' | '2024'
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

    return {
      editorStore,
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
