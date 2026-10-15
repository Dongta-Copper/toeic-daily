import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import { ERROR_TYPES, type Feedback, type Sentence } from '@/lib/situation'

export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const { sentence, answer }: { sentence: Sentence; answer: string } = await req.json()
    if (!answer?.trim()) return NextResponse.json({ error: 'empty answer' }, { status: 400 })

    const prompt = `Bạn là giáo viên tiếng Anh giàu kinh nghiệm, dạy một kỹ sư quản lý dự án xây dựng người Việt (trình độ khoảng B1–B2, đang luyện IELTS).

Học viên được yêu cầu dịch câu tiếng Việt sau sang tiếng Anh:
"${sentence.vietnamese}"

Câu trả lời của học viên:
"${answer.trim()}"

Câu mẫu tham khảo (chỉ là MỘT cách viết, không phải duy nhất): "${sentence.english}"
Trình độ mục tiêu: ${sentence.level}. Điểm ngữ pháp trọng tâm: ${sentence.notes || '(không có)'}

Nhiệm vụ: chấm CÂU CỦA HỌC VIÊN theo chính nó. Nếu câu đúng ngữ pháp, tự nhiên và giữ đúng ý câu tiếng Việt thì là đúng, kể cả khi khác câu mẫu. KHÔNG bắt lỗi chỉ vì khác câu mẫu.

Trả về JSON đúng cấu trúc sau:
{
  "verdict": "correct" | "minor" | "incorrect",
  "score": số nguyên 0-10,
  "summary": "1-2 câu nhận xét tổng quát bằng tiếng Việt",
  "errors": [
    {
      "wrong": "đoạn học viên viết sai (trích nguyên văn)",
      "correct": "đoạn sửa lại",
      "type": một trong: ${Object.keys(ERROR_TYPES).join(', ')},
      "explanation": "giải thích ngắn gọn bằng tiếng Việt vì sao sai và quy tắc đúng"
    }
  ],
  "corrected": "câu của học viên sau khi sửa tối thiểu (giữ nguyên cách diễn đạt của học viên nếu có thể)",
  "natural": [
    { "text": "cách viết tự nhiên hơn, như người bản xứ trong môi trường công việc", "note": "vì sao cách này hay hơn, bằng tiếng Việt" }
  ]
}

Quy tắc:
- "correct": không có lỗi. "minor": lỗi nhỏ (dấu câu, mạo từ, cách dùng hơi gượng) nhưng vẫn hiểu đúng ý. "incorrect": sai ngữ pháp rõ ràng hoặc sai ý.
- Nếu verdict là "correct" thì "errors" là mảng rỗng và "corrected" giống câu học viên.
- Thiếu dấu chấm cuối câu hoặc viết hoa đầu câu thì KHÔNG tính là lỗi.
- "natural": đưa 2-3 cách viết khác nhau, tự nhiên, đúng ngữ cảnh công trường/văn phòng; không lặp lại y nguyên câu mẫu.`

    const fb = await generateJSON<Feedback>(prompt)
    fb.errors = (fb.errors ?? []).map((e) => ({ ...e, type: e.type in ERROR_TYPES ? e.type : 'other' }))
    fb.natural = fb.natural ?? []
    return NextResponse.json(fb)
  } catch (e) {
    console.error('Situation feedback error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return NextResponse.json({ error: 'AI chưa phản hồi được. Vui lòng thử lại.', detail }, { status: 500 })
  }
}
