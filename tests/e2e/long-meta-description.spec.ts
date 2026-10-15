import { expect, test } from '@playwright/test'

import { adminAuthHeader } from './admin'

/**
 * A stored description over 160 characters is cut at render time, in every
 * tag that carries it, while the CMS keeps the full text.
 */

const SLUG = 'long-meta-description-spec'
const LONG =
  "Struggling to sleep? Before you reach for melatonin, discover the potential melatonin side effects and hidden dangers the labels don't mention. Learn why a regulated, natural alternative may be the safer choice for restful nights."

const decode = (s: string) =>
  s
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const metaContent = (html: string, attr: string) => {
  const tag = html.match(new RegExp(`<meta ${attr}[^>]*>`))?.[0]
  expect(tag, attr).toBeTruthy()
  return decode(tag!.match(/content="([^"]*)"/)![1])
}

test.describe('long meta descriptions', () => {
  let adminAuth: string
  let id: string
  let html: string

  test.beforeAll(async ({ request }) => {
    adminAuth = await adminAuthHeader(request)
    const res = await request.post('/api/posts', {
      headers: { Authorization: adminAuth },
      data: {
        title: 'LONG META DESCRIPTION SPEC',
        _status: 'published',
        slug: SLUG,
        content: 'A short body.',
        meta: { title: 'Long meta description spec', description: LONG },
      },
    })
    expect(res.status(), await res.text()).toBe(201)
    id = (await res.json()).doc.id

    const page = await request.get(`/blog/${SLUG}`)
    expect(page.status()).toBe(200)
    html = await page.text()
  })

  test.afterAll(async ({ request }) => {
    if (id) await request.delete(`/api/posts/${id}`, { headers: { Authorization: adminAuth } })
  })

  for (const attr of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
    test(`${attr} is cut to 160 at a word`, () => {
      const value = metaContent(html, attr)
      expect(value.length).toBeLessThanOrEqual(160)
      expect(value.endsWith('…')).toBe(true)
      expect(LONG.startsWith(value.slice(0, -1))).toBe(true)
    })
  }

  test('the JSON-LD description is cut the same way', () => {
    const json = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1]
    expect(json).toBeTruthy()
    const description = JSON.parse(json!.replace(/\\u003c/g, '<')).description as string
    expect(description.length).toBeLessThanOrEqual(160)
    expect(description).toBe(metaContent(html, 'name="description"'))
  })

  test('the CMS keeps the full text', async ({ request }) => {
    const res = await request.get(`/api/posts/${id}`, { headers: { Authorization: adminAuth } })
    expect((await res.json()).meta.description).toBe(LONG)
  })
})
