import Link from 'next/link'
import { Tree } from '@/lib/types'

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

interface Props {
  tree: Tree
  latestPhotoUrl?: string
}

export default function TreeCard({ tree, latestPhotoUrl }: Props) {
  const lastAnalysis = tree.last_analysis_at
    ? new Date(tree.last_analysis_at).toLocaleDateString()
    : 'Never analyzed'

  return (
    <Link href={`/tree/${tree.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{tree.name}</h3>
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              {SPECIES_LABELS[tree.species] ?? tree.species}
            </p>
            {tree.location && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📍 {tree.location}</p>
            )}
          </div>

          {latestPhotoUrl ? (
            <img
              src={latestPhotoUrl}
              alt={tree.name}
              className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-600 shrink-0"
            />
          ) : (
            <span className="text-4xl shrink-0">🌿</span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">Last check: {lastAnalysis}</span>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">View →</span>
        </div>
      </div>
    </Link>
  )
}
