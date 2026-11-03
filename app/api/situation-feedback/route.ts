import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import { ERROR_TYPES, type Feedback, type Sentence } from '@/lib/situation'
import { USER_HEADER, isOwner } from '@/lib/session'

export const maxDuration = 120

const MAX_ANSWER_CHARS = 1000

export async function POST(req: Request) {
  // The API key and its quota are the owner's, so other accounts cannot use it.
  const user = req.headers.get(USER_HEADER)
  if (!user || !isOwner(user)) return NextResponse.json({ error: 'Tài khoản này không dùng được AI chấm. Bạn có thể tự chấm với câu mẫu.' }, { status: 403 })
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.' }, { status: 503 })

  try {
    const { sentence, answer }: { sentence: Sentence; answer: string } = await req.json()
    const text = answer?.trim()
    if (!text) return NextResponse.json({ error: 'Chưa có câu để chấm.' }, { status: 400 })
    if (text.length > MAX_ANSWER_CHARS) return NextResponse.json({ error: 'Câu quá dài để chấm.' }, { status: 400 })

    const prompt = `Bạn là giáo viên tiếng Anh dạy một kỹ sư quản lý dự án xây dựng người Việt (trình độ B1–B2, đang luyện IELTS). Học viên dịch một câu tiếng Việt sang tiếng Anh; bạn chấm câu đó và viết mọi nhận xét bằng tiếng Việt.

Câu tiếng Việt: "${sentence.vietnamese}"
Học viên viết: "${text}"
Câu mẫu tham khảo: "${sentence.english}"
Trình độ mục tiêu: ${sentence.level}. Điểm ngữ pháp trọng tâm: ${sentence.notes || '(không có)'}

Chấm câu của học viên theo chính nó. Câu đúng ngữ pháp, tự nhiên và giữ đúng ý tiếng Việt thì là đúng, kể cả khi khác câu mẫu, vì câu mẫu chỉ là một cách viết.

Trả về JSON đúng cấu trúc sau:
{
  "verdict": "correct" | "minor" | "incorrect",
  "score": số nguyên 0-10,
  "summary": "1-2 câu nhận xét",
  "errors": [
    {
      "wrong": "trích nguyên văn đoạn sai",
      "correct": "đoạn sửa",
      "type": một trong: ${Object.keys(ERROR_TYPES).join(', ')},
      "explanation": "vì sao sai và quy tắc đúng"
    }
  ],
  "corrected": "câu của học viên sau khi sửa tối thiểu, giữ cách diễn đạt của học viên",
  "natural": [
    { "text": "cách viết tự nhiên trong môi trường công trường/văn phòng, khác câu mẫu", "note": "vì sao hay hơn" }
  ]
}

Quy tắc:
- "correct": không có lỗi. "minor": lỗi nhỏ (mạo từ, cách dùng hơi gượng) nhưng vẫn đúng ý. "incorrect": sai ngữ pháp rõ ràng hoặc sai ý.
- Câu đúng thì "errors" rỗng và "corrected" giữ nguyên câu học viên.
- Thiếu dấu chấm cuối câu hoặc viết hoa đầu câu không tính là lỗi.
- "natural": đưa 1-2 cách viết.`

    // One deadline across retries and the fallback model, so the call ends inside maxDuration.
    const fb = await generateJSON<Feedback>(prompt, { deadline: Date.now() + 110000 })
    return NextResponse.json({
      ...fb,
      score: Math.min(10, Math.max(0, Math.round(Number(fb.score) || 0))),
      errors: (fb.errors ?? []).map((e) => ({ ...e, type: e.type in ERROR_TYPES ? e.type : 'other' })),
      natural: fb.natural ?? [],
    })
  } catch (e) {
    console.error('Situation feedback error:', e)
    const detail = e instanceof Error ? e.message : String(e)
    if (/\b429\b|quota/i.test(detail)) return NextResponse.json({ error: 'AI đã hết lượt miễn phí hoặc đang quá tải. Bạn thử lại sau, hoặc tự chấm với câu mẫu.' }, { status: 429 })
    return NextResponse.json({ error: `AI chưa chấm được. Vui lòng thử lại. (${detail.slice(0, 200)})` }, { status: 502 })
  }
}
