import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import type { Lesson, QuizQ } from '@/lib/lessons'

export const maxDuration = 60

type Body = {
  mode: 'quiz' | 'lesson'
  count?: number
  base: { title: string; rules: string[] }
  focus?: string // narrower topic for a new lesson
  avoid?: string[] // question texts already used
  myErrors?: { wrong: string; correct: string }[]
}

const QUIZ_SPEC = (n: number) => `${n} questions as a JSON array "quiz". Mix two kinds:
- About 60%: {"kind":"choose","q":"sentence with ___ gap or a short question","options":["…","…","…"],"answer":<index of correct option>,"why":"short reason in Vietnamese"}. 2-4 options, exactly one correct.
- About 40%: {"kind":"fix","q":"Sửa cụm gạch chân","sentence":"a full English sentence that contains one mistake","wrong":"the exact wrong phrase as it appears in sentence","answer":"the corrected phrase only","alts":["other fully correct phrasings, if any"],"why":"short reason in Vietnamese"}.
Rules: workplace context (construction projects, site, contracts, emails, meetings); natural British/international business English; vary the vocabulary; "wrong" must appear verbatim in "sentence".
Coverage: spread the questions over ALL the lesson rules (each rule at least once, then the most error-prone ones again). Every item is one complete, realistic sentence with enough context to decide the answer — never a bare phrase. The "why" names the rule in Vietnamese (e.g. "Có mốc quá khứ 'yesterday' → quá khứ đơn").
Quality (most important):
- In "choose" items every distractor must be clearly WRONG English in that sentence. Never offer two acceptable options (e.g. "make/reach/take a decision" — "take a decision" is fine British English; "face/encounter problems"). If unsure, drop the item.
- In "fix" items the wrong phrase must be a genuine grammar or word error that any teacher would mark wrong (e.g. "discuss about", "informations", "meet difficulties"). Never mark a grammatical phrase as wrong just because another is more idiomatic (e.g. "not meet the deadline" is correct). Put every other correct answer in "alts".`

function valid(q: QuizQ): boolean {
  if (!q || typeof q.q !== 'string' || typeof q.why !== 'string') return false
  if (q.kind === 'fix') return typeof q.answer === 'string' && !!q.answer.trim() && (!q.wrong || !q.sentence || q.sentence.includes(q.wrong))
  return Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length
}

export async function POST(req: Request) {
  try {
    const b: Body = await req.json()
    const n = Math.min(Math.max(b.count ?? 10, 1), 10)
    const ctx = `Lesson: "${b.base.title}"\nRules:\n- ${b.base.rules.join('\n- ')}`
    const mine = b.myErrors?.length
      ? `\nThe learner (Vietnamese construction project manager) actually made these mistakes; build similar items:\n${b.myErrors
          .slice(0, 8)
          .map((e) => `- "${e.wrong}" → "${e.correct}"`)
          .join('\n')}`
      : ''
    const avoid = b.avoid?.length ? `\nDo not repeat these questions:\n${b.avoid.slice(0, 30).map((q) => `- ${q}`).join('\n')}` : ''

    if (b.mode === 'quiz') {
      // The quality rules make the model drop items now and then; ask again for what is missing.
      const quiz: QuizQ[] = []
      for (let round = 0; round < 2 && quiz.length < n; round++) {
        const need = n - quiz.length
        const fixes = Math.max(1, Math.round(need * 0.4))
        const used = quiz.length ? `\nAlso avoid these new ones:\n${quiz.map((q) => `- ${q.q} ${q.kind === 'fix' ? q.sentence ?? '' : ''}`).join('\n')}` : ''
        const out = await generateJSON<{ quiz: QuizQ[] }>(
          `You write English grammar/vocabulary exercises for a Vietnamese learner (target IELTS 6.5).\n${ctx}${mine}${avoid}${used}\nReturn JSON {"quiz": [...]} with exactly ${QUIZ_SPEC(need)}\nInclude exactly ${fixes} "fix" items.`,
          { timeoutMs: 28000 }
        ).catch(() => ({ quiz: [] as QuizQ[] }))
        quiz.push(...(out.quiz ?? []).filter(valid).slice(0, need))
      }
      if (!quiz.length) throw new Error('no valid questions')
      return NextResponse.json({ quiz })
    }

    const out = await generateJSON<Omit<Lesson, 'type' | 'minutes'>>(
      `You write short English lessons in Vietnamese for a Vietnamese construction project manager (target IELTS 6.5).
Parent lesson for context:\n${ctx}
New lesson topic (narrower or related): "${b.focus || b.base.title}".${mine}
Write it like a good grammar reference (e.g. Cambridge Grammar for IELTS): clear sections, each rule with a pattern, a workplace example and a warning about the typical mistake.
Return JSON {"title": "Vietnamese title", "theory": [{"heading":"short heading","points":[{"rule":"rule in Vietnamese with the English pattern","ex":"English workplace example","warn":"optional: wrong ✗ → right ✓"}]}] (3 sections, 2-4 points each), "rules": ["the 3-5 most important rules, one line each, Vietnamese"], "examples": [{"en":"…","vi":"…"}] (3 examples), "trap": [{"wrong":"…","right":"…","why":"Vietnamese"}] (3 typical mistakes of Vietnamese speakers), "quiz": [...]} where quiz is ${QUIZ_SPEC(10)}`,
      { timeoutMs: 55000 }
    )
    const quiz = (out.quiz ?? []).filter(valid)
    if (!out.title || !out.rules?.length || quiz.length < 5) throw new Error('incomplete lesson')
    return NextResponse.json({ lesson: { ...out, quiz } })
  } catch (e) {
    const detail = e instanceof Error ? e.message.slice(0, 200) : String(e)
    return NextResponse.json({ error: detail }, { status: 500 })
  }
}
