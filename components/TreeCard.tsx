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
  attention: { label: 'Attention',       dot: 'bg-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' },
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
  const recs = (summary?.ai_recommendations ?? [])
    .slice(0, 3)
    .map(r => r.length > 60 ? r.slice(0, 57).trimEnd() + '…' : r)

  return (
    <Link href={`/tree/${tree.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all cursor-pointer">
        <div className="flex gap-3">
          {/* Left: all text content */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{tree.name}</h3>
            <p className="text-xs text-green-700 dark:text-green-400 font-medium">
              {SPECIES_LABELS[tree.species] ?? tree.species}
            </p>

            {/* Status + readings — compact row right under species */}
            {summary && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-tight ${urgency!.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${urgency!.dot}`} />
                  {urgency!.label}
                </span>
                {summary.moisture_reading != null && (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    💧{summary.moisture_reading}%
                  </span>
                )}
                {summary.ph_reading != null && (
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                    pH{summary.ph_reading}
                  </span>
                )}
              </div>
            )}

            {/* Brief action items */}
            {recs.length > 0 && (
              <ul className="mt-1.5 space-y-px">
                {recs.map((rec, i) => (
                  <li key={i} className="flex gap-1 text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    <span className="text-green-500 dark:text-green-400 shrink-0">•</span>
                    <span className="line-clamp-1">{rec}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Footer inline */}
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
              {lastAnalysis ? `Last check: ${lastAnalysis}` : 'Never analyzed'}
            </p>
          </div>

          {/* Right: photo or leaf icon */}
          {summary?.photoUrl ? (
            <img
              src={summary.photoUrl}
              alt={tree.name}
              className="w-44 h-44 rounded-xl object-cover border border-gray-200 dark:border-gray-600 shrink-0"
            />
          ) : (
            <span className="text-5xl shrink-0 mt-2">🌿</span>
          )}
        </div>
      </div>
    </Link>
  )
}
