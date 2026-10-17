import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import type { IeltsAnalysis } from '@/lib/ielts'

export const maxDuration = 120

type Mistake = { type: string; question: string; answer: string; correct: string; explanation: string }

export async function POST(req: Request) {
  try {
    const { stats, mistakes, band }: { stats: Record<string, { right: number; total: number }>; mistakes: Mistake[]; band: number | null } =
      await req.json()
    if (!mistakes.length) return NextResponse.json({ error: 'Chưa có câu sai để phân tích.' }, { status: 400 })

    const prompt = `Bạn là giáo viên luyện thi IELTS General Training Reading. Học viên là kỹ sư quản lý dự án xây dựng người Việt, mục tiêu band 6.5 (khoảng 32/40 câu đúng).
Band ước tính hiện tại: ${band ?? 'chưa có bài thi đủ đề'}.
Tỷ lệ đúng theo dạng câu hỏi: ${JSON.stringify(stats)}

Các câu sai gần đây:
${mistakes
  .slice(0, 60)
  .map((m, i) => `${i + 1}. [${m.type}] ${m.question} | học viên: "${m.answer || '(bỏ trống)'}" | đáp án: "${m.correct}" | ${m.explanation}`)
  .join('\n')}

Trả về JSON:
{
  "overview": "2-3 câu tiếng Việt: đang ở đâu so với mục tiêu 6.5, cần thêm bao nhiêu câu đúng",
  "weaknesses": [
    { "type": "tên dạng câu hỏi", "level": "Yếu" | "Trung bình" | "Cần chú ý", "pattern": "học viên đang sai theo kiểu gì (dựa trên dữ liệu thật)", "strategy": "chiến lược làm bài cụ thể để sửa" }
  ],
  "plan": ["3-5 việc cụ thể cho tuần tới, ví dụ: làm 2 bài TFNG mỗi ngày, luyện Section 3 có bấm giờ 20 phút…"]
}
"weaknesses": 2-4 mục, sắp xếp theo mức độ ảnh hưởng đến điểm.`

    return NextResponse.json(await generateJSON<IeltsAnalysis>(prompt, { timeoutMs: 60000 }))
  } catch (e) {
    console.error('IELTS analyze error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return NextResponse.json({ error: `AI chưa phân tích được. Vui lòng thử lại. (${detail})` }, { status: 500 })
  }
}
