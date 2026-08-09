import type { Metadata } from 'next'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { ThemeRegistry } from '../theme/ThemeRegistry'
import { Providers } from './providers'

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
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
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