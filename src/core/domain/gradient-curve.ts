export type GradientCurvePreset = 'linear' | 'ease_in' | 'ease_out' | 'smoothstep' | 'custom'

export interface GradientColorStop {
  color: string
  offset: number
}

export interface GradientOverlayConfig {
  enabled: boolean
  direction: 'left_to_right' | 'right_to_left' | 'top_to_bottom' | 'bottom_to_top' | 'vignette' | 'radial'
  blendMode: string
  opacity: number
  startColor: string
  endColor: string
  curve: GradientCurvePreset
  curveTension?: number
  stops?: GradientColorStop[]
}

/**
 * Evaluates a normalized falloff position t in [0, 1] along the selected falloff curve.
 * When `curve === 'custom'` (or `curveTension` is provided), uses a power curve where
 * `t = 0.5` maps to `curveTension` in (0, 1).
 */
export function evaluateGradientCurve(
  t: number,
  curve: GradientCurvePreset = 'linear',
  curveTension?: number
): number {
  const clamped = Math.max(0, Math.min(1, t))
  if (curve === 'custom' && typeof curveTension === 'number' && curveTension > 0.01 && curveTension < 0.99) {
    const gamma = Math.log(curveTension) / Math.log(0.5)
    return Math.pow(clamped, gamma)
  }
  switch (curve) {
    case 'ease_in':
      return clamped * clamped
    case 'ease_out':
      return 1 - (1 - clamped) * (1 - clamped)
    case 'smoothstep':
      return clamped * clamped * (3 - 2 * clamped)
    case 'linear':
    default:
      return clamped
  }
}

interface ParsedRgba {
  r: number
  g: number
  b: number
  a: number
}

function parseColorRgba(color: string): ParsedRgba | null {
  const c = (color || '').trim()
  const rgbaMatch = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i)
  if (rgbaMatch) {
    return {
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1,
    }
  }
  const hexMatch = c.match(/^#([0-9a-f]{3,8})$/i)
  if (hexMatch) {
    const h = hexMatch[1]
    if (h.length === 3) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
        a: 1,
      }
    }
    if (h.length === 6 || h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: h.length === 8 ? Number((parseInt(h.slice(6, 8), 16) / 255).toFixed(3)) : 1,
      }
    }
  }
  return null
}

function interpolateStopsWithCurve(
  stops: GradientColorStop[],
  curve: GradientCurvePreset,
  curveTension?: number
): string[] {
  const sorted = [...stops].sort((a, b) => a.offset - b.offset)
  if (sorted.length < 2) {
    return sorted.map((s) => `${s.color} ${s.offset}%`)
  }
  if (curve === 'linear' && (curveTension === undefined || Math.abs(curveTension - 0.5) < 0.02)) {
    return sorted.map((s) => `${s.color} ${s.offset}%`)
  }

  const out: string[] = []
  const subSteps = 5
  for (let i = 0; i < sorted.length - 1; i++) {
    const s0 = sorted[i]
    const s1 = sorted[i + 1]
    const c0 = parseColorRgba(s0.color)
    const c1 = parseColorRgba(s1.color)
    if (!c0 || !c1 || s1.offset <= s0.offset) {
      out.push(`${s0.color} ${s0.offset}%`)
      if (i === sorted.length - 2) out.push(`${s1.color} ${s1.offset}%`)
      continue
    }
    for (let step = 0; step < subSteps; step++) {
      const localT = step / subSteps
      const curvedT = evaluateGradientCurve(localT, curve, curveTension)
      const r = Math.round(c0.r + (c1.r - c0.r) * curvedT)
      const g = Math.round(c0.g + (c1.g - c0.g) * curvedT)
      const b = Math.round(c0.b + (c1.b - c0.b) * curvedT)
      const a = Number((c0.a + (c1.a - c0.a) * curvedT).toFixed(3))
      const pos = Number((s0.offset + (s1.offset - s0.offset) * localT).toFixed(1))
      out.push(`rgba(${r}, ${g}, ${b}, ${a}) ${pos}%`)
    }
    if (i === sorted.length - 2) {
      out.push(`${s1.color} ${s1.offset}%`)
    }
  }
  return out
}

export function formatCurvedGradientCss(overlay?: GradientOverlayConfig): string {
  if (!overlay || !overlay.enabled) return 'none'
  const rawStops = Array.isArray(overlay.stops) && overlay.stops.length >= 2
    ? overlay.stops
    : [
        { color: overlay.startColor || 'rgba(0,0,0,0.65)', offset: 0 },
        { color: overlay.endColor || 'rgba(0,0,0,0)', offset: 100 },
      ]
  const stopParts = interpolateStopsWithCurve(rawStops, overlay.curve || 'linear', overlay.curveTension)
  const stopStr = stopParts.join(', ')

  if (overlay.direction === 'radial') {
    return `radial-gradient(circle at center, ${stopStr})`
  }
  if (overlay.direction === 'vignette') {
    const revStops = [...rawStops]
      .sort((a, b) => a.offset - b.offset)
      .map((s) => ({ color: s.color, offset: 100 - s.offset }))
      .sort((a, b) => a.offset - b.offset)
    const revStr = interpolateStopsWithCurve(revStops, overlay.curve || 'linear', overlay.curveTension).join(', ')
    return `radial-gradient(ellipse at center, ${revStr})`
  }
  const dirMap: Record<string, string> = {
    left_to_right: 'to right',
    right_to_left: 'to left',
    top_to_bottom: 'to bottom',
    bottom_to_top: 'to top',
  }
  const cssDir = dirMap[overlay.direction] || 'to bottom'
  return `linear-gradient(${cssDir}, ${stopStr})`
}
