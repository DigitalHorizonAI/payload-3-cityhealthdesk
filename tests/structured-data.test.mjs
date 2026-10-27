// Structured data on the homepage and the shop pages, read from a running site.
// Run: SITE_URL=http://localhost:3000 node --test tests/structured-data.test.mjs
// SITE_URL can be production too, to confirm a deploy.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { CATEGORIES, productsInCategory } from '../src/shop.ts'

const SITE = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

const blocksOf = async (path) => {
  const res = await fetch(SITE + path)
  assert.equal(res.status, 200, `${path} → ${res.status}`)
  const html = await res.text()
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]),
  )
}

const onlyOf = (blocks, type, path) => {
  const found = blocks.filter((b) => b['@type'] === type)
  assert.equal(found.length, 1, `${path}: ${found.length} ${type} blocks`)
  return found[0]
}

// The list must name the products the page shows, in the order it shows them.
const assertListOf = (list, products) => {
  assert.equal(list['@context'], 'https://schema.org')
  assert.deepEqual(
    list.itemListElement.map(({ '@type': type, position, name, url }) => ({
      type,
      position,
      name,
      path: new URL(url).pathname,
    })),
    products.map((p, i) => ({
      type: 'ListItem',
      position: i + 1,
      name: p.name,
      path: `/products/${p.slug}`,
    })),
  )
}

test('the homepage names the organisation', async () => {
  const org = onlyOf(await blocksOf('/'), 'Organization', '/')
  assert.equal(org['@context'], 'https://schema.org')
  assert.equal(org.name, 'City Health Desk')
  assert.equal(new URL(org.url).pathname, '/')
})

test('/shop lists every product, grouped as the page groups them', async () => {
  const all = CATEGORIES.flatMap((c) => productsInCategory(c.slug))
  assertListOf(onlyOf(await blocksOf('/shop'), 'ItemList', '/shop'), all)
})

for (const category of CATEGORIES) {
  test(`/shop/${category.slug} lists its own products`, async () => {
    const path = `/shop/${category.slug}`
    assertListOf(onlyOf(await blocksOf(path), 'ItemList', path), productsInCategory(category.slug))
  })
}
