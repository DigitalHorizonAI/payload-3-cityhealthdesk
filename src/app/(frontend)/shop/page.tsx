import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { ProductCard } from '@/components/shop/ProductCard'
import { CATEGORIES, PRODUCTS, productsInCategory } from '@/shop'
import { getPublicSiteURL } from '@/utilities/getURL'

/**
 * Everything, grouped by category so the page doubles as the shop's own index.
 *
 * The catalogue is a code constant, so this page has nothing to fetch and can
 * be fully static — no revalidate needed, unlike the pages that read Payload.
 */
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Shop — Everyday Health Essentials | City Health Desk',
  description:
    'Home monitoring devices, first aid, daily living aids and personal care essentials, with practical guidance on choosing and using each one.',
  alternates: { canonical: `${getPublicSiteURL()}/shop` },
}

export default function ShopPage() {
  return (
    <div className="pb-28 pt-10 md:pt-14">
      <div className="container mb-12">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">The Shop</p>
        <h1 className="editorial-heading mb-3 text-3xl text-foreground sm:text-4xl">
          Everyday Health Essentials
        </h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          {PRODUCTS.length} things worth keeping at home, across four categories — each one
          written up with what it does, when it helps, and how to use it properly.
        </p>
      </div>

      <nav aria-label="Categories" className="container mb-14">
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/shop/${category.slug}`}
                className="inline-block border border-border px-3 py-2 text-sm transition-colors hover:border-foreground/40 hover:bg-secondary"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {CATEGORIES.map((category) => (
        <section key={category.slug} className="container mb-16 last:mb-0">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-3">
            <h2 className="editorial-heading text-2xl">{category.name}</h2>
            <Link
              href={`/shop/${category.slug}`}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              About {category.name.toLowerCase()}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {productsInCategory(category.slug).map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
