import GuideLayout from '../../components/guide/GuideLayout'
import { ADMIN_GUIDE_CATEGORIES } from '../../content/adminGuide'

export default function AdminGuide() {
  return (
    <GuideLayout
      variant="admin"
      title="Admin manual"
      subtitle="Day-to-day tasks for staff — confirming payments, booking courts, open play, and blocking hours."
      categories={ADMIN_GUIDE_CATEGORIES}
      backLink="/admin"
      backLabel="Back to overview"
    />
  )
}
