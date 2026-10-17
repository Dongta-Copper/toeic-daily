import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import { ERROR_TYPES, type DrillSet, type WeaknessReport } from '@/lib/situation'

export const maxDuration = 120

type Body = {
  focus: string
  weakness?: WeaknessReport['weaknesses'][number]
  mistakes: { vietnamese: string; answer: string; wrong: string; correct: string }[]
}

export async function POST(req: Request) {
  try {
    const { focus, weakness, mistakes }: Body = await req.json()
    const label = ERROR_TYPES[focus] ?? focus

    const prompt = `Bạn là giáo viên tiếng Anh, đang thiết kế bài luyện tập để sửa MỘT điểm yếu cụ thể cho một kỹ sư quản lý dự án xây dựng người Việt (đang làm gói thầu ghế chờ nhà ga sân bay: shop drawing, nhà máy, lắp đặt, QC, nghiệm thu, hợp đồng; đang luyện IELTS).

Điểm yếu cần luyện: ${label} (mã: ${focus})
${weakness ? `Nhận xét trước đó: ${weakness.explanation}\nVí dụ lỗi: ${weakness.examples.map((e) => `"${e.wrong}" → "${e.correct}"`).join('; ')}` : ''}
Các lỗi thật của học viên ở loại này:
${mistakes.length ? mistakes.map((m, i) => `${i + 1}. VN: "${m.vietnamese}" | viết: "${m.answer}" | lỗi: "${m.wrong}" → "${m.correct}"`).join('\n') : '(chưa có dữ liệu)'}

Trả về JSON đúng cấu trúc:
{
  "rule": "bài học ngắn 3-5 câu bằng tiếng Việt: quy tắc cốt lõi và mẹo nhận biết, nhắm đúng kiểu sai của học viên",
  "examples": [{ "wrong": "câu sai điển hình", "correct": "câu đúng" }],
  "items": [
    {
      "kind": "translate" | "fix",
      "vietnamese": "câu tiếng Việt (ý nghĩa của câu đúng)",
      "wrong": "chỉ với kind=fix: câu tiếng Anh CHỨA ĐÚNG lỗi ${label}, các phần khác đúng",
      "english": "câu tiếng Anh đúng, tự nhiên, chuyên nghiệp",
      "hint": "gợi ý ngắn bằng tiếng Việt về chỗ cần chú ý, KHÔNG nói thẳng đáp án",
      "level": "B1" | "B2" | "C1"
    }
  ]
}

Yêu cầu:
- "examples": 2-3 cặp.
- "items": ĐÚNG 8 câu: 4 câu kind "translate" rồi 4 câu kind "fix", độ khó tăng dần.
- Mọi câu phải buộc học viên dùng đúng điểm ngữ pháp "${label}" (ví dụ: nếu là số ít/số nhiều thì câu phải chứa danh từ đếm được/không đếm được dễ nhầm như feedback, equipment, information, progress, cement).
- Bối cảnh: 5 câu công việc xây dựng/dự án, 3 câu giao tiếp/suy ngẫm cá nhân. Không lặp lại câu học viên đã làm.`

    const drill = await generateJSON<Omit<DrillSet, 'focus' | 'createdAt'>>(prompt)
    const items = (drill.items ?? []).filter((it) => it.vietnamese && it.english && (it.kind !== 'fix' || it.wrong))
    return NextResponse.json({ ...drill, items, focus, createdAt: new Date().toISOString() } satisfies DrillSet)
  } catch (e) {
    console.error('Situation drill error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return NextResponse.json({ error: `AI chưa tạo được bài luyện. Vui lòng thử lại. (${detail})` }, { status: 500 })
  }
}
