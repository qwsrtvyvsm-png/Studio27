/* ==========================================================
   STUDIO 27 — SITE SCRIPT
   Builds the shared header/footer, runs the 18+ age gate,
   and fills in details from js/data.js.
   ========================================================== */
(function () {
  'use strict';

  /* ---------- 18+ age gate: decide before first paint ---------- */
  var AGE_KEY = 's27_age_ok';
  var ageOk = false;
  try { ageOk = localStorage.getItem(AGE_KEY) === '1'; } catch (e) {}
  if (!ageOk) document.documentElement.classList.add('age-pending');

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var DAY_NAMES = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
  var TODAY = DAYS[(new Date().getDay() + 6) % 7];

  var NAV = [
    { href: 'index.html', label: 'Home', id: 'home' },
    { href: 'about.html', label: 'About', id: 'about' },
    { href: 'ladies.html', label: 'Ladies', id: 'models' },
    { href: 'roster.html', label: 'Roster & Hours', id: 'roster' },
    { href: 'rates.html', label: 'Rates', id: 'rates' },
    { href: 'news.html', label: 'News & Updates', id: 'news' },
    { href: 'contact.html', label: 'Contact', id: 'contact' }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function tel(n) { return 'tel:' + String(n).replace(/[^\d+]/g, ''); }

  /* ---------- Header ---------- */
  function headerHTML(page) {
    var links = NAV.map(function (n) {
      return '<li><a href="' + n.href + '"' + (n.id === page ? ' aria-current="page"' : '') + '>' + n.label + '</a></li>';
    }).join('');

    return '' +
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<header class="site-header">' +
        '<div class="container site-header__inner">' +
          '<a class="brand" href="index.html" aria-label="Studio 27 home">' +
            '<span class="brand__mark">27</span>' +
            '<span class="brand__text"><span class="brand__name">Studio 27</span><span class="brand__sub">Men&rsquo;s Studio</span></span>' +
          '</a>' +
          '<button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">' +
            '<span></span><span></span><span></span><span class="sr-only">Menu</span>' +
          '</button>' +
          '<nav id="site-nav" class="site-nav" aria-label="Main">' +
            '<ul>' + links + '</ul>' +
            '<a class="btn btn--small btn--pink" href="work-with-us.html"' + (page === 'work' ? ' aria-current="page"' : '') + '>Apply Now</a>' +
          '</nav>' +
        '</div>' +
      '</header>';
  }

  /* ---------- Footer ---------- */
  function footerInnerHTML() {
    return '' +
        '<div class="container footer-grid">' +
          '<div class="footer-brand">' +
            '<a class="brand" href="index.html"><span class="brand__mark">27</span>' +
            '<span class="brand__text"><span class="brand__name">Studio 27</span><span class="brand__sub">Men&rsquo;s Studio</span></span></a>' +
            '<p class="footer-tagline">' + esc(SITE.tagline) + '</p>' +
            '<p class="age-badge"><span>18+</span> This site is intended for adults aged 18 and over.</p>' +
          '</div>' +
          '<div>' +
            '<h3>Visit</h3>' +
            '<address>' + esc(SITE.address) + '<br>' + esc(SITE.suburb) + '</address>' +
            '<p><a href="' + tel(SITE.phone) + '">' + esc(SITE.phone) + '</a></p>' +
            (SITE.phone2 ? '<p><a href="' + tel(SITE.phone2) + '">' + esc(SITE.phone2) + '</a></p>' : '') +
            '<p>' + esc(SITE.hoursSummary) + '</p>' +
          '</div>' +
          '<div>' +
            '<h3>Explore</h3>' +
            '<ul>' +
              '<li><a href="about.html">About Us</a></li>' +
              '<li><a href="ladies.html">Ladies</a></li>' +
              '<li><a href="roster.html">Roster &amp; Hours</a></li>' +
              '<li><a href="rates.html">Rates &amp; Services</a></li>' +
              '<li><a href="house-rules.html">House Rules</a></li>' +
              '<li><a href="news.html">News &amp; Updates</a></li>' +
              '<li><a href="work-with-us.html">Apply Now</a></li>' +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h3>Legal</h3>' +
            '<ul>' +
              '<li><a href="terms.html">Terms &amp; Conditions</a></li>' +
              '<li><a href="privacy.html">Privacy Policy</a></li>' +
              '<li><a href="cookies.html">Cookie Policy</a></li>' +
              '<li><a href="cancellation-policy.html">Cancellation &amp; Refunds</a></li>' +
              '<li><a href="disclaimer.html">Legal Disclaimer</a></li>' +
              '<li><a href="accessibility.html">Accessibility Statement</a></li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="container footer-compliance">' +
          '<p class="footer-ad"><strong>This website is an advertisement only.</strong> It is intended for adults aged 18 years and over. All persons depicted are 18 years of age or older.</p>' +
          '<dl class="compliance-list">' +
            '<div><dt>Registered business name</dt><dd>' + esc(SITE.legalName) + '</dd></div>' +
            '<div><dt>Registration no.</dt><dd>' + esc(SITE.registrationNo) + '</dd></div>' +
            '<div><dt>ABN</dt><dd>' + esc(SITE.abn) + '</dd></div>' +
            '<div><dt>Licence / permit no.</dt><dd>' + esc(SITE.licence) + '</dd></div>' +
          '</dl>' +
          '<p class="copyright">&copy; ' + new Date().getFullYear() + ' ' + esc(SITE.legalName) + ' trading as Studio 27. All rights reserved. ' +
          'The Studio 27 name, logo, images and content are protected by copyright and may not be reproduced without written permission.</p>' +
        '</div>';
  }

  /* ---------- Age gate ---------- */
  function showAgeGate() {
    var root = document.documentElement;
    var regions = document.querySelectorAll('body > :not(.age-gate)');
    var gate = document.createElement('div');
    gate.className = 'age-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'age-gate-title');
    gate.innerHTML = '' +
      '<div class="age-gate__panel">' +
        '<span class="brand__mark brand__mark--lg" aria-hidden="true">27</span>' +
        '<p class="eyebrow">Adults only &middot; 18+</p>' +
        '<h2 id="age-gate-title" class="display">Are you <em>18 or over?</em></h2>' +
        '<p>This website contains adult content and is intended only for adults aged 18 years and over. ' +
        'By entering, you confirm you are at least 18, that viewing this material is lawful where you are, ' +
        'and that you agree to our <a href="terms.html">Terms &amp; Conditions</a>.</p>' +
        '<div class="age-gate__actions">' +
          '<button type="button" class="btn btn--gold" data-age="enter">I am 18+ &mdash; Enter</button>' +
          '<a class="btn btn--ghost" href="https://www.google.com">Leave</a>' +
        '</div>' +
      '</div>';

    regions.forEach(function (el) { el.inert = true; });
    document.body.appendChild(gate);
    gate.querySelector('[data-age="enter"]').focus();

    gate.querySelector('[data-age="enter"]').addEventListener('click', function () {
      try { localStorage.setItem(AGE_KEY, '1'); } catch (e) {}
      regions.forEach(function (el) { el.inert = false; });
      root.classList.remove('age-pending');
      gate.remove();
    });
  }

  /* ---------- Data-driven content ---------- */
  function fillSiteFields() {
    document.querySelectorAll('[data-site]').forEach(function (el) {
      var v = SITE[el.dataset.site];
      var optionalWrap = el.closest('[data-optional]');
      if (v == null || v === '') {
        if (optionalWrap) optionalWrap.hidden = true;
        return;
      }
      if (optionalWrap) optionalWrap.hidden = false;
      el.textContent = v;
      if (el.dataset.link === 'tel') el.href = tel(v);
      if (el.dataset.link === 'mailto') el.href = 'mailto:' + v;
    });
  }

  function paragraphsHTML(paragraphs) {
    return (paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
  }

  function cardsHTML(items, numerals) {
    return (items || []).map(function (item, i) {
      return '<article class="card"><span class="card__num">' + (numerals[i] || '') + '.</span>' +
        '<h3 class="h3">' + esc(item.heading) + '</h3><p>' + esc(item.body) + '</p></article>';
    }).join('');
  }

  function renderWelcome(el) {
    var c = (SITE.content && SITE.content.welcome) || {};
    el.innerHTML = '<p class="lead">' + esc(c.lead || '') + '</p>' +
      '<div class="split__cols">' + paragraphsHTML(c.paragraphs) + '</div>';
  }

  function renderExperience(el) {
    var items = (SITE.content && SITE.content.experience) || [];
    el.innerHTML = cardsHTML(items, ['i', 'ii', 'iii', 'iv', 'v', 'vi']);
  }

  function renderAboutIntro(el) {
    var c = (SITE.content && SITE.content.about) || {};
    el.innerHTML = '<p class="lead">' + esc(c.lead || '') + '</p>' +
      '<div class="split__cols">' + paragraphsHTML(c.paragraphs) + '</div>';
  }

  function renderAboutValues(el) {
    var values = (SITE.content && SITE.content.about && SITE.content.about.values) || [];
    el.innerHTML = cardsHTML(values, ['i', 'ii', 'iii', 'iv', 'v', 'vi']);
  }

  function renderFaq(el) {
    var groups = (SITE.content && SITE.content.faq) || [];
    el.innerHTML = '<div class="faq">' + groups.map(function (g) {
      var items = (g.items || []).map(function (item) {
        return '<details><summary>' + esc(item.question) + '</summary><div><p>' + esc(item.answer) + '</p></div></details>';
      }).join('');
      return '<div class="faq-group"><p class="eyebrow">' + esc(g.title) + '</p>' + items + '</div>';
    }).join('') + '</div>';
  }

  function renderNews(el) {
    var c = (SITE.content && SITE.content.news) || {};
    el.innerHTML = paragraphsHTML(c.paragraphs);
  }

  function renderRates(el) {
    var rates = SITE.rates || { sessions: [], servicesNote: '' };
    var sessionsHTML = (rates.sessions || [])
      .map(function (s) {
        var incall = s.incallPrice != null ? s.incallPrice : s.price;
        var outcall = s.outcallPrice != null ? s.outcallPrice : s.price;
        return '<li><span class="name">' + esc(s.name) + '</span><span class="dots"></span>' +
          '<span class="price-pair">' +
          '<span class="price"><small>Incall</small>$' + esc(incall) + '</span>' +
          '<span class="price"><small>Outcall</small>$' + esc(outcall) + '</span>' +
          '</span></li>';
      })
      .join('');
    el.innerHTML = '' +
      '<div class="rate-menu"><h2 class="h3">Sessions</h2>' +
      '<p>All sessions include a private room and shower facilities.</p>' +
      '<ul class="rate-list">' + (sessionsHTML || '<li>Rates coming soon &mdash; please call to ask.</li>') + '</ul></div>' +
      '<p class="notice">' + esc(rates.servicesNote || '') + '</p>';
  }

  function renderHours(el) {
    el.innerHTML = '<table class="hours-table"><caption class="sr-only">Opening hours</caption><tbody>' +
      DAYS.map(function (d) {
        return '<tr' + (d === TODAY ? ' class="is-today"' : '') + '><th scope="row">' + DAY_NAMES[d] +
          (d === TODAY ? ' <span class="tag tag--small">Today</span>' : '') + '</th><td>' + esc(SITE.hours[d]) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function modelCard(m) {
    var photo = m.photo
      ? '<img src="' + esc(m.photo) + '" alt="' + esc(m.name) + '" loading="lazy">'
      : '<div class="model-card__placeholder" aria-hidden="true"><span>27</span><small>Photo coming soon</small></div>';
    var onToday = m.days.indexOf(TODAY) !== -1;
    return '' +
      '<article class="model-card">' +
        '<div class="model-card__photo">' + photo +
          (m.isNew ? '<span class="tag">New</span>' : '') +
          (onToday ? '<span class="tag tag--gold">On today</span>' : '') +
        '</div>' +
        '<div class="model-card__body">' +
          '<h3>' + esc(m.name) + '</h3>' +
          (m.age ? '<p class="model-card__age">Age ' + esc(m.age) + '</p>' : '') +
          '<p>' + esc(m.intro) + '</p>' +
          '<p class="model-card__days"><span>Available</span> ' + (m.days.length ? m.days.join(' &middot; ') : 'By request') + '</p>' +
          '<a class="link-arrow" href="contact.html?model=' + encodeURIComponent(m.name) + '">Enquire</a>' +
        '</div>' +
      '</article>';
  }

  function renderModels(el) {
    var limit = parseInt(el.dataset.limit, 10) || MODELS.length;
    el.innerHTML = MODELS.slice(0, limit).map(modelCard).join('');
  }

  function renderRoster(el) {
    var head = '<tr><th scope="col">Lady</th>' + DAYS.map(function (d) {
      return '<th scope="col"' + (d === TODAY ? ' class="is-today"' : '') + '>' + d + '</th>';
    }).join('') + '</tr>';
    var rows = MODELS.map(function (m) {
      return '<tr><th scope="row">' + esc(m.name) + '</th>' + DAYS.map(function (d) {
        var on = m.days.indexOf(d) !== -1;
        return '<td class="' + (d === TODAY ? 'is-today ' : '') + (on ? 'is-on' : 'is-off') + '">' + (on ? esc(m.time) : '&mdash;') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    el.innerHTML = '<div class="table-wrap"><table class="roster-table"><caption class="sr-only">Weekly roster</caption><thead>' +
      head + '</thead><tbody>' + rows + '</tbody></table></div>';
  }

  function renderToday(el) {
    var on = MODELS.filter(function (m) { return m.days.indexOf(TODAY) !== -1; });
    el.innerHTML = on.length
      ? '<ul class="chip-list">' + on.map(function (m) {
          return '<li class="chip"><strong>' + esc(m.name) + '</strong><span>' + esc(m.time) + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="muted">Today&rsquo;s roster is being finalised &mdash; call us for availability.</p>';
  }

  function fillModelSelect(sel) {
    var wanted = new URLSearchParams(location.search).get('model');
    // Re-run safely when live data replaces the data.js fallback: keep
    // only the first option (the placeholder) and rebuild the rest.
    while (sel.options.length > 1) sel.remove(1);
    MODELS.forEach(function (m) {
      var o = document.createElement('option');
      o.value = o.textContent = m.name;
      if (m.name === wanted) o.selected = true;
      sel.appendChild(o);
    });
  }

  /* ---------- Forms ----------
     Forms with a data-endpoint post to the API (see server/routes/).
     Forms without one just redirect once valid (used nowhere currently,
     kept as a harmless fallback).                                      */
  function wireForms() {
    document.querySelectorAll('form[data-redirect]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var status = form.querySelector('.form-status');
        if (!form.checkValidity()) {
          form.reportValidity();
          if (status) status.textContent = 'Please complete the required fields.';
          return;
        }

        var endpoint = form.dataset.endpoint;
        if (!endpoint) {
          location.href = form.dataset.redirect;
          return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        if (status) status.textContent = 'Sending…';

        fetch(endpoint, { method: 'POST', body: new FormData(form) })
          .then(function (res) {
            return res
              .json()
              .catch(function () { return null; })
              .then(function (data) {
                if (!res.ok) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
                return data;
              });
          })
          .then(function () {
            location.href = form.dataset.redirect;
          })
          .catch(function (err) {
            if (submitBtn) submitBtn.disabled = false;
            if (status) status.textContent = err.message;
          });
      });
    });
  }

  /* ---------- Render everything that depends on SITE/MODELS ---------- */
  function renderFooter() {
    // Reuse the same node across re-renders (rather than replacing it) so
    // that if the age gate already applied `inert` to it, that stays intact.
    var el = document.querySelector('.site-footer');
    if (!el) {
      el = document.createElement('footer');
      el.className = 'site-footer';
      document.body.appendChild(el);
    }
    el.innerHTML = footerInnerHTML();
  }

  function renderContent() {
    renderFooter();
    fillSiteFields();
    document.querySelectorAll('[data-hours]').forEach(renderHours);
    document.querySelectorAll('[data-models]').forEach(renderModels);
    document.querySelectorAll('[data-roster]').forEach(renderRoster);
    document.querySelectorAll('[data-today]').forEach(renderToday);
    document.querySelectorAll('[data-rates]').forEach(renderRates);
    document.querySelectorAll('select[data-model-select]').forEach(fillModelSelect);
    document.querySelectorAll('[data-content="welcome"]').forEach(renderWelcome);
    document.querySelectorAll('[data-content="experience"]').forEach(renderExperience);
    document.querySelectorAll('[data-content="aboutIntro"]').forEach(renderAboutIntro);
    document.querySelectorAll('[data-content="aboutValues"]').forEach(renderAboutValues);
    document.querySelectorAll('[data-content="faq"]').forEach(renderFaq);
    document.querySelectorAll('[data-content="news"]').forEach(renderNews);
  }

  /* Pulls live content from the API and re-renders over the data.js
     fallback once it arrives, so pages never sit blank on first paint
     and still work if the API is briefly unreachable.                */
  function loadLiveContent() {
    var fetchJSON = function (url) {
      return fetch(url)
        .then(function (res) { return res.ok ? res.json() : null; })
        .catch(function () { return null; });
    };

    Promise.all([fetchJSON('/api/public/site'), fetchJSON('/api/public/models')]).then(function (results) {
      var liveSite = results[0];
      var liveModels = results[1];
      var changed = false;

      if (liveSite && Object.keys(liveSite).length) {
        Object.assign(SITE, liveSite);
        changed = true;
      }
      if (Array.isArray(liveModels) && liveModels.length) {
        MODELS.length = 0;
        liveModels.forEach(function (m) { MODELS.push(m); });
        changed = true;
      }
      if (changed) renderContent();
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;
    var page = body.dataset.page || '';

    body.insertAdjacentHTML('afterbegin', headerHTML(page));

    // Mobile nav
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
      body.classList.toggle('nav-open', open);
    });

    // Header background once scrolled
    var header = document.querySelector('.site-header');
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    renderContent();
    loadLiveContent();
    wireForms();

    // Legal pages are readable without passing the gate
    if ('noGate' in body.dataset) {
      document.documentElement.classList.remove('age-pending');
    } else if (!ageOk) {
      showAgeGate();
    }
  });
})();
