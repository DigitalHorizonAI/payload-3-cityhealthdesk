import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getPublicSiteURL } from '@/utilities/getURL'
import { getDocPath } from '@/utilities/collectionPrefixMap'

/**
 * Lists published articles so search engines can discover them without waiting
 * to stumble across a link. Served at <public origin>/sitemap.xml.
 *
 * URLs use the public origin — see getPublicSiteURL().
 *
 * Scope: articles only, until the full site lands in this app and its pages
 * earn entries of their own.
 */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteURL = getPublicSiteURL()
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: { slug: true, updatedAt: true },
    where: { _status: { equals: 'published' } },
  })

  const entries: MetadataRoute.Sitemap = [
    { url: `${siteURL}/blog`, changeFrequency: 'daily', priority: 0.8 },
  ]

  for (const doc of posts.docs) {
    if (!doc.slug) continue
    entries.push({
      url: `${siteURL}${getDocPath('posts', doc.slug)}`,
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  // The `pages` collection is deliberately absent, inherited from the sister
  // sites where root-level page URLs belonged to another app. Here the root
  // will belong to this app once the full site launches — add `pages` back
  // then, alongside real published pages. Nothing is lost meanwhile: no
  // `pages` doc is published.

  return entries
}
