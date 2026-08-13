import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { ProductCard } from '@/components/shop/ProductCard'
import { CATEGORIES, getCategory, productsInCategory } from '@/shop'
import { getPublicSiteURL } from '@/utilities/getURL'

export const dynamic = 'force-static'

/** The four categories are a closed set, so every page is built ahead of time. */
export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.slug }))
}

type Args = { params: Promise<{ category: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) return {}

  return {
    title: category.seoTitle,
    description: category.metaDescription,
    alternates: { canonical: `${getPublicSiteURL()}/shop/${category.slug}` },
  }
}

export default async function CategoryPage({ params }: Args) {
  const { category: slug } = await params
  const category = getCategory(slug)

  // An unknown slug is a 404 rather than an empty grid: a category page with no
  // products still returns 200 and gets indexed as a thin page otherwise.
  if (!category) notFound()

  const products = productsInCategory(category.slug)

  return (
    <div className="pb-28 pt-10 md:pt-14">
      <div className="container mb-12">
        <Link
          href="/shop"
          className="mb-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← All categories
        </Link>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {category.tagline}
        </p>
        <h1 className="editorial-heading mb-4 text-3xl text-foreground sm:text-4xl">
          {category.name}
        </h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">{category.description}</p>
      </div>

      <div className="container">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}
