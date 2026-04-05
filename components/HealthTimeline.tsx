import { Analysis } from '@/lib/types'

const URGENCY_ORDER = { good: 0, monitor: 1, attention: 2, urgent: 3 }
const URGENCY_COLOR = {
  good:      { dot: 'bg-green-500',  label: 'Healthy',          text: 'text-green-700' },
  monitor:   { dot: 'bg-yellow-400', label: 'Monitor',          text: 'text-yellow-700' },
  attention: { dot: 'bg-orange-500', label: 'Needs Attention',  text: 'text-orange-700' },
  urgent:    { dot: 'bg-red-500',    label: 'Urgent',           text: 'text-red-700'   },
}

function trend(analyses: Analysis[]): { label: string; icon: string; color: string } | null {
  if (analyses.length < 2) return null
  const sorted = [...analyses].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const oldest = URGENCY_ORDER[sorted[0].ai_urgency]
  const newest = URGENCY_ORDER[sorted[sorted.length - 1].ai_urgency]
  if (newest < oldest) return { label: 'Improving', icon: '↗', color: 'text-green-600' }
  if (newest > oldest) return { label: 'Declining', icon: '↘', color: 'text-red-600' }
  return { label: 'Stable', icon: '→', color: 'text-gray-500' }
}

interface Props {
  analyses: Analysis[]
}

export default function HealthTimeline({ analyses }: Props) {
  if (analyses.length === 0) return null

  const sorted = [...analyses].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const t = trend(analyses)
  const latest = sorted[sorted.length - 1]
  const latestConfig = URGENCY_COLOR[latest.ai_urgency]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Health Progress</h2>
        {t && (
          <span className={`text-sm font-semibold ${t.color} flex items-center gap-1`}>
            {t.icon} {t.label}
          </span>
        )}
      </div>

      {/* Current status */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${latestConfig.dot}`} />
        <span className={`text-sm font-medium ${latestConfig.text}`}>
          Currently: {latestConfig.label}
        </span>
        <span className="text-xs text-gray-400">
          as of {new Date(latest.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Timeline dots */}
      {sorted.length > 1 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">History ({sorted.length} checks)</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {sorted.map((a, i) => {
              const cfg = URGENCY_COLOR[a.ai_urgency]
              const isLatest = i === sorted.length - 1
              return (
                <div key={a.id} className="group relative">
                  <div className={`w-4 h-4 rounded-full ${cfg.dot} ${isLatest ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-80'} transition-transform group-hover:scale-125 cursor-default`} />
                  {/* Tooltip */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    {new Date(a.created_at).toLocaleDateString()}: {cfg.label}
                    {a.moisture_reading != null && ` · ${a.moisture_reading}% moisture`}
                    {a.ph_reading != null && ` · pH ${a.ph_reading}`}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-3 mt-3 flex-wrap">
            {(Object.entries(URGENCY_COLOR) as [keyof typeof URGENCY_COLOR, typeof URGENCY_COLOR[keyof typeof URGENCY_COLOR]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs text-gray-500">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moisture & pH trend if data available */}
      {sorted.some(a => a.moisture_reading != null || a.ph_reading != null) && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.some(a => a.moisture_reading != null) && (() => {
            const readings = sorted.filter(a => a.moisture_reading != null)
            const first = readings[0].moisture_reading!
            const last = readings[readings.length - 1].moisture_reading!
            const diff = last - first
            return (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Moisture trend</p>
                <p className="text-sm font-semibold text-blue-600">
                  {last}%
                  {readings.length > 1 && (
                    <span className={`ml-1 text-xs font-normal ${diff < 0 ? 'text-red-500' : diff > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                      {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} from first check
                    </span>
                  )}
                </p>
              </div>
            )
          })()}
          {sorted.some(a => a.ph_reading != null) && (() => {
            const readings = sorted.filter(a => a.ph_reading != null)
            const first = readings[0].ph_reading!
            const last = readings[readings.length - 1].ph_reading!
            const diff = last - first
            return (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">pH trend</p>
                <p className="text-sm font-semibold text-purple-600">
                  {last}
                  {readings.length > 1 && (
                    <span className={`ml-1 text-xs font-normal ${Math.abs(diff) < 0.3 ? 'text-gray-400' : 'text-amber-500'}`}>
                      {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} from first check
                    </span>
                  )}
                </p>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
