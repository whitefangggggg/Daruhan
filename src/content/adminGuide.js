export const ADMIN_GUIDE_CATEGORIES = [
  {
    id: 'overview',
    title: 'Overview',
    summary: 'Your daily starting point — stats, pending work, and who is on court today.',
    topics: [
      {
        id: 'admin-nav',
        title: 'Navigate the admin panel',
        summary: 'What each menu item does and when to use it.',
        steps: [
          'Overview — monthly booking stats, pending payments, and today\'s confirmed schedule.',
          'Bookings — full calendar, payment verification, and walk-in reservations.',
          'Open Play — community sessions, RSVP posts, and session wrap-up.',
          'Block Hours — take a court offline for maintenance or private use.',
          'Users — registered players and contact details.',
          'Guide — this manual, always available from the top menu.',
        ],
      },
      {
        id: 'admin-monthly-stats',
        title: 'View monthly stats',
        path: '/admin',
        summary: 'Track booking revenue, volume, and court hours for any month.',
        steps: [
          'Open Overview from the admin menu.',
          'The top cards show revenue (₱), booking count, court hours, and how many payments need review.',
          'Use the month picker to look at past months; tap Today to jump back to the current month.',
          'Trend arrows compare this month to the previous one.',
        ],
        tips: [
          'Open play revenue is on the Open Play page — it is not mixed into booking revenue here.',
        ],
      },
      {
        id: 'admin-pending-payments',
        title: 'Review pending payments',
        path: '/admin',
        summary: 'Confirm or reject player payments waiting on the overview page.',
        steps: [
          'When players submit GCash or GoTyme payment, their booking appears under Pending payments.',
          'Each card shows court, date, time, player name, payment method, sender, and reference number.',
          'Match the reference against your payment app, then tap Verify & confirm to approve the booking.',
          'Tap Reject if payment was not received or details do not match.',
          'Confirmed bookings leave the pending list and the player gets a notification.',
        ],
        tips: [
          'You can also verify payments from the Bookings page if you are already viewing that day.',
        ],
      },
      {
        id: 'admin-today-schedule',
        title: 'View today\'s schedule',
        path: '/admin',
        summary: 'See every confirmed booking happening today at a glance.',
        steps: [
          'Scroll to Today\'s schedule on the Overview page.',
          'Bookings are listed by start time with court, player name, and duration.',
          'Use this at the start of your shift to know who is expected on each court.',
        ],
      },
    ],
  },
  {
    id: 'bookings',
    title: 'Bookings',
    summary: 'View the calendar, verify payments, create walk-ins, and manage reservations.',
    topics: [
      {
        id: 'admin-view-bookings',
        title: 'View bookings on the calendar',
        path: '/admin/bookings',
        summary: 'Browse reservations by date and see status at a glance.',
        steps: [
          'Open Bookings from the admin menu.',
          'Pick a date or use the calendar to jump to any day.',
          'Each card shows court, time, player, status, and payment info.',
          'Statuses include Processing (awaiting verification), Confirmed, Completed, and Cancelled.',
        ],
      },
      {
        id: 'admin-verify-booking',
        title: 'Verify or reject a payment',
        path: '/admin/bookings',
        summary: 'Confirm player-submitted payments from the bookings list.',
        steps: [
          'Find a Processing booking on the chosen date.',
          'Open the card and check payment method, sender name, and reference number.',
          'Cross-check against your GCash or GoTyme records.',
          'Tap Verify to confirm the booking, or Reject if payment is missing or invalid.',
        ],
        tips: [
          'Rejecting cancels the booking — only reject when you are sure payment was not received.',
        ],
      },
      {
        id: 'admin-create-booking',
        title: 'Create a walk-in reservation',
        path: '/admin/bookings',
        summary: 'Book a court for someone at the desk or over the phone.',
        steps: [
          'On the Bookings page, tap Create reservation.',
          'Choose court, date, start hour, and duration (1–24 hours).',
          'Enter the player\'s name and contact details.',
          'Turn on Repeat weekly if the same slot should repeat every matching weekday until an end date.',
          'Toggle Payment collected if they already paid; leave off if they will pay later.',
          'Submit — the booking is confirmed immediately (no player payment step).',
        ],
        tips: [
          'Weekly repeat is handy for regular groups, e.g. every Saturday morning.',
          'The booking must finish before midnight on the day it starts.',
        ],
      },
      {
        id: 'admin-mark-paid',
        title: 'Mark a booking as paid',
        path: '/admin/bookings',
        summary: 'Record payment for reservations that were not paid upfront.',
        steps: [
          'Find a confirmed admin booking where payment was not collected at booking time.',
          'When the player pays at the desk, tap Mark as paid on the booking card.',
          'The payment collected flag updates so you know the balance is settled.',
        ],
      },
      {
        id: 'admin-cancel-booking',
        title: 'Cancel a booking',
        path: '/admin/bookings',
        summary: 'Remove a confirmed reservation when the session will not happen.',
        steps: [
          'Open the booking on the Bookings page.',
          'Tap Cancel on a confirmed booking.',
          'Confirm — the slot becomes available again for other players.',
        ],
      },
    ],
  },
  {
    id: 'open-play',
    title: 'Open Play',
    summary: 'Post community sessions, manage RSVPs, and log attendance and revenue.',
    topics: [
      {
        id: 'admin-create-open-play',
        title: 'Create an open play post',
        path: '/admin/open-play',
        summary: 'Announce a drop-in session and block the court automatically.',
        steps: [
          'Open Open Play from the admin menu and tap Create post.',
          'Pick court, session date, start time, and end time.',
          'Set the RSVP deadline — when sign-ups close on Reclub.',
          'Add the Reclub link, skill level, title, and session details.',
          'Publish — the court is blocked for that window and players can see the post.',
        ],
        tips: [
          'The RSVP deadline can be earlier than session start — that drives the countdown players see.',
        ],
      },
      {
        id: 'admin-edit-open-play',
        title: 'Edit or cancel a session',
        path: '/admin/open-play',
        summary: 'Update details or call off an upcoming open play.',
        steps: [
          'Find the session under Upcoming on the Open Play page.',
          'Tap Edit to change times, details, or the Reclub link.',
          'Tap Cancel post if the session will not run — this frees the court again.',
        ],
        tips: [
          'Always cancel from the app rather than leaving a stale post live.',
        ],
      },
      {
        id: 'admin-wrap-up-open-play',
        title: 'Mark complete & log revenue',
        path: '/admin/open-play',
        summary: 'Close out a session after RSVP deadline and record how it went.',
        steps: [
          'After the RSVP deadline, the session moves to Needs wrap-up.',
          'Tap Mark complete on the session card.',
          'Enter attendance (headcount) and money collected (₱).',
          'Save — the session moves to Completed and counts toward open play stats.',
          'Use Edit totals later if you need to correct the numbers.',
        ],
        tips: [
          'Open play income is tracked separately from regular court bookings.',
        ],
      },
    ],
  },
  {
    id: 'courts',
    title: 'Courts',
    summary: 'Control court availability outside of normal bookings.',
    topics: [
      {
        id: 'admin-block-hours',
        title: 'Block hours for maintenance',
        path: '/admin/slots',
        summary: 'Take a court offline for repairs, cleaning, or a private event.',
        steps: [
          'Open Block Hours from the admin menu.',
          'Select court, date, start hour, and duration.',
          'Add an optional reason (e.g. maintenance, private event).',
          'Save — blocked time shows as unavailable when players try to book.',
          'Remove the block from the list when the court is open again.',
        ],
        tips: [
          'Open play posts block the court automatically — no extra block needed for those.',
        ],
      },
    ],
  },
  {
    id: 'users',
    title: 'Users',
    summary: 'Look up registered players and contact information.',
    topics: [
      {
        id: 'admin-view-users',
        title: 'Look up a registered player',
        path: '/admin/users',
        summary: 'Find name, phone, and account details for follow-ups.',
        steps: [
          'Open Users from the admin menu.',
          'Browse the list — newest accounts appear first.',
          'Each row shows name, phone, player or admin badge, onboarding status, and join date.',
          'Use phone numbers to follow up on bookings or payment issues.',
        ],
        tips: [
          'Onboarding pending means the player has not finished their profile yet.',
          'To add a new admin account, contact your site owner — roles cannot be changed here.',
        ],
      },
    ],
  },
]
