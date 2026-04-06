'use client'

import { useEffect, useState, createContext, useContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

function applyTheme(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
  if (theme === 'system') localStorage.removeItem('theme')
  else localStorage.setItem('theme', theme)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    const initial: Theme = saved === 'light' || saved === 'dark' ? saved : 'system'
    setThemeState(initial)
    applyTheme(initial)

    // Re-apply when system preference changes (only if user hasn't pinned a mode)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (!localStorage.getItem('theme')) applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    applyTheme(t)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
