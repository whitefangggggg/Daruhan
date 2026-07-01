import GuideLayout from '../components/guide/GuideLayout'
import { USER_GUIDE_CATEGORIES } from '../content/userGuide'

export default function Guide() {
  return (
    <GuideLayout
      variant="user"
      title="Player guide"
      subtitle="How to book courts, join open play, track your reservations, and manage your account."
      categories={USER_GUIDE_CATEGORIES}
      backLink="/home"
      backLabel="Back to home"
    />
  )
}
