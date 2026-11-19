import { expect, test } from '@playwright/test'

import { adminAuthHeader } from './admin'

/**
 * Pictures placed between paragraphs must show on the article page.
 *
 * Articles carry in-text pictures as Lexical `upload` nodes, which reach the
 * page as bare media ids (live post 133: three of them), and the page showed
 * none of them, only the cover.
 *
 * Four pictures go in: one with alt, one without, a PDF and one whose media is
 * deleted. Only the first two may come out, each at its place, next to the
 * mediaBlock picture that already rendered, and the page must still answer 200.
 */

const SLUG = 'inline-images-spec'

// 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\n' +
    'trailer<</Root 1 0 R>>\n%%EOF\n',
)

const text = (value: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})
const paragraph = (value: string) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  children: [text(value)],
})
const upload = (id: number) => ({
  type: 'upload',
  version: 3,
  format: '',
  relationTo: 'media',
  value: id,
  fields: null,
})
const mediaBlock = (id: number) => ({
  type: 'block',
  version: 2,
  format: '',
  fields: { blockType: 'mediaBlock', blockName: '', media: id },
})

const ALT = 'A "quoted" picture'

let adminAuth: string
const mediaIds: number[] = []
let postId: number | undefined

test.afterAll(async ({ request }) => {
  const headers = { Authorization: adminAuth }
  if (postId) await request.delete(`/api/posts/${postId}`, { headers })
  for (const id of mediaIds) await request.delete(`/api/media/${id}`, { headers })
})

test('the article page shows each in-text picture between its paragraphs', async ({ request }) => {
  adminAuth = await adminAuthHeader(request)
  const headers = { Authorization: adminAuth }

  const addMedia = async (name: string, mimeType: string, buffer: Buffer, alt?: string) => {
    const res = await request.post('/api/media', {
      headers,
      multipart: { file: { name, mimeType, buffer }, _payload: JSON.stringify(alt ? { alt } : {}) },
    })
    expect(res.ok(), await res.text()).toBe(true)
    const id: number = (await res.json()).doc.id
    mediaIds.push(id)
    return id
  }

  const withAlt = await addMedia('inline-images-spec-a.png', 'image/png', PNG, ALT)
  const noAlt = await addMedia('inline-images-spec-b.png', 'image/png', PNG)
  const pdf = await addMedia('inline-images-spec.pdf', 'application/pdf', PDF, 'a document')
  const gone = await addMedia('inline-images-spec-gone.png', 'image/png', PNG, 'deleted')

  const post = await request.post('/api/posts', {
    headers,
    data: {
      title: 'INLINE IMAGES SPEC',
      _status: 'published',
      slug: SLUG,
      content: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            paragraph('P-ONE'),
            upload(withAlt),
            paragraph('P-TWO'),
            upload(noAlt),
            paragraph('P-THREE'),
            upload(pdf),
            upload(gone),
            mediaBlock(withAlt),
            paragraph('P-FOUR'),
          ],
        },
      },
    },
  })
  expect(post.status(), await post.text()).toBe(201)
  postId = (await post.json()).doc.id

  const del = await request.delete(`/api/media/${gone}`, { headers })
  expect(del.ok(), await del.text()).toBe(true)
  mediaIds.splice(mediaIds.indexOf(gone), 1)

  const page = await request.get(`/blog/${SLUG}`)
  expect(page.status()).toBe(200)
  const html = await page.text()

  // The article body (RichText's article-prose div) up to its last paragraph;
  // the head may repeat the text in a description.
  const start = html.indexOf('article-prose')
  expect(start, 'article body').toBeGreaterThan(-1)
  const end = html.indexOf('P-FOUR', start)
  expect(end, 'last paragraph').toBeGreaterThan(start)
  const article = html.slice(start, end)

  const imgs = article.match(/<img\b[^>]*>/g) ?? []
  expect(imgs, 'two in-text pictures and the mediaBlock one').toHaveLength(3)

  const [first = '', second = '', third = ''] = imgs
  const alt = (tag: string) => tag.match(/\balt="([^"]*)"/)?.[1]
  expect(alt(first)).toBe('A &quot;quoted&quot; picture')
  expect(alt(second)).toBe('')
  expect(alt(third)).toBe('A &quot;quoted&quot; picture')
  for (const tag of imgs) {
    expect(tag).toMatch(/\bwidth="\d+"/)
    expect(tag).toMatch(/\bheight="\d+"/)
  }

  // Each at its place between the paragraphs.
  const at = (s: string) => article.indexOf(s)
  expect(at(first)).toBeLessThan(at('P-TWO'))
  expect(at(second)).toBeGreaterThan(at('P-TWO'))
  expect(at(second)).toBeLessThan(at('P-THREE'))
  expect(article.lastIndexOf('<img')).toBeGreaterThan(at('P-THREE'))
})
