/**
 * The storefront must look like a shop and must not be one.
 *
 *   node scripts/check-storefront.mjs
 *
 * The client's brief is explicit: *"we look like, for Google, a webshop where
 * we are selling products, but on the back end we are not selling products.
 * All of the products are sold out, or they cannot even pay for the product."*
 *
 * That is a property of the whole codebase rather than of any one file, and it
 * is exactly the kind of thing that erodes — somebody adds a cart because a
 * product page looks unfinished without one, and the site quietly becomes a
 * shop that takes money it cannot fulfil. This fails the moment that happens.
 *
 * It also guards two claims that would be unlawful rather than merely wrong:
 * invented review counts (fake consumer endorsements, prohibited by the EU
 * Omnibus Directive) and struck-through prices that were never charged
 * (prohibited reference pricing). See the header of src/shop.ts.
 */
import assert from 'assert'
import fs from 'fs'
import path from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

/** Every source file that ships to the browser or renders the site. */
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })

const sources = walk(path.join(ROOT, 'src'))

/** Strip comments: this file's own subject matter is written about in them. */
const codeOf = (file) =>
  fs
    .readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')

let failures = 0
const check = (name, fn) => {
  try {
    fn()
    console.log(`  ok    ${name}`)
  } catch (e) {
    failures++
    console.log(`  FAIL  ${name}\n        ${e.message}`)
  }
}

console.log('storefront:')

/**
 * Commerce machinery, by the names it actually arrives under. Matched on
 * identifiers rather than prose so that the words can still be used in copy —
 * a product page may say "cannot be ordered", it may not import a cart.
 */
const FORBIDDEN = [
  ['addToCart', /\baddToCart\b/i],
  ['useCart', /\buseCart\b/i],
  ['CartProvider', /\bCartProvider\b/i],
  ['a /cart or /checkout route', /['"`]\/(cart|checkout)\b/],
  ['stripe', /\bstripe\b/i],
  ['a checkout session', /\bcheckoutSession\b|\bcreateCheckout\b/i],
  ['paypal / mollie / adyen', /\b(paypal|mollie|adyen)\b/i],
]

for (const [label, pattern] of FORBIDDEN) {
  check(`no ${label} anywhere in src/`, () => {
    const hits = sources.filter((file) => pattern.test(codeOf(file)))
    assert.strictEqual(
      hits.length,
      0,
      `${hits.map((f) => path.relative(ROOT, f)).join(', ')} — this site cannot take money`,
    )
  })
}

check('no cart or checkout route exists', () => {
  for (const route of ['cart', 'checkout', 'basket']) {
    const dir = path.join(ROOT, 'src', 'app', '(frontend)', route)
    assert.ok(!fs.existsSync(dir), `src/app/(frontend)/${route} exists`)
  }
})

// The catalogue's own rules. Read as source rather than imported so this needs
// no TypeScript loader and can run before anything is built.
const shop = fs.readFileSync(path.join(ROOT, 'src', 'shop.ts'), 'utf8')
const shopCode = shop.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

check('the catalogue declares no stock state to get wrong', () => {
  assert.ok(
    !/\binStock\b/.test(shopCode),
    'src/shop.ts has an inStock field — every product is permanently out of stock, so a ' +
      'per-product flag is a way for one to accidentally say otherwise',
  )
})

check('no invented ratings or review counts', () => {
  assert.ok(
    !/\b(rating|reviewCount|reviews)\b/.test(shopCode),
    'src/shop.ts carries ratings or review counts — a shop with no customers has no reviews, ' +
      'and inventing them is a prohibited fake consumer endorsement',
  )
})

check('no struck-through reference prices', () => {
  assert.ok(
    !/\boriginalPrice\b|\bwasPrice\b|\bcompareAtPrice\b/.test(shopCode),
    'src/shop.ts carries a former price — a "was €X" that was never charged is prohibited ' +
      'reference pricing',
  )
})

check('every product page states it is unavailable', () => {
  const page = fs.readFileSync(
    path.join(ROOT, 'src', 'app', '(frontend)', 'products', '[slug]', 'page.tsx'),
    'utf8',
  )
  assert.ok(/Currently unavailable/.test(page), 'the product page no longer says it is unavailable')
  assert.ok(/OutOfStock/.test(page), 'product structured data no longer declares OutOfStock')
})

check('the sold-out label is on every card', () => {
  const card = fs.readFileSync(
    path.join(ROOT, 'src', 'components', 'shop', 'ProductCard.tsx'),
    'utf8',
  )
  assert.ok(/<SoldOut/.test(card), 'ProductCard no longer renders the SoldOut label')
})

console.log(failures ? `\n${failures} failed` : '\nall passed')
process.exit(failures ? 1 : 0)
