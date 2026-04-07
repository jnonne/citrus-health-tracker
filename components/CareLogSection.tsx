'use client'

import { useState, useEffect, useCallback } from 'react'

type CareType = 'watering' | 'fertilizer'

interface CareLog {
  id: string
  tree_id: string
  care_type: CareType
  care_date: string
  notes: string | null
  fertilizer_name: string | null
  fertilizer_amount: string | null
  created_at: string
}

interface Props {
  treeId: string
}

function formatDate(dateStr: string) {
  // Parse as local date (avoid UTC offset shifting the day)
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function CareLogSection({ treeId }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [logs, setLogs] = useState<CareLog[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<CareType | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form fields
  const [careDate, setCareDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [fertilizerName, setFertilizerName] = useState('')
  const [fertilizerAmount, setFertilizerAmount] = useState('')

  const loadLogs = useCallback(async () => {
    const res = await fetch(`/api/tree/${treeId}/care-logs`)
    if (res.ok) setLogs(await res.json())
    setLoading(false)
  }, [treeId])

  useEffect(() => { loadLogs() }, [loadLogs])

  function openForm(type: CareType) {
    setCareDate(today)
    setNotes('')
    setFertilizerName('')
    setFertilizerAmount('')
    setSaveError('')
    setAdding(type)
  }

  function cancelForm() { setAdding(null); setSaveError('') }

  async function submitLog(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    const res = await fetch(`/api/tree/${treeId}/care-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        care_type: adding,
        care_date: careDate,
        notes: notes.trim() || null,
        fertilizer_name: fertilizerName.trim() || null,
        fertilizer_amount: fertilizerAmount.trim() || null,
      }),
    })
    if (res.ok) {
      setAdding(null)
      await loadLogs()
    } else {
      const d = await res.json()
      setSaveError(d.error ?? 'Save failed')
    }
    setSaving(false)
  }

  async function deleteLog(id: string) {
    setDeleting(id)
    await fetch(`/api/care-logs/${id}`, { method: 'DELETE' })
    setLogs(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm ' +
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ' +
    'focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="mb-6">
      {/* Section header + action buttons */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Care History
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => openForm('watering')}
            className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
          >
            💧 Log Water
          </button>
          <button
            onClick={() => openForm('fertilizer')}
            className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-800/40 transition-colors"
          >
            🌱 Log Fertilizer
          </button>
        </div>
      </div>

      {/* Inline add form */}
      {adding && (
        <form
          onSubmit={submitLog}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {adding === 'watering' ? '💧 Log Watering' : '🌱 Log Fertilizer Application'}
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
            <input
              type="date" value={careDate} max={today} required
              onChange={e => setCareDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {adding === 'fertilizer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Fertilizer Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text" value={fertilizerName}
                  onChange={e => setFertilizerName(e.target.value)}
                  placeholder="e.g., Citrus-tone, 6-4-6"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Amount <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text" value={fertilizerAmount}
                  onChange={e => setFertilizerAmount(e.target.value)}
                  placeholder="e.g., 1 cup, 2 tbsp"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any observations…"
              className={inputClass}
            />
          </div>

          {saveError && <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={cancelForm}
              className="border border-gray-300 dark:border-gray-600 px-4 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Log list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 h-14 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No care events logged yet. Use the buttons above to record watering or fertilizer.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div
              key={log.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5 shrink-0">
                  {log.care_type === 'watering' ? '💧' : '🌱'}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {log.care_type === 'watering' ? 'Watered' : 'Fertilized'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(log.care_date)}
                    </span>
                  </div>
                  {log.care_type === 'fertilizer' && (log.fertilizer_name || log.fertilizer_amount) && (
                    <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                      {[log.fertilizer_name, log.fertilizer_amount].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {log.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.notes}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteLog(log.id)}
                disabled={deleting === log.id}
                title="Delete entry"
                className="text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors shrink-0 text-lg leading-none mt-0.5 disabled:opacity-40"
              >
                {deleting === log.id ? '…' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
