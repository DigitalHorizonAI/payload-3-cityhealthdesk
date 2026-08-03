import { CollectionSlug } from 'payload'

/**
 * Maps a collection to the URL path its documents are served under.
 *
 * Kept separate from the collection slug on purpose: posts live at /blog, not
 * /posts — the sister sites' URL scheme, and it leaves the root free for the
 * future full site. Anything building a link to a document must read
 * this map rather than interpolating the collection name.
 */
export const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/blog',
  pages: '',
}

/** URL path for a document, e.g. ('posts', 'my-article') -> '/blog/my-article' */
export const getDocPath = (
  relationTo: string | null | undefined,
  slug: string | null | undefined,
): string => `${collectionPrefixMap[relationTo as CollectionSlug] ?? `/${relationTo}`}/${slug}`
