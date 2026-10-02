// No imports on purpose: tests/article-writer.test.mjs loads this file directly with Node.

type Row = { slug: string | null; author: string | null }

/** GetRanked keeps the article's full path ("topic/subtopic/slug"); the CMS keeps only the last part. */
const lastSegment = (path: string | null) => (path ?? '').split('/').filter(Boolean).pop()

type Options = {
  env?: Record<string, string | undefined>
  fetch?: typeof fetch
  timeoutMs?: number
  cacheMs?: number
  retryMs?: number
}

/**
 * The writer GetRanked holds for an article, looked up by slug.
 *
 * Articles reach this CMS without a writer, while GetRanked keeps one on every
 * article it publishes. The lookup reads GetRanked's published rows for this
 * domain once and serves every page from that copy until it expires.
 *
 * A writer is returned only when every row whose path ends in the slug agrees
 * on one name.
 * When a read fails after an earlier one succeeded, the earlier copy is kept.
 * Anything else - no row, two names, GetRanked slow or down with no earlier
 * copy, the env unset - returns undefined and the page renders without a
 * writer, never with a guess or the site name.
 */
export function makeArticleWriter({
  env = process.env,
  fetch: fetchFn = fetch,
  // Generous on purpose: a build renders pages in many busy worker processes,
  // where 3 s ran out. No visitor waits on a build or an hourly re-render.
  timeoutMs = 10_000,
  cacheMs = 10 * 60_000,
  retryMs = 60_000,
}: Options = {}) {
  let rows: Promise<Row[]> | null = null
  let lastGood: Row[] | null = null
  let expires = 0

  const load = async (): Promise<Row[]> => {
    const { GETRANKED_URL, GETRANKED_ANON_KEY, GETRANKED_DOMAIN_ID } = env
    if (!GETRANKED_URL || !GETRANKED_ANON_KEY || !GETRANKED_DOMAIN_ID) return []

    const params = new URLSearchParams({
      domain_id: `eq.${GETRANKED_DOMAIN_ID}`,
      status: 'eq.published',
      select: 'slug,author',
    })
    const res = await fetchFn(`${GETRANKED_URL}/rest/v1/generated_content?${params}`, {
      headers: { apikey: GETRANKED_ANON_KEY, Authorization: `Bearer ${GETRANKED_ANON_KEY}` },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) throw new Error(`GetRanked answered ${res.status}`)
    return (await res.json()) as Row[]
  }

  return async function articleWriter(slug: string | null | undefined): Promise<string | undefined> {
    if (!slug) return undefined

    if (!rows || Date.now() > expires) {
      expires = Date.now() + cacheMs
      rows = load()
        .then((fresh) => (lastGood = fresh))
        .catch((error) => {
          // Keep the last good copy, so an hourly re-render during an outage
          // does not drop the writer from a page that had one.
          const kept = lastGood ? 'keeping the last copy' : 'no writers'
          console.warn(`[article-writer] GetRanked read failed, ${kept}: ${error}`)
          expires = Date.now() + retryMs
          return lastGood ?? []
        })
    }

    const names = new Set(
      (await rows)
        .filter((r) => r.author && lastSegment(r.slug) === slug)
        .map((r) => r.author as string),
    )
    return names.size === 1 ? [...names][0] : undefined
  }
}

export const articleWriter = makeArticleWriter()
