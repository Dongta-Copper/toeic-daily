import { GoogleGenerativeAI } from '@google/generative-ai'

// "-latest" aliases always point to Google's newest models, so they are not retired like fixed versions.
// If the main model is overloaded (503) or rate-limited (429), fall back to the lighter one.
const MODELS = [process.env.GEMINI_MODEL || 'gemini-flash-latest', 'gemini-flash-lite-latest']

// Each call is capped so a slow model never leaves the user waiting for minutes.
const TIMEOUT_MS = 30000

// Models that reported an exhausted quota are skipped for a while (per server instance).
const QUOTA_COOLDOWN_MS = 10 * 60000
const skipUntil = new Map<string, number>()

function isTemporary(e: unknown): boolean {
  // Malformed JSON (long outputs occasionally contain a stray comma) is also worth another try.
  return e instanceof SyntaxError || (e instanceof Error && /\b(503|429|500)\b|overloaded|high demand|abort|timeout/i.test(e.message))
}

/** Parses model output, repairing the most common JSON slips (code fences, trailing commas). */
export function parseModelJSON<T>(raw: string): T {
  const text = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
  try {
    return JSON.parse(text) as T
  } catch {
    return JSON.parse(text.replace(/,\s*([}\]])/g, '$1')) as T
  }
}

// deadline: absolute time (ms) by which all attempts must finish — keeps retries inside the function limit.
type Options = { timeoutMs?: number; attemptsPerModel?: number; temperature?: number; deadline?: number }

export async function generateJSON<T>(prompt: string, opts: Options = {}): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  const genAI = new GoogleGenerativeAI(apiKey)

  let lastError: unknown
  const models = MODELS.filter((m) => (skipUntil.get(m) ?? 0) < Date.now())
  if (!models.length) models.push(MODELS[MODELS.length - 1])
  for (const [mi, name] of models.entries()) {
    const isLast = mi === models.length - 1
    for (let attempt = 0; attempt < (opts.attemptsPerModel ?? 2); attempt++) {
      const left = opts.deadline ? opts.deadline - Date.now() : Infinity
      if (left < 5000) throw lastError ?? new Error('timeout: no time left for the AI call')
      // Leave time for the fallback model when this one is slow.
      const budget = Math.min(opts.timeoutMs ?? TIMEOUT_MS, isLast ? left : Math.max(8000, left / 2))
      try {
        const model = genAI.getGenerativeModel(
          {
            model: name,
            generationConfig: { responseMimeType: 'application/json', temperature: opts.temperature ?? 0.3 },
          },
          { timeout: budget }
        )
        const result = await model.generateContent(prompt)
        return parseModelJSON<T>(result.response.text())
      } catch (e) {
        lastError = e
        if (!isTemporary(e)) throw e
        // Quota exhausted: retrying is pointless — use the next model for a while.
        if (e instanceof Error && /quota/i.test(e.message)) {
          skipUntil.set(name, Date.now() + QUOTA_COOLDOWN_MS)
          break
        }
        // A timeout on the main model also moves on rather than waiting again.
        if (!isLast && e instanceof Error && /abort|timeout/i.test(e.message)) break
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  throw lastError
}
