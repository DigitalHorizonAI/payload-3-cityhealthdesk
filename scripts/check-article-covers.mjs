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

console.log('\nimagery that is advertised:')

/**
 * Every rooted image path written anywhere in src/ must exist in public/.
 *
 * This began as a check on `defaultOGImage` alone, because `site.ts` advertised
 * `/og-default.webp` on every page for weeks while the file did not exist —
 * scrapers skip a 404 silently, so every link the client shared had no preview
 * card and nothing anywhere said so. That is not a property of one field; it is
 * a property of every asset the code promises the browser, and the category and
 * hero photographs are now the same kind of promise.
 */
check('every image path referenced in src/ exists in public/', () => {
  const advertised = new Map()

  for (const file of walk(path.join(ROOT, 'src'))) {
    const code = codeOf(fs.readFileSync(file, 'utf8'))
    for (const [, url] of code.matchAll(/['"`](\/[\w./-]+\.(?:webp|png|jpe?g|svg|avif|ico))['"`]/g)) {
      if (!advertised.has(url)) advertised.set(url, path.relative(ROOT, file))
    }
  }

  assert.ok(advertised.size > 0, 'src/ references no image at all — has the shape changed?')

  const missing = [...advertised]
    .filter(([url]) => !fs.existsSync(path.join(ROOT, 'public', url.replace(/^\//, ''))))
    .map(([url, from]) => `${url} (promised by ${from})`)

  assert.strictEqual(
    missing.length,
    0,
    `public/ has no such file:\n        ${missing.join('\n        ')}`,
  )
})

console.log('\ncategory cards:')

/**
 * ## Why these two replaced a check that could not fail
 *
 * The check that used to live here asserted that `--accent` was "rendered
 * somewhere", and passed on a single teal button. It shipped green while the
 * client looked at the live site and said there was no colour on it — the
 * category tints were `hsl(h 34% 96%)` on a `98%` page, a two-point difference
 * that is invisible on any screen. A guard that cannot fail is decoration.
 *
 * So assert the two properties that actually decide whether the cards work, for
 * every hue rather than for the one somebody looked at:
 *
 *   1. the tint is far enough from the page to be seen at all, and
 *   2. the ink on it still clears WCAG AA.
 *
 * They are deliberately a pair. Deepening the tint alone drops the old
 * `--muted-foreground` tagline to ~4.25:1, so a fix aimed only at (1) breaks
 * (2) — which is exactly the mistake this catches.
 */

/** `hsl(H S% L%)` → the L, as a number. */
const lightnessOf = (hsl) => {
  const m = hsl.match(/hsl\([^)]*?([\d.]+)%\s*([\d.]+)%\s*\)/)
  assert.ok(m, `cannot read a lightness out of ${hsl}`)
  return Number(m[2])
}

/** The surface function's five colours, read as source rather than imported. */
const surfaceColours = () => {
  const art = read('src', 'components', 'shop', 'ProductArt.tsx')
  const body = art.match(/export const categorySurface[\s\S]*?\n\}\)/)
  assert.ok(body, 'ProductArt.tsx no longer exports categorySurface')

  const found = Object.fromEntries(
    [...body[0].matchAll(/(\w+):\s*`(hsl\([^`]+\))`/g)].map(([, key, value]) => [key, value]),
  )
  for (const key of ['background', 'borderColor', 'heading', 'body']) {
    assert.ok(found[key], `categorySurface no longer declares ${key}`)
  }
  return found
}

/** WCAG 2.x relative luminance of an `hsl()` string, hue substituted. */
const luminance = (hsl, hue) => {
  const m = hsl.replace(/\$\{hue\}/, String(hue)).match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/)
  assert.ok(m, `cannot parse ${hsl}`)
  const [h, s, l] = [Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100]

  // HSL → sRGB, then the sRGB transfer function, then Rec.709 weights.
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m0 = l - c / 2
  const sector = Math.floor(h / 60) % 6
  const rgb = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector].map((v) => v + m0)

  const lin = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

const ratio = (a, b) => {
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

/** The hues the cards are actually painted in. */
const hues = (() => {
  const art = read('src', 'components', 'shop', 'ProductArt.tsx')
  const block = art.match(/export const HUES[\s\S]*?\n\}/)
  assert.ok(block, 'ProductArt.tsx no longer exports HUES')
  return [...block[0].matchAll(/:\s*(\d+)\s*,/g)].map(([, n]) => Number(n))
})()

const MIN_TINT_DELTA = 6
const MIN_CONTRAST = 4.5

/** `--background`'s lightness — what every other surface is measured against. */
const pageLightness = () => {
  const css = read('src', 'app', '(frontend)', 'globals.css')
  const page = css.match(/--background:\s*([\d.]+\s+[\d.]+%\s+([\d.]+)%)/)
  assert.ok(page, 'globals.css no longer declares --background')
  return Number(page[2])
}

/** A `--token: H S% L%` declaration in globals.css, by name. */
const tokenLightness = (name) => {
  const css = read('src', 'app', '(frontend)', 'globals.css')
  const m = css.match(new RegExp(`--${name}:\\s*[\\d.]+\\s+[\\d.]+%\\s+([\\d.]+)%`))
  assert.ok(m, `globals.css no longer declares --${name}`)
  return Number(m[1])
}

/** The `ground` an SVG art component paints behind its glyph. */
const groundLightness = (...file) => {
  const code = read('src', ...file)
  const m = code.match(/const ground = `hsl\(\$\{hue\} [\d.]+% ([\d.]+)%\)`/)
  assert.ok(m, `${file.join('/')} no longer declares a templated ground colour`)
  return Number(m[1])
}

/**
 * ⭐ Every large surface on the page, not just the one that was complained about.
 *
 * The category cards were caught two points off the page. The audit that
 * followed found the same defect on four more surfaces nothing was watching: the
 * hero band and the journal band were `bg-secondary/40`, which resolves to about
 * 97% on a 98% page, and both drawn-art grounds sat at 94%. That is why the
 * client's report was "overall the website still look pure white" rather than
 * "the cards are too pale" — it was true of nearly the whole page.
 *
 * So this asserts separation for all of them. A future surface added at 96% is
 * the bug coming back somewhere new, and it fails here.
 */
const SURFACES = [
  ['the category card fill', () => lightnessOf(surfaceColours().background)],
  ['the hero band', () => tokenLightness('band')],
  ['the journal band', () => tokenLightness('band-muted')],
  ['the product art ground', () => groundLightness('components', 'shop', 'ProductArt.tsx')],
  ['the article art ground', () => groundLightness('components', 'PostArt.tsx')],
]

check(`every large surface clears the page background by ${MIN_TINT_DELTA} points`, () => {
  const pageL = pageLightness()
  const tooClose = []

  for (const [what, read_] of SURFACES) {
    const l = read_()
    const delta = Math.abs(pageL - l)
    console.log(`        ${what.padEnd(26)} ${String(l).padStart(5)}%  Δ${delta}`)
    if (delta < MIN_TINT_DELTA) tooClose.push(`${what} at ${l}% (Δ${delta})`)
  }

  assert.strictEqual(
    tooClose.length,
    0,
    `on a ${pageL}% page these are close enough to be invisible: ${tooClose.join(', ')}. ` +
      'The client looked at exactly this and said the site had no colour on it. ' +
      `Needs at least ${MIN_TINT_DELTA} points.`,
  )
})

check(`both inks clear ${MIN_CONTRAST}:1 on the tint, for every hue`, () => {
  const surface = surfaceColours()
  const failures = []

  for (const hue of hues) {
    const bg = luminance(surface.background, hue)
    for (const ink of ['heading', 'body']) {
      const r = ratio(bg, luminance(surface[ink], hue))
      if (r < MIN_CONTRAST) failures.push(`hue ${hue} ${ink} ${r.toFixed(2)}:1`)
    }
  }

  assert.strictEqual(
    failures.length,
    0,
    `below AA for normal text: ${failures.join(', ')}. Tint and ink move together — ` +
      'deepening one without darkening the other is the failure this exists to catch.',
  )

  const worst = Math.min(
    ...hues.flatMap((hue) =>
      ['heading', 'body'].map((ink) =>
        ratio(luminance(surface.background, hue), luminance(surface[ink], hue)),
      ),
    ),
  )
  console.log(`        worst pairing across ${hues.length} hues: ${worst.toFixed(2)}:1`)
})

console.log('\naccent colour:')

/**
 * Narrowed from "somewhere in src/" to "on the homepage". The palette's accent
 * was defined and rendered on zero pixels; the homepage is the page the client
 * opens, so that is where the regression would be noticed and that is where to
 * pin it. `components/ui` is excluded either way — shadcn primitives ship accent
 * classes for their own hover states, and those were the only usages while the
 * site itself rendered none.
 */
check('the homepage renders the accent, not just globals.css', () => {
  const page = codeOf(read('src', 'app', '(frontend)', 'page.tsx'))
  assert.ok(
    /\b(bg|text|border|decoration)-accent\b/.test(page),
    'the homepage renders no accent class, so the palette defines a colour the ' +
      'front page never shows — the state the client saw and reported',
  )
})

console.log(failures ? `\n${failures} failed` : '\nall passed')
process.exit(failures ? 1 : 0)
