/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import * as React from 'react'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import { Nav } from '~/components/Nav'
import appCss from '~/styles/app.css?url'
import { seo } from '~/utils/seo'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ...seo({
        title: 'mojeKytara — Výuka hry na kytaru',
        description: 'Naučte se hrát na kytaru. Akordy, procvičování s metronomem a zvukem, písně s akordy.',
        keywords: 'kytara, akordy, výuka, procvičování, metronom, písně',
      }),
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' },
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <HeadContent />
      </head>
      <body className="bg-stone-50 text-stone-800 h-full flex flex-col">
        <Nav />
        <div className="flex-1 overflow-y-scroll flex flex-col">
          <main className="flex-1">
            <Outlet />
          </main>
          <footer className="border-t border-stone-200 bg-white mt-auto print:hidden">
            <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
              <span className="font-medium">🎸 mojeKytara — výuka hry na kytaru</span>
              <span>Vytvořeno s ❤️ pro muzikanty</span>
            </div>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
