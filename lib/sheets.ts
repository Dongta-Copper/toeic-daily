import Papa from 'papaparse'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Part5Question = {
  id: string
  question: string
  options: { A: string; B: string; C: string; D: string }
  answer: string
  explanation: string
}

export type SubQuestion = {
  id: string
  question: string
  options: { A: string; B: string; C: string; D: string }
  answer: string
  explanation: string
}

export type Passage = {
  id: string
  passage: string
  questions: SubQuestion[]
}

// ─── Fetch helper (cache 10 minutes on Vercel) ────────────────────────────────

async function fetchCSV(sheetId: string, gid: string): Promise<Record<string, string>[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
  const res = await fetch(url, { next: { revalidate: 600 } })
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)
  const text = await res.text()
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })
  return data
}

// ─── Part 5 ───────────────────────────────────────────────────────────────────
// Sheet columns: id | question | A | B | C | D | answer | explanation

export async function getPart5FromSheets(): Promise<Part5Question[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID
  const gid = process.env.GOOGLE_SHEET_GID_PART5 ?? '0'
  if (!sheetId) return []

  const rows = await fetchCSV(sheetId, gid)
  return rows
    .filter((r) => r.id && r.question && r.answer)
    .map((r) => ({
      id: r.id.trim(),
      question: r.question.trim(),
      options: { A: r.A.trim(), B: r.B.trim(), C: r.C.trim(), D: r.D.trim() },
      answer: r.answer.trim().toUpperCase(),
      explanation: r.explanation?.trim() ?? '',
    }))
}

// ─── Part 6 & 7 ───────────────────────────────────────────────────────────────
// Sheet columns: passage_id | passage | question_id | question | A | B | C | D | answer | explanation

export async function getPart67FromSheets(part: 6 | 7): Promise<Passage[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID
  const gid =
    part === 6
      ? (process.env.GOOGLE_SHEET_GID_PART6 ?? '')
      : (process.env.GOOGLE_SHEET_GID_PART7 ?? '')
  if (!sheetId || !gid) return []

  const rows = await fetchCSV(sheetId, gid)
  const map = new Map<string, Passage>()

  for (const r of rows) {
    if (!r.passage_id || !r.question_id) continue
    if (!map.has(r.passage_id)) {
      map.set(r.passage_id, {
        id: r.passage_id.trim(),
        passage: r.passage.trim(),
        questions: [],
      })
    }
    map.get(r.passage_id)!.questions.push({
      id: r.question_id.trim(),
      question: r.question.trim(),
      options: { A: r.A.trim(), B: r.B.trim(), C: r.C.trim(), D: r.D.trim() },
      answer: r.answer.trim().toUpperCase(),
      explanation: r.explanation?.trim() ?? '',
    })
  }

  return Array.from(map.values())
}
