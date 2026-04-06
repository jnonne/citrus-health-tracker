'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'

interface TrustedDevice {
  id: string
  device_id: string
  device_name: string
  created_at: string
  last_used_at: string
  expires_at: string
}

function friendlyDeviceName(ua: string): string {
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua)) return 'iPad'
  if (/Android/i.test(ua)) return 'Android device'
  if (/Mac/i.test(ua)) return 'Mac'
  if (/Windows/i.test(ua)) return 'Windows PC'
  if (/Linux/i.test(ua)) return 'Linux PC'
  return 'Unknown device'
}

export default function TrustedDevicesPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [devices, setDevices] = useState<TrustedDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDeviceId, setCurrentDeviceId] = useState('')
  const [revoking, setRevoking] = useState<string | null>(null)

  const loadDevices = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('last_used_at', { ascending: false })

    setDevices(data ?? [])
    setLoading(false)

    const match = document.cookie.match(/trusted_device_id=([^;]+)/)
    setCurrentDeviceId(match?.[1] ?? '')
  }, [supabase, router])

  useEffect(() => { loadDevices() }, [loadDevices])

  async function revokeDevice(device: TrustedDevice) {
    setRevoking(device.id)
    await supabase.from('trusted_devices').delete().eq('id', device.id)
    if (device.device_id === currentDeviceId) {
      document.cookie = 'trusted_device_id=; path=/; max-age=0'
      setCurrentDeviceId('')
    }
    await loadDevices()
    setRevoking(null)
  }

  async function revokeAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setRevoking('all')
    await supabase.from('trusted_devices').delete().eq('user_id', user.id)
    document.cookie = 'trusted_device_id=; path=/; max-age=0'
    setCurrentDeviceId('')
    await loadDevices()
    setRevoking(null)
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">← Home</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Trusted Devices</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Devices that stay signed in for 30 days. Revoke any device you don't recognize.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-3">🔓</p>
          <p className="text-sm">No trusted devices. Enable "Trust this device" at next sign-in.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => {
            const isCurrent = device.device_id === currentDeviceId
            const expiresIn = Math.ceil(
              (new Date(device.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            return (
              <div
                key={device.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 flex items-center justify-between gap-4 ${
                  isCurrent
                    ? 'border-green-300 dark:border-green-600'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {/iPhone|iPad/i.test(device.device_name) ? '📱' :
                     /Android/i.test(device.device_name) ? '📱' : '💻'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {friendlyDeviceName(device.device_name)}
                      {isCurrent && (
                        <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                          This device
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Added {new Date(device.created_at).toLocaleDateString()} · Expires in {expiresIn}d
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => revokeDevice(device)}
                  disabled={revoking !== null}
                  className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-40 shrink-0"
                >
                  {revoking === device.id ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            )
          })}

          {devices.length > 1 && (
            <button
              onClick={revokeAll}
              disabled={revoking !== null}
              className="w-full mt-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
            >
              {revoking === 'all' ? 'Revoking all...' : 'Revoke All Devices'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
