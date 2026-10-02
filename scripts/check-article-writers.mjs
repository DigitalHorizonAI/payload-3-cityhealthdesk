/**
 * Every article page names the writer GetRanked holds for it.
 *
 *   node --env-file=.env scripts/check-article-writers.mjs https://cityhealthdesk.com
 *
 * Walks every /blog/<slug> address in the site's sitemap and reads GetRanked's
 * published rows for this domain on its own (same GETRANKED_* variables as the
 * app). Per page:
 *   - GetRanked holds writer W: the meta author is W, the JSON-LD author is one
 *     Person named W, and W shows in the page body.
 *   - GetRanked holds none: no meta author and no JSON-LD author at all - never
 *     the site name standing in for one.
 * Fails when any page fails, when it checked no pages, and when no page was
 * expected to carry a writer: a check that compared nothing has not passed.
 */
const origin = (process.argv[2] ?? '').replace(/\/+$/, '')
const { GETRANKED_URL, GETRANKED_ANON_KEY, GETRANKED_DOMAIN_ID } = process.env

if (!origin || !GETRANKED_URL || !GETRANKED_ANON_KEY || !GETRANKED_DOMAIN_ID) {
  console.error('Usage: node --env-file=.env scripts/check-article-writers.mjs <origin>')
  console.error('Needs GETRANKED_URL, GETRANKED_ANON_KEY and GETRANKED_DOMAIN_ID.')
  process.exit(1)
}

const params = new URLSearchParams({
  domain_id: `eq.${GETRANKED_DOMAIN_ID}`,
  status: 'eq.published',
  select: 'slug,author',
})
const gr = await fetch(`${GETRANKED_URL}/rest/v1/generated_content?${params}`, {
  headers: { apikey: GETRANKED_ANON_KEY, Authorization: `Bearer ${GETRANKED_ANON_KEY}` },
})
// A failed read leaves no expectations; the "nothing was compared" rule below then fails the run.
if (!gr.ok) console.error(`GetRanked answered ${gr.status}`)
const rows = gr.ok ? await gr.json() : []

// GetRanked keeps the full path ("topic/subtopic/slug"); the site uses the last part.
const lastSegment = (path) => (path ?? '').split('/').filter(Boolean).pop()

const expectedWriter = (slug) => {
  const names = new Set(rows.filter((r) => r.author && lastSegment(r.slug) === slug).map((r) => r.author))
  return names.size === 1 ? [...names][0] : undefined
}

const sitemap = await fetch(`${origin}/sitemap.xml`)
if (!sitemap.ok) console.error(`${origin}/sitemap.xml answered ${sitemap.status}`)
const paths = [...(sitemap.ok ? await sitemap.text() : '').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, loc]) => new URL(loc).pathname)
  .filter((p) => /^\/blog\/[^/]+\/?$/.test(p) && !p.startsWith('/blog/page'))

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const metaAuthors = (html) =>
  [...html.matchAll(/<meta[^>]*name="author"[^>]*>/g)].map(([tag]) =>
    decode(tag.match(/content="([^"]*)"/)?.[1] ?? ''),
  )

const jsonLdAuthors = (html) => {
  const posting = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json))
    .find((d) => d['@type'] === 'BlogPosting')
  if (!posting) return null
  return posting.author === undefined ? [] : [].concat(posting.author)
}

const bodyText = (html) =>
  decode(
    (html.split(/<body[^>]*>/)[1] ?? '')
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  )

let checked = 0
let withWriter = 0
const failures = []

for (const path of paths) {
  const slug = path.replace(/^\/blog\//, '').replace(/\/$/, '')
  const res = await fetch(`${origin}${path}`, { redirect: 'manual' })
  if (res.status !== 200) {
    failures.push(`${path}: answered ${res.status}`)
    continue
  }
  const html = await res.text()
  checked++

  const want = expectedWriter(slug)
  const meta = metaAuthors(html)
  const ld = jsonLdAuthors(html)
  const problems = []

  if (ld === null) problems.push('no BlogPosting JSON-LD')
  if (want) {
    withWriter++
    if (meta.length !== 1 || meta[0] !== want) problems.push(`meta author ${JSON.stringify(meta)}`)
    if (ld && !(ld.length === 1 && ld[0]['@type'] === 'Person' && ld[0].name === want)) {
      problems.push(`JSON-LD author ${JSON.stringify(ld)}`)
    }
    if (!bodyText(html).includes(want)) problems.push('writer not in the page body')
  } else {
    if (meta.length) problems.push(`meta author ${JSON.stringify(meta)} where GetRanked holds none`)
    if (ld?.length) problems.push(`JSON-LD author ${JSON.stringify(ld)} where GetRanked holds none`)
  }

  if (problems.length) failures.push(`${path}: expected ${want ?? 'no writer'}; ${problems.join('; ')}`)
}

console.log(`Checking ${origin}`)
console.log(`  ....  ${rows.length} GetRanked rows read`)
console.log(`  ....  ${checked} article pages checked, ${withWriter} with a GetRanked writer`)
for (const f of failures) console.log(`  FAIL  ${f}`)

if (checked === 0) console.log('  FAIL  0 article pages checked')
if (withWriter === 0) console.log('  FAIL  no page matched a GetRanked writer, so nothing was compared')
if (failures.length) console.log(`${failures.length} of ${paths.length} article pages failed.`)

// exitCode, not process.exit(): exiting with fetch sockets still closing
// trips a libuv assertion on Windows and reports 127 instead of 1.
if (checked === 0 || withWriter === 0 || failures.length) process.exitCode = 1
else console.log('  PASS  every article page names the writer GetRanked holds for it')
