import { NextRequest, NextResponse } from 'next/server'
import { analyzeTree } from '@/lib/claude'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export const maxDuration = 60

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServiceClient()

    // Fetch analysis + photos
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*, analysis_photos(*)')
      .eq('id', id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Fetch tree info
    const { data: tree, error: treeError } = await supabase
      .from('trees')
      .select('*')
      .eq('id', analysis.tree_id)
      .single()

    if (treeError || !tree) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 })
    }

    const photos: { id: string; storage_path: string; photo_type: string }[] =
      analysis.analysis_photos ?? []

    // Download photos from storage and convert to base64
    const treePhotoBase64s: { data: string; mediaType: string }[] = []
    const meterPhotoBase64s: { data: string; mediaType: string }[] = []

    for (const photo of photos) {
      const { data: blob, error: downloadError } = await supabase.storage
        .from('tree-photos')
        .download(photo.storage_path)

      if (downloadError || !blob) continue

      const arrayBuffer = await blob.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mediaType = (blob.type && blob.type !== 'application/octet-stream')
        ? blob.type
        : 'image/jpeg'

      if (photo.photo_type === 'meter') {
        meterPhotoBase64s.push({ data: base64, mediaType })
      } else {
        treePhotoBase64s.push({ data: base64, mediaType })
      }
    }

    // Re-run Claude analysis with current readings
    const aiResult = await analyzeTree({
      treeSpecies: tree.species,
      treeName: tree.name,
      lastWatered: analysis.last_watered,
      moistureReading: analysis.moisture_reading ?? undefined,
      phReading: analysis.ph_reading ?? undefined,
      userConcerns: analysis.user_concerns ?? undefined,
      treePhotoBase64s,
      meterPhotoBase64s,
    })

    // Persist updated AI results
    const { data: updated, error: updateError } = await supabase
      .from('analyses')
      .update({
        ai_summary: aiResult.summary,
        ai_recommendations: aiResult.recommendations,
        ai_urgency: aiResult.urgency,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      ai_summary: updated.ai_summary,
      ai_recommendations: updated.ai_recommendations,
      ai_urgency: updated.ai_urgency,
    })
  } catch (err) {
    console.error('Reanalyze error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Reanalysis failed' },
      { status: 500 }
    )
  }
}
