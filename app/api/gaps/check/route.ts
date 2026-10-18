import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'

export const maxDuration = 120

type Body = { sentenceWrong: string; sentenceCorrect: string; correct: string; wrong?: string; answer: string }

export async function POST(req: Request) {
  try {
    const b: Body = await req.json()
    if (!b.answer?.trim()) return NextResponse.json({ error: 'empty answer' }, { status: 400 })

    const prompt = `Học viên (người Việt, B1–B2) từng viết câu sai: "${b.sentenceWrong}"
Lỗi chính: "${b.wrong ?? ''}" → phải là "${b.correct}". Câu sửa mẫu: "${b.sentenceCorrect}"

Bây giờ học viên viết lại: "${b.answer.trim()}"

Đánh giá: học viên đã sửa ĐÚNG lỗi chính chưa, và câu viết lại có lỗi ngữ pháp mới nào không. Không bắt buộc giống câu mẫu; chấp nhận cách diễn đạt khác nếu đúng và tự nhiên. Thiếu dấu chấm cuối câu không tính là lỗi.

Trả về JSON:
{ "ok": true | false, "feedback": "1–2 câu tiếng Việt", "corrected": "câu của học viên sau khi sửa (giữ cách diễn đạt của học viên)" }
ok = true chỉ khi lỗi chính đã được sửa và không có lỗi ngữ pháp đáng kể.`

    return NextResponse.json(await generateJSON<{ ok: boolean; feedback: string; corrected: string }>(prompt, { timeoutMs: 45000 }))
  } catch (e) {
    console.error('Gap check error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return NextResponse.json({ error: `AI chưa chấm được. Vui lòng thử lại. (${detail})` }, { status: 500 })
  }
}
