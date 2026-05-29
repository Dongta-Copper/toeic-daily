import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const parts = [
  {
    number: 5,
    label: 'Incomplete Sentences',
    description: 'Choose the word or phrase that best completes each sentence. Tests grammar and vocabulary.',
    href: '/quiz/5',
  },
  {
    number: 6,
    label: 'Text Completion',
    description: 'Read a short text and choose the best word, phrase, or sentence for each blank.',
    href: '/quiz/6',
  },
  {
    number: 7,
    label: 'Reading Comprehension',
    description: 'Read single and multiple passages, then answer questions about content and detail.',
    href: '/quiz/7',
  },
]

export default function Home() {
  return (
    <div className="max-w-xl mx-auto px-6 py-20 w-full">
      <div className="mb-14">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Reading Section</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">TOEIC Practice</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Select a part to begin. Your scores are saved automatically after each submission.
        </p>
      </div>

      <div className="space-y-3">
        {parts.map((part) => (
          <Link
            key={part.number}
            href={part.href}
            className="group flex items-start justify-between p-6 border border-gray-200 rounded-lg hover:border-gray-900 transition-all duration-150"
          >
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  Part {part.number}
                </span>
                <span className="text-sm font-medium text-gray-900">{part.label}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{part.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 flex-shrink-0 mt-0.5 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
