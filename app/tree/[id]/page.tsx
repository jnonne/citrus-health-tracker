import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getPhotoUrl } from '@/lib/supabase'
import AnalysisResult from '@/components/AnalysisResult'
import HealthTimeline from '@/components/HealthTimeline'
import { Tree, Analysis } from '@/lib/types'

export const revalidate = 0

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

async function getTree(id: string): Promise<Tree | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('trees').select('*').eq('id', id).single()
  return data ?? null
}

async function getAnalyses(treeId: string): Promise<Analysis[]> {
  const supabase = await createSupabaseServerClient()
  const { data: analyses } = await supabase
    .from('analyses')
    .select('*, analysis_photos(*)')
    .eq('tree_id', treeId)
    .order('created_at', { ascending: false })

  if (!analyses) return []

  return analyses.map((a) => ({
    ...a,
    photos: (a.analysis_photos ?? []).map((p: { id: string; analysis_id: string; storage_path: string; photo_type: 'tree' | 'meter' }) => ({
      ...p,
      public_url: getPhotoUrl(p.storage_path),
    })),
  }))
}

export default async function TreeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [tree, analyses] = await Promise.all([getTree(id), getAnalyses(id)])

  if (!tree) notFound()

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← All Trees</Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{tree.name}</h1>
            <p className="text-sm text-green-700 font-medium">{SPECIES_LABELS[tree.species] ?? tree.species}</p>
            {tree.location && <p className="text-xs text-gray-500 mt-1">📍 {tree.location}</p>}
            {tree.notes && <p className="text-xs text-gray-500 mt-2">{tree.notes}</p>}
          </div>
          <span className="text-4xl">🌿</span>
        </div>
        <div className="mt-4">
          <Link href={`/tree/${tree.id}/analyze`}>
            <button className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors">
              Run New Analysis
            </button>
          </Link>
        </div>
      </div>

      {/* Health progress timeline */}
      <HealthTimeline analyses={analyses} />

      {/* Analysis history */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Analysis History {analyses.length > 0 && `(${analyses.length})`}
      </h2>

      {analyses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">No analyses yet. Run your first analysis above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <AnalysisResult key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  )
}
