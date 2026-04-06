'use client'

import { useState } from 'react'
import { Analysis } from '@/lib/types'

const URGENCY_CONFIG = {
  good: {
    label: 'Healthy',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-green-700',
    icon: '✅',
  },
  monitor: {
    label: 'Monitor',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-700',
    icon: '👁️',
  },
  attention: {
    label: 'Needs Attention',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-700',
    icon: '⚠️',
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-700',
    icon: '🚨',
  },
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
      body: JSON.stringify({ moisture_reading: moisture, ph_reading: ph, last_watered: lastWatered }),
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
        <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${urgency.bg} ${urgency.text} border ${urgency.border}`}>
            {urgency.icon} {urgency.label}
          </span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
              title="Edit readings"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* Readings — view or edit */}
      {editing ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Edit Readings</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Moisture %</label>
              <input
                type="number" min="0" max="100" step="0.1"
                value={moisture} onChange={e => setMoisture(e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">pH</label>
              <input
                type="number" min="0" max="14" step="0.1"
                value={ph} onChange={e => setPh(e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Last Watered</label>
              <input
                type="date"
                value={lastWatered}
                onChange={e => setLastWatered(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="border border-gray-300 dark:border-gray-600 px-4 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 flex-wrap">
          {analysis.moisture_reading !== null && analysis.moisture_reading !== undefined && (
            <div className="bg-white dark:bg-gray-800/70 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Moisture</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analysis.moisture_reading}%</p>
            </div>
          )}
          {analysis.ph_reading !== null && analysis.ph_reading !== undefined && (
            <div className="bg-white dark:bg-gray-800/70 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">pH</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analysis.ph_reading}</p>
            </div>
          )}
          {analysis.last_watered && (
            <div className="bg-white dark:bg-gray-800/70 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Watered</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {new Date(analysis.last_watered).toLocaleDateString()}
              </p>
            </div>
          )}
          {analysis.moisture_reading == null && analysis.ph_reading == null && !analysis.last_watered && (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">No readings recorded — click Edit to add them.</p>
          )}
        </div>
      )}

      {/* Re-analysis status */}
      {reanalyzing && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Re-analyzing with AI based on updated readings…
        </div>
      )}
      {reanalyzeError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
          Re-analysis failed: {reanalyzeError}
        </div>
      )}

      {/* User concerns */}
      {analysis.user_concerns && (
        <div className="bg-white dark:bg-gray-800/70 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your observations</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{analysis.user_concerns}"</p>
        </div>
      )}

      {/* AI Summary */}
      <div>
        <h4 className={`text-sm font-semibold ${urgency.text} mb-1`}>AI Analysis</h4>
        <p className="text-sm text-gray-800 dark:text-gray-200">{analysis.ai_summary}</p>
      </div>

      {/* Recommendations */}
      {analysis.ai_recommendations.length > 0 && (
        <div>
          <h4 className={`text-sm font-semibold ${urgency.text} mb-2`}>Recommendations</h4>
          <ul className="space-y-1">
            {analysis.ai_recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-800 dark:text-gray-200">
                <span className="text-green-600 dark:text-green-400 mt-0.5 shrink-0">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Photos */}
      {showPhotos && analysis.photos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Photos</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {analysis.photos.map((photo) => (
              <a key={photo.id} href={photo.public_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={photo.public_url}
                  alt={photo.photo_type}
                  className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
