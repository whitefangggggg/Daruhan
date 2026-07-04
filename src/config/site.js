/**
 * Venue branding & business settings — edit this file when cloning for a new client.
 *
 * Most UI copy still lives in Landing.jsx and src/content/*.js; search for the old
 * venue name after changing values here. See CLIENT_SETUP.md (frontend checklist).
 */

export const SITE = {
  /** Short name — navbar, login, page title */
  name: 'Daruhan',

  /** Legal / footer name */
  legalName: 'Daruhan Gighub and Foodpark',

  /** Tagline under the logo (matches crest) */
  tagline: 'Gighub & Food Park',

  /** Used in payment QR demo payload and emails */
  slug: 'Daruhan',

  /** Prefix for sessionStorage keys and custom DOM events (use lowercase, no spaces) */
  storagePrefix: 'daruhan',

  venue: {
    courtCount: 4,
    maxCourtQuantity: 4,
    hoursLabel: 'Open 7AM – 5AM',
    hoursDetail: 'Daily · closed 5AM – 7AM',
    parkingLabel: 'Parking available',
    cityLine: 'Proper Valladolid, Carcar City, Cebu',
    /** Venue reopens at openHour; closed from closeHour until openHour (overnight). */
    operatingHours: { openHour: 7, closeHour: 5 },
    openingSoon: false,
  },

  contact: {
    phone: '+639236398087',
    phoneDisplay: '0923 639 8087',
    email: 'calipayanjenneva@gmail.com',
    facebook: 'https://www.facebook.com/profile.php?id=61582349907442',
    facebookLabel: "Daruhan & D'Superclub on Facebook",
    messenger: 'https://www.facebook.com/profile.php?id=61582349907442',
    messengerLabel: "Daruhan & D'Superclub on Facebook",
    address: 'Proper Valladolid, Carcar City',
    addressNote: 'Cebu, Philippines',
    waze: 'https://waze.com/ul?q=Proper+Valladolid+Carcar+City+Cebu',
    maps: 'https://maps.google.com/?q=Proper+Valladolid+Carcar+City+Cebu',
  },

  features: {
    trainer: false,
    multiCourtBooking: true,
  },

  /** Reusable marketing strings — Landing, Footer, guides */
  copy: {
    heroLine1: 'Court.',
    heroLine2Prefix: 'Lounge. ',
    heroLine2Accent: 'Club.',
    heroTagline: 'Book Your Court.',
    heroSubtitle:
      'Sweat it out on the court, then sing it out in the lounge — billiards, KTV, and Daruhan Super Club while you wait.',
    footerBlurb:
      'Pickleball courts, lounge, billiards, KTV, and Daruhan Super Club — your weekends, upgraded.',
    aboutSectionLabel: 'About Daruhan',
    aboutHeadlineLine1: 'More than',
    aboutHeadlineAccent: 'a court.',
    aboutLead:
      'Daruhan is a food park and gig hub — pickleball courts, minimart, restaurant, cafe, billiards, KTV, and D\'SuperClub all in one stop. Book your court online, then stay for the rest of the experience.',
    aboutHighlightTitle: 'The full Daruhan experience',
    aboutHighlightNote: 'Proper Valladolid, Carcar City, Cebu',
    eventsBlurb:
      "Court busy? We've got you covered. Rack 'em up, book a KTV room, or cool down with a drink at Daruhan Super Club.",
    joinCta: 'Join Daruhan',
    welcomeOnboarding: 'Welcome to Daruhan',
  },

  /** About section venue cards — Landing #about */
  aboutVenues: [
    {
      iconifyId: 'noto:ping-pong',
      title: 'Pickleball Courts',
      hook: 'Book online',
      desc: 'Four pickleball courts — reserve online and rally up with friends, leagues, or your regular group.',
    },
    {
      iconifyId: 'noto:convenience-store',
      title: 'Daruhan Minimart',
      hook: 'Open 24/7',
      desc: 'Your 24/7 pitstop for snacks, cold drinks, liquors, and daily essentials.',
    },
    {
      iconifyId: 'noto:fork-and-knife-with-plate',
      title: 'Daruhan Restaurant',
      hook: 'Hearty meals',
      desc: 'Hearty meals and good times. The perfect sit-down spot for lunch or dinner.',
    },
    {
      iconifyId: 'noto:hot-beverage',
      title: 'Daruhan Cafe',
      hook: 'Sip & recharge',
      desc: 'Sip, relax, and recharge with expertly brewed coffee and fresh pastries.',
    },
    {
      iconifyId: 'noto:microphone',
      title: 'Daruhan KTV',
      hook: '9 rooms',
      desc: '9 private rooms, endless hits. Grab the mic for just ₱100/hour.',
    },
    {
      iconifyId: 'noto:pool-8-ball',
      title: 'Billiards',
      hook: "Rack 'em up",
      desc: "Rack 'em up. Premium tables and a cool vibe for ₱100/hour.",
    },
    {
      iconifyId: 'noto:party-popper',
      title: "D'SuperClub",
      hook: 'Night life',
      desc: 'Where the night comes alive. Live DJs, loud beats, and flowing drinks.',
    },
  ],

  ktv: {
    roomCount: 9,
    ratePerHour: 100,
    minHours: 1,
    maxHours: 8,
    hoursLabel: 'Open 8AM – 4AM',
    hoursDetail: 'Daily · closed 4AM – 8AM',
    /** Rooms reopen at openHour; closed from closeHour until openHour (overnight). */
    operatingHours: { openHour: 8, closeHour: 4 },
  },
}

/** @deprecated Prefer SITE.contact — kept so existing imports keep working */
export const CONTACT = SITE.contact
