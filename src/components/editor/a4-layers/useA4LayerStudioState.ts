import { computed, ref, watch, inject, provide } from 'vue'
import type { InjectionKey } from 'vue'
import { useEditorStore, A4CompositionLayer } from 'src/stores/editor-store'
import { useMonsterStore } from 'src/stores/monster-store'
import { useQuasar } from 'quasar'
import { appAsset } from 'src/core/domain/asset-url'

// State and handlers shared by A4LayerStudio and its section components (ADR-0003 provide/inject).
export function useA4LayerStudioState() {
  const a4MeasuredPx = computed(() => editorStore.a4PageMeasuredHeight || 0)
  const a4TargetPx = computed(() => editorStore.a4Orientation === 'landscape' ? 794 : 1123)
  const a4OverflowPx = computed(() => Math.max(0, a4MeasuredPx.value - a4TargetPx.value))
  const a4CapacityRatio = computed(() => a4TargetPx.value > 0 ? (a4MeasuredPx.value / a4TargetPx.value) : 0)
  const a4StatusLabel = computed(() => {
    if (a4OverflowPx.value > 0) return `Overflow (+${a4OverflowPx.value}px)`
    if (a4CapacityRatio.value > 0.9) return `Near Capacity (${Math.round((1 - a4CapacityRatio.value) * a4TargetPx.value)}px left)`
    return 'Optimal Capacity'
  })

  const toggleOrientation = () => {
    editorStore.a4Orientation = editorStore.a4Orientation === 'portrait' ? 'landscape' : 'portrait'
  }

  const toggleColumns = () => {
    editorStore.statBlockColumns = editorStore.statBlockColumns === 2 ? 1 : 2
  }

  const resetA4Layout = () => {
    editorStore.a4Orientation = 'portrait'
    editorStore.statBlockColumns = 1
    editorStore.a4CompactDensity = false
    editorStore.a4StatblockWidth = null
    editorStore.a4StatblockFinalWidth = 100
    editorStore.a4StatblockFinalHeight = 100
    editorStore.a4StatblockScaleX = 100
    editorStore.a4StatblockScaleY = 100
    editorStore.a4StatblockOffsetX = 0
    editorStore.a4StatblockOffsetY = 0
    editorStore.a4PortraitOffsetX = 0
    editorStore.a4PortraitOffsetY = 0
    editorStore.a4PortraitScale = 100
  }

  const editorStore = useEditorStore()
  const quasar = useQuasar()
  const monsterStore = useMonsterStore()

  const showAddLayerForm = ref(false)
  const expandedLayerId = ref<string | null>(null)

  const newLayerType = ref<'background' | 'foreground'>('background')
  const newLayerName = ref('')
  const newLayerUrl = ref('')
  const newLayerFile = ref<File | null>(null)
  const newLayerBlend = ref<A4CompositionLayer['blendMode']>('normal')

  const blendModeOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Multiply (Darken & Texture)', value: 'multiply' },
    { label: 'Screen (Lighten & Glow)', value: 'screen' },
    { label: 'Overlay (High Contrast)', value: 'overlay' },
    { label: 'Soft Light (Subtle Tint)', value: 'soft-light' },
    { label: 'Darken', value: 'darken' },
    { label: 'Lighten', value: 'lighten' },
    { label: 'Color Dodge', value: 'color-dodge' },
    { label: 'Color Burn', value: 'color-burn' },
    { label: 'Difference', value: 'difference' },
  ]

  const watercolorMaskOptions = [
    { label: 'None (No Mask)', value: '' },
    { label: 'Watercolor Splash Center', value: '/homebrew/masks/watercolor_splash_center.png' },
    { label: 'Watercolor Bottom Edge Splatter', value: '/homebrew/masks/watercolor_bottom_01.png' },
    { label: 'Watercolor Top Edge Splatter', value: '/homebrew/masks/watercolor_top_01.png' },
    { label: 'Watercolor Left Edge Splatter', value: '/homebrew/masks/watercolor_left_01.png' },
    { label: 'Watercolor Right Edge Splatter', value: '/homebrew/masks/watercolor_right_01.png' },
  ]

  const layerTypeOptions = [
    { label: 'Background Texture', value: 'background' },
    { label: 'Foreground Frame / Vignette', value: 'foreground' },
  ]

  const portraitPositionOptions = [
    { label: 'Right Side', value: 'right' },
    { label: 'Left Side', value: 'left' },
    { label: 'Top Header', value: 'top' },
    { label: 'Bottom Foot', value: 'bottom' },
    { label: 'Hidden', value: 'none' },
  ]

  const overlayAlignOptions = [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ]

  // Ensure the permanent Statblock layer and Portrait layer are always in the unified stack
  const ensureCoreLayers = () => {
    if (!editorStore.a4Layers) {
      editorStore.a4Layers = []
    }

    // 1. Permanent Statblock Layer
    let statblockLayer = editorStore.a4Layers.find(l => l.id === 'statblock_layer' || l.type === 'statblock')
    if (!statblockLayer) {
      statblockLayer = {
        id: 'statblock_layer',
        type: 'statblock',
        name: 'Monster Statblock (Dual-Axis Anamorphic)',
        opacity: editorStore.a4StatblockOpacity ?? 100,
        blendMode: 'normal',
        visible: true,
        offsetX: editorStore.a4StatblockOffsetX || 0,
        offsetY: editorStore.a4StatblockOffsetY || 0,
        scaleX: editorStore.a4StatblockScaleX ?? 100,
        scaleY: editorStore.a4StatblockScaleY ?? 100,
        locked: true,
      }
      editorStore.a4Layers.push(statblockLayer)
    } else {
      statblockLayer.locked = true
      statblockLayer.type = 'statblock'
    }

    // 2. Creature Portrait Artwork Layer (always present as core layer in composition)
    let portraitLayer = editorStore.a4Layers.find(l => l.id === 'portrait_layer' || l.type === 'portrait')
    if (!portraitLayer) {
      portraitLayer = {
        id: 'portrait_layer',
        type: 'portrait',
        name: 'Creature Portrait Artwork',
        url: monsterStore.portrait?.url || '',
        opacity: 100,
        blendMode: 'normal',
        visible: true,
        offsetX: editorStore.a4PortraitOffsetX || 0,
        offsetY: editorStore.a4PortraitOffsetY || 0,
        scale: editorStore.a4PortraitScale ?? 100,
        occlusion: editorStore.a4PictureOcclusion || 0,
      }
      // Insert behind statblock by default (higher array index = lower z-index)
      const sIdx = editorStore.a4Layers.findIndex(l => l.type === 'statblock')
      const insertAt = sIdx >= 0 ? sIdx + 1 : editorStore.a4Layers.length
      editorStore.a4Layers.splice(insertAt, 0, portraitLayer)
    } else {
      portraitLayer.url = monsterStore.portrait?.url || ''
    }
  }

  const insertBackgroundLayerOnTopOfBackgrounds = (layer: A4CompositionLayer) => {
    const firstBgIdx = editorStore.a4Layers.findIndex(l => l.type === 'background')
    if (firstBgIdx >= 0) {
      editorStore.a4Layers.splice(firstBgIdx, 0, layer)
    } else {
      editorStore.a4Layers.push(layer)
    }
  }

  ensureCoreLayers()

  watch(() => monsterStore.portrait?.url, () => {
    ensureCoreLayers()
  })

  const displayLayers = computed(() => {
    ensureCoreLayers()
    return editorStore.a4Layers || []
  })

  const shiftLayer = (index: number, delta: number) => {
    const targetIndex = index + delta
    if (targetIndex < 0 || targetIndex >= editorStore.a4Layers.length) return
    const item = editorStore.a4Layers.splice(index, 1)[0]
    editorStore.a4Layers.splice(targetIndex, 0, item)
  }

  const toggleLayerVisibility = (layer: A4CompositionLayer) => {
    layer.visible = !layer.visible
  }

  const removeLayer = (index: number) => {
    const layer = editorStore.a4Layers[index]
    if (layer && (layer.locked || layer.type === 'statblock')) {
      return
    }
    editorStore.a4Layers.splice(index, 1)
  }

  const setStatblockWidth = (width: number | null) => {
    editorStore.$patch({ a4StatblockWidth: width, a4StatblockScaleX: 100, a4StatblockScaleY: 100 })
  }

  const replacementReaders = new WeakMap<A4CompositionLayer, FileReader>()
  const replaceLayerImage = (layer: A4CompositionLayer, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    replacementReaders.set(layer, reader)
    reader.onload = () => {
      if (replacementReaders.get(layer) !== reader) return
      replacementReaders.delete(layer)
      if (typeof reader.result === 'string' && editorStore.a4Layers.some(entry => entry.id === layer.id)) {
        layer.url = reader.result
      }
    }
    reader.onerror = () => {
      if (replacementReaders.get(layer) !== reader) return
      replacementReaders.delete(layer)
      quasar.notify({ type: 'negative', message: 'Could not read the image. Choose another image file.' })
    }
    reader.readAsDataURL(file)
  }

  const onNewLayerFileSelected = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        newLayerUrl.value = e.target.result as string
        if (!newLayerName.value) {
          newLayerName.value = file.name.replace(/\.[^/.]+$/, '')
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const addCustomLayer = () => {
    if (!newLayerUrl.value) return
    const id = 'layer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    const layer: A4CompositionLayer = {
      id,
      type: newLayerType.value,
      name: newLayerName.value || (newLayerType.value === 'background' ? 'Custom Background' : 'Custom Frame'),
      url: newLayerUrl.value,
      opacity: 100,
      blendMode: newLayerBlend.value || 'normal',
      visible: true,
      offsetX: 0,
      offsetY: 0,
      scale: 100,
    }

    if (newLayerType.value === 'background') {
      // Place new background above existing backgrounds so 'normal' blend occludes backgrounds beneath it
      insertBackgroundLayerOnTopOfBackgrounds(layer)
    } else {
      // Place foregrounds towards the top
      editorStore.a4Layers.unshift(layer)
    }

    newLayerUrl.value = ''
    newLayerName.value = ''
    newLayerFile.value = null
    showAddLayerForm.value = false
    expandedLayerId.value = id
  }

  const addPreset = (presetKey: string) => {
    const id = 'layer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    let layer: A4CompositionLayer

    switch (presetKey) {
      case 'yellowed_parchment':
        layer = {
          id,
          type: 'background',
          name: 'Aged Yellowed Parchment',
          url: '/homebrew/backgrounds/Yellowed parchment background.jpg',
          opacity: 100,
          blendMode: 'multiply',
          visible: true,
          scale: 100,
          offsetX: 0,
          offsetY: 0,
        }
        insertBackgroundLayerOnTopOfBackgrounds(layer)
        break

      case 'phb_parchment':
        layer = {
          id,
          type: 'background',
          name: 'Classic PHB Stained Background',
          url: '/homebrew/backgrounds/PHB-background.png',
          opacity: 100,
          blendMode: 'normal',
          visible: true,
          scale: 100,
          offsetX: 0,
          offsetY: 0,
        }
        insertBackgroundLayerOnTopOfBackgrounds(layer)
        break

      case 'silvered_parchment':
        layer = {
          id,
          type: 'background',
          name: 'Silvered Vintage Parchment',
          url: '/homebrew/backgrounds/Silvered parchment background.jpg',
          opacity: 100,
          blendMode: 'multiply',
          visible: true,
          scale: 100,
          offsetX: 0,
          offsetY: 0,
        }
        insertBackgroundLayerOnTopOfBackgrounds(layer)
        break

      case 'watercolor_splash':
        layer = {
          id,
          type: 'foreground',
          name: 'Watercolor Splash Vignette',
          url: '/homebrew/masks/watercolor_splash_center.png',
          maskUrl: '/homebrew/masks/watercolor_splash_center.png',
          opacity: 85,
          blendMode: 'multiply',
          visible: true,
          scale: 100,
          offsetX: 0,
          offsetY: 0,
        }
        editorStore.a4Layers.unshift(layer)
        break

      case 'watercolor_bottom':
        layer = {
          id,
          type: 'foreground',
          name: 'Watercolor Bottom Edge',
          url: '/homebrew/masks/watercolor_bottom_01.png',
          opacity: 90,
          blendMode: 'multiply',
          visible: true,
          scale: 100,
          offsetX: 0,
          offsetY: 0,
        }
        editorStore.a4Layers.unshift(layer)
        break

      case 'header_overlay':
        layer = {
          id,
          type: 'foreground',
          name: 'Running Header Overlay',
          opacity: 100,
          blendMode: 'normal',
          visible: true,
          scale: 100,
          offsetX: 0,
          offsetY: 0,
          showTextOverlay: true,
          overlayText: `${monsterStore.name || 'CREATURE COMPENDIUM'} | CHAPTER 1`,
          overlayTextAlign: 'center',
          overlayTextOffsetX: 0,
          overlayTextOffsetY: -1050,
          overlayTextColor: '#58180d',
          overlayTextFontSize: 9,
        }
        editorStore.a4Layers.unshift(layer)
        break

      case 'footer_overlay':
        layer = {
          id,
          type: 'foreground',
          name: 'Running Footer Overlay',
          opacity: 100,
          blendMode: 'normal',
          visible: true,
          scale: 100,
          offsetX: 0,
          offsetY: 0,
          showTextOverlay: true,
          overlayText: 'D&D 5E COMPENDIUM | 1:1 PHYSICAL A4 PRINT PREVIEW',
          overlayTextAlign: 'center',
          overlayTextOffsetX: 0,
          overlayTextOffsetY: 0,
          overlayTextColor: '#58180d',
          overlayTextFontSize: 9,
        }
        editorStore.a4Layers.unshift(layer)
        break
    }

    expandedLayerId.value = id
  }

  const portraitFileInput = ref<File | null>(null)

  const portraitUrlModel = computed({
    get: () => monsterStore.portrait?.url || '',
    set: (val: string) => {
      if (!monsterStore.portrait) {
        monsterStore.portrait = {
          url: val,
          caption: '',
          position: 'right',
          width: 280,
        }
      } else {
        monsterStore.portrait.url = val
      }
      ensureCoreLayers()
    }
  })

  const portraitPositionModel = computed({
    get: () => {
      if (editorStore.a4Layout === 'statblock_only') return 'none'
      if (editorStore.a4Layout === 'stacked') {
        return monsterStore.portrait?.position === 'bottom' ? 'bottom' : 'top'
      }
      return monsterStore.portrait?.position === 'left' ? 'left' : 'right'
    },
    set: (val: 'left' | 'right' | 'top' | 'bottom' | 'none') => {
      if (!monsterStore.portrait) {
        monsterStore.portrait = {
          url: '',
          caption: '',
          position: val,
          width: 280,
        }
      } else {
        monsterStore.portrait.position = val
      }
      if (val === 'none') {
        editorStore.a4Layout = 'statblock_only'
      } else if (val === 'top' || val === 'bottom') {
        editorStore.a4Layout = 'stacked'
      } else {
        editorStore.a4Layout = 'side_by_side'
      }
    }
  })

  const portraitWidthModel = computed({
    get: () => monsterStore.portrait?.width || 280,
    set: (val: number) => {
      if (monsterStore.portrait) {
        monsterStore.portrait.width = val
      }
    }
  })

  const portraitCaptionModel = computed({
    get: () => monsterStore.portrait?.caption || '',
    set: (val: string) => {
      if (monsterStore.portrait) {
        monsterStore.portrait.caption = val
      }
    }
  })

  const onPortraitFileSelected = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        if (!monsterStore.portrait) {
          monsterStore.portrait = {
            url: e.target.result,
            caption: '',
            position: 'right',
            width: 280,
          }
        } else {
          monsterStore.portrait.url = e.target.result
          if (monsterStore.portrait.position === 'none') {
            monsterStore.portrait.position = 'right'
          }
        }
        ensureCoreLayers()
      }
    }
    reader.readAsDataURL(file)
  }

  const onPortraitUrlChanged = (val: string | number | null) => {
    portraitUrlModel.value = String(val ?? '')
  }

  return {
    a4MeasuredPx,
    a4TargetPx,
    a4OverflowPx,
    a4CapacityRatio,
    a4StatusLabel,
    toggleOrientation,
    toggleColumns,
    resetA4Layout,
    
    appAsset,
    editorStore,
    monsterStore,
    displayLayers,
    showAddLayerForm,
    expandedLayerId,
    newLayerType,
    newLayerName,
    newLayerUrl,
    newLayerFile,
    newLayerBlend,
    blendModeOptions,
    watercolorMaskOptions,
    layerTypeOptions,
    portraitPositionOptions,
    overlayAlignOptions,
    shiftLayer,
    toggleLayerVisibility,
    removeLayer,
    replaceLayerImage,
    setStatblockWidth,
    onNewLayerFileSelected,
    addCustomLayer,
    addPreset,
    portraitFileInput,
    portraitUrlModel,
    portraitPositionModel,
    portraitWidthModel,
    portraitCaptionModel,
    onPortraitFileSelected,
    onPortraitUrlChanged,
  }
}

export type A4LayerStudioState = ReturnType<typeof useA4LayerStudioState>
const KEY: InjectionKey<A4LayerStudioState> = Symbol('A4LayerStudio')
export const provideA4LayerStudioState = (state: A4LayerStudioState) => { provide(KEY, state); return state }
export const injectA4LayerStudioState = (): A4LayerStudioState => {
  const state = inject(KEY)
  if (!state) throw new Error('A4LayerStudio section used outside A4LayerStudio')
  return state
}
