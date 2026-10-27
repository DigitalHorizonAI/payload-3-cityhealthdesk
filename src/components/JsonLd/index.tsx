/**
 * schema.org markup for the homepage (Organization) and the shop listings
 * (ItemList). Articles and products carry their own; see ArticleJsonLd and the
 * product page.
 *
 * Only what the site already states: no logo (the site has none, only a text
 * wordmark), no address, no ratings.
 */
import React from 'react'

import type { Product } from '@/shop'

import { getPublicSiteURL } from '@/utilities/getURL'
import { SITE } from '@/utilities/site'

export const organizationJsonLd = () => {
  const site = getPublicSiteURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site}/#organization`,
    name: SITE.name,
    url: site,
  }
}

/** The products in the order the page shows them. */
export const itemListJsonLd = (products: Product[]) => {
  const site = getPublicSiteURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: `${site}/products/${product.slug}`,
    })),
  }
}

export const JsonLd: React.FC<{ data: object }> = ({ data }) => (
  <script
    type="application/ld+json"
    // Serialised from code constants, never from user input. `<` is escaped
    // anyway, matching ArticleJsonLd and the product page.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
  />
)
