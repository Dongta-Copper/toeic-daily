import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import { ERROR_TYPES, type Feedback, type Sentence } from '@/lib/situation'

export const maxDuration = 180

// Grades up to 10 sentences in one AI call.
export async function POST(req: Request) {
  try {
    const { items }: { items: { sentence: Sentence; answer: string }[] } = await req.json()
    const list = (items ?? []).filter((i) => i.answer?.trim()).slice(0, 12)
    if (!list.length) return NextResponse.json({ error: 'Chưa có câu nào để chấm.' }, { status: 400 })

    const prompt = `Bạn là giáo viên tiếng Anh giàu kinh nghiệm, dạy một kỹ sư quản lý dự án xây dựng người Việt (B1–B2, luyện IELTS). Học viên dịch ${list.length} câu tiếng Việt sang tiếng Anh. Chấm TỪNG câu theo chính câu của học viên: đúng ngữ pháp, tự nhiên và giữ đúng ý thì là đúng, kể cả khi khác câu mẫu.

${list
  .map(
    (it, i) => `### Câu ${i + 1}
Tiếng Việt: "${it.sentence.vietnamese}"
Học viên viết: "${it.answer.trim()}"
Câu mẫu tham khảo: "${it.sentence.english}" (trình độ ${it.sentence.level})`
  )
  .join('\n\n')}

Trả về JSON: { "results": [ ... đúng ${list.length} phần tử, theo thứ tự câu 1 → ${list.length} ... ] }
Mỗi phần tử:
{
  "verdict": "correct" | "minor" | "incorrect",
  "score": 0-10,
  "summary": "1 câu nhận xét tiếng Việt",
  "errors": [ { "wrong": "trích nguyên văn đoạn sai", "correct": "đoạn sửa", "type": một trong ${Object.keys(ERROR_TYPES).join(', ')}, "explanation": "ngắn gọn, tiếng Việt" } ],
  "corrected": "câu học viên sau khi sửa tối thiểu",
  "natural": [ { "text": "1 cách viết tự nhiên hơn trong môi trường công việc", "note": "vì sao, tiếng Việt" } ]
}
Quy tắc: "minor" = lỗi nhỏ nhưng đúng ý; "incorrect" = sai ngữ pháp rõ hoặc sai ý; câu đúng thì errors rỗng. Thiếu dấu chấm cuối hoặc viết hoa đầu câu không tính lỗi.`

    const out = await generateJSON<{ results: Feedback[] }>(prompt, { timeoutMs: 90000 })
    const results = (out.results ?? []).slice(0, list.length).map((fb) => ({
      ...fb,
      errors: (fb.errors ?? []).map((e) => ({ ...e, type: e.type in ERROR_TYPES ? e.type : 'other' })),
      natural: fb.natural ?? [],
    }))
    if (results.length !== list.length) throw new Error(`AI trả về ${results.length}/${list.length} câu`)
    return NextResponse.json({ results })
  } catch (e) {
    console.error('Batch feedback error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 200) : String(e)
    return NextResponse.json({ error: `AI chưa chấm được. Vui lòng thử lại. (${detail})` }, { status: 500 })
  }
}
