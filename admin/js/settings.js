(function () {
  'use strict';

  var esc = Admin.esc;
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var data = {};

  Admin.requireSession(function () {
    Admin.mountShell('settings', 'Site Settings', 'Edit hours, rates and the contact/compliance details shown on the public site.');
    var content = document.getElementById('admin-content');
    content.innerHTML = '<p class="muted">Loading&hellip;</p>';

    Admin.api('/settings')
      .then(function (res) {
        data = res || {};
        data.hours = data.hours || {};
        data.rates = data.rates || { sessions: [], services: [], servicesNote: '' };
        render();
      })
      .catch(function (err) {
        content.innerHTML = '<p class="form-status is-error">' + esc(err.message) + '</p>';
      });

    function render() {
      content.innerHTML =
        '<form id="settings-form">' +
        panel('Contact & compliance', contactFields()) +
        panel('Opening hours', hoursFields()) +
        panel('Rates', ratesFields()) +
        '<div class="admin-panel">' +
        '<button type="submit" class="btn btn--pink">Save changes</button>' +
        '<p class="form-status" role="status"></p>' +
        '</div>' +
        '</form>' +
        panel('Account', accountFields());

      wireRateRows();
      document.getElementById('settings-form').addEventListener('submit', onSubmit);
      document.getElementById('password-form').addEventListener('submit', onPasswordSubmit);
    }

    function accountFields() {
      return (
        '<form id="password-form" class="form">' +
        '<div class="field"><label for="p-current">Current password</label><input id="p-current" name="currentPassword" type="password" autocomplete="current-password" required></div>' +
        '<div class="field"><label for="p-new">New password</label><input id="p-new" name="newPassword" type="password" autocomplete="new-password" minlength="8" required></div>' +
        '<div class="field full">' +
        '<button type="submit" class="btn btn--ghost">Change password</button>' +
        '<p class="form-status" role="status"></p>' +
        '</div>' +
        '</form>'
      );
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
        .then(function () {
          status.className = 'form-status is-ok';
          status.textContent = 'Password changed.';
          form.reset();
        })
        .catch(function (err) {
          status.className = 'form-status is-error';
          status.textContent = err.message;
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
        field('Business registration no.', 'registrationNo', data.registrationNo) +
        field('ABN', 'abn', data.abn) +
        field('Licence / permit no.', 'licence', data.licence) +
        field('Address', 'address', data.address) +
        field('Suburb / state / postcode', 'suburb', data.suburb) +
        field('Phone', 'phone', data.phone) +
        field('Booking email', 'email', data.email, 'email') +
        field('Recruitment email', 'recruitEmail', data.recruitEmail, 'email') +
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
        '<div id="sessions-rows">' + (data.rates.sessions || []).map(sessionRow).join('') + '</div>' +
        '<button type="button" class="btn btn--small btn--ghost" id="add-session">+ Add session</button>' +
        '<h3 class="h3" style="font-size:1rem;margin:28px 0 10px">Services</h3>' +
        '<p class="hint" style="margin-bottom:10px">' +
        '<label>Note shown above the services list &mdash; <input type="text" id="services-note" value="' + esc(data.rates.servicesNote || '') + '" style="width:60%;min-width:220px"></label>' +
        '</p>' +
        '<div id="services-rows">' + (data.rates.services || []).map(serviceRow).join('') + '</div>' +
        '<button type="button" class="btn btn--small btn--ghost" id="add-service">+ Add service</button>' +
        '</div>'
      );
    }

    function sessionRow(s, i) {
      return (
        '<div class="rate-editor-row" data-session-row="' + i + '">' +
        '<input placeholder="e.g. 30 minutes" value="' + esc(s.name || '') + '" data-session-name>' +
        '<span></span>' +
        '<input placeholder="Price" value="' + esc(s.price || '') + '" data-session-price>' +
        '<button type="button" data-remove-session="' + i + '">&times;</button>' +
        '</div>'
      );
    }

    function serviceRow(s, i) {
      return (
        '<div class="rate-editor-row" data-service-row="' + i + '">' +
        '<input placeholder="Service name" value="' + esc(s.name || '') + '" data-service-name>' +
        '<input placeholder="Short description" value="' + esc(s.description || '') + '" data-service-desc>' +
        '<input placeholder="Price" value="' + esc(s.price || '') + '" data-service-price>' +
        '<button type="button" data-remove-service="' + i + '">&times;</button>' +
        '</div>'
      );
    }

    function wireRateRows() {
      document.getElementById('add-session').addEventListener('click', function () {
        data.rates = collectRates();
        data.rates.sessions.push({ name: '', price: '' });
        rerenderRatesOnly();
      });
      document.getElementById('add-service').addEventListener('click', function () {
        data.rates = collectRates();
        data.rates.services.push({ name: '', description: '', price: '' });
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
      content.querySelectorAll('[data-remove-service]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var all = collectRates();
          all.services.splice(Number(btn.dataset.removeService), 1);
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
          price: row.querySelector('[data-session-price]').value.trim()
        };
      });
      var services = Array.from(document.querySelectorAll('#services-rows [data-service-row]')).map(function (row) {
        return {
          name: row.querySelector('[data-service-name]').value.trim(),
          description: row.querySelector('[data-service-desc]').value.trim(),
          price: row.querySelector('[data-service-price]').value.trim()
        };
      });
      var noteEl = document.getElementById('services-note');
      return { sessions: sessions, services: services, servicesNote: noteEl ? noteEl.value.trim() : (data.rates.servicesNote || '') };
    }

    function onSubmit(e) {
      e.preventDefault();
      var form = e.target;
      var status = form.querySelector('.form-status');
      var fd = new FormData(form);
      var next = Object.assign({}, data);
      next.hours = {};
      DAYS.forEach(function (d) { next.hours[d] = fd.get('hours_' + d) || ''; });
      ['legalName', 'registrationNo', 'abn', 'licence', 'address', 'suburb', 'phone', 'email', 'recruitEmail', 'parking', 'payment', 'hoursSummary'].forEach(
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
