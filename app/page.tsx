import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import TreeCard from '@/components/TreeCard'
import { Tree } from '@/lib/types'

export const revalidate = 0

async function getTrees(): Promise<Tree[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}

export default async function HomePage() {
  const trees = await getTrees()

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citrus Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered tree health monitoring</p>
        </div>
        <Link href="/tree/new">
          <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
            + Add Tree
          </button>
        </Link>
      </div>

      {/* Tree list */}
      {trees.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍋</div>
          <h2 className="text-lg font-semibold text-gray-700">No trees yet</h2>
          <p className="text-sm text-gray-400 mt-1 mb-6">Add your first citrus tree to get started</p>
          <Link href="/tree/new">
            <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors">
              Add Your First Tree
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {trees.map((tree) => (
            <TreeCard key={tree.id} tree={tree} />
          ))}
        </div>
      )}
    </div>
  )
}
