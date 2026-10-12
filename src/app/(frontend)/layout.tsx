import type { Metadata } from 'next'

import { cn } from 'src/utilities/cn'
import localFont from 'next/font/local'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

// The editorial pairing carried from the sister blog CMS: Cormorant Garamond
// for headings, DM Sans for everything else.
// The files are committed (latin subset, variable weight, SIL OFL; licences
// alongside) so the build never has to reach Google Fonts.
const cormorant = localFont({
  src: './fonts/CormorantGaramond-latin.woff2',
  weight: '400 500',
  variable: '--font-cormorant',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

const dmSans = localFont({
  src: './fonts/DMSans-latin.woff2',
  weight: '400 500',
  variable: '--font-dm-sans',
  display: 'swap',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html className={cn(cormorant.variable, dmSans.variable)} lang="en" suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        {/* The reveal animation starts from opacity 0, so without JavaScript
            there would be nothing to un-hide it. Cheaper and more reliable
            than a blocking script, and it degrades to "just show everything". */}
        <noscript>
          <style>{`.fade-in { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          <LivePreviewListener />

          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
