export type TreeSpecies =
  | 'navel_orange'
  | 'valencia_orange'
  | 'meyer_lemon'
  | 'eureka_lemon'
  | 'persian_lime'
  | 'key_lime'
  | 'grapefruit'
  | 'mandarin'
  | 'tangerine'
  | 'kumquat'
  | 'other'

export interface Tree {
  id: string
  name: string
  species: TreeSpecies
  location?: string
  notes?: string
  created_at: string
  last_analysis_at?: string
}

export interface Analysis {
  id: string
  tree_id: string
  created_at: string
  last_watered: string
  moisture_reading?: number
  ph_reading?: number
  user_concerns?: string
  ai_summary: string
  ai_recommendations: string[]
  ai_urgency: 'good' | 'monitor' | 'attention' | 'urgent'
  photos: AnalysisPhoto[]
}

export interface AnalysisPhoto {
  id: string
  analysis_id: string
  storage_path: string
  photo_type: 'tree' | 'meter'
  public_url: string
}

export interface AnalysisFormData {
  tree_id: string
  last_watered: string
  moisture_reading?: number
  ph_reading?: number
  user_concerns?: string
  tree_photos: File[]
  meter_photos: File[]
}
