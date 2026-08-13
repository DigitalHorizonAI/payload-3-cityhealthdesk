import React from 'react'

import { cn } from 'src/utilities/cn'

/**
 * The stock state, which is the same for every product and always will be.
 *
 * It is a plain label rather than a "notify me" or "back in stock" control,
 * because there is no restock and no way to be notified — offering either would
 * be collecting an email address against a promise nobody intends to keep.
 */
export const SoldOut = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'inline-block border border-border bg-background/90 px-2 py-1 text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-sm',
      className,
    )}
  >
    Sold out
  </span>
)

export default SoldOut
