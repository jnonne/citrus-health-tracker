'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { TreeSpecies } from '@/lib/types'

const SPECIES_OPTIONS: { value: TreeSpecies; label: string }[] = [
  { value: 'navel_orange', label: 'Navel Orange' },
  { value: 'valencia_orange', label: 'Valencia Orange' },
  { value: 'meyer_lemon', label: 'Meyer Lemon' },
  { value: 'eureka_lemon', label: 'Eureka Lemon' },
  { value: 'persian_lime', label: 'Persian Lime' },
  { value: 'key_lime', label: 'Key Lime' },
  { value: 'grapefruit', label: 'Grapefruit' },
  { value: 'mandarin', label: 'Mandarin' },
  { value: 'tangerine', label: 'Tangerine' },
  { value: 'kumquat', label: 'Kumquat' },
  { value: 'other', label: 'Other Citrus' },
]

export default function NewTreePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<TreeSpecies>('navel_orange')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('trees')
      .insert({ name: name.trim(), species, location: location.trim() || null, notes: notes.trim() || null })
      .select()
      .single()

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    router.push(`/tree/${data.id}`)
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">Add New Tree</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tree Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Backyard Lemon, Front Yard Orange"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value as TreeSpecies)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {SPECIES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Backyard, South side of house"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this tree..."
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Add Tree'}
        </button>
      </form>
    </div>
  )
}
