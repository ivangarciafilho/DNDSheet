import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useTokens() {
  const { t } = useI18n()

  // token definitions
  const saveTokens = computed(() => [
    {
      label: t('monster.stat.STR'),
      token: '{DC:STR}',
    },
    {
      label: t('monster.stat.DEX'),
      token: '{DC:DEX}',
    },
    {
      label: t('monster.stat.CON'),
      token: '{DC:CON}',
    },
    {
      label: t('monster.stat.INT'),
      token: '{DC:INT}',
    },
    {
      label: t('monster.stat.WIS'),
      token: '{DC:WIS}',
    },
    {
      label: t('monster.stat.CHA'),
      token: '{DC:CHA}',
    },
  ])

  const attackTokens = computed(() => [
    {
      label: t('monster.stat.STR'),
      token: '{A:STR}',
    },
    {
      label: t('monster.stat.DEX'),
      token: '{A:DEX}',
    },
    {
      label: t('monster.stat.CON'),
      token: '{A:CON}',
    },
    {
      label: t('monster.stat.INT'),
      token: '{A:INT}',
    },
    {
      label: t('monster.stat.WIS'),
      token: '{A:WIS}',
    },
    {
      label: t('monster.stat.CHA'),
      token: '{A:CHA}',
    },
  ])

  const monsterTokens = computed(() => [
    {
      label: t('monster.name'),
      token: '{monster.name}',
    },
    {
      label: t('monster.proficiencyBonus'),
      token: '{monster.proficiency}',
    },
    {
      label: t('monster.ac'),
      token: '{monster.AC}',
    },
    {
      label: t('monster.hp.label'),
      token: '{monster.hp}',
    },
  ])

  const traitTokens = computed(() => [
    {
      label: t('monster.trait.name'),
      token: '{trait.name}',
    },
    {
      label: t('monster.trait.limitedUse.label'),
      token: '{trait.limitedUse}',
    },
    {
      label: t('monster.trait.limitedUse.count'),
      token: '{trait.limitedUse.count}',
    },
    {
      label: t('monster.trait.limitedUse.rate'),
      token: '{trait.limitedUse.rate}',
    },
  ])

  const spellTokens = computed(() => [
    {
      label: t('monster.spellcasting.level'),
      token: '{spellcasting.level}',
    },
    {
      label: t('editor.spellcasting.slot.levelOrdinal'),
      token: '{spellcasting.ordinal}',
    },
    {
      label: t('monster.spellcasting.class'),
      token: '{spellcasting.class}',
    },
    {
      label: t('monster.spellcasting.ability'),
      token: '{spellcasting.stat}',
    },
    {
      label: t('monster.spellcasting.save'),
      token: '{spellcasting.save}',
    },
    {
      label: t('monster.spellcasting.attack'),
      token: '{spellcasting.attack}',
    },
    {
      label: t('monster.spellcasting.modifier'),
      token: '{spellcasting.modifier}',
    },
  ])

  // oops naming conflict
  const attackDamageTokens = computed(() => [
    {
      label: t('editor.attack.primary'),
      token: '{attack.damage}',
    },
    {
      label: t('editor.attack.distanceLabel'),
      token: '{attack.distance}',
    },
    {
      label: t('monster.attack.bonus'),
      token: '{attack.modifier}',
    },
    {
      label: t('monster.attack.targets'),
      token: '{attack.targets}',
    },
    {
      label: t('editor.attack.additional'),
      token: '{attack.additionalDamage}',
    },
    {
      label: t('editor.attack.conditional'),
      token: '{attack.conditionalDamage}',
    },
  ])

  const actionTokens = computed(() => [
    {
      label: t('monster.trait.name'),
      token: '{action.name}',
    },
    {
      label: t('monster.trait.limitedUse.label'),
      token: '{action.limitedUse}',
    },
    {
      label: t('monster.trait.limitedUse.count'),
      token: '{action.limitedUse.count}',
    },
    {
      label: t('monster.trait.limitedUse.rate'),
      token: '{action.limitedUse.rate}',
    },
    {
      label: t('monster.action.recharge'),
      token: '{action.recharge}',
    },
  ])

  const legendaryTokens = computed(() => [
    {
      label: t('editor.legendary.actionCount'),
      token: '{legendaryActions.count}',
    },
    {
      label: t('editor.legendary.count'),
      token: '{legendaryActions.actions}',
    },
  ])

  const abilityTokens = computed(() => [
    { label: 'STR Modifier ({STR_MOD})', token: '{STR_MOD}' },
    { label: 'DEX Modifier ({DEX_MOD})', token: '{DEX_MOD}' },
    { label: 'CON Modifier ({CON_MOD})', token: '{CON_MOD}' },
    { label: 'INT Modifier ({INT_MOD})', token: '{INT_MOD}' },
    { label: 'WIS Modifier ({WIS_MOD})', token: '{WIS_MOD}' },
    { label: 'CHA Modifier ({CHA_MOD})', token: '{CHA_MOD}' },
    { label: 'STR Score ({STR})', token: '{STR}' },
    { label: 'DEX Score ({DEX})', token: '{DEX}' },
    { label: 'CON Score ({CON})', token: '{CON}' },
    { label: 'INT Score ({INT})', token: '{INT}' },
    { label: 'WIS Score ({WIS})', token: '{WIS}' },
    { label: 'CHA Score ({CHA})', token: '{CHA}' },
  ])

  const formulaTokens = computed(() => [
    { label: 'Cantrip Tier ({CANTRIP_TIER})', token: '{CANTRIP_TIER}' },
    { label: 'Scaling Tier ({TIER})', token: '{TIER}' },
    { label: '1d10 + CHA ({1d10 + CHA_MOD})', token: '{1d10 + CHA_MOD}' },
    { label: '2d6 + STR ({2d6 + STR_MOD})', token: '{2d6 + STR_MOD}' },
    { label: '1d8 + DEX ({1d8 + DEX_MOD})', token: '{1d8 + DEX_MOD}' },
    { label: '1d6 + STR ({1d6 + STR_MOD})', token: '{1d6 + STR_MOD}' },
    { label: '2d8 + CON ({2d8 + CON_MOD})', token: '{2d8 + CON_MOD}' },
    { label: '3d6 Fire ({3d6})', token: '{3d6}' },
    { label: '4d10 Force ({4d10})', token: '{4d10}' },
  ])

  const deliveryTokens = computed(() => [
    { label: 'Melee Weapon Attack', token: 'Melee Weapon Attack: {A:STR} to hit, reach 5 ft., one target.' },
    { label: 'Ranged Weapon Attack', token: 'Ranged Weapon Attack: {A:DEX} to hit, range 80/320 ft., one target.' },
    { label: 'Melee Spell Attack', token: 'Melee Spell Attack: {spellcasting.attack} to hit, reach 5 ft., one target.' },
    { label: 'Ranged Spell Attack', token: 'Ranged Spell Attack: {spellcasting.attack} to hit, range 120 ft., one target.' },
    { label: 'DC Save Area Effect', token: 'Each creature in a 20-foot-radius sphere must make a {DC:DEX} saving throw.' },
  ])

  const conditionTokens = computed(() => [
    { label: 'Knocked Prone', token: 'and the target is knocked prone.' },
    { label: 'Grappled (escape {DC:STR})', token: 'and the target is grappled (escape {DC:STR}).' },
    { label: 'Restrained', token: 'and the target is restrained until the grapple ends.' },
    { label: 'Poisoned (1 min, {DC:CON})', token: 'must succeed on a {DC:CON} saving throw or be poisoned for 1 minute.' },
    { label: 'Frightened (1 min, {DC:WIS})', token: 'must succeed on a {DC:WIS} saving throw or be frightened until the end of its next turn.' },
    { label: 'Reactions Disabled', token: 'and cannot take reactions until the start of its next turn.' },
  ])

  return {
    attackTokens,
    saveTokens,
    monsterTokens,
    traitTokens,
    spellTokens,
    attackDamageTokens,
    actionTokens,
    legendaryTokens,
    abilityTokens,
    formulaTokens,
    deliveryTokens,
    conditionTokens,
  }
}
