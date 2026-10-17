import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import type { SentenceCheck } from '@/lib/phrases'

export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const { phrase, meaning, example, sentence }: { phrase: string; meaning: string; example: string; sentence: string } =
      await req.json()
    if (!sentence?.trim()) return NextResponse.json({ error: 'empty sentence' }, { status: 400 })

    const prompt = `Bạn là giáo viên tiếng Anh. Học viên (kỹ sư quản lý dự án xây dựng người Việt) được yêu cầu tự đặt một câu có dùng cụm từ "${phrase}" (nghĩa: ${meaning}; ví dụ: "${example}").

Câu của học viên: "${sentence.trim()}"

Đánh giá: học viên có dùng cụm "${phrase}" ĐÚNG (đúng giới từ / kết hợp từ, đúng nghĩa, đúng ngữ pháp xung quanh cụm) hay không. Lỗi nhỏ không liên quan đến cụm (ví dụ thiếu dấu chấm) không làm câu bị tính sai, nhưng hãy nhắc trong nhận xét.

Trả về JSON:
{
  "ok": true | false,
  "feedback": "1-3 câu nhận xét bằng tiếng Việt: dùng cụm đúng/sai ở đâu, vì sao",
  "corrected": "câu của học viên sau khi sửa (giữ ý của học viên); nếu đã đúng hoàn toàn thì chép lại nguyên câu"
}`
    return NextResponse.json(await generateJSON<SentenceCheck>(prompt))
  } catch (e) {
    console.error('Phrase check error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return NextResponse.json({ error: `AI chưa chấm được. Vui lòng thử lại. (${detail})` }, { status: 500 })
  }
}
