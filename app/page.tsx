import { redirect } from 'next/navigation'

// The TOEIC part list was replaced by IELTS General Reading (the old /quiz and /history pages still exist).
export default function Home() {
  redirect('/ielts')
}
