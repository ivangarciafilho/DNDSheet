/**
 * Presentation-only workspace presets (B7.4).
 * Strictly touches editor visual/layout settings and never mutates Monster mechanics or contentRevision.
 */
export type WorkspacePresetId = 'screen' | 'ink_saver' | 'art_plate'

export interface WorkspacePresentationSlice {
  visualTemplate: 'classic' | 'modern'
  visualTheme: string
  a4PreviewMode: boolean
  a4CompactDensity: boolean
  a4StatblockOpacity: number
  condenseImmunities: boolean
  a4Layout?: string
}

export interface WorkspacePresetDefinition {
  id: WorkspacePresetId
  label: string
  icon: string
  description: string
  patch: WorkspacePresentationSlice
}

export const WORKSPACE_PRESETS: readonly WorkspacePresetDefinition[] = Object.freeze([
  {
    id: 'screen',
    label: 'Screen',
    icon: 'desktop_windows',
    description: 'High-clarity parchment contrast optimized for digital table play.',
    patch: {
      visualTemplate: 'classic',
      visualTheme: 'wotc',
      a4PreviewMode: false,
      a4CompactDensity: false,
      a4StatblockOpacity: 100,
      condenseImmunities: false,
    },
  },
  {
    id: 'ink_saver',
    label: 'Ink saver',
    icon: 'print',
    description: 'Clean white paper ground, compact A4 rhythm, and condensed defenses for printing.',
    patch: {
      visualTemplate: 'classic',
      visualTheme: 'printer',
      a4PreviewMode: true,
      a4CompactDensity: true,
      a4StatblockOpacity: 100,
      condenseImmunities: true,
    },
  },
  {
    id: 'art_plate',
    label: 'Art plate',
    icon: 'auto_awesome_mosaic',
    description: 'Showcase A4 layout with modern framing and subtle backdrop translucency for artwork.',
    patch: {
      visualTemplate: 'modern',
      visualTheme: 'art_nouveau',
      a4PreviewMode: true,
      a4CompactDensity: false,
      a4StatblockOpacity: 85,
      condenseImmunities: false,
      a4Layout: 'auto',
    },
  },
])

export function workspacePresetById(id: WorkspacePresetId): WorkspacePresetDefinition {
  return WORKSPACE_PRESETS.find((preset) => preset.id === id) ?? WORKSPACE_PRESETS[0]
}

export function applyWorkspacePreset(
  editorState: Partial<WorkspacePresentationSlice> & Record<string, unknown>,
  presetId: WorkspacePresetId,
): WorkspacePresentationSlice {
  const def = workspacePresetById(presetId)
  Object.assign(editorState, def.patch)
  return { ...def.patch }
}

export function detectActiveWorkspacePreset(
  editorState: Partial<WorkspacePresentationSlice>,
): WorkspacePresetId | 'custom' {
  for (const preset of WORKSPACE_PRESETS) {
    const p = preset.patch
    if (
      editorState.visualTemplate === p.visualTemplate &&
      editorState.visualTheme === p.visualTheme &&
      Boolean(editorState.a4PreviewMode) === p.a4PreviewMode &&
      Boolean(editorState.a4CompactDensity) === p.a4CompactDensity &&
      Number(editorState.a4StatblockOpacity ?? 100) === p.a4StatblockOpacity &&
      Boolean(editorState.condenseImmunities) === p.condenseImmunities
    ) {
      return preset.id
    }
  }
  return 'custom'
}
