// The meta description cut. Run: pnpm test:description
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { clampDescription } from '../src/utilities/clampDescription.ts'

// A live post's stored description, 230 characters.
const MELATONIN =
  "Struggling to sleep? Before you reach for melatonin, discover the potential melatonin side effects and hidden dangers the labels don't mention. Learn why a regulated, natural alternative may be the safer choice for restful nights."

const assertCutAtWord = (original, cut, max = 160) => {
  assert.ok(cut.length <= max, `${cut.length} > ${max}`)
  assert.ok(cut.endsWith('…'), cut)
  const kept = cut.slice(0, -1)
  assert.ok(original.startsWith(kept), cut)
  assert.match(kept, /[^\s\p{P}]$/u, 'ends on a letter, not a space or punctuation')
  assert.match(original.slice(kept.length), /^[\s\p{P}]/u, 'no word cut in half')
}

test('a long description is cut at a word, with … inside 160', () => {
  assert.equal(MELATONIN.length, 230)
  assertCutAtWord(MELATONIN, clampDescription(MELATONIN))
})

test('the cut keeps as many words as fit', () => {
  const cut = clampDescription(MELATONIN)
  assert.ok(cut.length >= 150, `${cut.length}: dropped more than one word`)
})

test('160 characters or fewer is untouched', () => {
  const exact = 'a'.repeat(150) + ' ' + 'b'.repeat(9)
  assert.equal(exact.length, 160)
  assert.equal(clampDescription(exact), exact)
  assert.equal(clampDescription('Short and fine.'), 'Short and fine.')
})

test('& and an apostrophe count as one character each, as a crawler counts them', () => {
  const text = "Tom's & Jerry's " + 'x'.repeat(144)
  assert.equal(text.length, 160)
  assert.equal(clampDescription(text), text)
  assertCutAtWord(text + ' more', clampDescription(text + ' more'))
})

test('runs of whitespace collapse before counting', () => {
  assert.equal(clampDescription('  one \n two\t three  '), 'one two three')
  const padded = 'word '.repeat(31) + '\n\n\n\n\n' // 154 characters once collapsed and trimmed
  assert.equal(clampDescription(padded), 'word '.repeat(31).trim())
})

test('a single word longer than 160 is hard-cut, never longer', () => {
  const cut = clampDescription('x'.repeat(300))
  assert.equal(cut.length, 160)
  assert.ok(cut.endsWith('…'))
})

test('nothing in, nothing out', () => {
  assert.equal(clampDescription(undefined), undefined)
  assert.equal(clampDescription(null), undefined)
  assert.equal(clampDescription(''), undefined)
})
