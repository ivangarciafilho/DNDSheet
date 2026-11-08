import assert from 'node:assert/strict'
import test from 'node:test'
import { creatureTypeLine } from '../../src/core/domain/export-markup.ts'

test('alignment follows the type after a comma', () => {
  assert.equal(creatureTypeLine('Large', 'dragon', 'chaotic evil'), 'Large dragon, chaotic evil')
})

test('an empty alignment leaves no dangling comma', () => {
  assert.equal(creatureTypeLine('Medium', 'humanoid', ''), 'Medium humanoid')
  assert.equal(creatureTypeLine('Medium', 'humanoid', '   '), 'Medium humanoid')
  assert.equal(creatureTypeLine('Medium', 'humanoid', undefined), 'Medium humanoid')
})

test('missing size or type collapses cleanly', () => {
  assert.equal(creatureTypeLine('', 'ooze', 'unaligned'), 'ooze, unaligned')
  assert.equal(creatureTypeLine('Tiny', '', ''), 'Tiny')
})
