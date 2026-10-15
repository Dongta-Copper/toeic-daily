import SituationDayList from '@/components/SituationDayList'
import { getSituationDays } from '@/lib/situationData'

export default async function SituationHome() {
  const days = await getSituationDays()
  const summary = days.map((d) => ({
    day: d.day,
    date: d.date,
    topics: d.sentences.filter((s) => s.number === 1).map((s) => s.topic),
  }))

  return <SituationDayList days={summary} />
}
