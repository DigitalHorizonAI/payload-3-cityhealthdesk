import { expect, test } from '@playwright/test'

import { adminAuthHeader } from './admin'

/**
 * Look-alike articles folded into one each (src/utilities/mergedArticles.js).
 *
 * A merged article must leave every trace a crawler or reader can follow: its
 * address answers 301 to the article it was merged into, and it is gone from
 * the sitemap and the blog listing. The article it was merged into keeps
 * answering 200 and names itself as canonical.
 *
 * The pairs are written out here again rather than imported, so a typo in the
 * list itself fails this spec instead of being copied into it.
 */

const EXPECTED: Record<string, string> = {
  'eating-healthy-near-me': 'healthy-eating-near-me',
  'methods-for-stress-management': 'method-of-stress-management',
  'methods-of-stress-management': 'method-of-stress-management',
  'stress-management-method': 'method-of-stress-management',
  'stress-management-methods': 'method-of-stress-management',
  'stress-management-technique': 'method-of-stress-management',
  'stress-management-techniques': 'method-of-stress-management',
  'techniques-for-stress-management': 'method-of-stress-management',
  'ways-of-stress-management': 'method-of-stress-management',
  'stress-management': 'method-of-stress-management',
  'heart-healthy-eating': 'healthy-eating-for-a-healthy-heart',
}

const WINNER = 'healthy-eating-for-a-healthy-heart'
const LOSER = 'heart-healthy-eating'

const lexical = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      },
    ],
  },
})

test.describe('merged look-alike articles', () => {
  let adminAuth: string
  const created: string[] = []

  test.beforeAll(async ({ request }) => {
    adminAuth = await adminAuthHeader(request)

    // Both published, so without the merge the loser would be listed and live.
    for (const slug of [WINNER, LOSER]) {
      const res = await request.post('/api/posts', {
        headers: { Authorization: adminAuth },
        data: { title: `MERGE SPEC — ${slug}`, _status: 'published', content: lexical('body'), slug },
      })
      expect(res.status()).toBe(201)
      const { doc } = await res.json()
      expect(doc.slug).toBe(slug)
      created.push(doc.id)
    }
  })

  test.afterAll(async ({ request }) => {
    for (const id of created) {
      await request.delete(`/api/posts/${id}`, { headers: { Authorization: adminAuth } })
    }
  })

  test('every merged address answers 301 to the article it was merged into', async ({
    request,
  }) => {
    for (const [loser, winner] of Object.entries(EXPECTED)) {
      const res = await request.get(`/blog/${loser}`, { maxRedirects: 0 })
      expect(res.status(), loser).toBe(301)
      expect(new URL(res.headers()['location'], 'http://x').pathname, loser).toBe(`/blog/${winner}`)
    }
  })

  test('a published merged article is absent from the sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()
    expect(xml).toContain(`/blog/${WINNER}<`)
    expect(xml).not.toContain(`/blog/${LOSER}<`)
  })

  test('a published merged article is absent from the blog listing', async ({ request }) => {
    const html = await (await request.get('/blog')).text()
    expect(html).toContain(`/blog/${WINNER}"`)
    expect(html).not.toContain(`/blog/${LOSER}"`)
  })

  test('the article it was merged into answers 200 with a self-canonical', async ({ request }) => {
    const res = await request.get(`/blog/${WINNER}`, { maxRedirects: 0 })
    expect(res.status()).toBe(200)

    const html = await res.text()
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    expect(canonical, 'a canonical link is present').toBeTruthy()
    expect(new URL(canonical!).pathname).toBe(`/blog/${WINNER}`)
  })
})
