'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function Header() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
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
        // Check admin status
        fetch('/api/admin/users').then(r => { if (r.ok) setIsAdmin(true) })
      }
    })

    // Check for trusted device cookie
    setIsTrusted(document.cookie.includes('trusted_device_id='))
  }, [])

  async function signOut() {
    // Remove trusted device cookie
    document.cookie = 'trusted_device_id=; path=/; max-age=0'
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <header className="flex items-center justify-between py-5">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">🍋</span>
        <span className="font-bold text-gray-900">Citrus Tracker</span>
      </Link>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors"
        >
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-gray-700 hidden sm:block max-w-[120px] truncate">{user.name}</span>
          {isTrusted && (
            <span title="Trusted device" className="text-xs">🔒</span>
          )}
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                {isTrusted && (
                  <p className="text-xs text-green-600 mt-0.5">🔒 Trusted device</p>
                )}
              </div>
              <Link href="/settings/devices" onClick={() => setMenuOpen(false)}>
                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Trusted Devices
                </button>
              </Link>
              {isAdmin && (
                <Link href="/settings/users" onClick={() => setMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    Manage Users
                  </button>
                </Link>
              )}
              <button
                onClick={signOut}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
