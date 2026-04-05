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

export default function AnalysisResult({ analysis, showPhotos = true }: Props) {
  const urgency = URGENCY_CONFIG[analysis.ai_urgency]
  const date = new Date(analysis.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className={`rounded-2xl border ${urgency.border} ${urgency.bg} p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{date}</span>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${urgency.bg} ${urgency.text} border ${urgency.border}`}>
          {urgency.icon} {urgency.label}
        </span>
      </div>

      {/* Readings */}
      <div className="flex gap-4">
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
      </div>

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
          <div className="grid grid-cols-3 gap-2">
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
