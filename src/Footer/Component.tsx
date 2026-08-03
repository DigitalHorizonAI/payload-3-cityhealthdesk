import Link from 'next/link'
import React from 'react'

import { Logo } from '@/components/Logo/Logo'
import { FOOTER_BLURB, FOOTER_EXPLORE, type NavLink } from '@/site'

/**
 * Code-owned chrome (src/site.ts), deliberately NOT read from the Payload
 * `footer` global — editing navItems in the CMS has no effect. Slimmer than
 * the sister blogs' footers on purpose: no shop columns, contact email or
 * business details exist for this site yet. They land here with the
 * full-site build.
 */

const FooterLink: React.FC<{ link: NavLink }> = ({ link }) => {
  const className = 'text-sm text-muted-foreground hover:text-foreground transition-colors'
  return link.href.startsWith('/') ? (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  ) : (
    <a href={link.href} className={className}>
      {link.label}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          <div className="lg:col-span-2">
            <a href="/" className="inline-block mb-5" aria-label="City Health Desk home">
              <Logo className="text-xl" />
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{FOOTER_BLURB}</p>
          </div>

          <div>
            <h4 className="nav-link text-foreground mb-4">Explore</h4>
            <ul className="space-y-3">
              {FOOTER_EXPLORE.map((link) => (
                <li key={link.href}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground tracking-wide">
            © {new Date().getFullYear()} City Health Desk. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
