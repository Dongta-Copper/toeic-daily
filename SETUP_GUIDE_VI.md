# Hướng dẫn cài đặt TOEIC-Daily trên máy tính (Windows)

Dành cho người chưa có kinh nghiệm lập trình. Làm lần lượt từng bước, không bỏ bước nào.

---

## 0. Những điều cần biết trước

| Mục | Thực tế trong repo |
|---|---|
| Địa chỉ repo | `https://github.com/Dongta-Copper/toeic-daily.git` (**Copper**, không phải *Cooper*) |
| Công nghệ | **Next.js 16** + React 19 + TypeScript + Tailwind CSS |
| Nơi chứa câu hỏi | File `public/data.json` (hoặc Google Sheets nếu có cấu hình) |
| Nơi lưu lịch sử làm bài | **Vercel KV (Upstash Redis)** — không phải Firebase |
| Phân tích AI | Google Gemini (cần khóa `GEMINI_API_KEY`) |
| Địa chỉ chạy thử | **http://localhost:3000** (không phải 5173) |
| Tài khoản đăng nhập | `Dongta` / `123456789` (ghi cứng trong `lib/auth.ts`) |

---

## 1. Cài phần mềm cần thiết (chỉ làm 1 lần)

1. **Node.js** (phiên bản 20 trở lên): tải tại https://nodejs.org → chọn bản **LTS** → cài, bấm Next liên tục.
2. **Git**: tải tại https://git-scm.com/download/win → cài, bấm Next liên tục.
3. **VS Code** (để xem/sửa code): https://code.visualstudio.com

Kiểm tra đã cài đúng: mở **PowerShell** (bấm phím Windows, gõ `PowerShell`, Enter), gõ từng dòng:

```powershell
node --version
git --version
```

Nếu hiện số phiên bản (ví dụ `v24.16.0`) là được.

---

## 2. Tải code về máy

Trong PowerShell:

```powershell
cd $HOME\Desktop
git clone https://github.com/Dongta-Copper/toeic-daily.git
cd toeic-daily
```

Sau bước này, trên Desktop sẽ có thư mục `toeic-daily`.

> Nếu báo `Repository not found`: kiểm tra lại chữ **Copper** trong địa chỉ.

---

## 3. Cài thư viện

Vẫn trong thư mục `toeic-daily`:

```powershell
npm install
```

Chờ 1–3 phút. Kết thúc sẽ thấy dòng kiểu `added 361 packages`.

> Dòng cảnh báo `14 vulnerabilities` là bình thường, **không** chạy `npm audit fix --force` (có thể làm hỏng app).

---

## 4. Chạy app trên máy

```powershell
npm run dev
```

Khi thấy dòng `✓ Ready`, mở trình duyệt vào **http://localhost:3000**.

- Muốn dừng server: bấm `Ctrl + C` trong PowerShell.
- Muốn chạy lại: mở PowerShell, `cd $HOME\Desktop\toeic-daily`, rồi `npm run dev`.

### Đã kiểm tra (15/10/2026)

| Trang | Kết quả |
|---|---|
| `/` Trang chủ | ✅ |
| `/quiz/5`, `/quiz/6`, `/quiz/7` | ✅ |
| `/history` | ✅ |
| `/api/sessions` | ✅ (trả về danh sách rỗng) |

### Giới hạn khi chạy trên máy

- **Lịch sử làm bài không được lưu** khi chạy local, vì máy chưa có khóa kết nối Vercel KV. Bản trên Vercel thì vẫn lưu bình thường.
- **Nút phân tích AI không hoạt động** khi chạy local, vì thiếu `GEMINI_API_KEY`.

Muốn hai tính năng này chạy trên máy, tạo file `.env.local` trong thư mục `toeic-daily` với nội dung (lấy giá trị trong Vercel → Project `toeic-daily` → **Settings → Environment Variables**):

```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
GEMINI_API_KEY=...
```

Hoặc cài Vercel CLI rồi tải tự động:

```powershell
npm i -g vercel
vercel login
vercel link        # chọn dongta-s-projects / toeic-daily
vercel env pull .env.local
```

> ⚠️ Lưu ý: khi dùng khóa KV thật, bài làm trên máy sẽ ghi vào **cùng dữ liệu** với bản đang chạy trên mạng.
> File `.env.local` đã nằm trong `.gitignore`, sẽ không bị đẩy lên GitHub — **không** dán các khóa này vào chỗ khác.

---

## 5. Cấu trúc thư mục (để biết sửa ở đâu)

```
toeic-daily/
├── app/
│   ├── page.tsx              ← Trang chủ (danh sách Part 5/6/7)
│   ├── quiz/[part]/page.tsx  ← Trang làm bài theo Part
│   ├── history/page.tsx      ← Trang lịch sử
│   └── api/
│       ├── sessions/route.ts ← Lưu/đọc lịch sử (Vercel KV)
│       └── analyze/route.ts  ← Phân tích AI (Gemini)
├── components/               ← Navbar, Part5Quiz, Part67Quiz, AuthGuard
├── lib/                      ← auth.ts, history.ts, sheets.ts
└── public/data.json          ← Ngân hàng câu hỏi TOEIC
```

---

## 6. Chế độ "Practice Situation" (đã thêm)

Bấm nút **Situation** trên thanh trên cùng (hoặc thẻ "Practice Situation" ở trang chủ). Nút **TOEIC** đưa về chế độ cũ, không thay đổi gì.

### Nội dung

- 47 ngày (15/10 → 30/11/2026) × 10 câu = **470 câu**.
- Mỗi ngày: **A** – Công việc/Xây dựng (4 câu), **B** – Giao tiếp/Suy ngẫm (4 câu), **C** – Câu phức kiểu IELTS (2 câu).
- Độ khó tăng dần: ngày 1–25 chủ yếu B1–B2, ngày 26–40 B2–C1, ngày 41–47 C1–C2.

### Cách học mỗi ngày

1. Mở **Situation** → bấm thẻ **Hôm nay** (tự nhận theo ngày trên máy).
2. Mỗi câu: đọc câu tiếng Việt → tự gõ câu tiếng Anh → bấm **Kiểm tra** (hoặc `Ctrl + Enter`).
3. Câu mẫu hiện ra: **xanh** = từ bạn đã viết đúng, **cam** = từ còn thiếu. Bấm 🔊 để nghe phát âm. Dòng **Note** là điểm ngữ pháp cần chú ý.
4. Tự chấm: **Nhớ rồi** hoặc **Cần ôn**.
5. Chấm đủ 10 câu → **Hoàn thành ngày** → tiến độ được lưu, chuyển sang ngày tiếp theo.

> Lần đầu có thể bỏ trống ô nhập rồi bấm **Xem câu mẫu** để đọc – nghe trước, sau đó làm lại.

### AI chấm câu & báo cáo điểm yếu (Google Gemini)

- Gõ câu rồi bấm **Kiểm tra** → AI (Gemini) chấm **câu của bạn** (Đúng / Gần đúng / Chưa đúng, điểm /10), chỉ ra từng lỗi kèm loại ngữ pháp, đưa câu đã sửa và 2–3 **cách viết tự nhiên hơn** (có nút 🔊). Mất khoảng 10–20 giây.
- Mỗi lần làm được ghi lại. Vào **Situation → Báo cáo điểm yếu** để xem thống kê 7/14/30 ngày và số lỗi theo loại.
- Bấm **AI phân tích điểm yếu** (mất khoảng 1 phút) → nhận: điểm yếu chính, ví dụ sai/đúng, mẹo, kế hoạch tuần tới và **10 câu luyện mới nhắm đúng điểm yếu**. Bấm **Copy CSV** rồi dán vào cuối `public/situation.csv` (xem bên dưới) để thêm thành một ngày học mới.
- Nếu thấy "AI chưa phản hồi được (… high demand …)": máy chủ Google đang quá tải tạm thời, đợi một lát rồi bấm Kiểm tra lại. Khóa AI nằm trong Vercel → Settings → Environment Variables → `GEMINI_API_KEY`.

### Sửa hoặc thêm câu

Toàn bộ nội dung nằm trong **một file**: `public/situation.csv` (mở bằng Excel được).

- Giữ nguyên tên cột ở dòng đầu: `day,date,scenario,sentence_number,scenario_type,english_sentence,vietnamese_context,topic,difficulty_level,notes`
- Muốn thêm ngày 48, 49…: thêm dòng mới với `day` và `date` tương ứng.
- Khi lưu từ Excel, chọn **CSV UTF-8** để không lỗi dấu tiếng Việt.

**Cách 1 — Sửa nhanh trên trang GitHub (không cần cài gì, làm được trên điện thoại):**

1. Mở https://github.com/Dongta-Copper/toeic-daily/blob/main/public/situation.csv (đăng nhập GitHub).
2. Bấm biểu tượng **bút chì ✏️** (Edit this file) ở góc phải.
3. Sửa chữ hoặc thêm dòng ở cuối file. Mỗi câu một dòng, câu có dấu phẩy thì phải đặt trong ngoặc kép `"..."`.
4. Bấm **Commit changes…** → **Commit changes**.
5. Chờ 1–2 phút, web tự cập nhật.

**Cách 2 — Sửa nhiều bằng Excel trên máy:**

1. Mở `C:\Users\vando\Desktop\toeic-daily\public\situation.csv` bằng Excel, sửa xong **Save As → CSV UTF-8**.
2. Đưa lên mạng bằng 3 lệnh ở mục **Đưa lên mạng** bên dưới (hoặc nhờ Claude Code chạy giúp và kiểm tra file trước khi đẩy).

> Nếu file CSV bị lỗi định dạng, những dòng lỗi sẽ không hiện trên web. Nhờ Claude kiểm tra file là cách an toàn nhất.

### Tiến độ được lưu ở đâu

- Trên Vercel: lưu vào Vercel KV với key riêng `situation_progress` (không đụng dữ liệu TOEIC).
- Khi chạy trên máy chưa có khóa KV: lưu tạm trong trình duyệt (localStorage).

### Các file đã thêm/sửa

| File | Vai trò |
|---|---|
| `public/situation.csv` | 470 câu |
| `lib/situation.ts`, `lib/situationData.ts` | Kiểu dữ liệu, đọc CSV, so sánh câu, lưu tiến độ |
| `app/situation/page.tsx` | Danh sách 47 ngày |
| `app/situation/[day]/page.tsx` | Trang luyện tập từng ngày |
| `components/SituationDayList.tsx`, `components/SituationPractice.tsx` | Giao diện |
| `app/api/situation-progress/route.ts` | API lưu tiến độ |
| `components/Navbar.tsx`, `app/page.tsx` | Nút chuyển TOEIC ↔ Situation |

### Đưa lên mạng

```powershell
cd $HOME\Desktop\toeic-daily
git add .
git commit -m "Add Practice Situation mode"
git push
```

Vercel tự động triển khai lên https://toeic-daily-lac.vercel.app sau 1–2 phút.
