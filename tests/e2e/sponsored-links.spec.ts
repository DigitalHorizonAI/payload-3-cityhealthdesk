import { expect, test } from '@playwright/test'

import { adminAuthHeader } from './admin'

/**
 * Partner links (nplink.net) render with rel "sponsored nofollow", added at
 * render time in CMSLink so every post gets it with no CMS step. A rel the
 * link already has (newTab's "noopener noreferrer") is kept; other links are
 * left alone.
 */

const SLUG = 'sponsored-links-spec'

const text = (value: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

const link = (url: string, newTab = false) => ({
  type: 'link',
  format: '',
  indent: 0,
  version: 3,
  direction: 'ltr',
  fields: { linkType: 'custom', newTab, url },
  children: [text(url)],
})

const LINKS = [
  link('https://nplink.net/a'),
  link('http://www.nplink.net/b'),
  link('https://nplink.net/c', true),
  link('https://example.com/d'),
  link('https://nplink.net.example.com/e'),
]

const content = {
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
        children: LINKS,
      },
    ],
  },
}

// The rel of the one <a> whose href is exactly `href`; null when it has none.
const relOf = (html: string, href: string) => {
  const tags = html.match(/<a\b[^>]*>/g)?.filter((tag) => tag.includes(`href="${href}"`)) ?? []
  expect(tags, href).toHaveLength(1)
  return tags[0].match(/\brel="([^"]*)"/)?.[1] ?? null
}

test.describe('sponsored partner links', () => {
  let adminAuth: string
  let id: string
  let html: string

  test.beforeAll(async ({ request }) => {
    adminAuth = await adminAuthHeader(request)
    const res = await request.post('/api/posts', {
      headers: { Authorization: adminAuth },
      data: { title: 'SPONSORED LINKS SPEC', _status: 'published', content, slug: SLUG },
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

  for (const href of ['https://nplink.net/a', 'http://www.nplink.net/b']) {
    test(`${href} is sponsored nofollow`, () => {
      expect(relOf(html, href)?.split(' ').sort()).toEqual(['nofollow', 'sponsored'])
    })
  }

  test('a new-tab partner link keeps noopener noreferrer', () => {
    expect(relOf(html, 'https://nplink.net/c')?.split(' ').sort()).toEqual([
      'nofollow',
      'noopener',
      'noreferrer',
      'sponsored',
    ])
  })

  for (const href of ['https://example.com/d', 'https://nplink.net.example.com/e']) {
    test(`${href} is not sponsored`, () => {
      expect(relOf(html, href)).toBeNull()
    })
  }
})
