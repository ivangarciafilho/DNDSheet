export interface CadenceDefinition {
  id: string; label: string; compact: string; category: string
  kind: 'interval' | 'event' | 'rest' | 'special'; help: string
}
const cadence = (id: string, label: string, compact: string, category: string, kind: CadenceDefinition['kind'], help: string): CadenceDefinition => ({ id, label, compact, category, kind, help })
/** Recovery vocabulary only. Availability, triggers and encounter resource consumption remain separate. */
export const CADENCES: readonly CadenceDefinition[] = [
  cadence('MINUTE','1 minute','Minute','Time intervals','interval','Recovery interval of one minute.'),
  cadence('TEN_MINUTES','10 minutes','10 Minutes','Time intervals','interval','Recovery interval of ten minutes.'),
  cadence('HOUR','Hourly','Hour','Time intervals','interval','Recovery interval of one hour.'),
  cadence('DAY','Daily','Day','Time intervals','interval','Uses available per day.'),
  cadence('DAY_EACH','Daily, each','Day Each','Time intervals','interval','Each listed option has its own daily uses.'),
  cadence('WEEKLY','Weekly','Week','Time intervals','interval','Uses available per week.'),
  cadence('MONTHLY','Monthly','Month','Time intervals','interval','Uses available per month.'),
  cadence('DAWN','Dawn','Dawn','Solar cycle','event','Recovery at dawn; not an elapsed 24-hour interval.'),
  cadence('DUSK','Dusk','Dusk','Solar cycle','event','Recovery at dusk.'),
  cadence('MIDDAY','Midday','Midday','Solar cycle','event','Recovery at midday.'),
  cadence('MIDNIGHT','Midnight','Midnight','Solar cycle','event','Recovery at midnight.'),
  cadence('SHORT_REST','Short Rest','Short Rest','Rest and recovery','rest','Recovery after a Short Rest. One use prints as Short Rest.'),
  cadence('LONG_REST','Long Rest','Long Rest','Rest and recovery','rest','Recovery after a Long Rest.'),
  cadence('LONG_OR_SHORT','Short or Long Rest','Short or Long Rest','Rest and recovery','rest','Recovery after either rest; not two separate resource pools.'),
  cadence('DOWNTIME','Downtime','Downtime','Rest and recovery','event','Authored recovery during downtime; the tool does not advance a campaign clock.'),
  cadence('WHILE_BLOODIED','While bloodied','While Bloodied','Combat states','event','Available or active while the creature is bloodied (at or below half HP).'),
  cadence('WHEN_BLOODIED','When bloodied','When Bloodied','Combat states','event','Triggers or recovers when the creature first becomes bloodied.'),
  cadence('AT_0_HP','At 0 hit points','At 0 HP','Combat states','event','Triggers or becomes active when reduced to 0 hit points.'),
  cadence('AT_1_HP','At 1 hit point','At 1 HP','Combat states','event','Triggers or becomes active when reduced to 1 hit point or survives at 1 HP.'),
  cadence('BLOODIED','Bloodied','Bloodied','Combat states','event','Recovery on becoming bloodied. This is not a bloodied-only availability restriction and does not automate combat.'),
  cadence('INITIATIVE','Initiative','Initiative','Combat events','event','Recovery at the authored initiative milestone.'),
  ...[['TURN','Turn'],['ROUND','Round'],['START_OF_ITS_TURN','Start of its turn'],['START_OF_A_TURN','Start of a turn'],['END_OF_ITS_TURN','End of its turn'],['END_OF_A_TURN','End of a turn'],['END_OF_CURRENT_TURN','End of current turn']].map(([id,label]) => cadence(id,label,label,'Turn boundaries','event',`Uses recover at the authored ${label.toLowerCase()} boundary.`)),
  cadence('HIDDEN','Hidden','','Special','special','Cadence label is hidden on the statblock.'),
  cadence('AT_WILL','At Will','At Will','Special','special','No limited-use resource.'),
  cadence('RECHARGE','Recharge roll','Recharge','Special','special','Use the recharge-roll editor for a roll range.'),
]
const aliases: Readonly<Record<string,string>> = {
  SHORT:'SHORT_REST', LONG:'LONG_REST', REST:'LONG_OR_SHORT', SHORT_OR_LONG_REST:'LONG_OR_SHORT',
  START_OF_YOUR_TURN:'START_OF_ITS_TURN', START_OF_CREATURE_TURN:'START_OF_A_TURN',
  END_OF_YOUR_TURN:'END_OF_ITS_TURN', END_OF_CREATURE_TURN:'END_OF_A_TURN',
  HOURLY:'HOUR', '10_MINUTES':'TEN_MINUTES', '1_MINUTE':'MINUTE',
  WHILEBLOODIED:'WHILE_BLOODIED', WHENBLOODIED:'WHEN_BLOODIED',
  AT_0_HIT_POINTS:'AT_0_HP', AT_1_HIT_POINT:'AT_1_HP',
}
export function cadenceDefinition(value: string): CadenceDefinition | undefined {
  const id = value.trim().toUpperCase()
  return CADENCES.find(item => item.id === (aliases[id] || id))
}
export function cadenceOptions(saved: string) {
  const options = CADENCES.filter(item => item.id !== 'RECHARGE' && item.id !== 'AT_WILL').map(item => ({ value:item.id,label:item.label,category:item.category,help:item.help }))
  if (saved && !options.some(item => item.value === saved)) options.push({value:saved,label:`${cadenceDefinition(saved)?.label || saved} (saved)`,category:'Saved values',help:'Retains the saved cadence ID without silently rewriting it.'})
  return options.sort((a,b)=>a.category.localeCompare(b.category,'en') || a.label.localeCompare(b.label,'en'))
}
export function formatLimitedUses(count: number, rate: string): string {
  if (!(count > 0) || !rate.trim()) return ''
  const definition = cadenceDefinition(rate)
  const label = definition?.compact || rate.trim()
  return count === 1 && definition?.kind === 'rest' ? label : `${count}/${label}`
}
