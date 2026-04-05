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
}

export default function TreeCard({ tree }: Props) {
  const lastAnalysis = tree.last_analysis_at
    ? new Date(tree.last_analysis_at).toLocaleDateString()
    : 'Never analyzed'

  return (
    <Link href={`/tree/${tree.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-green-300 transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{tree.name}</h3>
            <p className="text-sm text-green-700 font-medium">{SPECIES_LABELS[tree.species] ?? tree.species}</p>
            {tree.location && (
              <p className="text-xs text-gray-500 mt-1">📍 {tree.location}</p>
            )}
          </div>
          <span className="text-3xl">🌿</span>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Last check: {lastAnalysis}</span>
          <span className="text-xs text-green-600 font-medium">View →</span>
        </div>
      </div>
    </Link>
  )
}
