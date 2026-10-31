// Verbs grouped by Vietnamese meaning: nuance, transitivity and what follows each verb.
// IPA is British English. One new group per study day (Mon–Sat); Sunday reviews the week.

export type Pattern = { form: string; ex: string; wrong: string; right: string; why: string }
export type VerbEntry = {
  verb: string
  ipa: string
  en: string // short English definition
  vi: string
  kind: 'Ngoại động từ' | 'Nội động từ' | 'Ngoại & nội động từ' | 'Cụm động từ'
  formality: 1 | 2 | 3 // 1 thân mật · 2 trung tính · 3 trang trọng
  nuance: string
  patterns: Pattern[]
}
export type VerbGroup = { id: string; vi: string; intro: string; tip: string; verbs: VerbEntry[] }

export const FORMALITY = { 1: 'Thân mật', 2: 'Trung tính', 3: 'Trang trọng' } as const

export const VERB_GROUPS: VerbGroup[] = [
  {
    id: 'request',
    vi: 'YÊU CẦU',
    intro: 'Năm động từ đều dịch là "yêu cầu" nhưng khác nhau về mức độ bắt buộc và độ lịch sự.',
    tip: 'Email lịch sự → request · Hợp đồng/quy định bắt buộc → require · Kỹ sư ra lệnh → instruct · Nói chuyện thường → ask · demand chỉ dùng khi tranh chấp.',
    verbs: [
      {
        verb: 'ask', ipa: '/ɑːsk/', en: 'to say that you want someone to do or give something', vi: 'đề nghị, nhờ', kind: 'Ngoại & nội động từ', formality: 2,
        nuance: 'Trung tính, dùng khi nói chuyện hoặc email nội bộ.',
        patterns: [
          { form: 'ask + sb + to V', ex: 'Could you ask the MEP team to check the levels?', wrong: 'ask the MEP team check the levels', right: 'ask the MEP team to check the levels', why: 'Sau ask + người phải có "to V".' },
          { form: 'ask + (sb) + for + N', ex: 'We asked the client for an extension of time.', wrong: 'We asked for to extend the deadline.', right: 'We asked to extend the deadline. / We asked for an extension.', why: 'for + danh từ; muốn dùng động từ thì bỏ for.' },
        ],
      },
      {
        verb: 'request', ipa: '/rɪˈkwest/', en: 'to ask for something formally or officially', vi: 'đề nghị (chính thức)', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Trang trọng, lịch sự — dùng nhiều nhất trong thư và email gửi Chủ đầu tư, Kỹ sư.',
        patterns: [
          { form: 'request + N', ex: 'We request your approval of the revised programme.', wrong: 'We request for your approval.', right: 'We request your approval.', why: 'Động từ request không có for (chỉ danh từ mới là "a request for").' },
          { form: 'request + that + sb + (should) V', ex: 'We request that the Engineer confirm the instruction in writing.', wrong: 'We request the Engineer confirms the instruction.', right: 'We request that the Engineer (should) confirm the instruction.', why: 'Sau request that dùng động từ nguyên mẫu (hoặc should + V).' },
          { form: 'be requested + to V', ex: 'You are requested to submit the method statement by Friday.', wrong: 'You are request to submit…', right: 'You are requested to submit…', why: 'Bị động cần V3: requested.' },
        ],
      },
      {
        verb: 'require', ipa: '/rɪˈkwaɪə/', en: 'to need something, or to make something necessary (by a rule or contract)', vi: 'yêu cầu bắt buộc, cần', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Bắt buộc theo hợp đồng, quy định, tiêu chuẩn. Không mang tính "nhờ".',
        patterns: [
          { form: 'require + N', ex: 'Hot work requires a permit to work.', wrong: 'Hot work is required a permit.', right: 'Hot work requires a permit.', why: 'Chủ ngữ là công việc cần thứ gì → chủ động require + N.' },
          { form: 'require + sb + to V / sb + be required to V', ex: 'The Contract requires the Contractor to submit a programme within 28 days.', wrong: 'The Contract requires to submit a programme.', right: 'The Contract requires the Contractor to submit… / The Contractor is required to submit…', why: 'require cần tân ngữ chỉ người trước to V.' },
        ],
      },
      {
        verb: 'instruct', ipa: '/ɪnˈstrʌkt/', en: 'to tell someone officially to do something', vi: 'chỉ thị, ra lệnh', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Người có thẩm quyền (Kỹ sư, chỉ huy trưởng) ra lệnh — trong FIDIC là "Engineer\'s Instruction".',
        patterns: [
          { form: 'instruct + sb + to V', ex: 'The Engineer instructed us to relocate the benches.', wrong: 'The Engineer instructed us relocate the benches.', right: 'The Engineer instructed us to relocate the benches.', why: 'instruct sb + to V.' },
        ],
      },
      {
        verb: 'demand', ipa: '/dɪˈmɑːnd/', en: 'to ask for something forcefully, as if you have a right to it', vi: 'đòi, yêu sách', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Gay gắt — tránh dùng trong email thông thường, dễ gây căng thẳng.',
        patterns: [
          { form: 'demand + N / demand + that + sb + V', ex: 'The client demanded an explanation for the delay.', wrong: 'The client demanded us to explain the delay.', right: 'The client demanded that we explain the delay.', why: 'Không dùng demand + sb + to V.' },
        ],
      },
    ],
  },
  {
    id: 'suggest',
    vi: 'ĐỀ XUẤT, KHUYÊN',
    intro: 'Đây là nhóm người Việt sai nhiều nhất vì mỗi động từ đi với cấu trúc khác nhau.',
    tip: 'suggest/recommend + V-ing hoặc + that · propose = đề xuất chính thức (kế hoạch, giá) · advise + sb + to V. Không bao giờ "suggest sb to do".',
    verbs: [
      {
        verb: 'suggest', ipa: '/səˈdʒest/', en: 'to mention an idea or plan for someone to consider', vi: 'gợi ý, đề xuất', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Nhẹ nhàng, mang tính gợi ý.',
        patterns: [
          { form: 'suggest + V-ing', ex: 'I suggest postponing the inspection until Monday.', wrong: 'I suggest to postpone the inspection.', right: 'I suggest postponing the inspection.', why: 'suggest + V-ing, không + to V.' },
          { form: 'suggest + that + sb + (should) V', ex: 'We suggest that the MEP team start first.', wrong: 'We suggest the MEP team to start first.', right: 'We suggest that the MEP team (should) start first.', why: 'Không có cấu trúc suggest + sb + to V.' },
          { form: 'suggest + N + to sb', ex: 'Could you suggest a date for the meeting?', wrong: 'Could you suggest me a date?', right: 'Could you suggest a date (to me)?', why: 'suggest không nhận hai tân ngữ liền nhau.' },
        ],
      },
      {
        verb: 'propose', ipa: '/prəˈpəʊz/', en: 'to formally put forward a plan or idea for others to decide on', vi: 'đề xuất (chính thức)', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Đề xuất chính thức: phương án, giá, tiến độ — hay dùng trong thư và hồ sơ.',
        patterns: [
          { form: 'propose + N', ex: 'We propose an alternative fixing detail.', wrong: 'We propose about an alternative detail.', right: 'We propose an alternative detail.', why: 'propose + tân ngữ trực tiếp.' },
          { form: 'propose + to V (= dự định)', ex: 'We propose to start night shifts next week.', wrong: 'We propose starting night shift next week to you.', right: 'We propose to start night shifts next week.', why: 'Khi người nói tự dự định làm → propose to V.' },
          { form: 'propose + that + sb + (should) V', ex: 'We propose that the meeting be held on Monday.', wrong: 'We propose the meeting to be held on Monday.', right: 'We propose that the meeting (should) be held on Monday.', why: 'propose that + nguyên mẫu.' },
        ],
      },
      {
        verb: 'recommend', ipa: '/ˌrekəˈmend/', en: 'to advise that something is the best thing to do or use', vi: 'khuyến nghị', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Khuyến nghị dựa trên chuyên môn (tư vấn, báo cáo kỹ thuật).',
        patterns: [
          { form: 'recommend + V-ing', ex: 'We recommend replacing the damaged gaskets.', wrong: 'We recommend to replace the gaskets.', right: 'We recommend replacing the gaskets.', why: 'recommend + V-ing.' },
          { form: 'recommend + that + sb + (should) V', ex: 'The consultant recommends that the slab be tested again.', wrong: 'The consultant recommends that the slab is test again.', right: 'The consultant recommends that the slab (should) be tested again.', why: 'that + nguyên mẫu; bị động: be + V3.' },
        ],
      },
      {
        verb: 'advise', ipa: '/ədˈvaɪz/', en: 'to tell someone what you think they should do; (business) to inform', vi: 'khuyên; thông báo', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Khuyên có trách nhiệm; trong email thương mại còn có nghĩa "thông báo".',
        patterns: [
          { form: 'advise + sb + to V', ex: 'We advise you to book deliveries 48 hours in advance.', wrong: 'We advice you to book deliveries in advance.', right: 'We advise you to book deliveries in advance.', why: 'advise (động từ, /z/) ≠ advice (danh từ, /s/).' },
          { form: 'advise + sb + of + N (= inform)', ex: 'Please advise us of any change to the schedule.', wrong: 'Please advise us any change.', right: 'Please advise us of any change.', why: 'Nghĩa "thông báo" cần of.' },
        ],
      },
    ],
  },
  {
    id: 'ensure',
    vi: 'ĐẢM BẢO',
    intro: 'ensure / assure / insure phát âm gần giống nhau nhưng nghĩa khác hẳn.',
    tip: 'ensure = làm cho chắc chắn xảy ra · assure + NGƯỜI = trấn an ai đó · insure = mua bảo hiểm · guarantee = cam kết (thường có ràng buộc).',
    verbs: [
      {
        verb: 'ensure', ipa: '/ɪnˈʃɔː/', en: 'to make certain that something happens or is true', vi: 'đảm bảo (việc gì xảy ra)', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Dùng nhiều nhất trong email, quy trình, biện pháp thi công.',
        patterns: [
          { form: 'ensure + (that) + clause', ex: 'Please ensure that the area is cordoned off before lifting.', wrong: 'Please ensure the area to be cordoned off.', right: 'Please ensure (that) the area is cordoned off.', why: 'ensure + mệnh đề, không + O + to V.' },
          { form: 'ensure + N', ex: 'Regular inspections ensure the quality of the works.', wrong: 'Inspections ensure for the quality.', right: 'Inspections ensure the quality.', why: 'Không có giới từ sau ensure.' },
        ],
      },
      {
        verb: 'make sure', ipa: '/meɪk ʃɔː/', en: 'to check or take action so that something is certain', vi: 'chắc chắn rằng', kind: 'Cụm động từ', formality: 1,
        nuance: 'Thân mật — nói với đội thi công, email nội bộ.',
        patterns: [
          { form: 'make sure + (that) + clause', ex: 'Make sure the scaffold tag is green before you climb.', wrong: 'Make sure about the scaffold tag is green.', right: 'Make sure (that) the scaffold tag is green.', why: 'Không chèn about trước mệnh đề.' },
        ],
      },
      {
        verb: 'assure', ipa: '/əˈʃɔː/', en: 'to tell someone confidently that something is true, so they do not worry', vi: 'cam đoan, trấn an', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Luôn hướng vào NGƯỜI nghe.',
        patterns: [
          { form: 'assure + sb + (that) + clause', ex: 'We assure you that the works will be completed on time.', wrong: 'We assure that the works will be completed on time.', right: 'We assure you that the works will be completed on time.', why: 'assure cần tân ngữ chỉ người.' },
          { form: 'assure + sb + of + N', ex: 'We assure you of our full cooperation.', wrong: 'We assure our full cooperation to you.', right: 'We assure you of our full cooperation.', why: 'Cấu trúc assure sb of sth.' },
        ],
      },
      {
        verb: 'guarantee', ipa: '/ˌɡærənˈtiː/', en: 'to promise formally that something will happen or be of a certain quality', vi: 'bảo đảm, bảo hành', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Cam kết có ràng buộc (bảo hành, hợp đồng).',
        patterns: [
          { form: 'guarantee + N (+ for + time)', ex: 'The supplier guarantees the frames for ten years.', wrong: 'The supplier guarantees for the frames ten years.', right: 'The supplier guarantees the frames for ten years.', why: 'Tân ngữ đứng ngay sau guarantee.' },
          { form: 'guarantee + to V / + that', ex: 'We guarantee to replace any defective seat within 48 hours.', wrong: 'We guarantee replacing any defective seat.', right: 'We guarantee to replace any defective seat.', why: 'guarantee + to V.' },
        ],
      },
      {
        verb: 'insure', ipa: '/ɪnˈʃɔː/', en: 'to buy insurance for something', vi: 'mua bảo hiểm', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Chỉ về bảo hiểm.',
        patterns: [
          { form: 'insure + N (+ against/for)', ex: 'The Contractor shall insure the Works against loss and damage.', wrong: 'Please insure that all workers wear helmets.', right: 'Please ensure that all workers wear helmets.', why: 'Muốn nói "đảm bảo" thì dùng ensure, không phải insure.' },
        ],
      },
    ],
  },
  {
    id: 'approve',
    vi: 'PHÊ DUYỆT, ĐỒNG Ý',
    intro: 'Phân biệt duyệt chính thức (approve), chấp nhận (accept), đồng ý (agree) và ký xác nhận (sign off).',
    tip: 'approve + N (không of) · agree to + đề xuất / agree with + người / agree on + điều khoản · accept + N · FIDIC 2017 dùng "give a Notice of No-objection".',
    verbs: [
      {
        verb: 'approve', ipa: '/əˈpruːv/', en: 'to officially accept a plan, drawing or request', vi: 'phê duyệt', kind: 'Ngoại & nội động từ', formality: 3,
        nuance: 'Duyệt chính thức. "approve of" lại có nghĩa là "tán thành, thấy tốt" (cảm xúc).',
        patterns: [
          { form: 'approve + N', ex: 'The client approved the mock-up yesterday.', wrong: 'The client approved of the mock-up drawings.', right: 'The client approved the mock-up drawings.', why: 'Duyệt hồ sơ → approve + N, không of.' },
          { form: 'be approved + by sb', ex: 'All materials must be approved by the Engineer before use.', wrong: 'All materials must approve by the Engineer.', right: 'All materials must be approved by the Engineer.', why: 'Vật liệu được duyệt → bị động.' },
        ],
      },
      {
        verb: 'accept', ipa: '/əkˈsept/', en: 'to agree to take or receive something offered', vi: 'chấp nhận', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Nhận lời đề nghị, báo giá, công việc đã hoàn thành.',
        patterns: [
          { form: 'accept + N', ex: 'We accept your proposal for the revised rate.', wrong: 'We accept with your proposal.', right: 'We accept your proposal.', why: 'accept + tân ngữ trực tiếp.' },
        ],
      },
      {
        verb: 'agree', ipa: '/əˈɡriː/', en: 'to have the same opinion, or to say yes to a proposal', vi: 'đồng ý', kind: 'Nội động từ', formality: 2,
        nuance: 'Giới từ thay đổi theo đối tượng: with (người/ý kiến), to (đề xuất), on (điều khoản).',
        patterns: [
          { form: 'agree + with + sb / to + proposal / on + terms', ex: 'Both parties agreed on the new rate.', wrong: 'I am agree with you.', right: 'I agree with you.', why: 'agree là động từ, không đi với am/is.' },
          { form: 'agree + to V / + that', ex: 'The subcontractor agreed to add four workers.', wrong: 'The subcontractor agreed adding four workers.', right: 'The subcontractor agreed to add four workers.', why: 'agree + to V.' },
        ],
      },
      {
        verb: 'sign off', ipa: '/saɪn ˈɒf/', en: 'to give formal approval by signing a document', vi: 'ký xác nhận, ký duyệt', kind: 'Cụm động từ', formality: 2,
        nuance: 'Hay dùng trên công trường: ký biên bản, danh mục tồn tại.',
        patterns: [
          { form: 'sign off + N / sign + N + off', ex: 'The Engineer signed off the snag list this morning.', wrong: 'The Engineer signed off for the snag list.', right: 'The Engineer signed off the snag list. / signed it off', why: 'Tân ngữ đứng sau "off" hoặc giữa sign và off (đại từ phải ở giữa).' },
        ],
      },
    ],
  },
  {
    id: 'delay',
    vi: 'TRÌ HOÃN, TẠM DỪNG',
    intro: 'Chậm ngoài ý muốn (delay) khác với dời có chủ đích (postpone/defer) và tạm dừng (suspend).',
    tip: 'Sau delay/postpone/defer dùng V-ing, không to V · suspend + công việc · push back = dời lại (thân mật).',
    verbs: [
      {
        verb: 'delay', ipa: '/dɪˈleɪ/', en: 'to make something late, or to do something later than planned', vi: 'làm chậm; hoãn', kind: 'Ngoại & nội động từ', formality: 2,
        nuance: 'Thường là chậm ngoài ý muốn.',
        patterns: [
          { form: 'delay + N / be delayed (by + time)', ex: 'Heavy rain delayed the pour by two days.', wrong: 'The delivery was delayed for 3 days late.', right: 'The delivery was delayed by three days.', why: 'Mức chậm dùng by + thời gian, không thêm late.' },
          { form: 'delay + V-ing', ex: 'We cannot delay ordering the steel any longer.', wrong: 'We cannot delay to order the steel.', right: 'We cannot delay ordering the steel.', why: 'delay + V-ing.' },
        ],
      },
      {
        verb: 'postpone', ipa: '/pəˈspəʊn/', en: 'to arrange for an event to happen at a later time', vi: 'dời lại (có chủ đích)', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Chủ động dời sự kiện: họp, nghiệm thu, đổ bê tông.',
        patterns: [
          { form: 'postpone + N + until/to + time', ex: 'The inspection was postponed until Monday.', wrong: 'The inspection was postponed to inspect on Monday.', right: 'The inspection was postponed until Monday.', why: 'postpone + sự kiện + until/to + thời điểm.' },
          { form: 'postpone + V-ing', ex: 'We had to postpone pouring the slab.', wrong: 'We had to postpone to pour the slab.', right: 'We had to postpone pouring the slab.', why: 'postpone + V-ing.' },
        ],
      },
      {
        verb: 'defer', ipa: '/dɪˈfɜː/', en: 'to delay a decision, payment or action until later (formal)', vi: 'hoãn (quyết định, thanh toán)', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Trang trọng — văn bản tài chính, hợp đồng.',
        patterns: [
          { form: 'defer + N / V-ing', ex: 'Release of the retention is deferred until the DNP expires.', wrong: 'The client deferred to pay the retention.', right: 'The client deferred paying the retention.', why: 'defer + V-ing. (defer to sb = nhường quyết định cho ai.)' },
        ],
      },
      {
        verb: 'suspend', ipa: '/səˈspend/', en: 'to stop something for a period of time', vi: 'tạm dừng, đình chỉ', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Tạm dừng công việc/hợp đồng — thuật ngữ FIDIC (Clause 8.9, 16.1).',
        patterns: [
          { form: 'suspend + N', ex: 'The Contractor may suspend the works after giving 21 days\' notice.', wrong: 'The Contractor may suspend to work.', right: 'The Contractor may suspend work.', why: 'suspend + danh từ (công việc).' },
        ],
      },
      {
        verb: 'push back', ipa: '/pʊʃ ˈbæk/', en: 'to change an event to a later time (informal)', vi: 'lùi lại (thân mật)', kind: 'Cụm động từ', formality: 1,
        nuance: 'Dùng khi nói chuyện, email nội bộ.',
        patterns: [
          { form: 'push + N + back (+ by/to)', ex: 'Can we push the meeting back to Thursday?', wrong: 'Can we push back the meeting until two days?', right: 'Can we push the meeting back by two days?', why: 'Lùi bao lâu → by; lùi đến khi nào → to.' },
        ],
      },
    ],
  },
  {
    id: 'resolve',
    vi: 'GIẢI QUYẾT, XỬ LÝ',
    intro: 'Giải quyết bài toán (solve), tranh chấp (resolve/settle), bắt tay xử lý (address/deal with/handle).',
    tip: 'solve + problem · resolve + dispute/issue · address + comments/concerns · deal with (luôn có with) · handle + N (không with).',
    verbs: [
      {
        verb: 'solve', ipa: '/sɒlv/', en: 'to find an answer to a problem', vi: 'giải (bài toán, vấn đề kỹ thuật)', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Vấn đề có "lời giải" kỹ thuật.',
        patterns: [
          { form: 'solve + problem', ex: 'Adding a drain solved the water problem.', wrong: 'We solved the conflict between the two teams.', right: 'We resolved the conflict between the two teams.', why: 'Xung đột/tranh chấp → resolve, không solve.' },
        ],
      },
      {
        verb: 'resolve', ipa: '/rɪˈzɒlv/', en: 'to find a satisfactory way to end a problem or disagreement', vi: 'giải quyết (dứt điểm)', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Trang trọng; tranh chấp, vấn đề tồn đọng, khiếu nại.',
        patterns: [
          { form: 'resolve + N', ex: 'The parties resolved the dispute through mediation.', wrong: 'The parties resolved about the dispute.', right: 'The parties resolved the dispute.', why: 'resolve + tân ngữ trực tiếp.' },
        ],
      },
      {
        verb: 'address', ipa: '/əˈdres/', en: 'to start to deal with a problem, comment or concern', vi: 'xử lý, giải quyết (ý kiến, lo ngại)', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Rất hay dùng khi trả lời ý kiến góp ý của Tư vấn.',
        patterns: [
          { form: 'address + comments/concerns/issues', ex: 'All comments have been addressed in Rev. B.', wrong: 'All comments have been addressed to Rev. B.', right: 'All comments have been addressed in Rev. B.', why: 'address a letter TO sb là gửi thư; xử lý ý kiến → address + N (+ in).' },
        ],
      },
      {
        verb: 'deal with', ipa: '/ˈdiːl wɪð/', en: 'to take action to solve a problem or do a task', vi: 'xử lý, giải quyết', kind: 'Cụm động từ', formality: 2,
        nuance: 'Trung tính, dùng cho cả việc và người.',
        patterns: [
          { form: 'deal with + N', ex: 'Who will deal with the NCR from yesterday?', wrong: 'Who will deal the NCR?', right: 'Who will deal with the NCR?', why: 'Nghĩa "xử lý" luôn có with.' },
        ],
      },
      {
        verb: 'handle', ipa: '/ˈhændl/', en: 'to manage or take care of a situation or task', vi: 'phụ trách, xử lý', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Nhấn mạnh người phụ trách.',
        patterns: [
          { form: 'handle + N', ex: 'Our QS will handle the variation claim.', wrong: 'Our QS will handle with the claim.', right: 'Our QS will handle the claim.', why: 'handle không đi với with.' },
        ],
      },
      {
        verb: 'settle', ipa: '/ˈsetl/', en: 'to end an argument by agreement; to pay money owed', vi: 'dàn xếp; thanh toán', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Dàn xếp tranh chấp, quyết toán, thanh toán hóa đơn.',
        patterns: [
          { form: 'settle + N', ex: 'We settled the final account at USD 2.4 million.', wrong: 'We settled down the final account.', right: 'We settled the final account.', why: 'settle down = ổn định cuộc sống, khác nghĩa.' },
        ],
      },
    ],
  },
  {
    id: 'inform',
    vi: 'THÔNG BÁO',
    intro: 'Thông báo cho ai: inform/notify luôn có NGƯỜI ngay sau động từ.',
    tip: 'inform/notify + sb + of/about/that · announce + sth (to sb) · update + sb + on · let sb know (không to).',
    verbs: [
      {
        verb: 'inform', ipa: '/ɪnˈfɔːm/', en: 'to tell someone facts or information', vi: 'thông báo', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Trang trọng, dùng nhiều trong email.',
        patterns: [
          { form: 'inform + sb + of/about + N', ex: 'Please inform us of any changes to the delivery date.', wrong: 'Please inform to us any changes.', right: 'Please inform us of any changes.', why: 'inform + người trực tiếp (không to) + of.' },
          { form: 'inform + sb + that', ex: 'We would like to inform you that the pour will take place on Saturday.', wrong: 'We would like to inform that the pour will…', right: 'We would like to inform you that the pour will…', why: 'inform cần tân ngữ chỉ người.' },
        ],
      },
      {
        verb: 'notify', ipa: '/ˈnəʊtɪfaɪ/', en: 'to formally tell someone about something', vi: 'thông báo chính thức', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Chính thức, theo hợp đồng/quy định (FIDIC: give a Notice).',
        patterns: [
          { form: 'notify + sb + of + N', ex: 'The Contractor shall notify the Engineer of any accident immediately.', wrong: 'The Contractor shall notify to the Engineer about…', right: 'The Contractor shall notify the Engineer of…', why: 'notify + người trực tiếp + of.' },
        ],
      },
      {
        verb: 'update', ipa: '/ʌpˈdeɪt/', en: 'to give someone the latest information', vi: 'cập nhật cho ai', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Thông tin tiến triển định kỳ.',
        patterns: [
          { form: 'update + sb + on + N', ex: 'I will update you on the progress every Friday.', wrong: 'I will update to you the progress.', right: 'I will update you on the progress.', why: 'update + người + on + nội dung.' },
        ],
      },
      {
        verb: 'let sb know', ipa: '/let ... ˈnəʊ/', en: 'to tell someone something (informal)', vi: 'cho ai biết', kind: 'Cụm động từ', formality: 1,
        nuance: 'Thân mật, câu kết email quen thuộc.',
        patterns: [
          { form: 'let + sb + know (+ if/when/that)', ex: 'Please let me know if you need anything else.', wrong: 'Please let me to know if you need anything.', right: 'Please let me know if you need anything.', why: 'let + sb + V nguyên mẫu (không to).' },
        ],
      },
      {
        verb: 'announce', ipa: '/əˈnaʊns/', en: 'to tell people publicly and officially about something', vi: 'công bố', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Công bố rộng rãi, không dùng để báo riêng một người.',
        patterns: [
          { form: 'announce + N / that (+ to sb)', ex: 'The client announced the new handover date to all contractors.', wrong: 'We announce you that the site will close.', right: 'We would like to inform you that the site will close.', why: 'announce không nhận người làm tân ngữ; báo riêng → inform.' },
        ],
      },
    ],
  },
  {
    id: 'check',
    vi: 'KIỂM TRA, XEM XÉT',
    intro: 'Mức độ từ nhẹ đến chính thức: check → review → inspect → verify → audit; theo dõi liên tục → monitor.',
    tip: 'Không có giới từ sau check/inspect/review/verify/monitor. review = xem hồ sơ · inspect = kiểm tra hiện trường.',
    verbs: [
      {
        verb: 'check', ipa: '/tʃek/', en: 'to look at something quickly to see if it is correct or safe', vi: 'kiểm tra (nhanh)', kind: 'Ngoại & nội động từ', formality: 2,
        nuance: 'Thông thường, hằng ngày.',
        patterns: [
          { form: 'check + N / check + (that) / check + with sb', ex: 'Please check that the anchors are tight.', wrong: 'Please check about the anchors.', right: 'Please check the anchors.', why: 'check + tân ngữ trực tiếp.' },
        ],
      },
      {
        verb: 'inspect', ipa: '/ɪnˈspekt/', en: 'to look at something carefully and officially', vi: 'kiểm tra, nghiệm thu (hiện trường)', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Chính thức, có biên bản.',
        patterns: [
          { form: 'inspect + N', ex: 'The Engineer will inspect the reinforcement at 10 am.', wrong: 'The Engineer will inspect on the reinforcement.', right: 'The Engineer will inspect the reinforcement.', why: 'Không có giới từ.' },
        ],
      },
      {
        verb: 'review', ipa: '/rɪˈvjuː/', en: 'to examine a document or situation in order to decide something', vi: 'xem xét (hồ sơ)', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Xem hồ sơ, bản vẽ, tiến độ — FIDIC 4.4.1.',
        patterns: [
          { form: 'review + N', ex: 'The Engineer has 21 days to review the shop drawings.', wrong: 'The Engineer has 21 days to review about the drawings.', right: 'The Engineer has 21 days to review the drawings.', why: 'Không có giới từ.' },
        ],
      },
      {
        verb: 'verify', ipa: '/ˈverɪfaɪ/', en: 'to prove or check that something is true or correct', vi: 'xác minh, đối chiếu', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Đối chiếu số liệu, khối lượng, chứng chỉ.',
        patterns: [
          { form: 'verify + N / that / whether', ex: 'Please verify the quantities against the BOQ.', wrong: 'Please verify if the quantities is correct.', right: 'Please verify whether the quantities are correct.', why: 'quantities số nhiều → are; trang trọng dùng whether.' },
        ],
      },
      {
        verb: 'monitor', ipa: '/ˈmɒnɪtə/', en: 'to watch and check something over a period of time', vi: 'theo dõi', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Theo dõi liên tục, định kỳ.',
        patterns: [
          { form: 'monitor + N', ex: 'We monitor progress against the baseline every week.', wrong: 'We monitor on progress every week.', right: 'We monitor progress every week.', why: 'Không có giới từ.' },
        ],
      },
    ],
  },
  {
    id: 'refuse',
    vi: 'TỪ CHỐI, BÁC BỎ',
    intro: 'Từ chối làm (refuse/decline + to V), bác bỏ thứ được trình (reject + N), phủ nhận (deny + V-ing).',
    tip: 'refuse/decline + to V · reject + N (không + to V) · deny + V-ing / that.',
    verbs: [
      {
        verb: 'refuse', ipa: '/rɪˈfjuːz/', en: 'to say firmly that you will not do or accept something', vi: 'từ chối (dứt khoát)', kind: 'Ngoại & nội động từ', formality: 2,
        nuance: 'Dứt khoát, có thể gây căng thẳng.',
        patterns: [
          { form: 'refuse + to V', ex: 'The subcontractor refused to sign the variation order.', wrong: 'The subcontractor refused signing the order.', right: 'The subcontractor refused to sign the order.', why: 'refuse + to V.' },
        ],
      },
      {
        verb: 'reject', ipa: '/rɪˈdʒekt/', en: 'to not accept a proposal, submission or material', vi: 'bác bỏ, không chấp nhận', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Bác bỏ thứ được trình: hồ sơ, vật liệu, đề xuất.',
        patterns: [
          { form: 'reject + N', ex: 'The Engineer rejected two submittals last week.', wrong: 'The Engineer rejected to approve the submittals.', right: 'The Engineer rejected the submittals.', why: 'reject + danh từ, không + to V.' },
        ],
      },
      {
        verb: 'decline', ipa: '/dɪˈklaɪn/', en: 'to politely say no to an offer or invitation', vi: 'từ chối (lịch sự)', kind: 'Ngoại & nội động từ', formality: 3,
        nuance: 'Lịch sự — dùng trong email từ chối.',
        patterns: [
          { form: 'decline + N / to V', ex: 'Unfortunately, we must decline your invitation.', wrong: 'We decline attending the meeting.', right: 'We decline to attend the meeting.', why: 'decline + to V.' },
        ],
      },
      {
        verb: 'deny', ipa: '/dɪˈnaɪ/', en: 'to say that something is not true', vi: 'phủ nhận', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Phủ nhận trách nhiệm/sự việc.',
        patterns: [
          { form: 'deny + V-ing / that', ex: 'The supplier denied causing the damage.', wrong: 'The supplier denied to cause the damage.', right: 'The supplier denied causing the damage.', why: 'deny + V-ing.' },
        ],
      },
    ],
  },
  {
    id: 'allow',
    vi: 'CHO PHÉP, NGĂN CẤM',
    intro: 'Mỗi động từ cho phép/ngăn cấm có cấu trúc riêng — rất hay sai trong biển báo, quy định công trường.',
    tip: 'allow/permit/enable + sb + to V · let + sb + V (không to) · prevent/prohibit + sb + from V-ing.',
    verbs: [
      {
        verb: 'allow', ipa: '/əˈlaʊ/', en: 'to give permission for someone to do something', vi: 'cho phép', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Trung tính.',
        patterns: [
          { form: 'allow + sb + to V / be allowed to V', ex: 'Visitors are not allowed to enter without PPE.', wrong: 'The rules do not allow to enter without PPE.', right: 'The rules do not allow visitors to enter without PPE.', why: 'allow + người + to V (hoặc allow + V-ing).' },
        ],
      },
      {
        verb: 'permit', ipa: '/pəˈmɪt/', en: 'to allow something officially', vi: 'cho phép (chính thức)', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Quy định, giấy phép. Danh từ "permit" /ˈpɜːmɪt/ nhấn âm đầu.',
        patterns: [
          { form: 'permit + sb + to V / be permitted', ex: 'Hot work is not permitted without a valid permit.', wrong: 'Hot work is not permit without a permit.', right: 'Hot work is not permitted without a permit.', why: 'Bị động: be + V3.' },
        ],
      },
      {
        verb: 'let', ipa: '/let/', en: 'to allow someone to do something (informal)', vi: 'để cho', kind: 'Ngoại động từ', formality: 1,
        nuance: 'Thân mật.',
        patterns: [
          { form: 'let + sb + V', ex: 'Let the team finish the pour before you start.', wrong: 'Let the team to finish the pour.', right: 'Let the team finish the pour.', why: 'let + sb + V nguyên mẫu.' },
        ],
      },
      {
        verb: 'enable', ipa: '/ɪˈneɪbl/', en: 'to make it possible for someone to do something', vi: 'giúp có thể', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Công cụ/giải pháp tạo khả năng.',
        patterns: [
          { form: 'enable + sb + to V', ex: 'BIM enables us to detect clashes early.', wrong: 'BIM enables to detect clashes early.', right: 'BIM enables us to detect clashes early.', why: 'enable cần tân ngữ trước to V.' },
        ],
      },
      {
        verb: 'prevent', ipa: '/prɪˈvent/', en: 'to stop something from happening', vi: 'ngăn chặn', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Phòng ngừa sự cố.',
        patterns: [
          { form: 'prevent + sb/sth + from + V-ing', ex: 'Guardrails prevent workers from falling.', wrong: 'Guardrails prevent workers to fall.', right: 'Guardrails prevent workers from falling.', why: 'prevent … from + V-ing.' },
        ],
      },
      {
        verb: 'prohibit', ipa: '/prəˈhɪbɪt/', en: 'to officially forbid something', vi: 'cấm', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Cấm theo quy định.',
        patterns: [
          { form: 'prohibit + sb + from V-ing / be prohibited', ex: 'Smoking is strictly prohibited on site.', wrong: 'The rules prohibit workers to smoke.', right: 'The rules prohibit workers from smoking.', why: 'prohibit … from + V-ing.' },
        ],
      },
    ],
  },
  {
    id: 'increase',
    vi: 'TĂNG, GIẢM',
    intro: 'Cặp rise/raise và fall/reduce là lỗi kinh điển: một cái nội động từ, một cái ngoại động từ.',
    tip: 'rise/fall: TỰ tăng/giảm (không tân ngữ) · raise/reduce: LÀM cho tăng/giảm (có tân ngữ) · increase/decrease: cả hai · mức thay đổi: by; đến mức: to.',
    verbs: [
      {
        verb: 'increase', ipa: '/ɪnˈkriːs/', en: 'to become or make larger in amount', vi: 'tăng; làm tăng', kind: 'Ngoại & nội động từ', formality: 2,
        nuance: 'Danh từ "increase" /ˈɪnkriːs/ nhấn âm đầu.',
        patterns: [
          { form: 'increase + by/to + số', ex: 'Material costs increased by 5% in October.', wrong: 'Material costs increased of 5%.', right: 'Material costs increased by 5%.', why: 'Mức tăng → by.' },
        ],
      },
      {
        verb: 'rise', ipa: '/raɪz/', en: 'to go up (no object) — rose, risen', vi: 'tự tăng lên', kind: 'Nội động từ', formality: 2,
        nuance: 'Không có tân ngữ.',
        patterns: [
          { form: 'sth + rises (+ by/to)', ex: 'Steel prices rose sharply last month.', wrong: 'The supplier rose the price.', right: 'The supplier raised the price.', why: 'Có tân ngữ (the price) → raise.' },
        ],
      },
      {
        verb: 'raise', ipa: '/reɪz/', en: 'to lift or increase something; to bring up a subject', vi: 'nâng, tăng; nêu ra', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Cần tân ngữ; còn có nghĩa "nêu" (raise a concern / an RFI).',
        patterns: [
          { form: 'raise + N', ex: 'The supplier raised the price by 8%.', wrong: 'Prices raised by 8% last month.', right: 'Prices rose by 8% last month.', why: 'Không có tân ngữ → rise.' },
        ],
      },
      {
        verb: 'reduce', ipa: '/rɪˈdjuːs/', en: 'to make something smaller in size, amount or degree', vi: 'giảm, cắt giảm', kind: 'Ngoại động từ', formality: 2,
        nuance: 'Thường cần tân ngữ hoặc dùng bị động.',
        patterns: [
          { form: 'reduce + N + by/to', ex: 'Prefabrication reduced the duration by two weeks.', wrong: 'The duration reduced two weeks.', right: 'The duration was reduced by two weeks.', why: 'Không có người làm → bị động + by.' },
        ],
      },
      {
        verb: 'fall', ipa: '/fɔːl/', en: 'to go down in amount (no object) — fell, fallen', vi: 'tự giảm xuống', kind: 'Nội động từ', formality: 2,
        nuance: 'Không có tân ngữ.',
        patterns: [
          { form: 'sth + falls (+ by/to)', ex: 'Productivity fell in December because of the rain.', wrong: 'We fell the cost by 3%.', right: 'We reduced the cost by 3%.', why: 'Có tân ngữ → reduce.' },
        ],
      },
    ],
  },
  {
    id: 'complete',
    vi: 'BẮT ĐẦU, HOÀN THÀNH, BÀN GIAO',
    intro: 'Động từ mở đầu và kết thúc công việc — chú ý giới từ thời gian và bị động.',
    tip: 'start/commence + on + ngày · finish + V-ing · complete là ngoại động từ (công việc được hoàn thành: is completed / is complete) · hand over (động từ) ≠ handover (danh từ).',
    verbs: [
      {
        verb: 'commence', ipa: '/kəˈmens/', en: 'to begin (formal)', vi: 'khởi công, bắt đầu', kind: 'Ngoại & nội động từ', formality: 3,
        nuance: 'Rất trang trọng — hợp đồng (Commencement Date).',
        patterns: [
          { form: 'commence + N / commence + on + date', ex: 'The works shall commence on 3 November.', wrong: 'The works shall commence at 3 November.', right: 'The works shall commence on 3 November.', why: 'Ngày → on.' },
        ],
      },
      {
        verb: 'start', ipa: '/stɑːt/', en: 'to begin doing something', vi: 'bắt đầu', kind: 'Ngoại & nội động từ', formality: 2,
        nuance: 'Thông thường; start + V-ing / to V đều được.',
        patterns: [
          { form: 'start + V-ing / to V / on + day', ex: 'We will start installing the seats on Monday.', wrong: 'We will start installing the seats from Monday next week.', right: 'We will start installing the seats on Monday (next week).', why: 'Mốc bắt đầu → on + ngày.' },
        ],
      },
      {
        verb: 'finish', ipa: '/ˈfɪnɪʃ/', en: 'to reach the end of an activity', vi: 'làm xong', kind: 'Ngoại & nội động từ', formality: 1,
        nuance: 'Thông thường; văn bản trang trọng dùng complete.',
        patterns: [
          { form: 'finish + V-ing', ex: 'The painters finished painting Zone A yesterday.', wrong: 'The painters finished to paint Zone A.', right: 'The painters finished painting Zone A.', why: 'finish + V-ing.' },
        ],
      },
      {
        verb: 'complete', ipa: '/kəmˈpliːt/', en: 'to finish doing or making something (formal)', vi: 'hoàn thành', kind: 'Ngoại động từ', formality: 3,
        nuance: 'Ngoại động từ: công việc "được hoàn thành".',
        patterns: [
          { form: 'complete + N / be completed', ex: 'The installation in Zone B was completed on 12 November.', wrong: 'The installation in Zone B completed on 12 November.', right: 'The installation in Zone B was completed on 12 November.', why: 'Công việc không tự hoàn thành → bị động (hoặc "is complete").' },
        ],
      },
      {
        verb: 'hand over', ipa: '/hænd ˈəʊvə/', en: 'to give responsibility or control of something to someone else', vi: 'bàn giao', kind: 'Cụm động từ', formality: 2,
        nuance: 'Động từ viết rời; danh từ viết liền "handover".',
        patterns: [
          { form: 'hand over + N (+ to sb) / hand + N + over', ex: 'We will hand over Zone A to the client on Friday.', wrong: 'We will handover Zone A on Friday.', right: 'We will hand over Zone A on Friday.', why: 'Động từ viết rời "hand over"; "handover" là danh từ.' },
        ],
      },
    ],
  },
]

// ─── Schedule: one group per study day (Mon–Sat) from START; Sunday = weekly review ──

export const PHRASE_START = '2026-11-02' // Monday

const dayMs = 86400000
const parse = (s: string) => new Date(`${s}T00:00:00`)
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Index of the study day (0-based, Mon–Sat only) for a date, or null for a Sunday / before start. */
export function studyIndex(date: Date): number | null {
  const start = parse(PHRASE_START).getTime()
  const d = parse(isoDate(date)).getTime()
  if (d < start || date.getDay() === 0) return null
  const days = Math.round((d - start) / dayMs)
  return days - Math.floor(days / 7) // remove Sundays
}

export function groupForDate(date: Date): VerbGroup | null {
  const i = studyIndex(date)
  return i === null ? null : VERB_GROUPS[i % VERB_GROUPS.length]
}

export function dateForGroup(index: number): string {
  const d = parse(PHRASE_START)
  d.setDate(d.getDate() + index + Math.floor(index / 6))
  return isoDate(d)
}

/** Groups studied in the Mon–Sat before a Sunday (or so far this week on other days). */
export function weekGroups(date: Date): VerbGroup[] {
  const monday = parse(isoDate(date))
  monday.setDate(monday.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1))
  const lastOffset = date.getDay() === 0 ? 5 : date.getDay() - 1 // Sunday → Mon..Sat; otherwise Mon..today
  const out: VerbGroup[] = []
  for (let k = 0; k <= lastOffset; k++) {
    const x = new Date(monday)
    x.setDate(monday.getDate() + k)
    const g = groupForDate(x)
    if (g && !out.includes(g)) out.push(g)
  }
  return out
}

/** Flattened rules for the AI question generator. */
export function groupRules(groups: VerbGroup[]): string[] {
  return groups.flatMap((g) => [
    `[${g.vi}] Choosing between ${g.verbs.map((v) => v.verb).join(' / ')}: ${g.tip}`,
    ...g.verbs.flatMap((v) =>
      v.patterns.map((p) => `[${g.vi}] ${v.verb} (${v.en}; ${FORMALITY[v.formality]}; ${v.kind}): ${p.form} — e.g. "${p.ex}"; common mistake "${p.wrong}" → "${p.right}"`)
    ),
  ])
}
