(function () {
  'use strict';

  Admin.requireSession(function () {
    Admin.mountShell('dashboard', 'Dashboard', 'A quick look at what needs attention.');
    var content = document.getElementById('admin-content');
    content.innerHTML = '<p class="muted">Loading&hellip;</p>';

    Promise.all([
      Admin.api('/enquiries?type=booking'),
      Admin.api('/enquiries?type=application'),
      Admin.api('/models')
    ])
      .then(function (results) {
        var bookings = results[0] || [];
        var applications = results[1] || [];
        var models = results[2] || [];

        var newBookings = bookings.filter(function (e) { return e.status === 'new'; }).length;
        var newApplications = applications.filter(function (e) { return e.status === 'new'; }).length;
        var activeModels = models.filter(function (m) { return m.status === 'active'; }).length;

        content.innerHTML =
          '<div class="stat-grid">' +
          '<div class="stat-card"><div class="num">' + newBookings + '</div><div class="label">New booking enquiries</div></div>' +
          '<div class="stat-card"><div class="num">' + newApplications + '</div><div class="label">New applications</div></div>' +
          '<div class="stat-card"><div class="num">' + activeModels + '</div><div class="label">Active profiles</div></div>' +
          '<div class="stat-card"><div class="num">' + models.length + '</div><div class="label">Total profiles</div></div>' +
          '</div>' +
          '<div class="admin-panel">' +
          '<h2>Quick links</h2>' +
          '<div class="admin-card-row"><span>Review new enquiries &amp; applications</span><a class="btn btn--small btn--ghost" href="enquiries.html">Open inbox</a></div>' +
          '<div class="admin-card-row"><span>Manage models, photos &amp; the roster</span><a class="btn btn--small btn--ghost" href="models.html">Manage roster</a></div>' +
          '<div class="admin-card-row"><span>Edit hours, rates &amp; contact details</span><a class="btn btn--small btn--ghost" href="settings.html">Edit settings</a></div>' +
          '<div class="admin-card-row"><span>Edit hero, about, experience &amp; FAQ text</span><a class="btn btn--small btn--ghost" href="content.html">Edit content</a></div>' +
          '</div>';
      })
      .catch(function (err) {
        content.innerHTML = '<p class="form-status is-error">' + Admin.esc(err.message) + '</p>';
      });
  });
})();
