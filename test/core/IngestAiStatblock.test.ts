import test from 'node:test'
import assert from 'node:assert'
import { extractJsonFromText, ingestAiStatblock } from '../../src/core/usecases/IngestAiStatblock.ts'

test('IngestAiStatblock - Markdown fenced JSON with commentary', () => {
  const llmResponse = `
Here is the CR 5 elemental monster you requested!

\`\`\`json
{
  "name": "Cinder Wisp",
  "size": "Small",
  "type": "elemental",
  "alignment": "Chaotic Neutral",
  "AC": 14,
  "HP": { "HD": 8, "type": 6, "modifier": 16 },
  "CR": 5,
  "proficiency": 3,
  "attacks": [
    {
      "id": "atk-1",
      "name": "Ember Touch",
      "distance": "MELEE",
      "kind": "WEAPON",
      "modifier": { "stat": "DEX", "proficient": true, "override": false, "overrideValue": 0 },
      "damage": { "dice": 6, "count": 2, "modifier": { "stat": "DEX", "override": false, "overrideValue": 0 }, "type": "fire" },
      "range": { "standard": 5, "long": 5, "reach": 5 },
      "targets": 1
    }
  ],
  "multiattacks": [
    {
      "id": "ma-1",
      "name": "Multiattack",
      "attacks": ["atk-1", "non-existent-attack-id"],
      "actions": []
    }
  ]
}
\`\`\`

Hope you find this creature useful in your next encounter!
  `

  const extracted = extractJsonFromText(llmResponse)
  assert.ok(extracted.startsWith('{'))
  assert.ok(extracted.endsWith('}'))

  const result = ingestAiStatblock(llmResponse)
  assert.strictEqual(result.success, true)
  assert.ok(result.monster)
  assert.strictEqual(result.monster.name, 'Cinder Wisp')
  assert.strictEqual(result.monster.saveVersion, 11) // auto-migrated
  assert.strictEqual(result.issuesFixed, 1) // pruned orphan "non-existent-attack-id"
  assert.deepStrictEqual(result.monster.multiattacks[0].attacks, ['atk-1'])
})

test('IngestAiStatblock - Invalid JSON input gracefully fails', () => {
  const badInput = 'This is just regular text with no json inside.'
  const result = ingestAiStatblock(badInput)
  assert.strictEqual(result.success, false)
  assert.ok(result.error?.includes('Unexpected token') || result.error?.includes('not valid JSON'))
})
