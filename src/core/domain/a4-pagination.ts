export const A4_PORTRAIT_MM = { width: 210, height: 297 } as const
export const A4_LANDSCAPE_MM = { width: 297, height: 210 } as const
export const MM_TO_PX_96DPI = 96 / 25.4
export const A4_OVERFLOW_TOLERANCE_PX = 2
export const A4_MAX_PAGES = 20

export interface A4PaginationMetrics {
  orientation: 'portrait' | 'landscape'
  compact: boolean
  pageWidthPx: number
  pageHeightPx: number
  contentHeightPx: number
  overflowPx: number
  isOverflowing: boolean
  pageCount: number
  breakPositionsPx: number[]
}

/** Calculates physical A4 pagination bounds and page-break guide offsets at 96 DPI. */
export function calculateA4Pagination(
  contentHeightPx: number,
  orientation: 'portrait' | 'landscape' = 'portrait',
  compact = false,
): A4PaginationMetrics {
  const dims = orientation === 'landscape' ? A4_LANDSCAPE_MM : A4_PORTRAIT_MM
  const pageWidthPx = Math.round(dims.width * MM_TO_PX_96DPI)
  const pageHeightPx = Math.round(dims.height * MM_TO_PX_96DPI)
  const normalizedHeight = Number.isFinite(contentHeightPx) && contentHeightPx > 0 ? contentHeightPx : 0
  const overflowPx = Math.max(0, Math.ceil(normalizedHeight - pageHeightPx))
  const isOverflowing = overflowPx > A4_OVERFLOW_TOLERANCE_PX
  const pageCount = isOverflowing
    ? Math.min(A4_MAX_PAGES, Math.max(2, Math.ceil(normalizedHeight / pageHeightPx)))
    : 1
  const breakPositionsPx: number[] = []
  for (let page = 1; page < pageCount; page++) {
    breakPositionsPx.push(Math.round(page * pageHeightPx))
  }
  return {
    orientation,
    compact,
    pageWidthPx,
    pageHeightPx,
    contentHeightPx: normalizedHeight,
    overflowPx,
    isOverflowing,
    pageCount,
    breakPositionsPx,
  }
}
