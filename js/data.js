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
  registrationNo: '[Business Registration No.]',
  abn: '[00 000 000 000]',
  licence: '[Licence / Permit No.]',

  // Location & contact
  address: '[Street Address]',
  suburb: '[Suburb] [STATE] [Postcode]',
  phone: '[0400 000 000]',
  phone2: '',
  email: '[bookings@studio27.com.au]',
  recruitEmail: '[jobs@studio27.com.au]',
  parking: '[Parking details, e.g. free parking at rear]',
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
      lead: '[One or two sentences on why Studio 27 exists and what it stands for.]',
      paragraphs: [
        '[Tell the story of the studio — how it started, the vision behind the space, and what guests love about it.]',
        '[Talk about the team: professional, friendly, and focused on making every visit relaxed and enjoyable.]'
      ],
      values: [
        { heading: 'Discretion', body: 'Your privacy is protected at every step, from booking to departure.' },
        { heading: 'Respect', body: 'Guests and staff are treated with courtesy and respect, always.' },
        { heading: 'Comfort', body: 'Clean, private rooms with everything you need to relax.' },
        { heading: 'Safety', body: 'A safe, professional and fully compliant environment for everyone.' }
      ]
    },
    faq: [
      {
        title: 'Bookings',
        items: [
          { question: 'Do I need to book?', answer: 'Bookings are recommended, especially on weekends and evenings. Walk-ins are welcome subject to availability.' },
          { question: 'How do I make a booking?', answer: 'Call or text us, or send a request through our contact page. Your booking is confirmed once you hear back from us.' },
          { question: 'Can I request a specific lady?', answer: 'Yes. Check the roster to see who’s working, then mention your preference when you book.' },
          { question: 'What if I need to cancel or reschedule?', answer: 'Please give us as much notice as possible. See our Cancellation, Refund & Rescheduling Policy.' }
        ]
      },
      {
        title: 'Your visit',
        items: [
          { question: 'Is it discreet?', answer: 'Absolutely. [Describe discreet entry, parking and how payments appear on statements.]' },
          { question: 'How do I pay?', answer: 'Payment is made at reception before your session. [List accepted payment methods.]' },
          { question: 'Is there parking?', answer: '[Parking details.]' },
          { question: 'Will I be asked for ID?', answer: 'All guests must be 18 or over. We may ask for photo ID if you look under 25.' },
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
   photo:  path to an image in /images, e.g. 'images/models/ruby.jpg'
           (leave '' to show the "photo coming soon" placeholder)
   age:    must be 18 or over
   days:   any of 'Mon','Tue','Wed','Thu','Fri','Sat','Sun'
   time:   shift shown on the roster for those days
   isNew:  true shows a "New" tag                                   */
const MODELS = [
  { name: '[Model 1]', photo: '', age: 18, intro: '[A short, tasteful introduction.]', days: ['Mon', 'Wed', 'Fri'], time: '10am – 6pm', isNew: true },
  { name: '[Model 2]', photo: '', age: 18, intro: '[A short, tasteful introduction.]', days: ['Tue', 'Thu', 'Sat'], time: '6pm – late', isNew: false },
  { name: '[Model 3]', photo: '', age: 18, intro: '[A short, tasteful introduction.]', days: ['Mon', 'Tue', 'Sun'], time: '12pm – 8pm', isNew: false },
  { name: '[Model 4]', photo: '', age: 18, intro: '[A short, tasteful introduction.]', days: ['Wed', 'Fri', 'Sat'], time: '8pm – late', isNew: true },
  { name: '[Model 5]', photo: '', age: 18, intro: '[A short, tasteful introduction.]', days: ['Thu', 'Sat', 'Sun'], time: '10am – 6pm', isNew: false },
  { name: '[Model 6]', photo: '', age: 18, intro: '[A short, tasteful introduction.]', days: ['Mon', 'Fri', 'Sun'], time: '6pm – late', isNew: false }
];
