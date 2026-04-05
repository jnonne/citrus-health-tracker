'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUpload from '@/components/PhotoUpload'
import { compressAll } from '@/lib/compressImage'

const URGENCY_CONFIG = {
  good: { label: 'Healthy', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✅' },
  monitor: { label: 'Monitor', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '👁️' },
  attention: { label: 'Needs Attention', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: '⚠️' },
  urgent: { label: 'Urgent', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '🚨' },
}

interface AnalysisResponse {
  analysisId: string
  extractedMoisture?: number
  extractedPh?: number
  finalMoisture?: number
  finalPh?: number
  summary: string
  recommendations: string[]
  urgency: 'good' | 'monitor' | 'attention' | 'urgent'
}

export default function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]

  const [treePhotos, setTreePhotos] = useState<File[]>([])
  const [meterPhotos, setMeterPhotos] = useState<File[]>([])
  const [lastWatered, setLastWatered] = useState(today)
  const [moisture, setMoisture] = useState('')
  const [ph, setPh] = useState('')
  const [concerns, setConcerns] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResponse | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Fetch tree name/species for analysis context
      const treeRes = await fetch(`/api/tree/${id}`)
      const tree = treeRes.ok ? await treeRes.json() : { name: 'Unknown', species: 'other' }

      // Compress images before upload to stay under Claude's 5MB per-image limit
      const [compressedTreePhotos, compressedMeterPhotos] = await Promise.all([
        compressAll(treePhotos),
        compressAll(meterPhotos),
      ])

      const form = new FormData()
      form.append('tree_id', id)
      form.append('tree_name', tree.name)
      form.append('tree_species', tree.species)
      form.append('last_watered', lastWatered)
      if (moisture) form.append('moisture_reading', moisture)
      if (ph) form.append('ph_reading', ph)
      if (concerns.trim()) form.append('user_concerns', concerns.trim())
      compressedTreePhotos.forEach((f) => form.append('tree_photos', f))
      compressedMeterPhotos.forEach((f) => form.append('meter_photos', f))

      const res = await fetch('/api/analyze', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data: AnalysisResponse = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const urgency = URGENCY_CONFIG[result.urgency]
    return (
      <div className="py-8 space-y-6">
        <div className={`rounded-2xl border ${urgency.border} ${urgency.bg} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Analysis Complete</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${urgency.bg} ${urgency.text} border ${urgency.border}`}>
              {urgency.icon} {urgency.label}
            </span>
          </div>

          {/* Confirmed readings */}
          {(result.finalMoisture !== undefined || result.finalPh !== undefined) && (
            <div className="flex gap-3 mb-4">
              {result.finalMoisture !== undefined && (
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-center">
                  <p className="text-xs text-gray-500">Moisture</p>
                  <p className="text-2xl font-bold text-blue-600">{result.finalMoisture}%</p>
                  {result.extractedMoisture !== undefined && (
                    <p className="text-xs text-gray-400">read from photo</p>
                  )}
                </div>
              )}
              {result.finalPh !== undefined && (
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-center">
                  <p className="text-xs text-gray-500">pH</p>
                  <p className="text-2xl font-bold text-purple-600">{result.finalPh}</p>
                  {result.extractedPh !== undefined && (
                    <p className="text-xs text-gray-400">read from photo</p>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-gray-800 mb-4">{result.summary}</p>

          {result.recommendations.length > 0 && (
            <div>
              <h3 className={`text-sm font-semibold ${urgency.text} mb-2`}>Recommendations</h3>
              <ul className="space-y-1">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-800">
                    <span className="text-green-600 mt-0.5 shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push(`/tree/${id}`)}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          Back to Tree
        </button>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Analysis</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PhotoUpload
          label="Tree Photos (whole tree and close-ups)"
          files={treePhotos}
          onChange={setTreePhotos}
          multiple={true}
        />

        <PhotoUpload
          label="Meter Reading Photo (optional)"
          files={meterPhotos}
          onChange={setMeterPhotos}
          multiple={false}
        />

        {/* Readings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moisture % (optional)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={moisture}
              onChange={(e) => setMoisture(e.target.value)}
              placeholder="e.g., 45"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">pH (optional)</label>
            <input
              type="number"
              min="0"
              max="14"
              step="0.1"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
              placeholder="e.g., 6.5"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Last watered */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Last Watered</label>
          <input
            type="date"
            value={lastWatered}
            onChange={(e) => setLastWatered(e.target.value)}
            max={today}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Concerns */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observations or Concerns (optional)</label>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="e.g., leaves are yellowing, some dropping, saw insects on the trunk..."
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing...
            </span>
          ) : 'Run AI Analysis'}
        </button>
      </form>
    </div>
  )
}
