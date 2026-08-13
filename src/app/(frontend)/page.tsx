import type { Metadata } from 'next'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ProductCard } from '@/components/shop/ProductCard'
import { CATEGORIES, featuredProducts, PRODUCTS } from '@/shop'
import { getPublicSiteURL } from '@/utilities/getURL'
import { getDocPath } from '@/utilities/collectionPrefixMap'

/**
 * The storefront.
 *
 * ⚠️ This route used to re-export the Pages `[slug]` template, so `/` rendered
 * whichever CMS page had the slug `home`. It no longer does. The `home` page
 * document still exists in the admin and is still reachable at `/home`, but it
 * does not drive the homepage any more — the storefront is code, the same
 * arrangement the catalogue uses and for the same reason (src/shop.ts).
 *
 * Articles are the exception and stay dynamic: they arrive from the SEO content
 * tool through the API, so the "latest writing" strip reads Payload live and
 * carries a revalidate window. Without one this page would be built once and
 * never show a new article.
 */
export const revalidate = 600

export const metadata: Metadata = {
  title: 'City Health Desk — Everyday Health Essentials & Clear Health Guides',
  description:
    'Home monitoring, first aid, daily living aids and personal care — with practical, researched guides on choosing and using them.',
  alternates: { canonical: getPublicSiteURL() },
}

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 3,
    overrideAccess: false,
    select: { title: true, slug: true, meta: true, publishedAt: true },
    sort: '-publishedAt',
    where: { _status: { equals: 'published' } },
  })

  return (
    <div className="pb-28">
      {/* Hero */}
      <section className="border-b border-border bg-secondary/40">
        <div className="container py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Everyday health, sorted
            </p>
            <h1 className="editorial-heading mb-5 text-4xl text-foreground sm:text-5xl">
              The things worth keeping at home — and how to use them.
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
              A short, considered list of everyday health essentials, each one written up
              properly: what it does, when it actually helps, and what to look for.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-block border border-foreground bg-foreground px-5 py-3 text-sm text-background transition-opacity hover:opacity-90"
              >
                Browse the shop
              </Link>
              <Link
                href="/blog"
                className="inline-block border border-border px-5 py-3 text-sm transition-colors hover:bg-secondary"
              >
                Read the journal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <h2 className="editorial-heading mb-8 text-2xl">Where to start</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/shop/${category.slug}`}
              className="group flex flex-col border border-border bg-card p-6 transition-colors hover:border-foreground/40"
            >
              <h3 className="editorial-heading mb-2 text-xl group-hover:underline">
                {category.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{category.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container pb-16">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-3">
          <h2 className="editorial-heading text-2xl">One from each shelf</h2>
          <Link
            href="/shop"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            All {PRODUCTS.length} products
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts().map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      {/* Latest articles — the only part of this page that reads the CMS */}
      {posts.docs.length > 0 && (
        <section className="border-t border-border bg-secondary/40">
          <div className="container py-16">
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-3">
              <h2 className="editorial-heading text-2xl">From the journal</h2>
              <Link
                href="/blog"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                All articles
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {posts.docs.map((post) => (
                <Link
                  key={post.id}
                  href={getDocPath('posts', post.slug ?? '')}
                  className="group flex flex-col border border-border bg-card p-6 transition-colors hover:border-foreground/40"
                >
                  <h3 className="editorial-heading mb-2 text-lg leading-snug group-hover:underline">
                    {post.title}
                  </h3>
                  {post.meta?.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {post.meta.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
