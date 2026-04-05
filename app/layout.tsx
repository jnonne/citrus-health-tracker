import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import Header from '@/components/Header'
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
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <div className="max-w-2xl mx-auto px-4 pb-12">
          <Header />
          {children}
        </div>
      </body>
    </html>
  )
}
