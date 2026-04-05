import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AnalysisInput {
  treeSpecies: string
  treeName: string
  lastWatered: string
  moistureReading?: number
  phReading?: number
  userConcerns?: string
  treePhotoBase64s: { data: string; mediaType: string }[]
  meterPhotoBase64s: { data: string; mediaType: string }[]
}

export interface AnalysisOutput {
  extractedMoisture?: number
  extractedPh?: number
  summary: string
  recommendations: string[]
  urgency: 'good' | 'monitor' | 'attention' | 'urgent'
}

export async function analyzeTree(input: AnalysisInput): Promise<AnalysisOutput> {
  const imageContent: Anthropic.ImageBlockParam[] = [
    ...input.treePhotoBase64s.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.data,
      },
    })),
    ...input.meterPhotoBase64s.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.data,
      },
    })),
  ]

  const meterSection =
    input.meterPhotoBase64s.length > 0
      ? `Meter photos are included — extract the moisture and pH values from them if visible.`
      : `No meter photos provided.`

  const manualReadings: string[] = []
  if (input.moistureReading !== undefined) manualReadings.push(`Moisture: ${input.moistureReading}%`)
  if (input.phReading !== undefined) manualReadings.push(`pH: ${input.phReading}`)

  const prompt = `You are an expert citrus tree horticulturist. Analyze the health of this citrus tree and provide actionable recommendations.

Tree information:
- Name: ${input.treeName}
- Species: ${input.treeSpecies.replace(/_/g, ' ')}
- Last watered: ${input.lastWatered}
${manualReadings.length > 0 ? `- Manual readings: ${manualReadings.join(', ')}` : ''}
${input.userConcerns ? `- User observations/concerns: ${input.userConcerns}` : ''}

${meterSection}

${input.treePhotoBase64s.length > 0 ? `${input.treePhotoBase64s.length} tree photo(s) are included for visual inspection.` : 'No tree photos provided.'}

Respond with a JSON object in this exact format:
{
  "extractedMoisture": <number or null — moisture % read from meter photo, null if not visible>,
  "extractedPh": <number or null — pH read from meter photo, null if not visible>,
  "summary": "<2-3 sentence plain-English summary of overall tree health>",
  "recommendations": [
    "<specific actionable recommendation 1>",
    "<specific actionable recommendation 2>",
    ...up to 6 recommendations
  ],
  "urgency": "<one of: good | monitor | attention | urgent>"
}

Urgency levels:
- good: Tree is healthy, no action needed beyond routine care
- monitor: Minor issues, keep an eye on it
- attention: Noticeable problems that should be addressed within 1-2 weeks
- urgent: Serious issue requiring immediate action

Return only the JSON object, no other text.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: imageContent.length > 0
          ? [...imageContent, { type: 'text', text: prompt }]
          : [{ type: 'text', text: prompt }],
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  // Strip markdown code fences if present (e.g. ```json ... ```)
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(text) as AnalysisOutput
  return parsed
}
