import SituationReport from '@/components/SituationReport'
import { getSituationDays } from '@/lib/situationData'

export default async function SituationReportPage() {
  const days = await getSituationDays()
  const last = days[days.length - 1]
  return <SituationReport lastDay={last.day} lastDate={last.date} />
}
