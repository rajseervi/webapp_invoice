import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { ThemeRegistry } from '../theme/ThemeRegistry'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Manage your inventory efficiently',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeRegistry>
            <Providers>
              {children}
            </Providers>
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
