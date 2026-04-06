'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useTheme, Theme } from '@/components/ThemeProvider'

const THEME_CYCLE: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }

const THEME_LABEL: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' }

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'dark') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    )
  }
  if (theme === 'light') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }
  // system
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

export default function Header() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<{ email: string; name: string; avatar?: string } | null>(null)
  const [isTrusted, setIsTrusted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          email: user.email ?? '',
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '',
          avatar: user.user_metadata?.avatar_url,
        })
        fetch('/api/admin/users').then(r => { if (r.ok) setIsAdmin(true) })
      }
    })
    setIsTrusted(document.cookie.includes('trusted_device_id='))
  }, [])

  async function signOut() {
    document.cookie = 'trusted_device_id=; path=/; max-age=0'
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <header className="flex items-center justify-between py-5">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">🍋</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">Citrus Tracker</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(THEME_CYCLE[theme])}
          title={`Theme: ${THEME_LABEL[theme]} — click to change`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-medium"
        >
          <ThemeIcon theme={theme} />
          <span className="hidden sm:inline">{THEME_LABEL[theme]}</span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2 transition-colors"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block max-w-[120px] truncate">
              {user.name}
            </span>
            {isTrusted && <span title="Trusted device" className="text-xs">🔒</span>}
            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                  {isTrusted && <p className="text-xs text-green-600 mt-0.5">🔒 Trusted device</p>}
                </div>
                <Link href="/settings/devices" onClick={() => setMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Trusted Devices
                  </button>
                </Link>
                {isAdmin && (
                  <Link href="/settings/users" onClick={() => setMenuOpen(false)}>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Manage Users
                    </button>
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border-t border-gray-100 dark:border-gray-700"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
