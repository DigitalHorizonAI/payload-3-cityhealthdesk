// In-text pictures (Lexical `upload` nodes) on article pages: which media to
// read, and which docs may render. Run: node --test tests/inline-media.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

// A namespace import, so a missing export fails its own tests instead of the whole file.
import * as M from '../src/components/RichText/inlineMedia.ts'

const media = (id, extra = {}) => ({
  id,
  url: `/api/media/file/p${id}.webp`,
  alt: `Picture ${id}`,
  mimeType: 'image/webp',
  width: 1408,
  height: 768,
  ...extra,
})
const para = (text) => ({ type: 'paragraph', children: [{ type: 'text', text }] })
const upload = (value) => ({ type: 'upload', relationTo: 'media', value, fields: null })
const body = (...children) => ({ root: { children } })

// A stand-in for the Payload local API: records each find, logs errors.
const fakePayload = (find) => {
  const calls = []
  const errors = []
  return {
    calls,
    errors,
    find: async (args) => {
      calls.push(args)
      return find(args)
    },
    logger: { error: (...args) => errors.push(args) },
  }
}

test('uploadIds lists each bare id once and skips populated docs', () => {
  const content = body(upload(134), para('x'), upload(media(9)), upload(134), upload('135'))
  assert.deepEqual(M.uploadIds(content), [134, '135'])
  assert.deepEqual(M.uploadIds(null), [])
  assert.deepEqual(M.uploadIds(body(para('no pictures'))), [])
})

test('all pictures of an article are read in one media query', async () => {
  const payload = fakePayload(() => ({ docs: [media(134), media(135)] }))
  const docs = await M.readInlineMedia(payload, body(upload(134), para('x'), upload(135)))
  assert.deepEqual(
    docs.map((d) => d.id),
    [134, 135],
  )
  assert.equal(payload.calls.length, 1)
  assert.deepEqual(payload.calls[0], {
    collection: 'media',
    where: { id: { in: [134, 135] } },
    depth: 0,
    pagination: false,
  })
})

test('an article without pictures makes no query', async () => {
  const payload = fakePayload(() => assert.fail('no query expected'))
  assert.deepEqual(await M.readInlineMedia(payload, body(para('x'))), [])
  assert.equal(payload.calls.length, 0)
})

test('a failed media read is logged and the article goes on without pictures', async () => {
  const payload = fakePayload(() => {
    throw new Error('connection terminated')
  })
  assert.deepEqual(await M.readInlineMedia(payload, body(upload(134))), [])
  assert.equal(payload.errors.length, 1)
})

test('a bare id resolves to its media doc', () => {
  assert.equal(M.inlineImage(134, [media(135), media(134)]).id, 134)
  assert.equal(M.inlineImage('134', [media(134)]).id, 134)
})

test('a populated doc is used as-is', () => {
  assert.equal(M.inlineImage(media(7), []).id, 7)
})

test('deleted media (no doc for the id) renders nothing', () => {
  assert.equal(M.inlineImage(999, [media(134)]), null)
  assert.equal(M.inlineImage(null, []), null)
  assert.equal(M.inlineImage(undefined, []), null)
})

test('media without alt still renders (ImageMedia writes alt="")', () => {
  assert.equal(M.inlineImage(1, [media(1, { alt: null })]).id, 1)
})

test('a non-image upload renders nothing', () => {
  assert.equal(M.inlineImage(2, [media(2, { mimeType: 'application/pdf' })]), null)
  assert.equal(M.inlineImage(2, [media(2, { mimeType: null })]), null)
})

test('only a same-origin path may serve the picture', () => {
  for (const url of [
    'https://elsewhere.test/a.webp',
    '//elsewhere.test/a.webp',
    'javascript:alert(1)',
    '',
    null,
  ]) {
    assert.equal(M.inlineImage(3, [media(3, { url })]), null, String(url))
  }
})

test('no width or height renders nothing (next/image would throw)', () => {
  assert.equal(M.inlineImage(4, [media(4, { width: null })]), null)
  assert.equal(M.inlineImage(4, [media(4, { height: 0 })]), null)
})
