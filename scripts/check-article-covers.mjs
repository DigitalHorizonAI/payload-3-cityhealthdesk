/**
 * Every article must show a cover, and the accent colour must reach a pixel.
 *
 *   node scripts/check-article-covers.mjs
 *
 * ## Why this exists
 *
 * Articles arrive from the SEO content tool over the API, which sends `title`
 * and `content` and uploads no media. Both places that render a cover used to
 * key straight off `meta.image`, so a tool-published article showed an empty
 * grey panel on `/blog` and no image at all on its own page. With a hundred
 * articles that is the most visible thing on the site.
 *
 * `PostArt` is the fallback. The regression this guards is somebody deleting
 * that branch — which looks harmless in a diff, because today the blog is empty
 * and nothing appears to change.
 *
 * It also pins the other half of the same request: `--accent` was defined in
 * globals.css and rendered nowhere, so the palette's own colour was invisible.
 */
import assert from 'assert'
import fs from 'fs'
import path from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8')

/** Strip comments — this file's subject matter is discussed in them. */
const codeOf = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })

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

console.log('article covers:')

/**
 * The two components that render a cover panel. Both destructure the post's
 * `meta.image`; both must fall back rather than render nothing.
 */
const COVER_RENDERERS = [
  ['components/Card/index.tsx', 'the blog listing and homepage card'],
  ['heros/PostHero/index.tsx', 'the article page header'],
]

for (const [file, what] of COVER_RENDERERS) {
  check(`${what} falls back to PostArt`, () => {
    const code = codeOf(read('src', ...file.split('/')))
    assert.ok(/metaImage/.test(code), `${file} no longer reads meta.image — has the shape changed?`)
    assert.ok(
      /<PostArt\b/.test(code),
      `${file} renders no PostArt, so an article with no image shows an empty panel`,
    )
  })
}

check('no cover panel is left keyed on meta.image alone', () => {
  // A bare `metaImage && <Media/>` is the exact shape that produced the empty
  // box. The fallback requires a ternary, so a surviving `&&` is the bug back.
  const offenders = COVER_RENDERERS.filter(([file]) =>
    /metaImage\s*&&\s*typeof\s+metaImage\s*!==\s*'string'\s*&&/.test(
      codeOf(read('src', ...file.split('/'))),
    ),
  ).map(([file]) => file)

  assert.strictEqual(
    offenders.length,
    0,
    `still renders the cover conditionally with no fallback: ${offenders.join(', ')}`,
  )
})

check('PostArt varies its output', () => {
  const code = codeOf(read('src', 'components', 'PostArt.tsx'))
  const hues = code.match(/const HUES = \[([^\]]*)\]/)
  assert.ok(hues, 'PostArt no longer declares a HUES list')
  assert.ok(
    hues[1].split(',').filter((h) => h.trim()).length > 1,
    'PostArt has one hue, so every cover on a page would be identical — the ' +
      'failure ProductArt already documents',
  )
})

/**
 * This one is here because the bug it describes actually shipped, inside the
 * change that added PostArt, and produced the exact empty panel the component
 * exists to prevent. `hash` returns `>>> 0`, an unsigned 32-bit value; `>>` is
 * a SIGNED shift, so any slug hashing above 2^31 yielded a negative index and
 * `FIGURES[-2] === undefined` rendered nothing at all. Roughly half of slugs.
 *
 * Rather than re-implement the hash here (a copy proves nothing about the
 * original), assert the two properties that make the class of bug impossible:
 * no signed shift, and every index reduced modulo the array length.
 */
check('PostArt cannot select an out-of-range figure', () => {
  const code = codeOf(read('src', 'components', 'PostArt.tsx'))

  assert.ok(
    !/[^>]>>[^>]/.test(code),
    'PostArt uses a signed >> shift. `hash` is unsigned (>>> 0), so >> can go ' +
      'negative and index the FIGURES array out of range, rendering an empty ' +
      'panel. Derive the index by division instead.',
  )

  const indexed = [...code.matchAll(/FIGURES\[([^\]]+)\]/g)].map((m) => m[1].trim())
  assert.ok(indexed.length > 0, 'PostArt no longer indexes FIGURES at all')

  // An index is safe if it is a literal, is reduced inline, or is a variable
  // whose declaration reduces it modulo the array length.
  const unguarded = indexed.filter((expr) => {
    if (/^\d+$/.test(expr)) return false
    if (/%\s*FIGURES\.length/.test(expr)) return false
    if (/^[A-Za-z_$][\w$]*$/.test(expr)) {
      const declared = new RegExp(`const\\s+${expr}\\s*=[^\\n]*%\\s*FIGURES\\.length`)
      return !declared.test(code)
    }
    return true
  })

  assert.strictEqual(
    unguarded.length,
    0,
    `FIGURES indexed by something never reduced modulo FIGURES.length: ${unguarded.join(', ')}`,
  )
})

console.log('\nsocial preview:')

check('the advertised Open Graph image exists', () => {
  const site = read('src', 'utilities', 'site.ts')
  const advertised = site.match(/defaultOGImage:\s*'([^']+)'/)
  assert.ok(advertised, 'site.ts no longer declares defaultOGImage')

  const file = path.join(ROOT, 'public', advertised[1].replace(/^\//, ''))
  assert.ok(
    fs.existsSync(file),
    `site.ts advertises ${advertised[1]} on every page but public/ has no such file — ` +
      'scrapers skip a 404 silently, so shared links get no preview image',
  )
})

console.log('\naccent colour:')

check('--accent is rendered somewhere, not just defined', () => {
  const sources = walk(path.join(ROOT, 'src')).filter(
    // shadcn primitives ship with accent classes for their own hover states;
    // those were the only usages while the site itself rendered none.
    (file) => !file.includes(path.join('components', 'ui')),
  )
  const users = sources.filter((file) => /\b(bg|text|border|decoration)-accent\b/.test(codeOf(fs.readFileSync(file, 'utf8'))))
  const inCss = /\b(bg|text|border|decoration)-accent\b/.test(read('src', 'app', '(frontend)', 'globals.css'))

  assert.ok(
    users.length > 0 || inCss,
    'the palette defines --accent but nothing outside components/ui renders it, ' +
      'so the site has no accent colour at all',
  )
})

console.log(failures ? `\n${failures} failed` : '\nall passed')
process.exit(failures ? 1 : 0)
