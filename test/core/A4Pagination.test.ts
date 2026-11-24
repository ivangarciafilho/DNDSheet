import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateA4Pagination } from '../../src/core/domain/a4-pagination.ts'

test('F4.1: portrait and landscape single-page fits stay within 2px subpixel tolerance', () => {
  const portraitExact = calculateA4Pagination(1123, 'portrait', false)
  assert.equal(portraitExact.pageWidthPx, 794)
  assert.equal(portraitExact.pageHeightPx, 1123)
  assert.equal(portraitExact.isOverflowing, false)
  assert.equal(portraitExact.pageCount, 1)
  assert.deepEqual(portraitExact.breakPositionsPx, [])

  const portraitRounding = calculateA4Pagination(1125, 'portrait', false)
  assert.equal(portraitRounding.overflowPx, 2)
  assert.equal(portraitRounding.isOverflowing, false)
  assert.equal(portraitRounding.pageCount, 1)

  const landscapeExact = calculateA4Pagination(794, 'landscape', true)
  assert.equal(landscapeExact.pageWidthPx, 1123)
  assert.equal(landscapeExact.pageHeightPx, 794)
  assert.equal(landscapeExact.compact, true)
  assert.equal(landscapeExact.isOverflowing, false)
  assert.equal(landscapeExact.pageCount, 1)
})

test('F4.1: overflowing portrait boss calculates pageCount and breakPositionsPx accurately', () => {
  const twoPage = calculateA4Pagination(1450, 'portrait')
  assert.equal(twoPage.isOverflowing, true)
  assert.equal(twoPage.pageCount, 2)
  assert.equal(twoPage.overflowPx, 327)
  assert.deepEqual(twoPage.breakPositionsPx, [1123])

  const threePage = calculateA4Pagination(2500, 'portrait')
  assert.equal(threePage.isOverflowing, true)
  assert.equal(threePage.pageCount, 3)
  assert.deepEqual(threePage.breakPositionsPx, [1123, 2246])
})

test('F4.1: landscape overflow and 20-page ceiling handle extreme inputs safely', () => {
  const landscapeBoss = calculateA4Pagination(1700, 'landscape')
  assert.equal(landscapeBoss.isOverflowing, true)
  assert.equal(landscapeBoss.pageCount, 3)
  assert.deepEqual(landscapeBoss.breakPositionsPx, [794, 1588])

  const huge = calculateA4Pagination(50000, 'portrait')
  assert.equal(huge.pageCount, 20)
  assert.equal(huge.breakPositionsPx.length, 19)

  const invalid = calculateA4Pagination(-100, 'portrait')
  assert.equal(invalid.contentHeightPx, 0)
  assert.equal(invalid.pageCount, 1)
})
