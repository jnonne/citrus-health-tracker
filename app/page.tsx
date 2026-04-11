import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getPhotoUrl } from '@/lib/supabase'
import TreeCard from '@/components/TreeCard'
import { Tree } from '@/lib/types'

export const revalidate = 0

export interface TreeSummary {
  moisture_reading?: number | null
  ph_reading?: number | null
  ai_urgency: 'good' | 'monitor' | 'attention' | 'urgent'
  ai_recommendations: string[]
  photoUrl?: string
}

async function getTrees(): Promise<Tree[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}

async function getLatestSummaries(treeIds: string[]): Promise<Record<string, TreeSummary>> {
  if (!treeIds.length) return {}
  const supabase = await createSupabaseServerClient()

  // Fetch latest analysis per tree (just the fields we need for the card)
  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, tree_id, moisture_reading, ph_reading, ai_urgency, ai_recommendations')
    .in('tree_id', treeIds)
    .order('created_at', { ascending: false })

  if (!analyses?.length) return {}

  // Keep only the most recent analysis per tree
  const latestByTree: Record<string, typeof analyses[0]> = {}
  for (const a of analyses) {
    if (!latestByTree[a.tree_id]) latestByTree[a.tree_id] = a
  }

  // Fetch one tree-type photo per latest analysis
  const analysisIds = Object.values(latestByTree).map(a => a.id)
  const { data: photos } = await supabase
    .from('analysis_photos')
    .select('analysis_id, storage_path')
    .in('analysis_id', analysisIds)
    .eq('photo_type', 'tree')

  const result: Record<string, TreeSummary> = {}
  for (const [treeId, analysis] of Object.entries(latestByTree)) {
    const photo = photos?.find(p => p.analysis_id === analysis.id)
    result[treeId] = {
      moisture_reading: analysis.moisture_reading,
      ph_reading: analysis.ph_reading,
      ai_urgency: analysis.ai_urgency,
      ai_recommendations: analysis.ai_recommendations ?? [],
      photoUrl: photo ? getPhotoUrl(photo.storage_path) : undefined,
    }
  }
  return result
}

export default async function HomePage() {
  const trees = await getTrees()
  const summaries = await getLatestSummaries(trees.map(t => t.id))

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Citrus Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">AI-powered tree health monitoring</p>
        </div>
        <Link href="/tree/new">
          <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
            + Add Tree
          </button>
        </Link>
      </div>

      {trees.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍋</div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No trees yet</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-6">
            Add your first citrus tree to get started
          </p>
          <Link href="/tree/new">
            <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors">
              Add Your First Tree
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {trees.map((tree) => (
            <TreeCard key={tree.id} tree={tree} summary={summaries[tree.id]} />
          ))}
        </div>
      )}
    </div>
  )
}
