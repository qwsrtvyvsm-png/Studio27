(function () {
  'use strict';

  var esc = Admin.esc;

  Admin.requireSession(function (me) {
    Admin.mountShell('activity', 'Activity', 'Who was active, and what they did — owner only.');
    var content = document.getElementById('admin-content');

    if (!me.isOwner) {
      content.innerHTML = Admin.accessDeniedHTML();
      return;
    }

    content.innerHTML = '<div class="admin-panel"><div id="activity-table"><p class="muted">Loading&hellip;</p></div></div>';

    Admin.api('/auth/activity')
      .then(function (rows) {
        var wrap = document.getElementById('activity-table');
        if (!rows.length) {
          wrap.innerHTML = '<div class="admin-empty">No activity recorded yet.</div>';
          return;
        }
        var body = rows
          .map(function (r) {
            return (
              '<tr>' +
              '<td>' + esc(new Date(r.createdAt).toLocaleString()) + '</td>' +
              '<td>' + esc(r.adminEmail || 'Removed account') + '</td>' +
              '<td>' + esc(r.action) + '</td>' +
              '</tr>'
            );
          })
          .join('');
        wrap.innerHTML =
          '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
          '<th>When</th><th>Who</th><th>What</th>' +
          '</tr></thead><tbody>' + body + '</tbody></table></div>';
      })
      .catch(function (err) {
        document.getElementById('activity-table').innerHTML =
          '<p class="form-status is-error">' + esc(err.message) + '</p>';
      });
  });
})();
