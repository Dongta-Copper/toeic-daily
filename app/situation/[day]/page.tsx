import { notFound } from 'next/navigation'
import SituationPractice from '@/components/SituationPractice'
import { getSituationDays } from '@/lib/situationData'

export default async function SituationDayPage({ params }: PageProps<'/situation/[day]'>) {
  const { day } = await params
  const days = await getSituationDays()
  const index = days.findIndex((d) => String(d.day) === day)
  if (index === -1) notFound()

  return (
    <SituationPractice
      key={day}
      data={days[index]}
      totalDays={days.length}
      hasNext={index < days.length - 1}
    />
  )
}
