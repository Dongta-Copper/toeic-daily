import { LessonView } from '@/components/Lessons'

export default async function LessonPage({ params }: PageProps<'/lessons/[type]'>) {
  const { type } = await params
  return <LessonView key={type} type={type} />
}
