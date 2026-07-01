import { SITE } from '../config/site'

export const USER_GUIDE_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    summary: 'Sign in, set up your profile, and learn your way around.',
    topics: [
      {
        id: 'user-sign-in',
        title: 'Sign in & set up your profile',
        summary: 'Create your account and complete onboarding once.',
        steps: [
          'From the landing page, tap Sign In or Book a Court.',
          'Sign in with Google or email and password.',
          'Complete onboarding — your name, mobile number, and optional address.',
          'You only need to do this once; future visits go straight to Home.',
        ],
      },
      {
        id: 'user-home',
        title: 'Your home screen',
        path: '/home',
        summary: 'What you see after sign-in and where to go next.',
        steps: [
          'Home shows your booking stats, quick actions, and upcoming reservations.',
          'My Open Play lists sessions you marked as RSVPed.',
          'Use the navbar for Book, Open Play, Bookings, and Guide.',
          'The bell icon shows recent notifications.',
        ],
        tips: [
          'Bookmark Home — it is your starting point every visit.',
        ],
      },
    ],
  },
  {
    id: 'bookings',
    title: 'Bookings',
    summary: 'Reserve a court, pay, and track your reservations.',
    topics: [
      {
        id: 'user-book-court',
        title: 'Book a court',
        path: '/book',
        summary: 'Pick a date, time, and duration, then pay to reserve.',
        steps: [
          'Tap Book in the navbar or the Book Court button on Home.',
          'Choose how many courts you need (1–4) — we auto-assign that many when your slot is free.',
      'Choose a date, then tap an available start hour on the time grid.',
          'Green highlights your selected block; striped slots are already taken.',
          'Pick duration (1–24 hours, limited by time left that day).',
          'Add optional extras — paddle or ball rental, or a trainer — on the next step.',
          'Review the price breakdown and continue to payment.',
          'Scan the GCash or GoTyme QR, pay, then enter sender name, platform, and reference.',
          'Submit — your booking stays Processing until staff verifies payment.',
        ],
        tips: [
          'Dashed slots mean your chosen duration will not fit in that window.',
          'Rates vary by time of day — check the legend on the grid.',
          'Multi-court bookings charge each court at the hourly rate for your slot, plus extras once.',
          'Processing bookings with payment submitted still hold your slot until staff confirms or cancels.',
        ],
      },
      {
        id: 'user-view-bookings',
        title: 'View your bookings',
        path: '/my-bookings',
        summary: 'See all reservations grouped by status.',
        steps: [
          'Open Bookings in the navbar.',
          'Processing — payment submitted, waiting for staff to verify.',
          'Upcoming — confirmed and not yet played.',
          'Past — completed, cancelled, or sessions that already ended.',
          'Tap a booking to view full details.',
        ],
      },
      {
        id: 'user-cancel-booking',
        title: 'Cancel a booking',
        path: '/my-bookings',
        summary: 'Cancel when your plans change (when allowed).',
        steps: [
          'Open My Bookings and find the reservation.',
          'Tap the booking to open details.',
          'Use Cancel if the option is available for that booking.',
          'Confirm — the court slot becomes free for others.',
        ],
        tips: [
          'Processing bookings may auto-cancel after 30 minutes if payment was not submitted.',
        ],
      },
    ],
  },
  {
    id: 'open-play',
    title: 'Open Play',
    summary: 'Community drop-in sessions — separate from paid court bookings.',
    topics: [
      {
        id: 'user-browse-open-play',
        title: 'Browse open play sessions',
        path: '/open-play',
        summary: `Find upcoming community sessions posted by ${SITE.name}.`,
        steps: [
          'Tap Open Play in the navbar.',
          'Browse Upcoming sessions with date, time, court, and skill level.',
          'Each card shows a countdown to the RSVP deadline.',
          'Switch to Past to see sessions whose RSVP window has closed.',
        ],
      },
      {
        id: 'user-rsvp-open-play',
        title: 'RSVP & track on your home feed',
        path: '/open-play',
        summary: 'Sign up on Reclub and keep sessions on your Home page.',
        steps: [
          'On a session card, tap RSVP on Reclub — this opens their site to sign up.',
          'After RSVPing externally, return and tap Yes, I\'ve RSVPed — add to My Open Play.',
          'The session then appears under My Open Play on Home and in the My RSVPs filter.',
          'Tap Remove on a card anytime to drop it from your list.',
        ],
        tips: [
          `Open play fees (if any) are handled through Reclub, not ${SITE.name}.`,
        ],
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    summary: 'Notifications, profile, and sign-in settings.',
    topics: [
      {
        id: 'user-notifications',
        title: 'Notifications',
        path: '/notifications',
        summary: 'Alerts when bookings are confirmed, cancelled, or updated.',
        steps: [
          'Tap the bell in the navbar for recent alerts.',
          'View all opens your full notification inbox.',
          'Tap an alert to mark it read, or use Mark all read.',
          'Booking alerts link you to My Bookings.',
        ],
        tips: [
          'If the badge looks stuck, refresh the page.',
        ],
      },
      {
        id: 'user-profile',
        title: 'Update your profile',
        path: '/profile',
        summary: 'Keep your name, phone, and address up to date.',
        steps: [
          'Open your avatar menu and tap Profile.',
          'Edit name, phone, and address — staff may use these for booking follow-ups.',
          'Email users can change password here; Google users manage security through Google.',
        ],
      },
    ],
  },
  {
    id: 'visit',
    title: 'Visit Us',
    summary: `Location, hours, and how to reach ${SITE.name}.`,
    topics: [
      {
        id: 'user-location',
        title: 'Location, hours & contact',
        summary: 'Find us and get help when you need it.',
        steps: [
          `${SITE.legalName} — ${SITE.venue.cityLine} (${SITE.contact.addressNote}).`,
          `${SITE.venue.hoursLabel}${SITE.venue.hoursDetail ? ` (${SITE.venue.hoursDetail})` : ''}. ${SITE.venue.parkingLabel}.`,
          `${SITE.venue.courtCount} pickleball courts available for online booking.`,
          'Use Waze or Google Maps links on the landing page or site footer.',
          `Questions or refund requests — message ${SITE.name} on Facebook (link on My Bookings).`,
        ],
      },
    ],
  },
]
