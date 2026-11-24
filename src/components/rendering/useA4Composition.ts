import { computed, nextTick, onBeforeUnmount, onMounted, ref, StyleValue, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { type A4CompositionLayer } from 'src/stores/editor-store'
import { calculateA4Pagination } from 'src/core/domain/a4-pagination'
import { appAsset } from 'src/core/domain/asset-url'
import { formatCurvedGradientCss } from 'src/core/domain/gradient-curve'
import type { ComputedRef, Ref } from 'vue'
import type { useMonsterStore as UseMonsterStore } from 'src/stores/monster-store'
import type { useEditorStore as UseEditorStore } from 'src/stores/editor-store'

/**
 * A4 page composition for the web renderer: layer stacks and z-order, statblock and portrait styles,
 * fit-to-frame measurement, overflow checks and print fitting. Extracted verbatim from WebRenderer (C1b);
 * its watchers and lifecycle hooks register on the calling component, exactly as before.
 */
export function useA4Composition({ monster, editorStore, renderRoot, columns, hasPortrait }: {
  monster: ReturnType<typeof UseMonsterStore>
  editorStore: ReturnType<typeof UseEditorStore>
  renderRoot: Ref<HTMLElement | null>
  columns: ComputedRef<StyleValue>
  hasPortrait: ComputedRef<boolean>
}) {
    const openLayerStudio = () => {
      const el = document.getElementById('a4-layer-studio-expansion')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    const a4AllCustomLayers = computed(() => {
      return (editorStore.a4Layers || []).filter(l => l.type !== 'statblock' && l.type !== 'portrait')
    })
    const a4BackgroundLayers = computed(() => {
      return (editorStore.a4Layers || []).filter(l => l.type === 'background')
    })
    const a4ForegroundLayers = computed(() => {
      return (editorStore.a4Layers || []).filter(l => l.type === 'foreground')
    })

    const a4PageRef = ref<HTMLElement | null>(null)
    const a4ViewportRef = ref<HTMLElement | null>(null)

    const a4TargetHeightPx = computed(() => {
      return editorStore.a4Orientation === 'landscape' ? (210 * 96 / 25.4) : (297 * 96 / 25.4)
    })

    const resolvedA4Layout = computed(() => {
      if (editorStore.a4Layout && editorStore.a4Layout !== 'auto') {
        return editorStore.a4Layout
      }
      if (!hasPortrait.value) return 'statblock_only'
      if (monster.portrait?.position === 'top' || monster.portrait?.position === 'bottom') return 'stacked'
      if (monster.portrait?.position === 'none') return 'statblock_only'
      return 'side_by_side'
    })

    const updateMeasuredHeight = () => {
      nextTick(() => {
        const el = document.querySelector<HTMLElement>('#render.statblock-wrapper')
        if (el && editorStore) {
          editorStore.a4PageMeasuredHeight = el.offsetHeight
        }
      })
    }
    watch(() => editorStore?.a4PreviewMode, updateMeasuredHeight)
    watch(() => editorStore?.statBlockColumns, updateMeasuredHeight)
    watch(() => editorStore?.a4CompactDensity, updateMeasuredHeight)
    watch(() => editorStore?.a4StatblockWidth, updateMeasuredHeight)
    watch(() => editorStore?.statblockFontScale, updateMeasuredHeight)
    onMounted(updateMeasuredHeight)

    const a4ScaleStageStyle = computed<StyleValue>(() => {
      const zoom = editorStore.a4Zoom
      const baseWidth = editorStore.a4Orientation === 'landscape' ? (297 * 96 / 25.4) : (210 * 96 / 25.4)
      const baseHeight = editorStore.a4Orientation === 'landscape' ? (210 * 96 / 25.4) : (297 * 96 / 25.4)

      let scale = 1.0
      if (typeof zoom === 'number') {
        scale = zoom / 100
      } else if (zoom === 'fit') {
        const vpWidth = a4ViewportRef.value?.clientWidth || (210 * 96 / 25.4)
        scale = Math.min(1.0, Math.max(0.4, (vpWidth - 32) / baseWidth))
      }

      if (scale === 1.0) return { width: `${baseWidth}px` }

      return {
        width: `${baseWidth * scale}px`,
        height: `${baseHeight * scale + 30}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }
    })

    const ensureCoreLayers = () => {
      if (!editorStore.a4Layers) {
        editorStore.a4Layers = []
      }
      let statblockLayer = editorStore.a4Layers.find(l => l.id === 'statblock_layer' || l.type === 'statblock')
      if (!statblockLayer) {
        statblockLayer = {
          id: 'statblock_layer',
          type: 'statblock',
          name: 'Monster Statblock',
          url: '',
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

      let portraitLayer = editorStore.a4Layers.find(l => l.id === 'portrait_layer' || l.type === 'portrait')
      if (!portraitLayer) {
        portraitLayer = {
          id: 'portrait_layer',
          type: 'portrait',
          name: 'Creature Portrait Artwork',
          url: monster.portrait?.url || '',
          opacity: 100,
          blendMode: 'normal',
          visible: true,
          offsetX: editorStore.a4PortraitOffsetX || 0,
          offsetY: editorStore.a4PortraitOffsetY || 0,
          scale: editorStore.a4PortraitScale ?? 100,
          occlusion: editorStore.a4PictureOcclusion || 0,
        }
        const sIdx = editorStore.a4Layers.findIndex(l => l.type === 'statblock')
        const insertAt = sIdx >= 0 ? sIdx + 1 : editorStore.a4Layers.length
        editorStore.a4Layers.splice(insertAt, 0, portraitLayer)
      } else {
        portraitLayer.url = monster.portrait?.url || ''
      }
    }

    const portraitLayerObj = computed(() => {
      ensureCoreLayers()
      return editorStore.a4Layers?.find(l => l.type === 'portrait' || l.id === 'portrait_layer') || null
    })

    const statblockLayerObj = computed(() => {
      ensureCoreLayers()
      return editorStore.a4Layers?.find(l => l.type === 'statblock' || l.id === 'statblock_layer') || null
    })

    const getLayerZIndex = (layerOrType: A4CompositionLayer | string): number => {
      ensureCoreLayers()
      const layers = editorStore.a4Layers || []
      const total = layers.length
      let idx = -1
      if (typeof layerOrType === 'string') {
        idx = layers.findIndex(l => l.type === layerOrType || l.id === layerOrType)
      } else {
        idx = layers.findIndex(l => l.id === layerOrType.id)
      }
      if (idx === -1) {
        if (layerOrType === 'statblock') return 30
        if (layerOrType === 'portrait') return 20
        return 10
      }
      return (total - idx) * 10 + 10
    }

    const a4StatblockWrapperStyle = computed<StyleValue>(() => {
      if (!editorStore?.a4PreviewMode) return {}
      return {
        position: 'relative',
        zIndex: 'auto',
      }
    })

    const a4StatblockWidth = computed(() => {
      const width = editorStore.a4StatblockWidth
      return width != null && resolvedA4Layout.value === 'side_by_side' && hasPortrait.value
        ? Math.max(35, Math.min(95, width))
        : null
    })

    const a4StatblockStyle = computed<StyleValue>(() => {
      const base = { ...(columns.value as Record<string, string>) }
      const occ = editorStore.a4PictureOcclusion || 0
      const opacity = editorStore.a4StatblockOpacity ?? 100
      const portraitW = monster.portrait?.width && monster.portrait.width > 50 ? monster.portrait.width : 280
      const statblockZ = getLayerZIndex('statblock')
      const sbLayer = statblockLayerObj.value

      const offX = editorStore.a4StatblockOffsetX || 0
      const offY = editorStore.a4StatblockOffsetY || 0
      const scX = (editorStore.a4StatblockScaleX ?? 100) / 100
      const scY = (editorStore.a4StatblockScaleY ?? 100) / 100
      const transformStyle = (offX !== 0 || offY !== 0 || scX !== 1 || scY !== 1)
        ? {
            transform: `translate(${offX}px, ${offY}px) scale(${scX}, ${scY})`,
            transformOrigin: 'top left'
          }
        : {}

      const layerVisibilityAndBlend: Record<string, string | undefined> = {
        display: sbLayer && sbLayer.visible === false ? 'none' : undefined,
        mixBlendMode: sbLayer?.blendMode || 'normal',
      }

      const opacityStyle = opacity < 100 ? {
        '--statblock-opacity': `${opacity / 100}`,
        '--a4-sb-bg-color': editorStore.visualTheme === 'wotc'
          ? `rgba(253, 241, 220, ${(opacity / 100) * 0.95})`
          : `rgba(255, 255, 255, ${(opacity / 100) * 0.95})`,
        backdropFilter: 'blur(2px)'
      } : {}

      if (resolvedA4Layout.value === 'statblock_only' || !hasPortrait.value) {
        return {
          ...base,
          width: '100%',
          columnCount: editorStore.statBlockColumns > 1 ? 2 : (editorStore.a4Orientation === 'landscape' ? 2 : 1),
          zIndex: statblockZ,
          position: 'relative',
          ...layerVisibilityAndBlend,
          ...opacityStyle,
          ...transformStyle
        }
      }
      if (resolvedA4Layout.value === 'stacked') {
        return {
          ...base,
          width: '100%',
          columnCount: 2,
          zIndex: statblockZ,
          position: 'relative',
          ...layerVisibilityAndBlend,
          ...opacityStyle,
          ...transformStyle
        }
      }

      if (occ >= 100) {
        return {
          ...base,
          width: '100%',
          zIndex: statblockZ,
          position: 'relative',
          ...layerVisibilityAndBlend,
          ...opacityStyle,
          ...transformStyle
        }
      }

      if (a4StatblockWidth.value !== null) {
        const width = a4StatblockWidth.value + '%'
        const overlap = occ > 0 ? Math.round((portraitW * occ) / 100) : 0
        const portraitOnRight = monster.portrait?.position === 'right'
        return {
          ...base,
          width,
          flex: '0 0 ' + width,
          minWidth: '0',
          marginLeft: !portraitOnRight && overlap ? '-' + overlap + 'px' : undefined,
          marginRight: portraitOnRight && overlap ? '-' + overlap + 'px' : undefined,
          zIndex: statblockZ,
          position: 'relative',
          ...layerVisibilityAndBlend,
          ...opacityStyle,
          ...transformStyle,
        }
      }

      if (occ > 0) {
        const overlapPx = Math.round((portraitW * occ) / 100)
        return {
          ...base,
          flex: '1 1 0',
          minWidth: '0',
          marginLeft: `-${overlapPx}px`,
          zIndex: statblockZ,
          position: 'relative',
          ...layerVisibilityAndBlend,
          ...opacityStyle,
          ...transformStyle
        }
      }

      return {
        ...base,
        width: '100%',
        flex: '1 1 0',
        minWidth: '0',
        zIndex: statblockZ,
        position: 'relative',
        ...layerVisibilityAndBlend,
        ...opacityStyle,
        ...transformStyle
      }
    })

    const statblockFrame = ref<HTMLElement | null>(null)
    const statblockContent = ref<HTMLElement | null>(null)
    const fit = ref<{ width: number; height: number; layoutWidth: number; font: number; x: number; y: number } | null>(null)
    const statblockFitActive = computed(() => Boolean(fit.value && editorStore.a4PreviewMode))
    const statblockFrameStyle = computed<StyleValue>(() => {
      if (!fit.value || !editorStore.a4PreviewMode) return { display: 'contents' }
      const base = a4StatblockStyle.value as Record<string, string>
      return {
        display: base.display, position: 'relative', zIndex: base.zIndex,
        width: fit.value.width + 'px', height: fit.value.height + 'px', flex: '0 0 auto',
        marginLeft: base.marginLeft, marginRight: base.marginRight, overflow: 'clip',
        transform: `translate(${editorStore.a4StatblockOffsetX}px, ${editorStore.a4StatblockOffsetY}px)`,
      }
    })
    const fittedStatblockStyle = computed<StyleValue>(() => {
      const base = a4StatblockStyle.value as Record<string, string>
      if (!fit.value) return base
      return {
        ...base, position: 'absolute', top: '0', left: '0', width: fit.value.layoutWidth + 'px',
        minWidth: '0', minHeight: fit.value.y === 1 ? fit.value.height + 'px' : undefined, marginLeft: '0', marginRight: '0',
        '--statblock-font-scale': fit.value.font,
        transform: `scale(${fit.value.x}, ${fit.value.y})`, transformOrigin: 'top left',
      }
    })

    function measureStatblockFit() {
      const frame = statblockFrame.value
      const block = statblockContent.value
      const widthFactor = Math.max(25, Math.min(150, editorStore.a4StatblockFinalWidth ?? 100)) / 100
      const heightFactor = Math.max(25, Math.min(150, editorStore.a4StatblockFinalHeight ?? 100)) / 100
      if (!frame || !block || !editorStore.a4PreviewMode || (widthFactor === 1 && heightFactor === 1)) {
        fit.value = null
        return
      }

      const frameStyle = frame.style.cssText
      const blockStyle = block.style.cssText
      try {
        frame.style.display = 'contents'
        const base = a4StatblockStyle.value as Record<string, string>
        Object.assign(block.style, {
          position: 'relative', top: '', left: '', width: base.width || '', minWidth: base.minWidth || '',
          flex: base.flex || '', marginLeft: base.marginLeft || '', marginRight: base.marginRight || '',
          alignSelf: 'start', transform: 'none', minHeight: '',
        })
        const preferred = (editorStore.statblockFontScale ?? 100) / 100
        block.style.setProperty('--statblock-font-scale', String(preferred))
        const naturalWidth = block.offsetWidth
        const naturalHeight = block.offsetHeight
        if (!naturalWidth || !naturalHeight) {
          fit.value = null
          return
        }

        const width = naturalWidth * widthFactor
        const height = naturalHeight * heightFactor
        const floor = Math.min(preferred, 0.75)
        const measure = (font: number) => {
          const layoutWidth = Math.max(width, naturalWidth * font / preferred)
          block.style.width = layoutWidth + 'px'
          block.style.flex = '0 0 ' + layoutWidth + 'px'
          block.style.setProperty('--statblock-font-scale', String(font))
          return { font, layoutWidth, contentHeight: block.offsetHeight }
        }
        const fits = (sample: ReturnType<typeof measure>) =>
          sample.layoutWidth <= width && (heightFactor === 1 || sample.contentHeight <= height)
        let sample = measure(preferred)
        if (!fits(sample)) {
          let low = floor
          let high = preferred
          sample = measure(low)
          if (fits(sample)) {
            for (let attempt = 0; attempt < 7; attempt++) {
              const candidate = measure((low + high) / 2)
              if (fits(candidate)) {
                sample = candidate
                low = candidate.font
              } else high = candidate.font
            }
          }
        }
        const targetHeight = heightFactor === 1 ? sample.contentHeight : height
        fit.value = {
          width, height: targetHeight, layoutWidth: sample.layoutWidth, font: sample.font,
          x: width / sample.layoutWidth, y: Math.min(1, targetHeight / Math.max(1, sample.contentHeight)),
        }
      } finally {
        frame.style.cssText = frameStyle
        block.style.cssText = blockStyle
      }
    }

    let fitFrame = 0
    const scheduleStatblockFit = () => {
      cancelAnimationFrame(fitFrame)
      fitFrame = requestAnimationFrame(measureStatblockFit)
    }
    const fitObserver = new MutationObserver(scheduleStatblockFit)
    let lastFitContainerWidth = 0
    const fitResizeObserver = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0
      if (width !== lastFitContainerWidth) {
        lastFitContainerWidth = width
        scheduleStatblockFit()
      }
    })
    watch(renderRoot, root => {
      fitResizeObserver.disconnect()
      if (root) fitResizeObserver.observe(root)
    })
    watch(statblockContent, block => {
      fitObserver.disconnect()
      if (block) fitObserver.observe(block, { subtree: true, childList: true, characterData: true })
    })
    onMounted(() => {
      window.addEventListener('resize', scheduleStatblockFit)
      document.fonts?.addEventListener('loadingdone', scheduleStatblockFit)
      scheduleStatblockFit()
    })
    onBeforeUnmount(() => {
      cancelAnimationFrame(fitFrame)
      fitObserver.disconnect()
      fitResizeObserver.disconnect()
      window.removeEventListener('resize', scheduleStatblockFit)
      document.fonts?.removeEventListener('loadingdone', scheduleStatblockFit)
    })

    const a4PortraitStyle = computed<StyleValue>(() => {
      const w = monster.portrait?.width && monster.portrait.width > 50 ? monster.portrait.width : 280
      const occ = editorStore.a4PictureOcclusion || 0
      const portraitZ = getLayerZIndex('portrait')
      const pLayer = portraitLayerObj.value
      const layerOpacity = ((pLayer?.opacity ?? 100) / 100)
      const layerBlend = (pLayer?.blendMode || 'normal') as CSSProperties['mixBlendMode']
      const layerDisplay = pLayer && pLayer.visible === false ? 'none' : undefined
      const maskImg = pLayer?.maskUrl ? `url("${appAsset(pLayer.maskUrl)}")` : undefined

      const pOffX = editorStore.a4PortraitOffsetX || 0
      const pOffY = editorStore.a4PortraitOffsetY || 0
      const pScale = (editorStore.a4PortraitScale ?? 100) / 100
      const pTransform = (pOffX !== 0 || pOffY !== 0 || pScale !== 1)
        ? {
            transform: `translate(${pOffX}px, ${pOffY}px) scale(${pScale})`,
            transformOrigin: 'top center'
          }
        : {}

      if (occ >= 100) {
        return {
          position: 'absolute',
          left: '20px',
          top: '20px',
          width: `${w}px`,
          maxWidth: `${w}px`,
          zIndex: portraitZ,
          opacity: layerOpacity,
          mixBlendMode: layerBlend,
          display: layerDisplay,
          maskImage: maskImg,
          WebkitMaskImage: maskImg,
          maskSize: maskImg ? 'cover' : undefined,
          WebkitMaskSize: maskImg ? 'cover' : undefined,
          ...pTransform
        }
      }

      const frameWidth = a4StatblockWidth.value !== null
        ? 'min(' + w + 'px, calc(' + (100 - a4StatblockWidth.value) + '% - 16px + ' + Math.round(w * occ / 100) + 'px))'
        : w + 'px'
      return {
        width: frameWidth,
        maxWidth: frameWidth,
        flexShrink: '0',
        zIndex: portraitZ,
        position: 'relative',
        opacity: layerOpacity,
        mixBlendMode: layerBlend,
        display: layerDisplay,
        maskImage: maskImg,
        WebkitMaskImage: maskImg,
        maskSize: maskImg ? 'cover' : undefined,
        WebkitMaskSize: maskImg ? 'cover' : undefined,
        ...pTransform
      }
    })

    const portraitCropContainerStyle = computed<StyleValue>(() => {
      if (!editorStore.a4PreviewMode) return {}
      const cropX = editorStore.a4PortraitCropX || { min: 0, max: 100 }
      const cropY = editorStore.a4PortraitCropY || { min: 0, max: 100 }
      const top = cropY.min || 0
      const right = 100 - (cropX.max ?? 100)
      const bottom = 100 - (cropY.max ?? 100)
      const left = cropX.min || 0
      if (top === 0 && right === 0 && bottom === 0 && left === 0) return {}
      return {
        clipPath: `inset(${top}% ${right}% ${bottom}% ${left}%)`,
        WebkitClipPath: `inset(${top}% ${right}% ${bottom}% ${left}%)`,
      }
    })

    const imageShapeTransform = (layer?: A4CompositionLayer | null) => {
      if (!layer) return ''
      const x = (layer.scaleX ?? 100) / 100 * (layer.mirrorHorizontal ? -1 : 1)
      const y = (layer.scaleY ?? 100) / 100 * (layer.mirrorVertical ? -1 : 1)
      return x === 1 && y === 1 && !layer.rotation ? '' : 'rotate(' + (layer.rotation ?? 0) + 'deg) scale(' + x + ', ' + y + ')'
    }

    const portraitImgStyle = computed<StyleValue>(() => {
      if (!editorStore.a4PreviewMode) return {}
      const cx = editorStore.a4PortraitCropCenterX || 0
      const cy = editorStore.a4PortraitCropCenterY || 0
      const pLayer = portraitLayerObj.value
      const filter = pLayer?.grayscaleAsAlpha
        ? (pLayer.grayscaleInvert ? 'url(#a4-luminance-to-alpha-invert)' : 'url(#a4-luminance-to-alpha)')
        : undefined
      const shape = imageShapeTransform(pLayer)
      if (cx === 0 && cy === 0 && !filter && !shape) return {}
      return {
        objectPosition: (cx !== 0 || cy !== 0) ? `${50 + cx}% ${50 + cy}%` : undefined,
        transform: [(cx || cy) ? 'translate(' + cx + '%, ' + cy + '%)' : '', shape].filter(Boolean).join(' ') || undefined,
        filter,
      }
    })

    type GradientOverlay = Parameters<typeof formatCurvedGradientCss>[0]
    const formatGradient = (overlay: GradientOverlay): string | undefined => {
      return formatCurvedGradientCss(overlay)
    }

    const getGradientOverlayStyle = (overlay: GradientOverlay | undefined): StyleValue => {
      if (!overlay || !overlay.enabled) return {}
      const grad = formatGradient(overlay) || 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: grad,
        mixBlendMode: (overlay.blendMode || 'normal') as CSSProperties['mixBlendMode'],
        opacity: (overlay.opacity ?? 100) / 100,
        pointerEvents: 'none',
      }
    }

    const getLayerStyle = (layer: A4CompositionLayer): StyleValue => {
      const top = layer.cropY?.min || 0
      const right = 100 - (layer.cropX?.max ?? 100)
      const bottom = 100 - (layer.cropY?.max ?? 100)
      const left = layer.cropX?.min || 0
      const clipPath = (top > 0 || right > 0 || bottom > 0 || left > 0)
        ? `inset(${top}% ${right}% ${bottom}% ${left}%)`
        : undefined

      const cx = layer.cropCenterX || 0
      const cy = layer.cropCenterY || 0
      const bgPos = (cx !== 0 || cy !== 0) ? `${50 + cx}% ${50 + cy}%` : undefined

      const offX = layer.offsetX || 0
      const offY = layer.offsetY || 0
      const sc = (layer.scale ?? 100) / 100
      const transform = [
        (offX || offY || sc !== 1) ? 'translate(' + offX + 'px, ' + offY + 'px) scale(' + sc + ')' : '',
        imageShapeTransform(layer),
      ].filter(Boolean).join(' ') || undefined

      const calculatedZIndex = getLayerZIndex(layer)

      const maskImage = layer.maskUrl ? `url("${appAsset(layer.maskUrl)}")` : undefined

      // Convert RGB grayscale luminance directly into alpha channel via SVG feColorMatrix filter
      // so even opaque 24-bit JPG/PNG textures without an alpha channel blend via luminance
      const filter = layer.grayscaleAsAlpha && layer.url
        ? (layer.grayscaleInvert ? 'url(#a4-luminance-to-alpha-invert)' : 'url(#a4-luminance-to-alpha)')
        : undefined

      return {
        backgroundImage: layer.url ? `url("${appAsset(layer.url)}")` : undefined,
        opacity: (layer.opacity ?? 100) / 100,
        mixBlendMode: layer.blendMode || 'normal',
        display: layer.visible ? 'block' : 'none',
        zIndex: calculatedZIndex,
        maskImage,
        WebkitMaskImage: maskImage,
        maskSize: maskImage ? 'cover' : undefined,
        WebkitMaskSize: maskImage ? 'cover' : undefined,
        filter,
        clipPath,
        WebkitClipPath: clipPath,
        backgroundPosition: bgPos,
        transform,
        transformOrigin: 'center center'
      }
    }

    const getLayerTextStyle = (layer: A4CompositionLayer): StyleValue => {
      const align = layer.overlayTextAlign || 'center'
      const offsetX = layer.overlayTextOffsetX || 0
      const offsetY = layer.overlayTextOffsetY || 0
      const color = layer.overlayTextColor || '#58180d'
      const fontSize = layer.overlayTextFontSize ? `${layer.overlayTextFontSize}pt` : '9pt'

      return {
        position: 'absolute',
        left: align === 'left' ? `${16 + offsetX}px` : align === 'center' ? '50%' : 'auto',
        right: align === 'right' ? `${16 - offsetX}px` : 'auto',
        bottom: '12px',
        transform: align === 'center' ? `translateX(-50%) translate(${offsetX}px, ${offsetY}px)` : `translateY(${offsetY}px)`,
        color,
        fontSize,
        fontFamily: "'Scaly Sans', 'Cinzel', serif",
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        zIndex: '10',
        whiteSpace: 'nowrap',
      }
    }

    const a4PageOverflowPx = ref<number>(0)
    const a4PageScrollHeight = ref<number>(0)
    const a4Pagination = computed(() =>
      calculateA4Pagination(a4PageScrollHeight.value, editorStore.a4Orientation, editorStore.a4CompactDensity),
    )
    const checkA4Overflow = () => {
      if (!editorStore.a4PreviewMode || !a4PageRef.value) {
        a4PageOverflowPx.value = 0
        a4PageScrollHeight.value = 0
        return
      }
      const actualHeight = a4PageRef.value.scrollHeight || 0
      a4PageScrollHeight.value = actualHeight
      const targetHeight = a4TargetHeightPx.value
      a4PageOverflowPx.value = Math.max(0, actualHeight - Math.ceil(targetHeight))
    }

    onMounted(() => {
      nextTick(() => checkA4Overflow())
    })
    watch(
      [
        () => monster,
        () => editorStore.a4Orientation,
        () => editorStore.a4Layout,
        () => editorStore.a4CompactDensity,
        () => editorStore.a4StatblockWidth,
        () => editorStore.statblockFontScale,
        () => editorStore.a4PreviewMode,
        () => editorStore.a4MultiPagePrint,
      ],
      () => {
        nextTick(() => checkA4Overflow())
      },
      { deep: true }
    )

    const fitA4ForPrint = () => {
      const page = a4PageRef.value
      if (!editorStore.a4PreviewMode || !page) return
      page.style.removeProperty('--a4-print-transform')
      const stage = page.parentElement
      if (stage) {
        const paper = getComputedStyle(page)
        stage.style.setProperty('--a4-print-paper', paper.backgroundColor)
        stage.style.setProperty('--a4-print-paper-image', paper.backgroundImage)
      }
      if (editorStore.a4MultiPagePrint && a4Pagination.value.isOverflowing) return
      const paperWidth = (editorStore.a4Orientation === 'landscape' ? 297 : 210) * 96 / 25.4
      const paperHeight = a4TargetHeightPx.value
      const pageRect = page.getBoundingClientRect()
      const previewScaleX = pageRect.width / page.offsetWidth
      const previewScaleY = pageRect.height / page.offsetHeight
      const boxes = Array.from(page.querySelectorAll('.statblock, .monster-portrait, .a4-hero-banner'))
        .map(element => element.getBoundingClientRect())
        .filter(box => box.width > 0 && box.height > 0)
      if (!boxes.length) return
      const left = (Math.min(...boxes.map(box => box.left)) - pageRect.left) / previewScaleX
      const top = (Math.min(...boxes.map(box => box.top)) - pageRect.top) / previewScaleY
      const right = (Math.max(...boxes.map(box => box.right)) - pageRect.left) / previewScaleX
      const bottom = (Math.max(...boxes.map(box => box.bottom)) - pageRect.top) / previewScaleY
      const scaleX = (paperWidth - 2) / (right - left)
      const scaleY = (paperHeight - 2) / (bottom - top)
      page.style.setProperty('--a4-print-transform', `matrix(${scaleX},0,0,${scaleY},${1 - left * scaleX},${1 - top * scaleY})`)
    }

    onMounted(() => window.addEventListener('beforeprint', fitA4ForPrint))
    onBeforeUnmount(() => window.removeEventListener('beforeprint', fitA4ForPrint))

    const printA4Sheet = async () => {
      await document.fonts?.ready
      await Promise.allSettled(Array.from(a4PageRef.value?.querySelectorAll('img') || []).map(img => img.decode()))
      fitA4ForPrint()
      window.print()
    }

    return { openLayerStudio, a4AllCustomLayers, a4BackgroundLayers, a4ForegroundLayers, a4PageRef, a4ViewportRef, a4TargetHeightPx, resolvedA4Layout, updateMeasuredHeight, a4ScaleStageStyle, ensureCoreLayers, portraitLayerObj, statblockLayerObj, getLayerZIndex, a4StatblockWrapperStyle, a4StatblockWidth, a4StatblockStyle, statblockFrame, statblockContent, fit, statblockFitActive, statblockFrameStyle, fittedStatblockStyle, measureStatblockFit, fitFrame, scheduleStatblockFit, fitObserver, lastFitContainerWidth, fitResizeObserver, a4PortraitStyle, portraitCropContainerStyle, imageShapeTransform, portraitImgStyle, formatGradient, getGradientOverlayStyle, getLayerStyle, getLayerTextStyle, a4PageOverflowPx, a4Pagination, checkA4Overflow, fitA4ForPrint, printA4Sheet }
}
