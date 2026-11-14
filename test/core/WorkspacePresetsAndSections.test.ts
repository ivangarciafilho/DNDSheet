import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultMonster } from '../../src/core/domain/types.ts'
import {
  canonicalDocumentFingerprint,
  createDocumentSessionTracker,
} from '../../src/core/domain/document-envelope.ts'
import { WORKSPACE_SECTIONS, workspaceSectionById } from '../../src/core/domain/workspace-sections.ts'
import {
  applyWorkspacePreset,
  detectActiveWorkspacePreset,
  WORKSPACE_PRESETS,
} from '../../src/core/domain/workspace-presets.ts'

test('B7.2: workspace section registry preserves canonical 15-section order matching MonsterBuilder', () => {
  assert.equal(WORKSPACE_SECTIONS.length, 15)
  const ids = WORKSPACE_SECTIONS.map((s) => s.id)
  assert.equal(new Set(ids).size, 15)
  assert.deepEqual(ids, [
    'a4Layers',
    'basics',
    'inventory',
    'saves',
    'speeds',
    'skills',
    'senses',
    'resistances',
    'spellcasting',
    'actions',
    'villainActions',
    'regional',
    'randomTables',
    'anatomy',
    'encounterDynamics',
  ])
  assert.equal(workspaceSectionById('actions')?.label, 'Actions & Traits')
})

test('B7.4: Screen, Ink saver, and Art plate presets touch only presentation fields without mutating Monster or contentRevision', () => {
  assert.deepEqual(
    WORKSPACE_PRESETS.map((p) => p.id),
    ['screen', 'ink_saver', 'art_plate'],
  )

  const monster = { ...defaultMonster(), name: 'Test Elemental' }
  const initialJson = canonicalDocumentFingerprint(monster)
  const tracker = createDocumentSessionTracker(monster)
  const initialRev = tracker.getRevision()

  const editorState: Record<string, unknown> = {
    visualTemplate: 'classic',
    visualTheme: 'wotc',
    a4PreviewMode: false,
    a4CompactDensity: false,
    a4StatblockOpacity: 100,
    condenseImmunities: false,
  }

  for (const presetId of ['screen', 'ink_saver', 'art_plate'] as const) {
    applyWorkspacePreset(editorState, presetId)
    assert.equal(detectActiveWorkspacePreset(editorState), presetId)
    assert.equal(canonicalDocumentFingerprint(monster), initialJson)
    assert.equal(tracker.recordMutation(monster, { presentationOnly: true }), false)
    assert.equal(tracker.recordMutation(monster), false)
    assert.equal(tracker.getRevision(), initialRev)
  }

  editorState.visualTheme = 'lovecraft_golden'
  assert.equal(detectActiveWorkspacePreset(editorState), 'custom')
})
