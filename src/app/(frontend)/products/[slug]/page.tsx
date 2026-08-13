import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { ProductArt } from '@/components/shop/ProductArt'
import { ProductCard } from '@/components/shop/ProductCard'
import { SoldOut } from '@/components/shop/SoldOut'
import { formatPrice, getCategory, getProduct, PRODUCTS, productsInCategory } from '@/shop'
import { getPublicSiteURL } from '@/utilities/getURL'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }))
}

type Args = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return {}

  return {
    title: product.seoTitle,
    description: product.metaDescription,
    alternates: { canonical: `${getPublicSiteURL()}/products/${product.slug}` },
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const category = getCategory(product.category)
  const related = productsInCategory(product.category)
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4)

  /**
   * Product structured data, with availability stated honestly as
   * OutOfStock. Marking a permanently unavailable product as InStock is the
   * one thing here that would be a lie to a search engine rather than a
   * design decision, and Google drops merchant listings that do it.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    category: category?.name,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/OutOfStock',
      url: `${getPublicSiteURL()}/products/${product.slug}`,
    },
  }

  return (
    <div className="pb-28 pt-10 md:pt-14">
      <script
        type="application/ld+json"
        // Serialised from src/shop.ts constants, never from user input. `<` is
        // escaped anyway, matching ArticleJsonLd — cheap, and it keeps the two
        // JSON-LD emitters in this codebase behaving identically.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="container">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <Link href="/shop" className="underline-offset-4 hover:text-foreground hover:underline">
            Shop
          </Link>
          {category && (
            <>
              <span className="px-2">/</span>
              <Link
                href={`/shop/${category.slug}`}
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                {category.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-square border border-border">
            <ProductArt
              art={product.art}
              category={product.category}
              className="h-full w-full"
            />
            <SoldOut className="absolute left-4 top-4" />
          </div>

          <div>
            {category && (
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {category.name}
              </p>
            )}
            <h1 className="editorial-heading mb-4 text-3xl text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
              {product.shortDescription}
            </p>

            <p className="mb-8 text-xl font-medium">{formatPrice(product.price)}</p>

            {/*
              Where a shop would put its add-to-cart button. There is no cart in
              this codebase; saying so plainly is better than a disabled button
              that looks like something that might come back.
            */}
            <div className="mb-10 border border-border bg-secondary/60 p-5">
              <p className="mb-1 text-sm font-medium">Currently unavailable</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This product is not in stock and cannot be ordered through this site. The write-up
                below is here to help you choose one — wherever you end up buying it.
              </p>
            </div>

            <div className="mb-10 space-y-4">
              {product.description.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div>
              <h2 className="editorial-heading mb-4 text-xl">Specifications</h2>
              <dl className="border-t border-border">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="grid grid-cols-1 gap-1 border-b border-border py-3 sm:grid-cols-3 sm:gap-4"
                  >
                    <dt className="text-sm text-muted-foreground">{spec.label}</dt>
                    <dd className="text-sm sm:col-span-2">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="editorial-heading mb-6 border-b border-border pb-3 text-2xl">
              More in {category?.name.toLowerCase()}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
