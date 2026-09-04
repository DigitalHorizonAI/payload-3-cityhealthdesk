/**
 * The site name is appended to a page title in exactly one place.
 *
 *   node scripts/check-meta-title.mjs
 *
 * It was appended in two, and every article on the live site carried the name
 * twice: "Insomnia: Causes, Signs & Solutions | City Health Desk | City Health
 * Desk". The SEO plugin's generateTitle writes the finished value into the
 * stored meta.title field; src/utilities/generateMeta.ts then appended it
 * again at render time. Neither half looks wrong on its own, which is why it
 * survived - so the invariant is asserted here rather than trusted.
 *
 * The stored meta.title IS the finished tag. Anything that renders a title
 * passes it through; only the write path composes it.
 */
import assert from 'assert'
import fs from 'fs'
import path from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })

/** Strip comments - this file's own subject matter gets written about in them. */
const codeOf = (file) =>
  fs
    .readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// The append, as it is actually written: a pipe and the name inside a template
// literal. A complete hand-typed title in src/shop.ts carries the name as plain
// text with no interpolation, and is not an append - it must not match.
const APPEND = '| ${SITE.name}'

const found = walk(path.join(ROOT, 'src'))
  .map((file) => [path.relative(ROOT, file), codeOf(file).split(APPEND).length - 1])
  .filter(([, count]) => count > 0)

const total = found.reduce((sum, [, count]) => sum + count, 0)

console.log('meta title:')
for (const [file, count] of found) console.log(`  ${count}x  ${file}`)

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

check('the site name is appended in exactly one place', () =>
  assert.strictEqual(total, 1, `appended in ${total} place(s): ${found.map(([f]) => f).join(', ')}`),
)

check('that place is the SEO plugin write path', () =>
  assert.ok(
    found.length === 1 && found[0][0].replace(/\\/g, '/') === 'src/plugins/index.ts',
    `expected src/plugins/index.ts, got ${found.map(([f]) => f).join(', ') || 'nothing'}`,
  ),
)

if (failures) {
  console.log(`\n${failures} failed.`)
  process.exit(1)
}
console.log('\nOK.')
