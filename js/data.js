/* ==========================================================
   STUDIO 27 — SITE DATA
   This is the one file to edit for business details, models
   and the roster. Every page reads from here.
   Anything in [square brackets] is a placeholder to replace.
   ========================================================== */

const SITE = {
  name: 'Studio 27',
  tagline: 'Adult Wellness & Relaxation Studio',

  // Compliance / advertising disclosures (shown in every footer)
  legalName: '[Registered Business Name]',
  abn: '[00 000 000 000]',

  // Location & contact
  address: '[Street Address]',
  suburb: '[Suburb] [STATE] [Postcode]',
  phone: '[0400 000 000]',
  phone2: '',
  email: '[bookings@studio27.com.au]',
  parking: '[Parking details, e.g. free parking at rear]',

  // Live update banner, shown site-wide when enabled (e.g. an early close)
  liveUpdate: { enabled: false, message: '' },

  // Social media
  social: {
    instagram: 'https://www.instagram.com/studio27.adl',
    x: 'https://x.com/twentysevenadl',
    reddit: 'https://www.reddit.com/u/OkMetal1969'
  },
  payment: '[Accepted payment methods, e.g. cash & card]',

  // Opening hours
  hoursSummary: 'Open 7 days · [10am – late]',
  hours: {
    Mon: '[10:00am – 2:00am]',
    Tue: '[10:00am – 2:00am]',
    Wed: '[10:00am – 2:00am]',
    Thu: '[10:00am – 2:00am]',
    Fri: '[10:00am – 4:00am]',
    Sat: '[10:00am – 4:00am]',
    Sun: '[12:00pm – 12:00am]'
  },

  // Rates & services (editable from the admin dashboard — this is the
  // fallback shown before /api/public/site loads, or if it's unreachable)
  rates: {
    sessions: [
      { name: '30 minutes', incallPrice: '[000]', outcallPrice: '[000]' },
      { name: '45 minutes', incallPrice: '[000]', outcallPrice: '[000]' },
      { name: '60 minutes', incallPrice: '[000]', outcallPrice: '[000]' },
      { name: '90 minutes', incallPrice: '[000]', outcallPrice: '[000]' },
      { name: '2 hours', incallPrice: '[000]', outcallPrice: '[000]' }
    ],
    servicesNote: 'Services are to be discussed in private room with chosen lady.'
  },

  // Editable page copy (admin dashboard — Site Content). This is the
  // fallback shown before /api/public/site loads, or if it's unreachable.
  content: {
    welcome: {
      lead: 'A sanctuary designed for the modern gentleman — where time slows down and every detail is taken care of.',
      paragraphs: [
        '[Introduce the studio here: who you are, what makes the experience different, and the atmosphere guests can expect when they walk through the door.]',
        '[Talk about comfort and discretion: private rooms, a warm welcome, and a team that takes pride in looking after every guest.]'
      ]
    },
    experience: [
      { heading: 'Private Rooms', body: '[Describe your rooms — ambience, amenities, showers, fresh linen.]' },
      { heading: 'Total Discretion', body: '[Describe your approach to privacy — discreet entry, parking, no names on statements.]' },
      { heading: 'Open Late', body: '[Open 7 days with late-night hours. Bookings and walk-ins welcome.]' }
    ],
    about: {
      lead: 'Studio 27 exists for one reason: to give you somewhere to properly switch off.',
      paragraphs: [
        'Beautiful private rooms, genuinely good company, and not a single thing to perform or prove.',
        'Come for an hour or make an afternoon of it — either way, this one’s entirely yours.'
      ],
      values: [
        { heading: 'Discretion', body: 'Your business is your business. Full stop.' },
        { heading: 'Warmth', body: 'Real conversation, real chemistry — never forced.' },
        { heading: 'Indulgence, done properly', body: 'Beautiful rooms, unhurried time, zero shortcuts.' },
        { heading: 'Respect', body: 'For every person who walks through our door — client or team.' }
      ]
    },
    faq: [
      {
        title: 'Bookings',
        items: [
          { question: 'Do I need to book, or can I just show up?', answer: 'Either works for us. We’re open 7 days and love a good walk-in, but booking ahead means your favourite is guaranteed to be free.' },
          { question: 'How do I make a booking?', answer: 'Call or text us, or send a request through our contact page. Your booking is confirmed once you hear back from us.' },
          { question: 'Can I request a specific lady?', answer: 'Yes. Check the roster to see who’s working, then mention your preference when you book.' },
          { question: 'Can I stay longer than I booked?', answer: 'Absolutely, if the lady requested is available — just ask and we’ll sort the rest.' },
          { question: 'Plans change — what’s your cancellation policy?', answer: 'Life happens. Full details in our Cancellation, Refund & Rescheduling Policy.' }
        ]
      },
      {
        title: 'Your visit',
        items: [
          { question: 'Will anyone know I was here?', answer: 'No. What happens at Studio 27 stays there — your visit, your details, your business.' },
          { question: 'What do I need to bring?', answer: 'Just valid photo ID (18+) and an open mind. We’ll handle the rest.' },
          { question: 'Incall vs outcall — what’s the difference?', answer: 'Incall: you come to us and enjoy the full studio experience. Outcall: we bring the experience to you. Rates for both are on our Rates page.' },
          { question: 'How do I pay?', answer: 'Payment is made at reception before your session. [List accepted payment methods.]' },
          { question: 'Is there parking?', answer: '[Parking details.]' },
          { question: 'Are showers available?', answer: 'Yes. Every room has shower facilities with fresh towels provided.' }
        ]
      },
      {
        title: 'Other',
        items: [
          { question: 'Are you hiring?', answer: 'We’re always happy to hear from new people. Visit Apply Now to join the team.' },
          { question: 'I have a question that isn’t answered here.', answer: 'Call us or send us a message through the contact page.' }
        ]
      }
    ],
    news: {
      paragraphs: [
        '[Share studio news, promotions or updates here. This text is edited from the admin dashboard.]'
      ]
    }
  }
};

/* Models
   photo:     path to an image in /images, e.g. 'images/models/ruby.jpg'
              (leave '' to show the "photo coming soon" placeholder)
   age:       must be 18 or over
   ethnicity: shown on their profile page
   size:      shown on their profile page, e.g. '8 (AU)'
   intro:     short blurb shown on cards
   about:     longer bio shown on their profile page
   days:      any of 'Mon','Tue','Wed','Thu','Fri','Sat','Sun'
   time:      shift shown on the roster for those days
   isNew:     true shows a "New" tag                                   */
const MODELS = [
  { id: 1, name: '[Model 1]', photo: '', photos: [], age: 18, ethnicity: '[Ethnicity]', size: '[Size]', intro: '[A short, tasteful introduction.]', about: '[A longer bio for their profile page.]', days: ['Mon', 'Wed', 'Fri'], time: '10am – 6pm', isNew: true },
  { id: 2, name: '[Model 2]', photo: '', photos: [], age: 18, ethnicity: '[Ethnicity]', size: '[Size]', intro: '[A short, tasteful introduction.]', about: '[A longer bio for their profile page.]', days: ['Tue', 'Thu', 'Sat'], time: '6pm – late', isNew: false },
  { id: 3, name: '[Model 3]', photo: '', photos: [], age: 18, ethnicity: '[Ethnicity]', size: '[Size]', intro: '[A short, tasteful introduction.]', about: '[A longer bio for their profile page.]', days: ['Mon', 'Tue', 'Sun'], time: '12pm – 8pm', isNew: false },
  { id: 4, name: '[Model 4]', photo: '', photos: [], age: 18, ethnicity: '[Ethnicity]', size: '[Size]', intro: '[A short, tasteful introduction.]', about: '[A longer bio for their profile page.]', days: ['Wed', 'Fri', 'Sat'], time: '8pm – late', isNew: true },
  { id: 5, name: '[Model 5]', photo: '', photos: [], age: 18, ethnicity: '[Ethnicity]', size: '[Size]', intro: '[A short, tasteful introduction.]', about: '[A longer bio for their profile page.]', days: ['Thu', 'Sat', 'Sun'], time: '10am – 6pm', isNew: false },
  { id: 6, name: '[Model 6]', photo: '', photos: [], age: 18, ethnicity: '[Ethnicity]', size: '[Size]', intro: '[A short, tasteful introduction.]', about: '[A longer bio for their profile page.]', days: ['Mon', 'Fri', 'Sun'], time: '6pm – late', isNew: false }
];
