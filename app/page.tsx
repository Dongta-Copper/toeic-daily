import { redirect } from 'next/navigation'

// Home is the learning roadmap (the old TOEIC part list was replaced by IELTS; /quiz and /history still exist).
export default function Home() {
  redirect('/roadmap')
}
