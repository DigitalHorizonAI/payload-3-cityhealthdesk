import type { Metadata } from 'next'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { Card } from '@/components/Card'
import { PostArt } from '@/components/PostArt'
import { ProductCard } from '@/components/shop/ProductCard'
import { HUES } from '@/components/shop/ProductArt'
import { CATEGORIES, featuredProducts, PRODUCTS } from '@/shop'
import { getPublicSiteURL } from '@/utilities/getURL'

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
    // `categories` is here because <Card> labels each article with it, the same
    // way the blog listing does.
    select: { title: true, slug: true, categories: true, meta: true, publishedAt: true },
    sort: '-publishedAt',
    where: { _status: { equals: 'published' } },
  })

  return (
    <div className="pb-28">
      {/*
        Hero. The copy column stays `max-w-2xl` — that is a reading measure, not
        a layout width — but it used to sit alone inside a full-width container,
        leaving the right half of the tallest section on the site literally
        blank. It is now one half of a two-column grid.
      */}
      <section className="border-b border-border bg-secondary/40">
        <div className="container grid grid-cols-1 items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">
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
                className="inline-block border border-accent bg-accent px-5 py-3 text-sm text-accent-foreground transition-opacity hover:opacity-90"
              >
                Browse the shop
              </Link>
              <Link
                href="/blog"
                className="inline-block border border-border px-5 py-3 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                Read the journal
              </Link>
            </div>
          </div>

          {/* Decorative, and the same drawn language as the product panels. */}
          <div className="relative hidden aspect-[4/3] overflow-hidden border border-border md:block">
            <PostArt slug="city-health-desk" className="absolute inset-0 h-full w-full" />
          </div>
        </div>
      </section>

      {/*
        Categories. These were four white rectangles on near-white paper. They
        now carry the same per-category hue the product panels use (HUES, in
        ProductArt), so a category reads as one family across the whole site
        rather than only inside the shop. Tint and rule only — the type stays on
        the ink colour, which keeps the contrast the palette was checked at.
      */}
      <section className="container py-16">
        <h2 className="editorial-heading mb-8 text-2xl">Where to start</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => {
            const hue = HUES[category.slug]

            return (
              <Link
                key={category.slug}
                href={`/shop/${category.slug}`}
                className="group flex flex-col border p-6 transition-colors"
                style={{
                  backgroundColor: `hsl(${hue} 34% 96%)`,
                  borderColor: `hsl(${hue} 26% 86%)`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="mb-4 block h-1 w-10"
                  style={{ backgroundColor: `hsl(${hue} 44% 34%)` }}
                />
                <h3 className="editorial-heading mb-2 text-xl group-hover:underline">
                  {category.name}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{category.tagline}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured products */}
      <section className="container pb-16">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-3">
          <h2 className="editorial-heading text-2xl">One from each shelf</h2>
          <Link
            href="/shop"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
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
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                All articles
              </Link>
            </div>
            {/*
              The same <Card> the blog listing uses. This strip used to
              hand-roll bare text links for the very same posts, so an article
              had a cover image on /blog and none here.
            */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {posts.docs.map((post) => (
                <Card key={post.id} doc={post} relationTo="posts" showCategories />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
