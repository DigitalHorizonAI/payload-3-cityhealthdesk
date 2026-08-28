/**
 * Fails if the SEO tool's Markdown can no longer reach `posts.content` as
 * Lexical.
 *
 *   pnpm check:markdown-ingest
 *
 * Needs no database, no browser and no server — like check-access.ts it loads
 * the config and calls the hook directly, so it runs in about a second.
 *
 * ## What this is guarding
 *
 * GetRanked's Payload connector can only emit a Markdown or HTML *string*.
 * `content` is a Lexical richText field, so a string is rejected with
 * `400 "Content > Content" — "This field is required."` — an error that points
 * at a missing field when the real problem is a format mismatch. The hook
 * converts Markdown *or* HTML on the way in. If it stops being attached, or
 * stops producing real headings and lists, every article the tool publishes
 * either 400s or lands as one flat blob of literal `##` and `-` characters.
 *
 * It does NOT cover link safety — see the note at section 3c. This site serves
 * the raw Lexical tree from /api/articles rather than HTML, so the only render
 * path is a React component this script cannot mount.
 *
 * ## Why it asserts on headings and lists specifically
 *
 * The failure this exists to catch is silent. `editorConfigFactory.default()`
 * resolves to the config-level `defaultLexical` — five features, no headings —
 * and converting against it produces a *valid* Lexical document with every
 * heading flattened to a paragraph and every bullet dropped. It would return
 * 201 and look fine. So asserting "the result is Lexical" proves nothing;
 * asserting the heading and list nodes survived is what catches it.
 *
 * ## What this cannot prove
 *
 * That the hook runs *before* the field's `required` validation — that ordering
 * lives in Payload's own beforeValidate/beforeChange passes and needs a real
 * create against a database. Verified by hand against local Postgres; this
 * script covers everything that does not need one.
 */
import type { Field, RichTextField } from 'payload'

import config from '@payload-config'

const resolved = await config
const failures: string[] = []

const check = (label: string, ok: boolean, detail: string) => {
  if (!ok) failures.push(`${label}: ${detail}`)
}

const posts = resolved.collections?.find((c) => c.slug === 'posts')
if (!posts) throw new Error('no `posts` collection in the resolved config')

/** Depth-first: `content` sits inside a tabs field, not at the top level. */
const findField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field
    const nested =
      'fields' in field
        ? field.fields
        : 'tabs' in field
          ? field.tabs.flatMap((tab) => tab.fields)
          : undefined
    if (nested) {
      const hit = findField(nested, name)
      if (hit) return hit
    }
  }
  return undefined
}

const content = findField(posts.fields, 'content') as RichTextField | undefined
if (!content) throw new Error('no `content` field on the posts collection')

// 1 — the hook is actually wired in. Everything below would still pass if the
// field edit were reverted, because it calls the hook directly.
const hooks = content.hooks?.beforeValidate ?? []
check(
  'wiring',
  hooks.length > 0,
  'posts.content has no beforeValidate hook — the SEO tool cannot publish Markdown',
)
if (!hooks.length) {
  console.error(`${failures[0]}`)
  process.exit(1)
}

const run = (value: unknown) =>
  hooks[0]!({ field: content, value } as unknown as Parameters<(typeof hooks)[0]>[0])

// 2 — Markdown converts, and headings and lists survive the conversion.
const converted = (await run(
  ['# Title', '', 'Some prose.', '', '## A section', '', '- first', '- second'].join('\n'),
)) as { root?: { children?: { tag?: string; type?: string }[] } }

const types = converted?.root?.children?.map((child) => child.type) ?? []
check('markdown', types.includes('heading'), `no heading node in the result — got [${types}]`)
check('markdown', types.includes('list'), `no list node in the result — got [${types}]`)
check(
  'markdown',
  converted?.root?.children?.some((child) => child.type === 'heading' && child.tag === 'h2') ??
    false,
  'the `##` did not become an h2 — the editor config is probably the wrong one',
)

// 3 — HTML converts too. The generator emits HTML whatever the connection
// setting says, so refusing it refused every article. Asserted the same way as
// Markdown: it is the *shape* of the result that catches a wrong editor config,
// not the fact that something came back.
const fromHtml = (await run(
  '<h1>Title</h1><p>Some prose.</p><h2>A section</h2><ul><li>first</li><li>second</li></ul>',
)) as { root?: { children?: { tag?: string; type?: string }[] } }

const htmlTypes = fromHtml?.root?.children?.map((child) => child.type) ?? []
check('html', htmlTypes.includes('heading'), `no heading node from HTML — got [${htmlTypes}]`)
check('html', htmlTypes.includes('list'), `no list node from HTML — got [${htmlTypes}]`)
check(
  'html',
  fromHtml?.root?.children?.some((child) => child.type === 'heading' && child.tag === 'h2') ?? false,
  'the <h2> did not become an h2 heading — the editor config is probably the wrong one',
)

// 3b — a real generated article, not a toy string. These are the constructs the
// article writer actually produces, and the two most at risk here: a bare
// <table>, and a top-level <img>. This repo has no other HTML parser. Measured against a real
// article on 28 Aug: every one of these survives, and the image does not.
const REAL_SHAPE = [
  '<p>Ever asked for a quote and been baffled by the answers?</p>',
  '<img src="https://newwebsite.builders/images/a.webp" alt="A calculator" />',
  '<h2>What drives the price</h2>',
  '<p>One person says <strong>$500</strong>, another says <em>$50,000</em>.</p>',
  '<h3>Scope</h3>',
  '<ul><li>Pages</li><li>Features</li></ul>',
  '<blockquote><p>Cheap work is not good.</p></blockquote>',
  '<table><thead><tr><th>Tier</th><th>Cost</th></tr></thead>',
  '<tbody><tr><td>Basic</td><td>$500</td></tr></tbody></table>',
].join('')

const real = (await run(REAL_SHAPE)) as { root?: { children?: { tag?: string; type?: string }[] } }
const realTypes = (real?.root?.children ?? []).map((child) =>
  child.type === 'heading' ? `heading:${child.tag}` : String(child.type),
)
for (const expected of ['heading:h2', 'heading:h3', 'list', 'quote', 'paragraph']) {
  check('real-article', realTypes.includes(expected), `no ${expected} — got [${realTypes}]`)
}

// KNOWN CEILING: `<table>` is NOT in this list. This site's content editor does
// not register EXPERIMENTAL_TableFeature, so a table converts to one paragraph
// per cell — the words survive, the grid does not. Asserted rather than
// ignored, because the article writer does produce comparison tables.
//
// Adding the feature here would make it WORSE before it made it better:
// components/RichText/serialize.tsx has no `table` case, so its switch falls
// through to `default: return null` and a real table node would render as
// nothing on /blog/[slug]. Fix the serializer first, then enable the feature.
check(
  'known-ceiling',
  !realTypes.includes('table'),
  'a <table> now produces a table node — if EXPERIMENTAL_TableFeature was enabled, ' +
    'serialize.tsx needs a table case in the same change or tables render as nothing',
)

// Bold and italic are the only inline formats the article writer uses. Assert
// the two we rely on actually carry their format bits, so a converter change
// that flattened them would be caught here rather than on a live article.
const textFormats = new Set<number>()
const collect = (node: { type?: string; format?: number; children?: unknown[] }) => {
  if (node?.type === 'text') textFormats.add(node.format ?? 0)
  for (const child of (node?.children ?? []) as typeof node[]) collect(child)
}
for (const child of (real?.root?.children ?? []) as Parameters<typeof collect>[0][]) collect(child)
check('real-article', textFormats.has(1), 'the <strong> did not produce a BOLD text node')
check('real-article', textFormats.has(2), 'the <em> did not produce an ITALIC text node')

// KNOWN CEILING, asserted so it stays a decision rather than a surprise: the
// content field registers no upload feature, so an <img> has no importer and is
// dropped. If this ever starts passing, images began surviving and the warning
// in the hook should go.
const imageNodes = realTypes.filter((type) => type === 'upload' || type === 'block').length
check(
  'known-ceiling',
  imageNodes === 0,
  `an <img> now produces a node (${imageNodes}) — images may be supported; revisit the hook's warning`,
)

// 3c — link safety is NOT asserted here, and that is deliberate.
//
// The sibling CMSs serve article HTML from /api/articles, so their link guard
// has an output this script can inspect. This one serves the raw Lexical tree
// (endpoints/articles.ts:70), so there is no server-rendered HTML to assert on.
// The only render path for post content is RichText/serialize.tsx -> CMSLink,
// a React component this script cannot mount.
//
// The guard itself is in src/components/Link/index.tsx: it applies `sanitizeUrl`
// from payload/shared, which maps a disallowed protocol to '#'. Neither
// converter allowlists protocols on import, so a `javascript:` href IS stored
// verbatim in posts.content by design — anything consuming the raw tree from
// the API has to sanitize its own hrefs.

// 4 — everything that is not a string passes through untouched, so the admin
// panel and existing articles never enter the converted path.
const alreadyLexical = { root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } }
check('passthrough', (await run(alreadyLexical)) === alreadyLexical, 'a Lexical value was rewritten')
check('passthrough', (await run(undefined)) === undefined, 'undefined was rewritten')
check('passthrough', (await run('   ')) === '   ', 'a blank string was converted instead of left alone')

console.log(
  `Checked posts.content ingest: 6 behaviours (wiring, markdown, html, real-article,
known-ceiling, passthrough). Link safety is not covered here — see section 3c.
`,
)

if (failures.length) {
  console.error(`${failures.length} check(s) failed:\n`)
  for (const failure of failures) console.error(`  ${failure}`)
  console.error('')
  process.exit(1)
}

console.log(
  `The SEO tool's Markdown and HTML both reach posts.content as Lexical, with headings, lists
and blockquotes intact.
Two known losses: images are dropped (no upload feature on this field) and tables flatten to
one paragraph per cell (no table feature on this field — see the ceiling checks above).`,
)
