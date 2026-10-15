import { GoogleGenerativeAI } from '@google/generative-ai'

// "-latest" aliases always point to Google's newest models, so they are not retired like fixed versions.
// If the main model is overloaded (503) or rate-limited (429), fall back to the lighter one.
const MODELS = [process.env.GEMINI_MODEL || 'gemini-flash-latest', 'gemini-flash-lite-latest']

// Each call is capped so a slow model never leaves the user waiting for minutes.
const TIMEOUT_MS = 30000

function isTemporary(e: unknown): boolean {
  return e instanceof Error && /\b(503|429|500)\b|overloaded|high demand|abort|timeout/i.test(e.message)
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  const genAI = new GoogleGenerativeAI(apiKey)

  let lastError: unknown
  for (const name of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel(
          {
            model: name,
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
          },
          { timeout: TIMEOUT_MS }
        )
        const result = await model.generateContent(prompt)
        const text = result.response.text().replace(/^```(?:json)?\s*|\s*```$/g, '')
        return JSON.parse(text) as T
      } catch (e) {
        lastError = e
        if (!isTemporary(e)) throw e
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  throw lastError
}
