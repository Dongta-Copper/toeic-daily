import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import { ERROR_TYPES, type Attempt, type WeaknessReport } from '@/lib/situation'

export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const { attempts }: { attempts: Attempt[] } = await req.json()
    const mistakes = attempts.filter((a) => a.verdict !== 'correct').slice(0, 80)

    if (mistakes.length === 0) {
      return NextResponse.json({ error: 'Chưa có câu sai nào trong khoảng thời gian này để phân tích.' }, { status: 400 })
    }

    const counts: Record<string, number> = {}
    for (const a of mistakes) for (const e of a.errors) counts[e.type] = (counts[e.type] ?? 0) + 1

    const list = mistakes
      .map(
        (a, i) =>
          `${i + 1}. VN: "${a.vietnamese}"\n   Học viên viết: "${a.answer}"\n   Lỗi: ${
            a.errors.map((e) => `[${e.type}] "${e.wrong}" → "${e.correct}"`).join('; ') || '(diễn đạt chưa tự nhiên)'
          }`
      )
      .join('\n')

    const prompt = `Bạn là giáo viên tiếng Anh, đang phân tích bài luyện dịch Việt → Anh của một kỹ sư quản lý dự án xây dựng người Việt (đang làm gói thầu ghế chờ cho nhà ga sân bay, luyện IELTS).

Trong giai đoạn này học viên làm ${attempts.length} câu, trong đó ${mistakes.length} câu chưa đúng hoàn toàn.
Thống kê số lỗi theo loại: ${JSON.stringify(counts)}
Danh sách loại lỗi hợp lệ: ${Object.keys(ERROR_TYPES).join(', ')}

Các câu sai:
${list}

Trả về JSON đúng cấu trúc:
{
  "overview": "đánh giá tổng quan 2-3 câu bằng tiếng Việt",
  "weaknesses": [
    {
      "type": "một loại lỗi trong danh sách hợp lệ",
      "level": "Yếu" | "Trung bình" | "Cần chú ý",
      "explanation": "học viên đang sai theo kiểu gì, quy tắc đúng là gì (tiếng Việt)",
      "examples": [{ "wrong": "...", "correct": "..." }],
      "tips": "mẹo cụ thể để khắc phục (tiếng Việt)"
    }
  ],
  "studyPlan": ["3-5 việc nên làm trong tuần tới, cụ thể, bằng tiếng Việt"],
  "practiceSentences": [
    {
      "scenario": "A" | "B" | "C",
      "english": "câu tiếng Anh mẫu, tự nhiên, chuyên nghiệp",
      "vietnamese": "bản dịch tiếng Việt chính xác",
      "topic": "chủ đề ngắn bằng tiếng Anh",
      "level": "B1" | "B2" | "C1" | "C2",
      "focus": "điểm ngữ pháp luyện tập, ngắn gọn bằng tiếng Anh"
    }
  ]
}

Yêu cầu:
- "weaknesses": 3-5 điểm yếu quan trọng nhất, sắp xếp từ nặng đến nhẹ, chỉ dựa trên dữ liệu thật ở trên.
- "practiceSentences": ĐÚNG 10 câu: 4 câu scenario "A" (công việc xây dựng, công trường, nhà máy, hồ sơ, nghiệm thu), 4 câu scenario "B" (giao tiếp, suy ngẫm, làm việc nhóm, phát triển bản thân), 2 câu scenario "C" (câu phức kiểu IELTS, C1-C2). Mỗi câu phải cố ý luyện đúng các điểm yếu ở trên.`

    const report = await generateJSON<WeaknessReport>(prompt)
    return NextResponse.json(report)
  } catch (e) {
    console.error('Situation report error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return NextResponse.json({ error: `AI chưa phân tích được. Vui lòng thử lại. (${detail})` }, { status: 500 })
  }
}
