import Link from 'next/link'
import React from 'react'

import { ProductArt } from './ProductArt'
import { SoldOut } from './SoldOut'
import { formatPrice, getCategory, type Product } from '@/shop'

/**
 * One product in a grid.
 *
 * The whole card is a single link to the product page. There is no add-to-cart
 * control here or anywhere else — see the header of src/shop.ts.
 */
export const ProductCard = ({ product }: { product: Product }) => {
  const category = getCategory(product.category)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col border border-border bg-card transition-colors hover:border-foreground/40"
    >
      <div className="relative aspect-square overflow-hidden border-b border-border">
        <ProductArt
          art={product.art}
          category={product.category}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <SoldOut className="absolute left-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {category && (
          <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {category.name}
          </span>
        )}
        <h3 className="text-base leading-snug group-hover:underline">{product.name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>
        <p className="mt-auto pt-2 text-sm font-medium">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}

export default ProductCard
