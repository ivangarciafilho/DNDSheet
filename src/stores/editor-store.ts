import { defineStore } from 'pinia'

export type EditorMode = 'monster' | 'character'

export type A4Orientation = 'portrait' | 'landscape'
export type A4Layout = 'auto' | 'side_by_side' | 'stacked' | 'statblock_only'

export interface A4CompositionLayer {
  id: string
  type: 'statblock' | 'portrait' | 'background' | 'foreground' | 'custom'
  name: string
  url?: string
  maskUrl?: string
  opacity: number // 0 to 100
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'difference'
  visible: boolean
  offsetX?: number // horizontal offset in px
  offsetY?: number // vertical offset in px
  scale?: number // uniform scale percentage (e.g. 100 = 100%)
  scaleX?: number // non-uniform X scale percentage
  scaleY?: number // non-uniform Y scale percentage
  rotation?: number // clockwise degrees
  mirrorHorizontal?: boolean
  mirrorVertical?: boolean
  occlusion?: number // occlusion percentage for portrait
  locked?: boolean // true for permanent layers (statblock)
  cropX?: { min: number; max: number } // 0 to 100
  cropY?: { min: number; max: number } // 0 to 100
  cropCenterX?: number // -100 to 100 (focal center for pre-crop offset)
  cropCenterY?: number // -100 to 100
  // Grayscale Luminance Masking as Alpha
  grayscaleAsAlpha?: boolean
  grayscaleInvert?: boolean
  // Gradient Overlays with Direction, Blend Mode, Opacity & Falloff Curves
  gradientOverlay?: {
    enabled?: boolean
    direction?: 'left_to_right' | 'right_to_left' | 'top_to_bottom' | 'bottom_to_top' | 'vignette' | 'radial'
    blendMode?: string
    opacity?: number
    curve?: 'linear' | 'ease_in' | 'ease_out' | 'smoothstep'
    stops?: { color: string; offset: number }[]
  }
  // Custom Overlay Layer Text
  showTextOverlay?: boolean
  overlayText?: string
  overlayTextAlign?: 'left' | 'center' | 'right'
  overlayTextOffsetX?: number
  overlayTextOffsetY?: number
  overlayTextColor?: string
  overlayTextFontSize?: number
}

export type VisualTheme =
  | 'wotc'
  | 'printer'
  | 'lovecraft_golden'
  | 'lovecraft_silver'
  | 'lovecraft_toxic'
  | 'lovecraft_spooky'
  | 'lovecraft_galactic'
  | 'lovecraft_fathomless'
  | 'dwarves_forge'
  | 'dwarves_aetherpunk'
  | 'art_nouveau'
  | 'art_deco'

import type { SpellcastingPlacement } from 'src/core/domain/export-contract'

export const useEditorStore = defineStore({
  id: 'editor',
  state: () => {
    return {
      statBlockColumns: 1,
      changelogShown: 'v2.4.0',
      style: '2024',
      spellcastingPlacement: 'auto' as SpellcastingPlacement,
      visualTemplate: 'classic' as 'classic' | 'modern',
      visualTheme: 'wotc' as VisualTheme,
      condenseImmunities: false,
      activeMode: 'monster' as EditorMode,
      a4PreviewMode: false,
      a4Orientation: 'portrait' as A4Orientation,
      a4Layout: 'auto' as A4Layout,
      a4Zoom: 100 as number | 'fit',
      a4CompactDensity: false,
    a4PageMeasuredHeight: 0,
      a4PictureOcclusion: 0, // 0 = 0% side-by-side, 50 = 50% occlusion, 100 = 100% full coverage
      a4StatblockOpacity: 100, // 0 to 100% background opacity
      a4StatblockOffsetX: 0, // horizontal offset in px
      a4StatblockOffsetY: 0, // vertical offset in px
      statblockFontScale: 100,
      a4StatblockWidth: null as number | null,
      a4StatblockFinalWidth: 100,
      a4StatblockFinalHeight: 100,
      a4StatblockScaleX: 100, // horizontal scaling percentage
      a4StatblockScaleY: 100, // vertical scaling percentage
      a4PortraitOffsetX: 0, // portrait horizontal offset in px
      a4PortraitOffsetY: 0, // portrait vertical offset in px
      a4PortraitScale: 100, // portrait uniform scaling percentage
      a4PortraitCropX: { min: 0, max: 100 } as { min: number; max: number },
      a4PortraitCropY: { min: 0, max: 100 } as { min: number; max: number },
      a4PortraitCropCenterX: 0, // pre-crop radial center X (-100 to 100)
      a4PortraitCropCenterY: 0, // pre-crop radial center Y (-100 to 100)
      a4Layers: [] as A4CompositionLayer[],
    }
  },
  persist: {
    key: 'app.editor',
  },
})
