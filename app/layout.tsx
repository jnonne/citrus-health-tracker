import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import Header from '@/components/Header'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Citrus Health Tracker',
  description: 'Track and analyze the health of your citrus trees with AI',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Citrus Tracker',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before React hydrates — prevents flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');})();` }} />
      </head>
      <body className={`${geist.className} bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200`}>
        <ThemeProvider>
          <div className="max-w-2xl mx-auto px-4 pb-12">
            <Header />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
