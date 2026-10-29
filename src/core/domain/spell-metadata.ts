export interface SpellMetadata {
  school: string
  level?: number
  components: ('V' | 'S' | 'M')[]
  materialDescription?: string
  concentration: boolean
  ritual: boolean
}

// Canonical 5e SRD spell catalog components & tags
export const SRD_SPELL_METADATA: Record<string, SpellMetadata> = {
  // Cantrips
  'Acid Splash': { school: 'Conjuration', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Blade Ward': { school: 'Abjuration', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Chill Touch': { school: 'Necromancy', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Dancing Lights': { school: 'Evocation', level: 0, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Eldritch Blast': { school: 'Evocation', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Fire Bolt': { school: 'Evocation', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Friends': { school: 'Enchantment', level: 0, components: ['S', 'M'], concentration: true, ritual: false },
  'Guidance': { school: 'Divination', level: 0, components: ['V', 'S'], concentration: true, ritual: false },
  'Light': { school: 'Evocation', level: 0, components: ['V', 'M'], concentration: false, ritual: false },
  'Mage Hand': { school: 'Conjuration', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Mending': { school: 'Transmutation', level: 0, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Message': { school: 'Transmutation', level: 0, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Minor Illusion': { school: 'Illusion', level: 0, components: ['S', 'M'], concentration: false, ritual: false },
  'Poison Spray': { school: 'Conjuration', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Prestidigitation': { school: 'Transmutation', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Produce Flame': { school: 'Conjuration', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Ray of Frost': { school: 'Evocation', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Resistance': { school: 'Abjuration', level: 0, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Sacred Flame': { school: 'Evocation', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Shillelagh': { school: 'Transmutation', level: 0, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Shocking Grasp': { school: 'Evocation', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Spare the Dying': { school: 'Necromancy', level: 0, components: ['V', 'S'], concentration: false, ritual: false },
  'Thaumaturgy': { school: 'Transmutation', level: 0, components: ['V'], concentration: false, ritual: false },
  'True Strike': { school: 'Divination', level: 0, components: ['S'], concentration: true, ritual: false },
  'Vicious Mockery': { school: 'Enchantment', level: 0, components: ['V'], concentration: false, ritual: false },

  // 1st Level
  'Alarm': { school: 'Abjuration', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Animal Friendship': { school: 'Enchantment', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Bane': { school: 'Enchantment', level: 1, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Bless': { school: 'Enchantment', level: 1, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Burning Hands': { school: 'Evocation', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Charm Person': { school: 'Enchantment', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Color Spray': { school: 'Illusion', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Command': { school: 'Enchantment', level: 1, components: ['V'], concentration: false, ritual: false },
  'Comprehend Languages': { school: 'Divination', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Cure Wounds': { school: 'Evocation', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Detect Evil and Good': { school: 'Divination', level: 1, components: ['V', 'S'], concentration: true, ritual: false },
  'Detect Magic': { school: 'Divination', level: 1, components: ['V', 'S'], concentration: true, ritual: true },
  'Detect Poison and Disease': { school: 'Divination', level: 1, components: ['V', 'S', 'M'], concentration: true, ritual: true },
  'Disguise Self': { school: 'Illusion', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Divine Favor': { school: 'Evocation', level: 1, components: ['V', 'S'], concentration: true, ritual: false },
  'Entangle': { school: 'Conjuration', level: 1, components: ['V', 'S'], concentration: true, ritual: false },
  'Expeditious Retreat': { school: 'Transmutation', level: 1, components: ['V', 'S'], concentration: true, ritual: false },
  'Faerie Fire': { school: 'Evocation', level: 1, components: ['V'], concentration: true, ritual: false },
  'False Life': { school: 'Necromancy', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Feather Fall': { school: 'Transmutation', level: 1, components: ['V', 'M'], concentration: false, ritual: false },
  'Find Familiar': { school: 'Conjuration', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Floating Disk': { school: 'Conjuration', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Fog Cloud': { school: 'Conjuration', level: 1, components: ['V', 'S'], concentration: true, ritual: false },
  'Goodberry': { school: 'Transmutation', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Guiding Bolt': { school: 'Evocation', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Healing Word': { school: 'Evocation', level: 1, components: ['V'], concentration: false, ritual: false },
  'Hellish Rebuke': { school: 'Evocation', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Heroism': { school: 'Enchantment', level: 1, components: ['V', 'S'], concentration: true, ritual: false },
  'Hideous Laughter': { school: 'Enchantment', level: 1, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Hunter\'s Mark': { school: 'Divination', level: 1, components: ['V'], concentration: true, ritual: false },
  'Identify': { school: 'Divination', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Illusory Script': { school: 'Illusion', level: 1, components: ['S', 'M'], concentration: false, ritual: true },
  'Inflict Wounds': { school: 'Necromancy', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Jump': { school: 'Transmutation', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Longstrider': { school: 'Transmutation', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Mage Armor': { school: 'Abjuration', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Magic Missile': { school: 'Evocation', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Protection from Evil and Good': { school: 'Abjuration', level: 1, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Purify Food and Drink': { school: 'Transmutation', level: 1, components: ['V', 'S'], concentration: false, ritual: true },
  'Sanctuary': { school: 'Abjuration', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Shield': { school: 'Abjuration', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Shield of Faith': { school: 'Abjuration', level: 1, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Silent Image': { school: 'Illusion', level: 1, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Sleep': { school: 'Enchantment', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Speak with Animals': { school: 'Divination', level: 1, components: ['V', 'S'], concentration: false, ritual: true },
  'Thunderwave': { school: 'Evocation', level: 1, components: ['V', 'S'], concentration: false, ritual: false },
  'Unseen Servant': { school: 'Conjuration', level: 1, components: ['V', 'S', 'M'], concentration: false, ritual: true },

  // 2nd Level
  'Aid': { school: 'Abjuration', level: 2, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Alter Self': { school: 'Transmutation', level: 2, components: ['V', 'S'], concentration: true, ritual: false },
  'Barkskin': { school: 'Transmutation', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Blindness/Deafness': { school: 'Necromancy', level: 2, components: ['V'], concentration: false, ritual: false },
  'Blur': { school: 'Illusion', level: 2, components: ['V'], concentration: true, ritual: false },
  'Darkness': { school: 'Evocation', level: 2, components: ['V', 'M'], concentration: true, ritual: false },
  'Darkvision': { school: 'Transmutation', level: 2, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Detect Thoughts': { school: 'Divination', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Enhance Ability': { school: 'Transmutation', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Enlarge/Reduce': { school: 'Transmutation', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Flaming Sphere': { school: 'Conjuration', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Gentle Repose': { school: 'Necromancy', level: 2, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Gust of Wind': { school: 'Evocation', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Heat Metal': { school: 'Transmutation', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Hold Person': { school: 'Enchantment', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Invisibility': { school: 'Illusion', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Knock': { school: 'Transmutation', level: 2, components: ['V'], concentration: false, ritual: false },
  'Lesser Restoration': { school: 'Abjuration', level: 2, components: ['V', 'S'], concentration: false, ritual: false },
  'Levitate': { school: 'Transmutation', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Locate Animals or Plants': { school: 'Divination', level: 2, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Locate Object': { school: 'Divination', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Magic Weapon': { school: 'Transmutation', level: 2, components: ['V', 'S'], concentration: true, ritual: false },
  'Mirror Image': { school: 'Illusion', level: 2, components: ['V', 'S'], concentration: false, ritual: false },
  'Misty Step': { school: 'Conjuration', level: 2, components: ['V'], concentration: false, ritual: false },
  'Moonbeam': { school: 'Evocation', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Pass without Trace': { school: 'Abjuration', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Prayer of Healing': { school: 'Evocation', level: 2, components: ['V'], concentration: false, ritual: false },
  'Protection from Poison': { school: 'Abjuration', level: 2, components: ['V', 'S'], concentration: false, ritual: false },
  'Ray of Enfeeblement': { school: 'Necromancy', level: 2, components: ['V', 'S'], concentration: true, ritual: false },
  'Scorching Ray': { school: 'Evocation', level: 2, components: ['V', 'S'], concentration: false, ritual: false },
  'See Invisibility': { school: 'Divination', level: 2, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Shatter': { school: 'Evocation', level: 2, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Silence': { school: 'Illusion', level: 2, components: ['V', 'S'], concentration: true, ritual: true },
  'Spider Climb': { school: 'Transmutation', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Spiritual Weapon': { school: 'Evocation', level: 2, components: ['V', 'S'], concentration: false, ritual: false },
  'Suggestion': { school: 'Enchantment', level: 2, components: ['V', 'M'], concentration: true, ritual: false },
  'Web': { school: 'Conjuration', level: 2, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Zone of Truth': { school: 'Enchantment', level: 2, components: ['V', 'S'], concentration: false, ritual: false },

  // 3rd Level
  'Animate Dead': { school: 'Necromancy', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Beacon of Hope': { school: 'Abjuration', level: 3, components: ['V', 'S'], concentration: true, ritual: false },
  'Bestow Curse': { school: 'Necromancy', level: 3, components: ['V', 'S'], concentration: true, ritual: false },
  'Call Lightning': { school: 'Conjuration', level: 3, components: ['V', 'S'], concentration: true, ritual: false },
  'Clairvoyance': { school: 'Divination', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Counterspell': { school: 'Abjuration', level: 3, components: ['S'], concentration: false, ritual: false },
  'Dispel Magic': { school: 'Abjuration', level: 3, components: ['V', 'S'], concentration: false, ritual: false },
  'Fear': { school: 'Illusion', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Fireball': { school: 'Evocation', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Fly': { school: 'Transmutation', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Gaseous Form': { school: 'Transmutation', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Glyph of Warding': { school: 'Abjuration', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Haste': { school: 'Transmutation', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Hypnotic Pattern': { school: 'Illusion', level: 3, components: ['S', 'M'], concentration: true, ritual: false },
  'Lightning Bolt': { school: 'Evocation', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Magic Circle': { school: 'Abjuration', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Major Image': { school: 'Illusion', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Mass Healing Word': { school: 'Evocation', level: 3, components: ['V'], concentration: false, ritual: false },
  'Nondetection': { school: 'Abjuration', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Phantom Steed': { school: 'Illusion', level: 3, components: ['V', 'S'], concentration: false, ritual: true },
  'Protection from Energy': { school: 'Abjuration', level: 3, components: ['V', 'S'], concentration: true, ritual: false },
  'Remove Curse': { school: 'Abjuration', level: 3, components: ['V', 'S'], concentration: false, ritual: false },
  'Revivify': { school: 'Necromancy', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Slow': { school: 'Transmutation', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Speak with Dead': { school: 'Necromancy', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Spirit Guardians': { school: 'Conjuration', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Stinking Cloud': { school: 'Conjuration', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Tiny Hut': { school: 'Evocation', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Tongues': { school: 'Divination', level: 3, components: ['V', 'M'], concentration: false, ritual: false },
  'Vampiric Touch': { school: 'Necromancy', level: 3, components: ['V', 'S'], concentration: true, ritual: false },
  'Water Breathing': { school: 'Transmutation', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Water Walk': { school: 'Transmutation', level: 3, components: ['V', 'S', 'M'], concentration: false, ritual: true },
  'Wind Wall': { school: 'Evocation', level: 3, components: ['V', 'S', 'M'], concentration: true, ritual: false },

  // 4th Level & Beyond Flagship Spells
  'Banishment': { school: 'Abjuration', level: 4, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Blight': { school: 'Necromancy', level: 4, components: ['V', 'S'], concentration: false, ritual: false },
  'Dimension Door': { school: 'Conjuration', level: 4, components: ['V'], concentration: false, ritual: false },
  'Greater Invisibility': { school: 'Illusion', level: 4, components: ['V', 'S'], concentration: true, ritual: false },
  'Ice Storm': { school: 'Evocation', level: 4, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Polymorph': { school: 'Transmutation', level: 4, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Stoneskin': { school: 'Abjuration', level: 4, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Wall of Fire': { school: 'Evocation', level: 4, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Cloudkill': { school: 'Conjuration', level: 5, components: ['V', 'S'], concentration: true, ritual: false },
  'Cone of Cold': { school: 'Evocation', level: 5, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Dominate Person': { school: 'Enchantment', level: 5, components: ['V', 'S'], concentration: true, ritual: false },
  'Greater Restoration': { school: 'Abjuration', level: 5, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Hold Monster': { school: 'Enchantment', level: 5, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Mass Cure Wounds': { school: 'Evocation', level: 5, components: ['V', 'S'], concentration: false, ritual: false },
  'Raise Dead': { school: 'Necromancy', level: 5, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Scrying': { school: 'Divination', level: 5, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Telekinesis': { school: 'Transmutation', level: 5, components: ['V', 'S'], concentration: true, ritual: false },
  'Wall of Force': { school: 'Evocation', level: 5, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Chain Lightning': { school: 'Evocation', level: 6, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Disintegrate': { school: 'Transmutation', level: 6, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Globe of Invulnerability': { school: 'Abjuration', level: 6, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Harm': { school: 'Necromancy', level: 6, components: ['V', 'S'], concentration: false, ritual: false },
  'Heal': { school: 'Evocation', level: 6, components: ['V', 'S'], concentration: false, ritual: false },
  'Sunbeam': { school: 'Evocation', level: 6, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'True Seeing': { school: 'Divination', level: 6, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Delayed Blast Fireball': { school: 'Evocation', level: 7, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Finger of Death': { school: 'Necromancy', level: 7, components: ['V', 'S'], concentration: false, ritual: false },
  'Fire Storm': { school: 'Evocation', level: 7, components: ['V', 'S'], concentration: false, ritual: false },
  'Plane Shift': { school: 'Conjuration', level: 7, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Resurrection': { school: 'Necromancy', level: 7, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Teleport': { school: 'Conjuration', level: 7, components: ['V'], concentration: false, ritual: false },
  'Dominate Monster': { school: 'Enchantment', level: 8, components: ['V', 'S'], concentration: true, ritual: false },
  'Earthquake': { school: 'Evocation', level: 8, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Holy Aura': { school: 'Abjuration', level: 8, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Sunburst': { school: 'Evocation', level: 8, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Foresight': { school: 'Divination', level: 9, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Gate': { school: 'Conjuration', level: 9, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Meteor Swarm': { school: 'Evocation', level: 9, components: ['V', 'S', 'M'], concentration: false, ritual: false },
  'Power Word Kill': { school: 'Enchantment', level: 9, components: ['V'], concentration: false, ritual: false },
  'Time Stop': { school: 'Transmutation', level: 9, components: ['V'], concentration: false, ritual: false },
  'True Polymorph': { school: 'Transmutation', level: 9, components: ['V', 'S', 'M'], concentration: true, ritual: false },
  'Wish': { school: 'Conjuration', level: 9, components: ['V'], concentration: false, ritual: false },
}

/**
 * Deduce spell metadata for any spell name, falling back to smart heuristic parsing.
 */
export function getSpellMetadata(spellName: string): SpellMetadata {
  if (!spellName || !spellName.trim()) {
    return { school: 'Universal', components: ['V', 'S'], concentration: false, ritual: false }
  }

  const clean = spellName.trim()
  if (SRD_SPELL_METADATA[clean]) {
    return SRD_SPELL_METADATA[clean]
  }

  // Case-insensitive lookup
  const lower = clean.toLowerCase()
  for (const [key, meta] of Object.entries(SRD_SPELL_METADATA)) {
    if (key.toLowerCase() === lower) {
      return meta
    }
  }

  // Heuristic deduction for homebrew or custom spells
  const isConcentration = lower.includes('aura') ||
    lower.includes('halo') ||
    lower.includes('veil') ||
    lower.includes('bless') ||
    lower.includes('bane') ||
    lower.includes('hold') ||
    lower.includes('dominate') ||
    lower.includes('invisib') ||
    lower.includes('fly') ||
    lower.includes('wall of') ||
    lower.includes('sphere') ||
    lower.includes('cloud') ||
    lower.includes('investiture') ||
    lower.includes('polymorph')

  const isRitual = lower.includes('alarm') ||
    lower.includes('detect') ||
    lower.includes('identify') ||
    lower.includes('comprehend') ||
    lower.includes('divination') ||
    lower.includes('commune') ||
    lower.includes('ritual') ||
    lower.includes('unseen') ||
    lower.includes('familiar')

  const school = lower.includes('ward') || lower.includes('shield') || lower.includes('protect') || lower.includes('abjur') || lower.includes('sanctuary') || lower.includes('veil') || lower.includes('banish')
    ? 'Abjuration'
    : lower.includes('heal') || lower.includes('bolt') || lower.includes('blast') || lower.includes('fire') || lower.includes('lightning') || lower.includes('ray') || lower.includes('flame') || lower.includes('javelin')
    ? 'Evocation'
    : lower.includes('teleport') || lower.includes('summon') || lower.includes('step') || lower.includes('gate') || lower.includes('fog')
    ? 'Conjuration'
    : lower.includes('see') || lower.includes('detect') || lower.includes('sight') || lower.includes('scry') || lower.includes('true')
    ? 'Divination'
    : lower.includes('charm') || lower.includes('suggest') || lower.includes('command') || lower.includes('sleep') || lower.includes('fear')
    ? 'Enchantment'
    : lower.includes('illusion') || lower.includes('image') || lower.includes('invisib') || lower.includes('shadow') || lower.includes('disguise')
    ? 'Illusion'
    : lower.includes('death') || lower.includes('life') || lower.includes('necro') || lower.includes('decay') || lower.includes('blight') || lower.includes('wounds')
    ? 'Necromancy'
    : 'Transmutation'

  return {
    school,
    components: ['V', 'S'],
    concentration: isConcentration,
    ritual: isRitual,
  }
}

/**
 * Returns formatted tags string for a spell (e.g. "[V, S, M, C]")
 */
export function getSpellTagString(spellName: string): string {
  const meta = getSpellMetadata(spellName)
  const tags: string[] = [...meta.components]
  if (meta.concentration) tags.push('C')
  if (meta.ritual) tags.push('R')
  return tags.join(', ')
}
