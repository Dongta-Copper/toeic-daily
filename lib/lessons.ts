import type { TheorySection } from './lessonTheory'

// Short lessons, one per error type the AI tags (keys match ERROR_TYPES).
// Each: core rule, construction-context examples, the typical Vietnamese-speaker trap, and a 5-question check.

export type ChooseQ = { kind?: 'choose'; q: string; options: string[]; answer: number; why: string }
/** Type the correct phrase. `sentence` (optional) is shown with `wrong` underlined. */
export type FixQ = { kind: 'fix'; q: string; sentence?: string; wrong?: string; answer: string; alts?: string[]; why: string; mine?: boolean }
export type QuizQ = ChooseQ | FixQ

export type Lesson = {
  theory?: TheorySection[] // AI-made lessons carry their own theory
  type: string
  title: string
  minutes: number
  rules: string[]
  examples: { en: string; vi: string }[]
  trap: { wrong: string; right: string; why: string }[]
  quiz: QuizQ[]
}

export const LESSONS: Lesson[] = [
  {
    type: 'article',
    title: 'Mạo từ a / an / the / không mạo từ',
    minutes: 3,
    rules: [
      'a/an: danh từ đếm được số ít, nhắc lần đầu hoặc "một cái bất kỳ" — a meeting, an inspection.',
      'the: người nghe biết đang nói cái nào (đã nhắc, chỉ có một, có cụm xác định phía sau) — the meeting on Monday, the Engineer.',
      'Không mạo từ: danh từ số nhiều hoặc không đếm được khi nói chung chung — Contractors must…, Safety is…',
      'Trong hợp đồng FIDIC, các vai trò viết hoa luôn đi với the: the Employer, the Contractor, the Engineer.',
    ],
    examples: [
      { en: 'We need an inspection before the pour.', vi: 'Chúng ta cần một buổi nghiệm thu trước khi đổ bê tông.' },
      { en: 'The inspection on Friday was postponed.', vi: 'Buổi nghiệm thu hôm thứ Sáu bị hoãn.' },
      { en: 'Subcontractors must submit method statements.', vi: 'Các nhà thầu phụ phải nộp biện pháp thi công.' },
    ],
    trap: [
      { wrong: 'The companies must comply with regulations.', right: 'Companies must comply with regulations.', why: 'Nói chung về các công ty → không dùng the.' },
      { wrong: 'We received approval from Engineer.', right: 'We received approval from the Engineer.', why: 'Vai trò cụ thể trong hợp đồng → the.' },
    ],
    quiz: [
      { q: 'Please send me ___ updated programme by Friday.', options: ['a', 'the', '(không)'], answer: 1, why: 'Tiến độ cụ thể hai bên đều biết → the.' },
      { q: '___ safety is our first priority on site.', options: ['The', 'A', '(không)'], answer: 2, why: 'Danh từ không đếm được, nói chung → không mạo từ.' },
      { q: 'We have ___ problem with the anchor bolts.', options: ['a', 'the', '(không)'], answer: 0, why: 'Nhắc lần đầu, một vấn đề → a.' },
      { q: 'The delay was caused by ___ Employer.', options: ['an', 'the', '(không)'], answer: 1, why: 'Vai trò trong hợp đồng → the Employer.' },
      { q: '___ engineers on this project are very experienced.', options: ['The', 'An', '(không)'], answer: 0, why: '"on this project" xác định nhóm kỹ sư cụ thể → The.' },
    ],
  },
  {
    type: 'plural_countable',
    title: 'Số ít / số nhiều & danh từ không đếm được',
    minutes: 3,
    rules: [
      'Danh từ đếm được sau số > 1, several, many, a number of, these → thêm -s: three days, several delays.',
      'Danh từ không đếm được KHÔNG thêm -s và đi với động từ số ít: equipment, information, feedback, progress, advice, furniture, research, concrete.',
      'Muốn đếm danh từ không đếm được → dùng đơn vị: a piece of equipment, an item of feedback, a cubic metre of concrete.',
      '"one of the + N số nhiều": one of the main reasons.',
    ],
    examples: [
      { en: 'The equipment was delivered yesterday.', vi: 'Thiết bị đã được giao hôm qua.' },
      { en: 'We received useful feedback from the client.', vi: 'Chúng tôi nhận được phản hồi hữu ích từ chủ đầu tư.' },
      { en: 'There are several defects in Zone B.', vi: 'Khu B có một số lỗi.' },
    ],
    trap: [
      { wrong: 'We need more informations.', right: 'We need more information.', why: 'information không đếm được.' },
      { wrong: 'One of the main reason is late approval.', right: 'One of the main reasons is late approval.', why: 'one of the + danh từ số nhiều.' },
    ],
    quiz: [
      { q: 'All the ___ has been installed.', options: ['equipment', 'equipments'], answer: 0, why: 'equipment không đếm được.' },
      { q: 'The work was delayed by two ___.', options: ['week', 'weeks'], answer: 1, why: 'Số > 1 → số nhiều.' },
      { q: 'Thank you for your ___.', options: ['feedbacks', 'feedback'], answer: 1, why: 'feedback không đếm được.' },
      { q: 'This is one of the biggest ___ on the project.', options: ['risk', 'risks'], answer: 1, why: 'one of the + số nhiều.' },
      { q: 'Good ___ is being made in Zone A.', options: ['progress', 'progresses'], answer: 0, why: 'progress không đếm được.' },
    ],
  },
  {
    type: 'subject_verb_agreement',
    title: 'Chia động từ theo chủ ngữ',
    minutes: 3,
    rules: [
      'Chủ ngữ số ít (kể cả danh từ không đếm được, V-ing, mệnh đề) → động từ số ít: The team is…, Learning English takes time.',
      'Chủ ngữ số nhiều → động từ số nhiều: The drawings are…',
      'Tìm chủ ngữ CHÍNH, bỏ qua cụm giới từ ở giữa: The quality of the materials IS good.',
      'each / every / one of … → số ít: Each subcontractor has…',
    ],
    examples: [
      { en: 'The list of defects is attached.', vi: 'Danh sách lỗi được đính kèm.' },
      { en: 'Coordinating subcontractors requires patience.', vi: 'Điều phối nhà thầu phụ đòi hỏi sự kiên nhẫn.' },
      { en: 'Each worker has a valid pass.', vi: 'Mỗi công nhân đều có thẻ hợp lệ.' },
    ],
    trap: [
      { wrong: 'Learning through courses have enhanced my skills.', right: 'Learning through courses has enhanced my skills.', why: 'Chủ ngữ là V-ing → số ít.' },
      { wrong: 'The companies complies with the rules.', right: 'The companies comply with the rules.', why: 'companies số nhiều → comply.' },
    ],
    quiz: [
      { q: 'The cost of the materials ___ increased.', options: ['have', 'has'], answer: 1, why: 'Chủ ngữ chính: The cost (số ít).' },
      { q: 'Managing risks ___ part of my job.', options: ['is', 'are'], answer: 0, why: 'V-ing làm chủ ngữ → số ít.' },
      { q: 'Each subcontractor ___ a safety officer.', options: ['need', 'needs'], answer: 1, why: 'each → số ít.' },
      { q: 'The drawings ___ been approved.', options: ['have', 'has'], answer: 0, why: 'drawings số nhiều.' },
      { q: 'The information you sent ___ very useful.', options: ['was', 'were'], answer: 0, why: 'information không đếm được → số ít.' },
    ],
  },
  {
    type: 'tense',
    title: 'Thì động từ trong email & báo cáo',
    minutes: 3,
    rules: [
      'Hiện tại hoàn thành (have done): việc vừa xong / kết quả còn liên quan — We have submitted the report.',
      'Quá khứ đơn (did): có thời điểm cụ thể — We submitted it yesterday.',
      'Hiện tại tiếp diễn: việc đang diễn ra — We are installing the seats in Zone B.',
      'Tương lai: will cho cam kết/dự đoán; be going to cho kế hoạch đã định — We will send it by Friday.',
    ],
    examples: [
      { en: 'We have completed the installation in Zone A.', vi: 'Chúng tôi đã hoàn thành lắp đặt Khu A.' },
      { en: 'The inspection took place on 12 November.', vi: 'Buổi nghiệm thu diễn ra ngày 12/11.' },
      { en: 'We will resubmit the drawings by Thursday.', vi: 'Chúng tôi sẽ trình lại bản vẽ trước thứ Năm.' },
    ],
    trap: [
      { wrong: 'We have submitted the RFI yesterday.', right: 'We submitted the RFI yesterday.', why: 'Có "yesterday" → quá khứ đơn.' },
      { wrong: 'I work on this project since 2025.', right: 'I have worked on this project since 2025.', why: 'since → hiện tại hoàn thành.' },
    ],
    quiz: [
      { q: 'We ___ the drawings last Monday.', options: ['have sent', 'sent'], answer: 1, why: 'last Monday → quá khứ đơn.' },
      { q: 'The Engineer ___ not ___ yet.', options: ['did / reply', 'has / replied'], answer: 1, why: 'yet → hiện tại hoàn thành.' },
      { q: 'Right now, the team ___ the ceiling in Zone C.', options: ['installs', 'is installing'], answer: 1, why: 'Đang diễn ra → tiếp diễn.' },
      { q: 'We ___ on this project for six months.', options: ['have worked', 'worked'], answer: 0, why: 'for six months (đến nay) → HTHT.' },
      { q: 'I ___ send you the report tomorrow.', options: ['will', 'am'], answer: 0, why: 'Cam kết tương lai → will.' },
    ],
  },
  {
    type: 'passive',
    title: 'Câu bị động trong văn bản kỹ thuật',
    minutes: 3,
    rules: [
      'Bị động = be + V3, dùng khi việc quan trọng hơn người làm — The drawings were approved.',
      'Chia "be" theo thì: is done / was done / has been done / will be done / must be done.',
      'Ai đó làm (by …) chỉ thêm khi cần — approved by the Engineer.',
      'Chủ ngữ tự làm hành động thì KHÔNG dùng bị động: I really appreciate… (không phải I am appreciated).',
    ],
    examples: [
      { en: 'The NCR has been closed.', vi: 'NCR đã được đóng.' },
      { en: 'All materials must be approved before use.', vi: 'Mọi vật liệu phải được phê duyệt trước khi sử dụng.' },
      { en: 'The report will be submitted on Friday.', vi: 'Báo cáo sẽ được nộp vào thứ Sáu.' },
    ],
    trap: [
      { wrong: 'The inspection is schedule for tomorrow.', right: 'The inspection is scheduled for tomorrow.', why: 'Bị động cần V3: scheduled.' },
      { wrong: 'I am really appreciated your help.', right: 'I really appreciate your help.', why: 'Tôi là người cảm kích → chủ động.' },
    ],
    quiz: [
      { q: 'The shop drawings ___ yesterday.', options: ['approved', 'were approved'], answer: 1, why: 'Bản vẽ được duyệt → bị động.' },
      { q: 'All defects must ___ before handover.', options: ['fix', 'be fixed'], answer: 1, why: 'must be + V3.' },
      { q: 'The delivery ___ by two weeks.', options: ['has delayed', 'has been delayed'], answer: 1, why: 'Việc giao hàng bị làm chậm → bị động.' },
      { q: 'We ___ the client\'s support.', options: ['appreciate', 'are appreciated'], answer: 0, why: 'Chúng tôi cảm kích → chủ động.' },
      { q: 'The meeting ___ next Tuesday.', options: ['will hold', 'will be held'], answer: 1, why: 'Cuộc họp được tổ chức → bị động.' },
    ],
  },
  {
    type: 'preposition',
    title: 'Giới từ đi kèm hay sai',
    minutes: 3,
    rules: [
      'Học theo cụm, không học giới từ đứng riêng: comply with, responsible for, depend on, impact on, delay in.',
      'Thời gian: by (hạn chót), until (kéo dài đến), within (trong vòng), on + ngày, at + giờ, in + tháng/năm.',
      'Một số động từ KHÔNG có giới từ: discuss, contact, approve, enter, request (động từ).',
      'by + V-ing = bằng cách: By applying…',
    ],
    examples: [
      { en: 'Please submit the report by Friday.', vi: 'Vui lòng nộp báo cáo trước thứ Sáu.' },
      { en: 'All works must comply with the specification.', vi: 'Mọi công việc phải tuân thủ chỉ dẫn kỹ thuật.' },
      { en: 'We discussed the variation with the client.', vi: 'Chúng tôi đã thảo luận phát sinh với chủ đầu tư.' },
    ],
    trap: [
      { wrong: 'We discussed about the price.', right: 'We discussed the price.', why: 'discuss không có giới từ.' },
      { wrong: 'I have worked in this project.', right: 'I have worked on this project.', why: 'work on a project.' },
    ],
    quiz: [
      { q: 'The contractor is responsible ___ site safety.', options: ['for', 'of', 'with'], answer: 0, why: 'responsible for.' },
      { q: 'Please reply ___ 5 pm today.', options: ['until', 'by', 'in'], answer: 1, why: 'Hạn chót → by.' },
      { q: 'We will contact ___ the supplier tomorrow.', options: ['with', 'to', '(không)'], answer: 2, why: 'contact + tân ngữ trực tiếp.' },
      { q: 'The delay had a big impact ___ the schedule.', options: ['to', 'on', 'for'], answer: 1, why: 'impact on.' },
      { q: '___ applying this method, we saved two weeks.', options: ['Through', 'By', 'With'], answer: 1, why: 'By + V-ing = bằng cách.' },
    ],
  },
  {
    type: 'collocation',
    title: 'Kết hợp từ (collocation) công việc',
    minutes: 3,
    rules: [
      'Một số động từ đi cố định với danh từ: meet a deadline, make a decision, take action, raise a concern, hold a meeting, place an order.',
      'Không dịch từng chữ từ tiếng Việt: "gặp khó khăn" → face difficulties (không phải meet difficulties).',
      'Tính từ + danh từ quen dùng: tight deadline, heavy rain, major milestone, minor defect.',
    ],
    examples: [
      { en: 'We worked overtime to meet the deadline.', vi: 'Chúng tôi tăng ca để kịp hạn chót.' },
      { en: 'The consultant raised a concern about the fixing detail.', vi: 'Tư vấn nêu lo ngại về chi tiết liên kết.' },
      { en: 'We must take immediate action.', vi: 'Chúng ta phải hành động ngay.' },
    ],
    trap: [
      { wrong: 'We met many challenges.', right: 'We faced many challenges.', why: 'face challenges.' },
      { wrong: 'Please make a meeting with the MEP team.', right: 'Please set up a meeting with the MEP team.', why: 'set up / arrange / hold a meeting.' },
    ],
    quiz: [
      { q: 'We need to ___ a decision today.', options: ['do', 'make', 'take'], answer: 1, why: 'make a decision.' },
      { q: 'We must ___ the deadline.', options: ['catch', 'meet', 'reach'], answer: 1, why: 'meet a deadline.' },
      { q: 'We ___ serious challenges last month.', options: ['met', 'faced', 'saw'], answer: 1, why: 'face challenges.' },
      { q: 'Please ___ the order for the aluminium this week.', options: ['place', 'make', 'do'], answer: 0, why: 'place an order.' },
      { q: '___ rain stopped the external works.', options: ['Strong', 'Heavy', 'Big'], answer: 1, why: 'heavy rain.' },
    ],
  },
  {
    type: 'word_choice',
    title: 'Chọn từ đúng nghĩa trong văn bản công việc',
    minutes: 3,
    rules: [
      'Văn bản công việc ưu tiên từ trang trọng, chính xác: complete (thay finish), request (thay ask for), inform (thay tell), approximately (thay about).',
      'Cẩn thận cặp dễ nhầm: economic (kinh tế) / economical (tiết kiệm); affect (động từ) / effect (danh từ); advice (danh từ) / advise (động từ).',
      'Dùng thuật ngữ chuẩn của ngành: authorities (cơ quan chức năng), senior management (ban lãnh đạo), backgrounds (nền tảng chuyên môn).',
    ],
    examples: [
      { en: 'The assessment was completed and submitted to the local authorities.', vi: 'Báo cáo đánh giá đã hoàn thành và nộp cho cơ quan chức năng địa phương.' },
      { en: 'The delay affected the handover date.', vi: 'Chậm trễ ảnh hưởng đến ngày bàn giao.' },
      { en: 'Please advise if there is any change.', vi: 'Vui lòng thông báo nếu có thay đổi.' },
    ],
    trap: [
      { wrong: 'professionals from different platforms', right: 'professionals from different backgrounds', why: 'Nền tảng chuyên môn → backgrounds.' },
      { wrong: 'The rain had a big affect on progress.', right: 'The rain had a big effect on progress.', why: 'Danh từ → effect.' },
    ],
    quiz: [
      { q: 'Prefabrication is more ___ than on-site work.', options: ['economic', 'economical'], answer: 1, why: 'Tiết kiệm → economical.' },
      { q: 'The weather will ___ the schedule.', options: ['affect', 'effect'], answer: 0, why: 'Động từ → affect.' },
      { q: 'Please ___ us of any changes.', options: ['inform', 'tell to'], answer: 0, why: 'inform sb of sth.' },
      { q: 'We need your ___ on this issue.', options: ['advise', 'advice'], answer: 1, why: 'Danh từ → advice.' },
      { q: 'The report was submitted to the local ___.', options: ['governments', 'authorities'], answer: 1, why: 'Cơ quan chức năng → authorities.' },
    ],
  },
  {
    type: 'word_form',
    title: 'Từ loại: danh từ / tính từ / trạng từ',
    minutes: 3,
    rules: [
      'Trước danh từ cần tính từ: environmental regulations, structural engineer, collaborative efforts.',
      'Sau the / a / tính từ sở hữu cần danh từ: the importance, the efficiency, my commitment.',
      'Bổ nghĩa cho động từ cần trạng từ (-ly): continuously improve, carefully check.',
    ],
    examples: [
      { en: 'All works must follow environmental regulations.', vi: 'Mọi công việc phải tuân thủ quy định môi trường.' },
      { en: 'The meeting highlighted the importance of safety.', vi: 'Cuộc họp nhấn mạnh tầm quan trọng của an toàn.' },
      { en: 'We continuously monitor progress.', vi: 'Chúng tôi theo dõi tiến độ liên tục.' },
    ],
    trap: [
      { wrong: 'environment regulations', right: 'environmental regulations', why: 'Trước danh từ → tính từ.' },
      { wrong: 'the important of transparency', right: 'the importance of transparency', why: 'Sau the → danh từ.' },
    ],
    quiz: [
      { q: 'We hired a ___ engineer.', options: ['structure', 'structural'], answer: 1, why: 'Tính từ trước danh từ.' },
      { q: 'This shows the ___ of good planning.', options: ['important', 'importance'], answer: 1, why: 'Sau the → danh từ.' },
      { q: 'Please check the drawings ___.', options: ['careful', 'carefully'], answer: 1, why: 'Bổ nghĩa cho check → trạng từ.' },
      { q: 'We need to improve ___.', options: ['efficient', 'efficiency'], answer: 1, why: 'Tân ngữ → danh từ.' },
      { q: 'Thank you for your ___ efforts.', options: ['collaboration', 'collaborative'], answer: 1, why: 'Tính từ trước danh từ.' },
    ],
  },
  {
    type: 'relative_clause',
    title: 'Mệnh đề quan hệ: who / which / that',
    minutes: 3,
    rules: [
      'who cho người, which cho vật/sự việc, that thay được cả hai trong mệnh đề xác định (không có dấu phẩy).',
      'Sau dấu phẩy (mệnh đề bổ sung) KHÔNG dùng that → dùng which / who.',
      ', which … có thể thay cho cả vế trước — động từ chia số ít: …, which has caused delays.',
      'Rút gọn: the drawings (which were) approved yesterday → the drawings approved yesterday.',
    ],
    examples: [
      { en: 'The engineer who inspected the site is on leave.', vi: 'Kỹ sư kiểm tra công trường đang nghỉ phép.' },
      { en: 'Access was given late, which delayed the works.', vi: 'Mặt bằng bàn giao muộn, điều này làm chậm công việc.' },
      { en: 'The materials delivered today are for Zone B.', vi: 'Vật tư giao hôm nay dành cho Khu B.' },
    ],
    trap: [
      { wrong: '…in the organisation, that have proved the importance…', right: '…in the organisation, which has proved the importance…', why: 'Sau dấu phẩy → which; thay cả vế → số ít.' },
    ],
    quiz: [
      { q: 'The supplier ___ delivered late has apologised.', options: ['who', 'which'], answer: 0, why: 'Người → who.' },
      { q: 'The site was flooded, ___ stopped all work.', options: ['that', 'which'], answer: 1, why: 'Sau dấu phẩy → which.' },
      { q: 'The report ___ you sent was very clear.', options: ['who', 'that'], answer: 1, why: 'Vật, mệnh đề xác định → that/which.' },
      { q: 'Payment was late, which ___ our cash flow.', options: ['have affected', 'has affected'], answer: 1, why: 'which thay cả vế → số ít.' },
      { q: 'The drawings ___ yesterday are attached.', options: ['approved', 'approving'], answer: 0, why: 'Rút gọn bị động → V3.' },
    ],
  },
  {
    type: 'linking',
    title: 'Từ nối: although, despite, however, therefore',
    minutes: 3,
    rules: [
      'although / even though + mệnh đề; despite / in spite of + danh từ hoặc V-ing.',
      'however, therefore đứng đầu câu (sau dấu chấm hoặc chấm phẩy) và có dấu phẩy theo sau.',
      'because + mệnh đề; because of / due to + danh từ.',
    ],
    examples: [
      { en: 'Although it rained, the pour went ahead.', vi: 'Mặc dù trời mưa, việc đổ bê tông vẫn tiến hành.' },
      { en: 'Despite the rain, the pour went ahead.', vi: 'Bất chấp mưa, việc đổ bê tông vẫn tiến hành.' },
      { en: 'Access was late. Therefore, we request an extension.', vi: 'Mặt bằng bàn giao muộn. Do đó, chúng tôi đề nghị gia hạn.' },
    ],
    trap: [
      { wrong: 'Despite it rained, …', right: 'Although it rained, … / Despite the rain, …', why: 'despite + danh từ.' },
      { wrong: 'Because the heavy rain, …', right: 'Because of the heavy rain, …', why: 'because of + danh từ.' },
    ],
    quiz: [
      { q: '___ the delay, we finished on budget.', options: ['Although', 'Despite'], answer: 1, why: 'Sau là danh từ → Despite.' },
      { q: 'The work stopped ___ heavy rain.', options: ['because', 'due to'], answer: 1, why: 'Danh từ → due to.' },
      { q: 'The price is high. ___, the quality is excellent.', options: ['However', 'Although'], answer: 0, why: 'Đầu câu, nối 2 câu → However.' },
      { q: '___ we worked overtime, we missed the deadline.', options: ['Despite', 'Although'], answer: 1, why: 'Mệnh đề → Although.' },
      { q: 'Payment is late. ___, we may suspend work.', options: ['Therefore', 'Because'], answer: 0, why: 'Kết quả → Therefore.' },
    ],
  },
  {
    type: 'word_order',
    title: 'Trật tự từ trong câu',
    minutes: 2,
    rules: [
      'Trạng từ tần suất đứng trước động từ thường, sau be: We always check…, The site is always clean.',
      'Tính từ đứng trước danh từ; cụm danh từ ghép: the project management team.',
      'Câu hỏi gián tiếp không đảo ngữ: Could you tell me when the inspection is? (không phải when is the inspection).',
    ],
    examples: [
      { en: 'We always hold a toolbox talk at 7 am.', vi: 'Chúng tôi luôn họp an toàn đầu ca lúc 7 giờ.' },
      { en: 'Could you confirm when the materials will arrive?', vi: 'Anh/chị có thể xác nhận khi nào vật tư đến không?' },
    ],
    trap: [
      { wrong: 'Could you tell me when will the drawings be approved?', right: 'Could you tell me when the drawings will be approved?', why: 'Câu hỏi gián tiếp → không đảo.' },
    ],
    quiz: [
      { q: 'Choose the correct sentence:', options: ['We check always the scaffold.', 'We always check the scaffold.'], answer: 1, why: 'always trước động từ thường.' },
      { q: 'Choose the correct sentence:', options: ['Please let me know where is the meeting.', 'Please let me know where the meeting is.'], answer: 1, why: 'Câu hỏi gián tiếp không đảo.' },
      { q: 'Choose the correct sentence:', options: ['The site is usually busy.', 'The site usually is busy.'], answer: 0, why: 'Sau be.' },
      { q: 'Choose the correct phrase:', options: ['a team project management', 'a project management team'], answer: 1, why: 'Danh từ chính đứng cuối.' },
      { q: 'Choose the correct sentence:', options: ['Do you know when the payment will be made?', 'Do you know when will the payment be made?'], answer: 0, why: 'Không đảo ngữ.' },
    ],
  },
  {
    type: 'conditional',
    title: 'Câu điều kiện trong đàm phán & cảnh báo',
    minutes: 3,
    rules: [
      'Loại 1 (có thể xảy ra): If + hiện tại, will + V — If the RFI is late, the works will stop.',
      'Loại 2 (giả định, lịch sự khi đàm phán): If + quá khứ, would + V — If you approved it today, we could start on Monday.',
      'Unless = if … not; provided that = với điều kiện.',
      'Trang trọng: Should you have any questions, … (= If you have…).',
    ],
    examples: [
      { en: 'If we receive approval today, we will start on Monday.', vi: 'Nếu hôm nay được duyệt, thứ Hai chúng tôi sẽ bắt đầu.' },
      { en: 'Unless payment is made, we may suspend the works.', vi: 'Nếu không được thanh toán, chúng tôi có thể tạm dừng thi công.' },
      { en: 'Should you need further information, please contact me.', vi: 'Nếu cần thêm thông tin, xin vui lòng liên hệ tôi.' },
    ],
    trap: [
      { wrong: 'If we will receive the drawings, we start.', right: 'If we receive the drawings, we will start.', why: 'Không dùng will sau if.' },
    ],
    quiz: [
      { q: 'If the materials ___ late, we will lose a week.', options: ['arrive', 'will arrive'], answer: 0, why: 'Sau if dùng hiện tại.' },
      { q: 'If you ___ the price, we could sign today.', options: ['accept', 'accepted'], answer: 1, why: 'Loại 2 → quá khứ.' },
      { q: '___ we receive payment, we cannot continue.', options: ['If', 'Unless'], answer: 1, why: 'Unless = if not.' },
      { q: '___ you have any questions, please let me know.', options: ['Should', 'Would'], answer: 0, why: 'Should you… = If you…' },
      { q: 'We will start on Monday, ___ the access is ready.', options: ['provided that', 'unless'], answer: 0, why: 'Với điều kiện.' },
    ],
  },
  {
    type: 'noun_phrase',
    title: 'Cụm danh từ (noun phrase) trong văn bản kỹ thuật',
    minutes: 4,
    rules: [
      'Danh từ chính đứng cuối; từ bổ nghĩa đứng trước và để số ít: fire safety inspection, drawing register.',
      'Thông tin sau danh từ: giới từ (increase in cost), V3 (drawings issued yesterday), V-ing (workers working at height), to V (a decision to extend).',
      'of cho số lượng/bộ phận/sở hữu với vật: the number of defects, the price of the hotel.',
    ],
    examples: [
      { en: 'The revised fire safety plan was issued yesterday.', vi: 'Phương án an toàn PCCC điều chỉnh đã được phát hành hôm qua.' },
      { en: 'The drawings issued on Monday supersede Rev. A.', vi: 'Bản vẽ phát hành thứ Hai thay thế phiên bản A.' },
      { en: 'There has been a significant increase in material costs.', vi: 'Chi phí vật liệu đã tăng đáng kể.' },
    ],
    trap: [
      { wrong: 'a drawings register', right: 'a drawing register', why: 'Danh từ bổ nghĩa để số ít.' },
      { wrong: 'the project’s cost of the variation', right: 'the cost of the variation', why: 'Sở hữu với vật → of.' },
      { wrong: 'the workers who are working at height must…', right: 'workers working at height must…', why: 'Rút gọn mệnh đề quan hệ cho gọn.' },
    ],
    quiz: [
      { q: 'Choose the correct phrase:', options: ['a safeties officer', 'a safety officer'], answer: 1, why: 'Danh từ bổ nghĩa để số ít.' },
      { q: 'There was a sharp increase ___ steel prices.', options: ['of', 'in', 'on'], answer: 1, why: 'increase in.' },
      { q: 'The materials ___ yesterday are for Zone B.', options: ['delivering', 'delivered', 'deliver'], answer: 1, why: 'Bị động rút gọn → V3.' },
      { q: 'We made a decision ___ the deadline.', options: ['extending', 'to extend', 'for extend'], answer: 1, why: 'decision + to V.' },
      { q: 'Choose the natural phrase:', options: ['the cost of the variation', 'the variation’s cost of it'], answer: 0, why: 'Vật → of.' },
    ],
  },
]

export const lessonFor = (type: string) => LESSONS.find((l) => l.type === type)

export const PASS_RATIO = 0.8
export const SESSION_SIZE = 10

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[.,!?;:"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export function checkFix(q: FixQ, input: string) {
  const got = norm(input)
  return [q.answer, ...(q.alts ?? [])].some((a) => norm(a) === got)
}
