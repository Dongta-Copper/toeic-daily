import { GoogleGenerativeAI } from '@google/generative-ai'

// "gemini-flash-latest" always points to Google's newest Flash model, so it is not retired like fixed versions.
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'

export async function generateJSON<T>(prompt: string): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
  })
  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/^```(?:json)?\s*|\s*```$/g, '')
  return JSON.parse(text) as T
}
