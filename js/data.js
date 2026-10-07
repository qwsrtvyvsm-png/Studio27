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
  }
};

/* Models
   photo:  path to an image in /images, e.g. 'images/models/ruby.jpg'
           (leave '' to show the "photo coming soon" placeholder)
   days:   any of 'Mon','Tue','Wed','Thu','Fri','Sat','Sun'
   time:   shift shown on the roster for those days
   isNew:  true shows a "New" tag                                   */
const MODELS = [
  { name: '[Model 1]', photo: '', intro: '[A short, tasteful introduction.]', days: ['Mon', 'Wed', 'Fri'], time: '10am – 6pm', isNew: true },
  { name: '[Model 2]', photo: '', intro: '[A short, tasteful introduction.]', days: ['Tue', 'Thu', 'Sat'], time: '6pm – late', isNew: false },
  { name: '[Model 3]', photo: '', intro: '[A short, tasteful introduction.]', days: ['Mon', 'Tue', 'Sun'], time: '12pm – 8pm', isNew: false },
  { name: '[Model 4]', photo: '', intro: '[A short, tasteful introduction.]', days: ['Wed', 'Fri', 'Sat'], time: '8pm – late', isNew: true },
  { name: '[Model 5]', photo: '', intro: '[A short, tasteful introduction.]', days: ['Thu', 'Sat', 'Sun'], time: '10am – 6pm', isNew: false },
  { name: '[Model 6]', photo: '', intro: '[A short, tasteful introduction.]', days: ['Mon', 'Fri', 'Sun'], time: '6pm – late', isNew: false }
];
