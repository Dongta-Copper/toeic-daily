import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import { validateSection, type Section } from '@/lib/ielts'

export const maxDuration = 300

const BRIEF: Record<1 | 2 | 3, string> = {
  1: `Section 1 (everyday life): 2 short texts (about 200–250 words each), e.g. adverts for courses or holiday accommodation, a notice, a timetable, product instructions, a list of services. One text should be a set of labelled items A–E (or A–F) for a matching_features task. Questions 1–14: e.g. 6–7 matching_features + 7–8 tfng.`,
  2: `Section 2 (workplace): 2 texts (about 250–300 words each), e.g. a staff handbook extract, a job description, a company policy, guidance on training or applying for jobs. Questions 15–27: e.g. 6–7 note_completion (NO MORE THAN TWO WORDS) or matching_headings on one text, and 6–7 mcq / short_answer / sentence_completion on the other.`,
  3: `Section 3 (general interest, the hardest): 1 long text of 750–900 words in 6–8 paragraphs labelled A, B, C…, on a topic like history, science, society, technology or the environment, written in a neutral, informative style with some complex sentences. Questions 28–40: e.g. 5–6 matching_headings or matching_info, 4 tfng, and 3–4 summary_completion / sentence_completion or mcq.`,
}

const SCHEMA = `Return JSON exactly in this shape:
{
  "number": 1 | 2 | 3,
  "title": "Section N",
  "texts": [ { "id": "A", "title": "…", "paragraphs": [ { "label": "A" (optional, needed for headings / matching_info / matching_features), "heading": "optional", "text": "…" } ] } ],
  "groups": [
    {
      "id": "g1",
      "type": "tfng" | "mcq" | "matching_features" | "matching_headings" | "matching_info" | "sentence_completion" | "summary_completion" | "note_completion" | "short_answer",
      "textId": "A",
      "instructions": "official-style IELTS instructions, including the word limit for completion tasks",
      "options": [ { "key": "A", "text": "…" } ]  (shared options for matching tasks; headings use keys i, ii, iii… and must include at least 2 extra headings that do not fit),
      "template": "notes or summary text with gaps written as {15}, {16}… (only for note_completion / summary_completion)",
      "maxWords": 2 (completion tasks only),
      "questions": [
        {
          "n": 15,
          "prompt": "statement / question / sentence with ___ for the gap (not needed when a template is used)",
          "options": [ { "key": "A", "text": "…" } ] (mcq only, 4 options A–D),
          "answer": ["main answer", "acceptable variant"],
          "evidence": "an EXACT, word-for-word quote copied from the text that proves the answer (empty string only for NOT GIVEN when nothing is relevant)",
          "explanation": "1–2 sentences in Vietnamese explaining why, and why the main distractor is wrong",
          "paraphrase": "question wording ↔ text wording (English), or empty"
        }
      ]
    }
  ]
}`

const RULES = `Quality rules (this is for a learner targeting General Training band 6.5):
- Original text; do not copy published IELTS material.
- Questions must test paraphrase: avoid using the same words as the text in statements and options.
- TFNG: include TRUE, FALSE and NOT GIVEN answers; NOT GIVEN statements must be plausible but genuinely not addressed.
- Answers for completion tasks must be copied exactly from the text and respect the word limit.
- Every question needs exactly one correct answer. MCQ distractors must be clearly wrong according to the text.
- Questions within a group follow the order of the text (except matching tasks).`

export async function POST(req: Request) {
  try {
    const { number }: { number: 1 | 2 | 3 } = await req.json()
    if (![1, 2, 3].includes(number)) return NextResponse.json({ error: 'invalid section' }, { status: 400 })

    let prompt = `You are an experienced IELTS item writer. Write ONE new IELTS General Training Reading section.

${BRIEF[number]}

${RULES}

${SCHEMA}`

    // Up to three rounds: a broken response is retried; a draft that fails the checks is sent back with the problems.
    for (let round = 0; round < 3; round++) {
      let draft: Omit<Section, 'id'>
      try {
        draft = await generateJSON<Omit<Section, 'id'>>(prompt, { timeoutMs: 120000, attemptsPerModel: 1, temperature: 0.7 })
      } catch (e) {
        if (round < 2 && e instanceof SyntaxError) continue
        throw e
      }
      const stamp = Date.now()
      const section: Section = {
        ...draft,
        number,
        id: `ai-${stamp}`,
        title: `AI Section ${number}`,
        groups: (draft.groups ?? []).map((g, i) => ({ ...g, id: `ai-${stamp}-g${i + 1}` })),
      }
      const problems = validateSection(section)
      const count = section.groups.reduce((n, g) => n + (g.questions?.length ?? 0), 0)
      if (count < 10) problems.push(`only ${count} questions; write 12–14`)
      if (!problems.length) return NextResponse.json({ section })
      prompt = `${prompt}\n\nYour previous draft had these problems:\n- ${problems.join('\n- ')}\n\nPrevious draft:\n${JSON.stringify(draft)}\n\nReturn a corrected version of the whole section in the same JSON shape.`
    }
    return NextResponse.json({ error: 'AI chưa tạo được đề đạt yêu cầu kiểm tra. Vui lòng thử lại.' }, { status: 502 })
  } catch (e) {
    console.error('IELTS generate error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return NextResponse.json({ error: `AI chưa tạo được đề. Vui lòng thử lại. (${detail})` }, { status: 500 })
  }
}
