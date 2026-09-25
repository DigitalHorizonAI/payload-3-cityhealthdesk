/**
 * Look-alike articles folded into one each: merged slug → the slug it now
 * lives at. Each winner is the oldest published article on its topic.
 *
 * The posts themselves stay published in the CMS. This list alone makes the
 * merge: redirects.js answers each merged address with a 301 to its winner,
 * and every public listing (blog, sitemap, home, search, /api/articles)
 * filters the merged slugs out. Removing a row undoes that article's merge.
 *
 * Plain JS rather than TS because next.config.js imports it too.
 */
export const MERGED_ARTICLES = {
  'eating-healthy-near-me': 'healthy-eating-near-me',

  'methods-for-stress-management': 'method-of-stress-management',
  'methods-of-stress-management': 'method-of-stress-management',
  'stress-management-method': 'method-of-stress-management',
  'stress-management-methods': 'method-of-stress-management',
  'stress-management-technique': 'method-of-stress-management',
  'stress-management-techniques': 'method-of-stress-management',
  'techniques-for-stress-management': 'method-of-stress-management',
  'ways-of-stress-management': 'method-of-stress-management',
  'stress-management': 'method-of-stress-management',

  'heart-healthy-eating': 'healthy-eating-for-a-healthy-heart',
}

export const MERGED_SLUGS = Object.keys(MERGED_ARTICLES)

/** A `where` clause that drops merged articles from a posts or search query. */
export const notMerged = { slug: { not_in: MERGED_SLUGS } }
