'use client'

import { useState } from 'react'
import { Analysis } from '@/lib/types'

const URGENCY_CONFIG = {
  good: { label: 'Healthy', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: '✅' },
  monitor: { label: 'Monitor', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: '👁️' },
  attention: { label: 'Needs Attention', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', icon: '⚠️' },
  urgent: { label: 'Urgent', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: '🚨' },
}

interface Props {
  analysis: Analysis
  showPhotos?: boolean
}

export default function AnalysisResult({ analysis: initial, showPhotos = true }: Props) {
  const [analysis, setAnalysis] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [moisture, setMoisture] = useState(initial.moisture_reading?.toString() ?? '')
  const [ph, setPh] = useState(initial.ph_reading?.toString() ?? '')
  const [lastWatered, setLastWatered] = useState(initial.last_watered ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [reanalyzing, setReanalyzing] = useState(false)
  const [reanalyzeError, setReanalyzeError] = useState('')

  const urgency = URGENCY_CONFIG[analysis.ai_urgency]
  const date = new Date(analysis.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  async function saveEdits() {
    setSaving(true)
    setSaveError('')
    const moistureChanged = moisture !== (analysis.moisture_reading?.toString() ?? '')
    const phChanged = ph !== (analysis.ph_reading?.toString() ?? '')

    const res = await fetch(`/api/analysis/${analysis.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moisture_reading: moisture,
        ph_reading: ph,
        last_watered: lastWatered,
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setSaveError(d.error ?? 'Save failed')
      setSaving(false)
      return
    }
    const updated = await res.json()
    setAnalysis(prev => ({ ...prev, ...updated }))
    setEditing(false)
    setSaving(false)

    // Auto-reanalyze when moisture or pH readings change
    if (moistureChanged || phChanged) {
      setReanalyzing(true)
      setReanalyzeError('')
      try {
        const reRes = await fetch(`/api/analysis/${analysis.id}/reanalyze`, { method: 'POST' })
        if (reRes.ok) {
          const aiData = await reRes.json()
          setAnalysis(prev => ({ ...prev, ...aiData }))
        } else {
          const d = await reRes.json()
          setReanalyzeError(d.error ?? 'Re-analysis failed')
        }
      } catch {
        setReanalyzeError('Re-analysis failed')
      } finally {
        setReanalyzing(false)
      }
    }
  }

  function cancelEdit() {
    setMoisture(analysis.moisture_reading?.toString() ?? '')
    setPh(analysis.ph_reading?.toString() ?? '')
    setLastWatered(analysis.last_watered ?? '')
    setSaveError('')
    setEditing(false)
  }

  return (
    <div className={`rounded-2xl border ${urgency.border} ${urgency.bg} p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{date}</span>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${urgency.bg} ${urgency.text} border ${urgency.border}`}>
            {urgency.icon} {urgency.label}
          </span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-white/60 transition-colors"
              title="Edit readings"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* Readings — view or edit */}
      {editing ? (
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Edit Readings</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moisture %</label>
              <input
                type="number" min="0" max="100" step="0.1"
                value={moisture} onChange={e => setMoisture(e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">pH</label>
              <input
                type="number" min="0" max="14" step="0.1"
                value={ph} onChange={e => setPh(e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Watered</label>
              <input
                type="date"
                value={lastWatered}
                onChange={e => setLastWatered(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          <div className="flex gap-2">
            <button onClick={saveEdits} disabled={saving}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={cancelEdit}
              className="border border-gray-300 px-4 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 flex-wrap">
          {analysis.moisture_reading !== null && analysis.moisture_reading !== undefined && (
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-center">
              <p className="text-xs text-gray-500">Moisture</p>
              <p className="text-2xl font-bold text-blue-600">{analysis.moisture_reading}%</p>
            </div>
          )}
          {analysis.ph_reading !== null && analysis.ph_reading !== undefined && (
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-center">
              <p className="text-xs text-gray-500">pH</p>
              <p className="text-2xl font-bold text-purple-600">{analysis.ph_reading}</p>
            </div>
          )}
          {analysis.last_watered && (
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-center">
              <p className="text-xs text-gray-500">Last Watered</p>
              <p className="text-sm font-semibold text-gray-700">
                {new Date(analysis.last_watered).toLocaleDateString()}
              </p>
            </div>
          )}
          {analysis.moisture_reading == null && analysis.ph_reading == null && !analysis.last_watered && (
            <p className="text-xs text-gray-400 italic">No readings recorded — click Edit to add them.</p>
          )}
        </div>
      )}

      {/* Re-analysis status */}
      {reanalyzing && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Re-analyzing with AI based on updated readings…
        </div>
      )}
      {reanalyzeError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          Re-analysis failed: {reanalyzeError}
        </div>
      )}

      {/* User concerns */}
      {analysis.user_concerns && (
        <div className="bg-white rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Your observations</p>
          <p className="text-sm text-gray-700 italic">"{analysis.user_concerns}"</p>
        </div>
      )}

      {/* AI Summary */}
      <div>
        <h4 className={`text-sm font-semibold ${urgency.text} mb-1`}>AI Analysis</h4>
        <p className="text-sm text-gray-800">{analysis.ai_summary}</p>
      </div>

      {/* Recommendations */}
      {analysis.ai_recommendations.length > 0 && (
        <div>
          <h4 className={`text-sm font-semibold ${urgency.text} mb-2`}>Recommendations</h4>
          <ul className="space-y-1">
            {analysis.ai_recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-800">
                <span className="text-green-600 mt-0.5 shrink-0">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Photos */}
      {showPhotos && analysis.photos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Photos</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {analysis.photos.map((photo) => (
              <a key={photo.id} href={photo.public_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={photo.public_url}
                  alt={photo.photo_type}
                  className="w-full h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
