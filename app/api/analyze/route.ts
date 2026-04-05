import { NextRequest, NextResponse } from 'next/server'
import { analyzeTree } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase'

export const maxDuration = 60

async function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return { data: base64, mediaType: file.type }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()

    const treeId = form.get('tree_id') as string
    const treeName = form.get('tree_name') as string
    const treeSpecies = form.get('tree_species') as string
    const lastWatered = form.get('last_watered') as string
    const moistureStr = form.get('moisture_reading') as string | null
    const phStr = form.get('ph_reading') as string | null
    const userConcerns = form.get('user_concerns') as string | null

    const moistureReading = moistureStr ? parseFloat(moistureStr) : undefined
    const phReading = phStr ? parseFloat(phStr) : undefined

    const treePhotoFiles = form.getAll('tree_photos') as File[]
    const meterPhotoFiles = form.getAll('meter_photos') as File[]

    // Convert images to base64 for Claude
    const [treePhotoBase64s, meterPhotoBase64s] = await Promise.all([
      Promise.all(treePhotoFiles.map(fileToBase64)),
      Promise.all(meterPhotoFiles.map(fileToBase64)),
    ])

    // Run Claude analysis
    const aiResult = await analyzeTree({
      treeSpecies,
      treeName,
      lastWatered,
      moistureReading,
      phReading,
      userConcerns: userConcerns || undefined,
      treePhotoBase64s,
      meterPhotoBase64s,
    })

    // Use extracted readings if not manually provided
    const finalMoisture = moistureReading ?? aiResult.extractedMoisture
    const finalPh = phReading ?? aiResult.extractedPh

    const supabase = createServiceClient()

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        tree_id: treeId,
        last_watered: lastWatered,
        moisture_reading: finalMoisture ?? null,
        ph_reading: finalPh ?? null,
        user_concerns: userConcerns || null,
        ai_summary: aiResult.summary,
        ai_recommendations: aiResult.recommendations,
        ai_urgency: aiResult.urgency,
      })
      .select()
      .single()

    if (analysisError) throw analysisError

    // Upload photos and create photo records
    const allPhotos = [
      ...treePhotoFiles.map((f) => ({ file: f, type: 'tree' as const })),
      ...meterPhotoFiles.map((f) => ({ file: f, type: 'meter' as const })),
    ]

    if (allPhotos.length > 0) {
      const photoRecords = await Promise.all(
        allPhotos.map(async ({ file, type }) => {
          const ext = file.name.split('.').pop() || 'jpg'
          const path = `${analysis.id}/${type}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('tree-photos')
            .upload(path, file, { cacheControl: '3600' })

          if (uploadError) throw uploadError

          return { analysis_id: analysis.id, storage_path: path, photo_type: type }
        })
      )

      await supabase.from('analysis_photos').insert(photoRecords)
    }

    // Update tree's last_analysis_at
    await supabase
      .from('trees')
      .update({ last_analysis_at: new Date().toISOString() })
      .eq('id', treeId)

    return NextResponse.json({
      analysisId: analysis.id,
      extractedMoisture: aiResult.extractedMoisture,
      extractedPh: aiResult.extractedPh,
      finalMoisture,
      finalPh,
      summary: aiResult.summary,
      recommendations: aiResult.recommendations,
      urgency: aiResult.urgency,
    })
  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
