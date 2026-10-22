(function () {
  'use strict';

  var esc = Admin.esc;
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var PERMS = [
    { key: 'models', label: 'Models & Roster' },
    { key: 'staff', label: 'Staff Roster' },
    { key: 'payslips', label: 'Payslips' },
    { key: 'enquiries', label: 'Enquiries & Applications' },
    { key: 'settings', label: 'Site Settings & Content' }
  ];

  var data = {};
  var accountEmail = '';
  var accountId = null;
  var isOwner = false;
  var canEditSettings = false;
  var adminUsers = [];
  var passwordRequests = [];

  Admin.requireSession(function (me) {
    Admin.mountShell('settings', 'Site Settings', 'Edit hours, rates and the contact details shown on the public site.');
    var content = document.getElementById('admin-content');
    content.innerHTML = '<p class="muted">Loading&hellip;</p>';

    accountEmail = me.email || '';
    accountId = me.id;
    isOwner = !!me.isOwner;
    canEditSettings = Admin.hasAccess('settings');

    Promise.all([
      canEditSettings ? Admin.api('/settings') : Promise.resolve({}),
      isOwner ? Admin.api('/auth/admin-users') : Promise.resolve([]),
      isOwner ? Admin.api('/auth/password-requests') : Promise.resolve([])
    ])
      .then(function (results) {
        data = results[0] || {};
        data.hours = data.hours || {};
        data.rates = data.rates || { sessions: [], servicesNote: '' };
        data.liveUpdate = data.liveUpdate || { enabled: false, message: '' };
        adminUsers = results[1] || [];
        passwordRequests = results[2] || [];
        render();
      })
      .catch(function (err) {
        content.innerHTML = '<p class="form-status is-error">' + esc(err.message) + '</p>';
      });

    function render() {
      content.innerHTML =
        (canEditSettings
          ? panel('Live update', liveUpdateFields()) +
            '<form id="settings-form">' +
            panel('Contact & compliance', contactFields()) +
            panel('Opening hours', hoursFields()) +
            panel('Rates', ratesFields()) +
            '<div class="admin-panel">' +
            '<button type="submit" class="btn btn--pink">Save changes</button>' +
            '<p class="form-status" role="status"></p>' +
            '</div>' +
            '</form>'
          : '') +
        panel('Account', accountFields()) +
        (isOwner ? panel('Pending password requests', passwordRequestsFields()) : '') +
        (isOwner ? panel('Admin users', adminUsersFields()) : '');

      if (canEditSettings) {
        wireRateRows();
        document.getElementById('live-update-form').addEventListener('submit', onLiveUpdateSubmit);
        document.getElementById('settings-form').addEventListener('submit', onSubmit);
      }
      document.getElementById('email-form').addEventListener('submit', onEmailSubmit);
      document.getElementById('password-form').addEventListener('submit', onPasswordSubmit);

      if (isOwner) {
        document.getElementById('add-admin-form').addEventListener('submit', onAddAdminSubmit);
        content.querySelectorAll('[data-remove-admin]').forEach(function (btn) {
          btn.addEventListener('click', function () { onRemoveAdmin(btn.dataset.removeAdmin); });
        });
        content.querySelectorAll('[data-save-permissions]').forEach(function (btn) {
          btn.addEventListener('click', function () { onSavePermissions(btn.dataset.savePermissions); });
        });
        content.querySelectorAll('[data-approve-request]').forEach(function (btn) {
          btn.addEventListener('click', function () { onResolveRequest(btn.dataset.approveRequest, 'approve'); });
        });
        content.querySelectorAll('[data-deny-request]').forEach(function (btn) {
          btn.addEventListener('click', function () { onResolveRequest(btn.dataset.denyRequest, 'deny'); });
        });
      }
    }

    function liveUpdateFields() {
      var u = data.liveUpdate || { enabled: false, message: '' };
      return (
        '<form id="live-update-form" class="form">' +
        '<div class="field full"><label class="check"><input type="checkbox" id="lu-enabled" ' +
        (u.enabled ? 'checked' : '') +
        '> Show a live update banner on the site</label></div>' +
        '<div class="field full"><label for="lu-message">Message</label>' +
        '<input id="lu-message" type="text" value="' + esc(u.message || '') + '" placeholder="e.g. Closing early today at 8pm"></div>' +
        '<div class="field full"><button type="submit" class="btn btn--gold">Save live update</button> <p class="form-status" role="status"></p></div>' +
        '</form>'
      );
    }

    function onLiveUpdateSubmit(e) {
      e.preventDefault();
      var status = e.target.querySelector('.form-status');
      status.textContent = '';
      status.className = 'form-status';
      var next = Object.assign({}, data, {
        liveUpdate: {
          enabled: document.getElementById('lu-enabled').checked,
          message: document.getElementById('lu-message').value.trim()
        }
      });
      Admin.api('/settings', { method: 'PUT', body: next })
        .then(function () {
          data = next;
          status.className = 'form-status is-ok';
          status.textContent = 'Saved. The site now reflects this.';
        })
        .catch(function (err) {
          status.className = 'form-status is-error';
          status.textContent = err.message;
        });
    }

    function accountFields() {
      return (
        '<p class="hint" style="margin-bottom:18px">Signed in as <strong>' + esc(accountEmail) + '</strong></p>' +
        '<form id="email-form" class="form" style="margin-bottom:28px">' +
        '<div class="field"><label for="e-new">New email</label><input id="e-new" name="newEmail" type="email" autocomplete="username" required></div>' +
        '<div class="field"><label for="e-current">Current password</label><input id="e-current" name="currentPassword" type="password" autocomplete="current-password" required></div>' +
        '<div class="field full">' +
        '<button type="submit" class="btn btn--ghost">Change email</button>' +
        '<p class="form-status" role="status"></p>' +
        '</div>' +
        '</form>' +
        '<form id="password-form" class="form">' +
        (isOwner ? '' : '<p class="hint" style="margin-bottom:10px">New passwords need the owner&rsquo;s approval before they take effect.</p>') +
        '<div class="field"><label for="p-current">Current password</label><input id="p-current" name="currentPassword" type="password" autocomplete="current-password" required></div>' +
        '<div class="field"><label for="p-new">New password</label><input id="p-new" name="newPassword" type="password" autocomplete="new-password" minlength="8" required></div>' +
        '<div class="field full">' +
        '<button type="submit" class="btn btn--ghost">' + (isOwner ? 'Change password' : 'Request password change') + '</button>' +
        '<p class="form-status" role="status"></p>' +
        '</div>' +
        '</form>'
      );
    }

    function onEmailSubmit(e) {
      e.preventDefault();
      var form = e.target;
      var status = form.querySelector('.form-status');
      status.textContent = '';
      status.className = 'form-status';
      Admin.api('/auth/email', {
        method: 'PUT',
        body: { currentPassword: form.currentPassword.value, newEmail: form.newEmail.value }
      })
        .then(function (res) {
          accountEmail = res.email;
          status.className = 'form-status is-ok';
          status.textContent = 'Email changed.';
          form.reset();
          var label = document.querySelector('#admin-content .hint strong');
          if (label) label.textContent = accountEmail;
        })
        .catch(function (err) {
          status.className = 'form-status is-error';
          status.textContent = err.message;
        });
    }

    function onPasswordSubmit(e) {
      e.preventDefault();
      var form = e.target;
      var status = form.querySelector('.form-status');
      status.textContent = '';
      status.className = 'form-status';
      Admin.api('/auth/password', {
        method: 'PUT',
        body: { currentPassword: form.currentPassword.value, newPassword: form.newPassword.value }
      })
        .then(function (res) {
          status.className = 'form-status is-ok';
          status.textContent = res && res.pending
            ? 'Sent to the owner for approval. Your password won’t change until then.'
            : 'Password changed.';
          form.reset();
        })
        .catch(function (err) {
          status.className = 'form-status is-error';
          status.textContent = err.message;
        });
    }

    function formatLastLogin(value) {
      if (!value) return 'Never signed in';
      return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    }

    function passwordRequestsFields() {
      if (!passwordRequests.length) return '<p class="muted">No pending requests.</p>';
      var rows = passwordRequests
        .map(function (r) {
          return (
            '<div class="rate-editor-row" style="grid-template-columns:1fr auto auto auto">' +
            '<span>' + esc(r.email) + '</span>' +
            '<span class="hint">' + esc(new Date(r.createdAt).toLocaleString()) + '</span>' +
            '<button type="button" class="btn btn--small btn--gold" data-approve-request="' + r.id + '">Approve</button>' +
            '<button type="button" class="btn btn--small btn--ghost" data-deny-request="' + r.id + '">Deny</button>' +
            '</div>'
          );
        })
        .join('');
      return '<div style="margin-bottom:4px">' + rows + '</div>';
    }

    function onResolveRequest(id, action) {
      Admin.api('/auth/password-requests/' + id + '/' + action, { method: 'POST' })
        .then(function () {
          passwordRequests = passwordRequests.filter(function (r) { return String(r.id) !== String(id); });
          render();
        })
        .catch(function (err) {
          window.alert(err.message);
        });
    }

    function adminUsersFields() {
      var rows = adminUsers
        .map(function (u) {
          var isSelf = u.id === accountId;
          if (u.isOwner) {
            return (
              '<div class="admin-user-card">' +
              '<div class="admin-user-card__head">' +
              '<div><strong>' + esc(u.email) + (isSelf ? ' <span class="hint">(you)</span>' : '') + '</strong>' +
              '<span class="hint">Last signed in: ' + esc(formatLastLogin(u.last_login_at)) + '</span></div>' +
              '</div>' +
              '<p class="hint">Owner &mdash; full access</p>' +
              '</div>'
            );
          }
          var checks = PERMS.map(function (p) {
            var checked = (u.permissions || []).indexOf(p.key) !== -1;
            return (
              '<label class="check"><input type="checkbox" data-perm-for="' + u.id + '" value="' + p.key + '" ' +
              (checked ? 'checked' : '') + '> ' + esc(p.label) + '</label>'
            );
          }).join('');
          return (
            '<div class="admin-user-card">' +
            '<div class="admin-user-card__head">' +
            '<div><strong>' + esc(u.email) + '</strong>' +
            '<span class="hint">Last signed in: ' + esc(formatLastLogin(u.last_login_at)) + '</span></div>' +
            '<button type="button" data-remove-admin="' + u.id + '" title="Remove">&times;</button>' +
            '</div>' +
            '<div class="perm-grid">' + checks + '</div>' +
            '<button type="button" class="btn btn--small btn--ghost" data-save-permissions="' + u.id + '">Save access</button>' +
            '</div>'
          );
        })
        .join('');

      return (
        '<div id="admin-users-list" style="margin-bottom:18px">' + rows + '</div>' +
        '<form id="add-admin-form" class="form">' +
        '<div class="field"><label for="a-email">Email</label><input id="a-email" name="email" type="email" autocomplete="off" required></div>' +
        '<div class="field"><label for="a-password">Password</label><input id="a-password" name="password" type="password" autocomplete="new-password" minlength="8" required></div>' +
        '<div class="field full">' +
        '<button type="submit" class="btn btn--ghost">Add admin user</button>' +
        '<p class="form-status" role="status"></p>' +
        '</div>' +
        '</form>'
      );
    }

    function onSavePermissions(id) {
      var checks = content.querySelectorAll('input[data-perm-for="' + id + '"]:checked');
      var permissions = Array.from(checks).map(function (cb) { return cb.value; });
      Admin.api('/auth/admin-users/' + id + '/permissions', { method: 'PUT', body: { permissions: permissions } })
        .then(function () {
          var u = adminUsers.filter(function (x) { return String(x.id) === String(id); })[0];
          if (u) u.permissions = permissions;
          var btn = content.querySelector('[data-save-permissions="' + id + '"]');
          if (btn) {
            var original = btn.textContent;
            btn.textContent = 'Saved';
            setTimeout(function () { btn.textContent = original; }, 1500);
          }
        })
        .catch(function (err) {
          window.alert(err.message);
        });
    }

    function onAddAdminSubmit(e) {
      e.preventDefault();
      var form = e.target;
      var status = form.querySelector('.form-status');
      status.textContent = '';
      status.className = 'form-status';
      Admin.api('/auth/admin-users', {
        method: 'POST',
        body: { email: form.email.value, password: form.password.value }
      })
        .then(function (user) {
          adminUsers.push(user);
          render();
        })
        .catch(function (err) {
          status.className = 'form-status is-error';
          status.textContent = err.message;
        });
    }

    function onRemoveAdmin(id) {
      if (!window.confirm('Remove this admin user? They will no longer be able to sign in.')) return;
      Admin.api('/auth/admin-users/' + id, { method: 'DELETE' })
        .then(function () {
          adminUsers = adminUsers.filter(function (u) { return String(u.id) !== String(id); });
          render();
        })
        .catch(function (err) {
          window.alert(err.message);
        });
    }

    function panel(title, body) {
      return '<div class="admin-panel"><h2>' + esc(title) + '</h2>' + body + '</div>';
    }

    function field(label, name, value, type) {
      return (
        '<div class="field">' +
        '<label for="f-' + name + '">' + esc(label) + '</label>' +
        '<input id="f-' + name + '" name="' + name + '" type="' + (type || 'text') + '" value="' + esc(value || '') + '">' +
        '</div>'
      );
    }

    function contactFields() {
      return (
        '<div class="form">' +
        field('Registered business name', 'legalName', data.legalName) +
        field('ABN', 'abn', data.abn) +
        field('Address', 'address', data.address) +
        field('Suburb / state / postcode', 'suburb', data.suburb) +
        field('Phone', 'phone', data.phone) +
        field('Second phone (optional)', 'phone2', data.phone2) +
        field('Email', 'email', data.email, 'email') +
        field('Parking details', 'parking', data.parking) +
        field('Accepted payment methods', 'payment', data.payment) +
        '</div>'
      );
    }

    function hoursFields() {
      return (
        '<div class="form">' +
        field('Hours summary (shown in footer)', 'hoursSummary', data.hoursSummary) +
        '<div class="field full"></div>' +
        DAYS.map(function (d) {
          return field(d, 'hours_' + d, data.hours[d]);
        }).join('') +
        '</div>'
      );
    }

    function ratesFields() {
      return (
        '<div>' +
        '<h3 class="h3" style="font-size:1rem;margin-bottom:10px">Sessions</h3>' +
        '<div class="rate-editor-row rate-editor-row--session rate-editor-header"><span>Duration</span><span>Incall</span><span>Outcall</span><span></span></div>' +
        '<div id="sessions-rows">' + (data.rates.sessions || []).map(sessionRow).join('') + '</div>' +
        '<button type="button" class="btn btn--small btn--ghost" id="add-session">+ Add session</button>' +
        '<h3 class="h3" style="font-size:1rem;margin:28px 0 10px">Services notice</h3>' +
        '<p class="hint" style="margin-bottom:10px">' +
        '<label>Note shown below the rates &mdash; <input type="text" id="services-note" value="' + esc(data.rates.servicesNote || '') + '" style="width:60%;min-width:220px"></label>' +
        '</p>' +
        '</div>'
      );
    }

    function sessionRow(s, i) {
      var incall = s.incallPrice != null ? s.incallPrice : (s.price || '');
      var outcall = s.outcallPrice != null ? s.outcallPrice : (s.price || '');
      return (
        '<div class="rate-editor-row rate-editor-row--session" data-session-row="' + i + '">' +
        '<input placeholder="e.g. 30 minutes" value="' + esc(s.name || '') + '" data-session-name>' +
        '<input placeholder="Incall price" value="' + esc(incall) + '" data-session-incall>' +
        '<input placeholder="Outcall price" value="' + esc(outcall) + '" data-session-outcall>' +
        '<button type="button" data-remove-session="' + i + '">&times;</button>' +
        '</div>'
      );
    }

    function wireRateRows() {
      document.getElementById('add-session').addEventListener('click', function () {
        data.rates = collectRates();
        data.rates.sessions.push({ name: '', incallPrice: '', outcallPrice: '' });
        rerenderRatesOnly();
      });
      content.querySelectorAll('[data-remove-session]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var all = collectRates();
          all.sessions.splice(Number(btn.dataset.removeSession), 1);
          data.rates = all;
          rerenderRatesOnly();
        });
      });
    }

    function rerenderRatesOnly() {
      var scrollY = window.scrollY;
      render();
      window.scrollTo(0, scrollY);
    }

    function collectRates() {
      var sessions = Array.from(document.querySelectorAll('#sessions-rows [data-session-row]')).map(function (row) {
        return {
          name: row.querySelector('[data-session-name]').value.trim(),
          incallPrice: row.querySelector('[data-session-incall]').value.trim(),
          outcallPrice: row.querySelector('[data-session-outcall]').value.trim()
        };
      });
      var noteEl = document.getElementById('services-note');
      return { sessions: sessions, servicesNote: noteEl ? noteEl.value.trim() : (data.rates.servicesNote || '') };
    }

    function onSubmit(e) {
      e.preventDefault();
      var form = e.target;
      var status = form.querySelector('.form-status');
      var fd = new FormData(form);
      var next = Object.assign({}, data);
      next.hours = {};
      DAYS.forEach(function (d) { next.hours[d] = fd.get('hours_' + d) || ''; });
      ['legalName', 'abn', 'address', 'suburb', 'phone', 'phone2', 'email', 'parking', 'payment', 'hoursSummary'].forEach(
        function (key) { next[key] = fd.get(key) || ''; }
      );
      next.rates = collectRates();

      status.textContent = '';
      status.className = 'form-status';
      Admin.api('/settings', { method: 'PUT', body: next })
        .then(function () {
          data = next;
          status.className = 'form-status is-ok';
          status.textContent = 'Saved. The public site now reflects these changes.';
        })
        .catch(function (err) {
          status.className = 'form-status is-error';
          status.textContent = err.message;
        });
    }
  });
})();
