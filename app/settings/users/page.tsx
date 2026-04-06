'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface AllowedUser {
  email: string
  display_name: string | null
  is_admin: boolean
  added_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<AllowedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [adding, setAdding] = useState(false)

  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIsAdmin, setEditIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)

  const [removing, setRemoving] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.status === 403) { setError('Admin access required.'); setLoading(false); return }
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, display_name: newName || null, is_admin: newIsAdmin }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error); setAdding(false); return }
    setNewEmail(''); setNewName(''); setNewIsAdmin(false)
    setAdding(false)
    await loadUsers()
  }

  function startEdit(user: AllowedUser) {
    setEditingEmail(user.email)
    setEditName(user.display_name ?? '')
    setEditIsAdmin(user.is_admin)
  }

  async function saveEdit(email: string) {
    setSaving(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, display_name: editName || null, is_admin: editIsAdmin }),
    })
    setEditingEmail(null)
    setSaving(false)
    await loadUsers()
  }

  async function removeUser(email: string) {
    if (!confirm(`Remove ${email}? They will lose access immediately.`)) return
    setRemoving(email)
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setRemoving(null)
    await loadUsers()
  }

  const inputClass = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">← Home</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add, edit or remove users who can access Citrus Tracker.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 text-sm text-red-700 dark:text-red-300 mb-4">
          {error}
        </div>
      )}

      {/* Add user form */}
      <form onSubmit={addUser} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6 space-y-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Add New User</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email *</label>
            <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Display Name</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane Smith" className={inputClass} />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} className="rounded" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Administrator (can manage users)</span>
        </label>
        <button type="submit" disabled={adding}
          className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
          {adding ? 'Adding...' : 'Add User'}
        </button>
      </form>

      {/* Users list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.email} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              {editingEmail === user.email ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Display Name</label>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editIsAdmin} onChange={e => setEditIsAdmin(e.target.checked)} className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Administrator</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(user.email)} disabled={saving}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingEmail(null)}
                      className="border border-gray-300 dark:border-gray-600 px-4 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{user.display_name ?? user.email}</p>
                      {user.is_admin && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">Admin</span>
                      )}
                    </div>
                    {user.display_name && <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500">Added {new Date(user.added_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(user)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      Edit
                    </button>
                    <button onClick={() => removeUser(user.email)} disabled={removing === user.email}
                      className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40">
                      {removing === user.email ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
