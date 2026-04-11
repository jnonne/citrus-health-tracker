import Link from 'next/link'
import { Tree } from '@/lib/types'
import { TreeSummary } from '@/app/page'

const SPECIES_LABELS: Record<string, string> = {
  navel_orange: 'Navel Orange',
  valencia_orange: 'Valencia Orange',
  meyer_lemon: 'Meyer Lemon',
  eureka_lemon: 'Eureka Lemon',
  persian_lime: 'Persian Lime',
  key_lime: 'Key Lime',
  grapefruit: 'Grapefruit',
  mandarin: 'Mandarin',
  tangerine: 'Tangerine',
  kumquat: 'Kumquat',
  other: 'Citrus Tree',
}

const URGENCY = {
  good:      { label: 'Healthy',         dot: 'bg-green-500',  badge: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' },
  monitor:   { label: 'Monitor',         dot: 'bg-yellow-400', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' },
  attention: { label: 'Needs Attention', dot: 'bg-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' },
  urgent:    { label: 'Urgent',          dot: 'bg-red-500',    badge: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300' },
}

interface Props {
  tree: Tree
  summary?: TreeSummary
}

export default function TreeCard({ tree, summary }: Props) {
  const lastAnalysis = tree.last_analysis_at
    ? new Date(tree.last_analysis_at).toLocaleDateString()
    : null

  const urgency = summary ? URGENCY[summary.ai_urgency] : null

  // Show up to 3 recommendations, trimmed to ~60 chars so they stay brief
  const recs = (summary?.ai_recommendations ?? [])
    .slice(0, 3)
    .map(r => r.length > 65 ? r.slice(0, 62).trimEnd() + '…' : r)

  return (
    <Link href={`/tree/${tree.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all cursor-pointer">

        {/* Top row: name/species/location + photo */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">{tree.name}</h3>
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              {SPECIES_LABELS[tree.species] ?? tree.species}
            </p>
            {tree.location && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">📍 {tree.location}</p>
            )}
          </div>

          {summary?.photoUrl ? (
            <img
              src={summary.photoUrl}
              alt={tree.name}
              className="w-32 h-32 rounded-xl object-cover border border-gray-200 dark:border-gray-600 shrink-0"
            />
          ) : (
            <span className="text-4xl shrink-0">🌿</span>
          )}
        </div>

        {/* Health summary — only shown if there's an analysis */}
        {summary && (
          <div className="mt-3 space-y-2">
            {/* Status badge + readings on one line */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${urgency!.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${urgency!.dot}`} />
                {urgency!.label}
              </span>
              {summary.moisture_reading != null && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  💧 {summary.moisture_reading}%
                </span>
              )}
              {summary.ph_reading != null && (
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  pH {summary.ph_reading}
                </span>
              )}
            </div>

            {/* Action items */}
            {recs.length > 0 && (
              <ul className="space-y-0.5">
                {recs.map((rec, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-gray-600 dark:text-gray-400 leading-snug">
                    <span className="text-green-500 dark:text-green-400 shrink-0 mt-px">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {lastAnalysis ? `Last check: ${lastAnalysis}` : 'Never analyzed'}
          </span>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">View →</span>
        </div>
      </div>
    </Link>
  )
}
