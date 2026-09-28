import { expect, test } from '@playwright/test'

import { adminAuthHeader } from './admin'

/**
 * Every published article must be reachable from /blog by a crawler: plain
 * `<a href>` links only, no JavaScript. The listing shows 12 per page, so with
 * more than 12 articles the rest are only reachable through the page links —
 * which used to be buttons, leaving every article past the first 12 orphaned.
 */

const COUNT = 14
const MERGED = 'heart-healthy-eating'
const slugs = Array.from({ length: COUNT }, (_, i) => `pagination-spec-${i + 1}`)

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

test.describe('blog pagination', () => {
  let adminAuth: string
  const created: string[] = []

  test.beforeAll(async ({ request }) => {
    adminAuth = await adminAuthHeader(request)

    for (const slug of [...slugs, MERGED]) {
      const res = await request.post('/api/posts', {
        headers: { Authorization: adminAuth },
        data: { title: `PAGINATION SPEC — ${slug}`, _status: 'published', content: lexical('body'), slug },
      })
      expect(res.status()).toBe(201)
      created.push((await res.json()).doc.id)
    }
  })

  test.afterAll(async ({ request }) => {
    for (const id of created) {
      await request.delete(`/api/posts/${id}`, { headers: { Authorization: adminAuth } })
    }
  })

  test('a crawler following plain links from /blog reaches every article', async ({ request }) => {
    const queue = ['/blog']
    const seen = new Set<string>()
    const linked = new Set<string>()

    while (queue.length) {
      const path = queue.shift()!
      if (seen.has(path)) continue
      seen.add(path)

      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
      const html = await res.text()

      for (const [, href] of html.matchAll(/href="(\/blog\/[^"]+)"/g)) {
        if (href.startsWith('/blog/page/')) queue.push(href)
        else linked.add(href.slice('/blog/'.length))
      }
    }

    for (const slug of slugs) expect(linked.has(slug), slug).toBe(true)
    expect(linked.has(MERGED), MERGED).toBe(false)
  })

  test('page 1 has one address: /blog/page/1 names /blog as canonical', async ({ request }) => {
    const html = await (await request.get('/blog/page/1')).text()
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    expect(canonical, 'a canonical link is present').toBeTruthy()
    expect(new URL(canonical!).pathname).toBe('/blog')
  })

  test('a page past the last one is a 404, not an empty listing', async ({ request }) => {
    expect((await request.get('/blog/page/999')).status()).toBe(404)
  })
})
