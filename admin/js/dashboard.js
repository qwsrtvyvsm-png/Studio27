(function () {
  'use strict';

  var esc = Admin.esc;
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var ICONS = {
    mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
    doc: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/></svg>',
    person: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    eyeOff: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.5 5.2A10.4 10.4 0 0 1 12 5c6 0 9.5 7 9.5 7a15.6 15.6 0 0 1-3.2 3.9M6.5 6.9C3.8 8.8 2.5 12 2.5 12s3.5 7 9.5 7a9.7 9.7 0 0 0 3.4-.6"/></svg>',
    personAdd: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/><path d="M19 8v6M16 11h6"/></svg>',
    edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>',
    external: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8"/></svg>'
  };

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/);
    return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
  }

  function timeAgo(dateStr) {
    var diff = Date.now() - new Date(dateStr).getTime();
    var mins = Math.round(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + ' hr' + (hrs === 1 ? '' : 's') + ' ago';
    var days = Math.round(hrs / 24);
    return days + ' day' + (days === 1 ? '' : 's') + ' ago';
  }

  function statCard(icon, num, label, href) {
    return (
      '<a class="stat-card" href="' + href + '">' +
      '<span class="stat-card__icon">' + icon + '</span>' +
      '<span class="stat-card__body"><span class="num">' + num + '</span><span class="label">' + label + '</span></span>' +
      '<span class="stat-card__chevron">' + ICONS.chevron + '</span>' +
      '</a>'
    );
  }

  function attentionRow(icon, title, body, actionsHTML) {
    return (
      '<div class="attn-row">' +
      '<span class="attn-row__icon">' + icon + '</span>' +
      '<span class="attn-row__body"><strong>' + title + '</strong><span>' + body + '</span></span>' +
      '<span class="attn-row__actions">' + actionsHTML + '</span>' +
      '</div>'
    );
  }

  function trendLine(thisWeek, lastWeek) {
    var delta = thisWeek - lastWeek;
    var sign = delta > 0 ? '+' : '';
    var word = thisWeek === 1 ? 'enquiry' : 'enquiries';
    var deltaHTML = lastWeek
      ? ' <span class="trend-delta ' + (delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : '') + '">' + sign + delta + ' vs last week</span>'
      : '';
    return '<span class="trend-line">' + thisWeek + ' ' + word + ' this week' + deltaHTML + '</span>';
  }

  function quickAction(icon, title, body, href) {
    return (
      '<a class="quick-action" href="' + href + '">' +
      '<span class="quick-action__icon">' + icon + '</span>' +
      '<span><strong>' + title + '</strong><span>' + body + '</span></span>' +
      '</a>'
    );
  }

  Admin.requireSession(function () {
    Admin.mountShell(
      'dashboard',
      'Dashboard',
      'Your daily overview',
      '<a class="btn btn--small btn--ghost" href="../index.html" target="_blank" rel="noopener">' + ICONS.external + ' View live site</a>'
    );
    var content = document.getElementById('admin-content');
    content.innerHTML = '<p class="muted">Loading&hellip;</p>';

    Promise.all([
      Admin.api('/enquiries?type=booking'),
      Admin.api('/enquiries?type=application'),
      Admin.api('/models'),
      Admin.api('/settings')
    ])
      .then(function (results) {
        var bookings = results[0] || [];
        var applications = results[1] || [];
        var models = results[2] || [];
        var settings = results[3] || {};
        var defaultHours = settings.hoursSummary || '';

        var newBookings = bookings.filter(function (e) { return e.status === 'new'; });
        var newApplications = applications.filter(function (e) { return e.status === 'new'; });
        var activeModels = models.filter(function (m) { return m.status === 'active'; });
        var unpublished = models.filter(function (m) { return m.status !== 'active'; });

        var today = DAY_NAMES[new Date().getDay()];
        var onToday = activeModels.filter(function (m) { return (m.days || []).indexOf(today) !== -1; });

        Admin.setNavBadge('enquiries', newBookings.length + newApplications.length);

        var latestBooking = newBookings[0];
        var latestApplication = newApplications[0];

        var needsAttentionCount = (latestBooking ? 1 : 0) + (latestApplication ? 1 : 0);

        var bookingRow = latestBooking
          ? attentionRow(
              ICONS.mail,
              'New booking enquiry',
              esc(latestBooking.name) + ' &middot; ' + timeAgo(latestBooking.created_at),
              '<span class="badge badge--new">New</span><a class="btn btn--small btn--gold" href="enquiries.html?id=' + latestBooking.id + '&type=booking">Review enquiry</a>'
            )
          : attentionRow(ICONS.mail, 'Booking enquiries', 'No new enquiries.', '');

        var applicationRow = latestApplication
          ? attentionRow(
              ICONS.doc,
              'New application',
              esc(latestApplication.name) + ' &middot; ' + timeAgo(latestApplication.created_at),
              '<span class="badge badge--new">New</span><a class="btn btn--small btn--gold" href="enquiries.html?id=' + latestApplication.id + '&type=application">Review application</a>'
            )
          : attentionRow(ICONS.doc, 'Applications', 'No new applications.', '');

        var rosterRows = onToday.length
          ? onToday
              .map(function (m) {
                var hoursHTML = m.time
                  ? esc(m.time)
                  : defaultHours
                    ? esc(defaultHours) + ' <span class="hint-tag">default</span>'
                    : 'Hours not set';
                return (
                  '<div class="roster-row">' +
                  '<span class="roster-avatar">' + esc(initials(m.name)).toUpperCase() + '</span>' +
                  '<span class="roster-row__body"><strong>' + esc(m.name) + '</strong>' +
                  '<span class="roster-row__status"><span class="dot"></span>Available</span></span>' +
                  '<span class="roster-row__hours">' + hoursHTML + '</span>' +
                  '</div>'
                );
              })
              .join('')
          : '<div class="admin-empty">No one is scheduled for today yet.</div>';

        var now = Date.now();
        var DAY_MS = 86400000;
        var allEnquiries = bookings.concat(applications);
        var thisWeekCount = allEnquiries.filter(function (e) { return now - new Date(e.created_at).getTime() <= 7 * DAY_MS; }).length;
        var lastWeekCount = allEnquiries.filter(function (e) {
          var age = now - new Date(e.created_at).getTime();
          return age > 7 * DAY_MS && age <= 14 * DAY_MS;
        }).length;

        content.innerHTML =
          '<div class="stat-grid">' +
          statCard(ICONS.mail, newBookings.length, 'New enquiries', 'enquiries.html') +
          statCard(ICONS.doc, newApplications.length, 'New applications', 'enquiries.html') +
          statCard(ICONS.person, onToday.length, 'Available today', 'models.html') +
          statCard(ICONS.eyeOff, unpublished.length, 'Unpublished profiles', 'models.html') +
          '</div>' +
          '<div class="dash-grid">' +
          '<div class="admin-panel">' +
          '<div class="panel-head"><h2>Needs attention' +
          (needsAttentionCount ? '<span class="pill-badge">' + needsAttentionCount + ' new</span>' : '') +
          '</h2></div>' +
          bookingRow + applicationRow +
          '</div>' +
          '<div class="admin-panel">' +
          '<div class="panel-head"><h2>Today&rsquo;s roster</h2>' +
          '<a class="btn btn--small btn--ghost" href="models.html">' + ICONS.edit + ' Edit roster</a></div>' +
          '<div class="roster-list">' + rosterRows + '</div>' +
          '</div>' +
          '</div>' +
          '<div class="admin-panel">' +
          '<div class="panel-head"><h2>Quick actions</h2>' + trendLine(thisWeekCount, lastWeekCount) + '</div>' +
          '<p class="muted" style="margin:-12px 0 18px">Common tasks to manage your site</p>' +
          '<div class="quick-actions">' +
          quickAction(ICONS.personAdd, 'Add profile', 'Create a new model profile', 'models.html') +
          quickAction(ICONS.doc, 'Edit site content', 'Update pages, text & images', 'content.html') +
          quickAction(ICONS.clock, 'Update opening hours', 'Set your availability', 'settings.html') +
          '</div>' +
          '</div>';
      })
      .catch(function (err) {
        content.innerHTML = '<p class="form-status is-error">' + esc(err.message) + '</p>';
      });
  });
})();
