/**
 * Canonical 15-section navigator contract matching `#editor > .q-list > .q-expansion-item` in MonsterBuilder.vue (B7.2).
 */
export interface WorkspaceSectionDef {
  id: string
  label: string
  shortLabel: string
  icon: string
  group: 'layout' | 'core' | 'offense' | 'world'
}

export const WORKSPACE_SECTIONS: readonly WorkspaceSectionDef[] = Object.freeze([
  { id: 'a4Layers', label: 'A4 Layers', shortLabel: 'Layers', icon: 'layers', group: 'layout' },
  { id: 'basics', label: 'Basics & Vitals', shortLabel: 'Basics', icon: 'badge', group: 'core' },
  { id: 'inventory', label: 'Inventory', shortLabel: 'Gear', icon: 'luggage', group: 'world' },
  { id: 'saves', label: 'Saving Throws', shortLabel: 'Saves', icon: 'shield', group: 'core' },
  { id: 'speeds', label: 'Speeds & Movement', shortLabel: 'Speeds', icon: 'speed', group: 'core' },
  { id: 'skills', label: 'Skills & Tools', shortLabel: 'Skills', icon: 'psychology', group: 'core' },
  { id: 'senses', label: 'Senses', shortLabel: 'Senses', icon: 'visibility', group: 'core' },
  { id: 'resistances', label: 'Defenses & Immunities', shortLabel: 'Defenses', icon: 'security', group: 'core' },
  { id: 'spellcasting', label: 'Spellcasting', shortLabel: 'Spells', icon: 'auto_fix_high', group: 'offense' },
  { id: 'actions', label: 'Actions & Traits', shortLabel: 'Actions', icon: 'flash_on', group: 'offense' },
  { id: 'villainActions', label: 'Villain & Bloodied', shortLabel: 'Villain', icon: 'fa-solid fa-crown', group: 'offense' },
  { id: 'regional', label: 'Lair & Regional', shortLabel: 'Lair', icon: 'public', group: 'world' },
  { id: 'randomTables', label: 'Random Tables', shortLabel: 'Tables', icon: 'casino', group: 'world' },
  { id: 'anatomy', label: 'Draco Anatomy', shortLabel: 'Anatomy', icon: 'fa-solid fa-shield-halved', group: 'offense' },
  { id: 'encounterDynamics', label: 'Encounter Dynamics', shortLabel: 'Dynamics', icon: 'timeline', group: 'world' },
])

export function workspaceSectionById(id: string): WorkspaceSectionDef | undefined {
  return WORKSPACE_SECTIONS.find((sec) => sec.id === id)
}
