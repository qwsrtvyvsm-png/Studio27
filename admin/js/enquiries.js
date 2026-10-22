(function () {
  'use strict';

  var esc = Admin.esc;
  var params = new URLSearchParams(location.search);
  var focusId = params.get('id') ? Number(params.get('id')) : null;
  var state = { items: [], type: params.get('type') || '', status: '', openId: focusId, photosByItem: {} };

  Admin.requireSession(function () {
    Admin.mountShell('enquiries', 'Enquiries & Applications', 'Booking requests and job applications from the public site.');
    var content = document.getElementById('admin-content');
    if (!Admin.hasAccess('enquiries')) { content.innerHTML = Admin.accessDeniedHTML(); return; }
    content.innerHTML =
      '<div class="admin-panel">' +
      '<div class="tabs" id="type-tabs">' +
      tabButton('', 'All') + tabButton('booking', 'Booking enquiries') + tabButton('application', 'Applications') +
      '</div>' +
      '<div class="tabs" id="status-tabs">' +
      statusButton('', 'Any status') + statusButton('new', 'New') + statusButton('contacted', 'Contacted') + statusButton('closed', 'Closed') +
      '</div>' +
      '<div id="enquiries-table"><p class="muted">Loading&hellip;</p></div>' +
      '</div>';

    content.querySelectorAll('#type-tabs [data-type]').forEach(function (btn) {
      btn.addEventListener('click', function () { state.type = btn.dataset.type; load(); });
    });
    content.querySelectorAll('#status-tabs [data-status]').forEach(function (btn) {
      btn.addEventListener('click', function () { state.status = btn.dataset.status; load(); });
    });

    load();

    function tabButton(value, label) {
      return '<button type="button" class="tab-btn' + (state.type === value ? ' is-active' : '') + '" data-type="' + value + '">' + label + '</button>';
    }
    function statusButton(value, label) {
      return '<button type="button" class="tab-btn' + (state.status === value ? ' is-active' : '') + '" data-status="' + value + '">' + label + '</button>';
    }

    function refreshTabs() {
      content.querySelectorAll('#type-tabs [data-type]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.type === state.type);
      });
      content.querySelectorAll('#status-tabs [data-status]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.status === state.status);
      });
    }

    function load() {
      refreshTabs();
      var qs = [];
      if (state.type) qs.push('type=' + encodeURIComponent(state.type));
      if (state.status) qs.push('status=' + encodeURIComponent(state.status));
      var wrap = document.getElementById('enquiries-table');
      wrap.innerHTML = '<p class="muted">Loading&hellip;</p>';
      Admin.api('/enquiries' + (qs.length ? '?' + qs.join('&') : ''))
        .then(function (rows) {
          state.items = rows || [];
          var openItem = state.openId && state.items.filter(function (x) { return x.id === state.openId; })[0];
          if (openItem && openItem.photo_count > 0 && !state.photosByItem[state.openId]) {
            Admin.api('/enquiries/' + state.openId + '/photos').then(function (photos) {
              state.photosByItem[state.openId] = photos;
              render();
            });
            return;
          }
          render();
          if (openItem) {
            var rowBtn = document.querySelector('[data-view="' + state.openId + '"]');
            if (rowBtn) rowBtn.scrollIntoView({ block: 'center' });
          }
        })
        .catch(function (err) {
          wrap.innerHTML = '<p class="form-status is-error">' + esc(err.message) + '</p>';
        });
    }

    function render() {
      var wrap = document.getElementById('enquiries-table');
      if (!state.items.length) {
        wrap.innerHTML = '<div class="admin-empty">Nothing here yet.</div>';
        return;
      }
      var rows = state.items
        .map(function (item) {
          var main =
            '<tr>' +
            '<td>' + esc(new Date(item.created_at).toLocaleDateString()) + '</td>' +
            '<td>' + (item.type === 'application' ? 'Application' : 'Booking') + '</td>' +
            '<td>' + esc(item.name) + '</td>' +
            '<td>' + esc(item.phone || item.email || '—') + '</td>' +
            '<td><span class="badge badge--' + item.status + '">' + esc(item.status) + '</span></td>' +
            '<td class="row-actions"><button data-view="' + item.id + '">' + (state.openId === item.id ? 'Close' : 'View') + '</button></td>' +
            '</tr>';
          var detail = state.openId === item.id ? '<tr><td colspan="6">' + detailHTML(item) + '</td></tr>' : '';
          return main + detail;
        })
        .join('');

      wrap.innerHTML =
        '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
        '<th>Date</th><th>Type</th><th>Name</th><th>Contact</th><th>Status</th><th>Actions</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';

      wrap.querySelectorAll('[data-view]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = Number(btn.dataset.view);
          state.openId = state.openId === id ? null : id;
          if (state.openId && !state.photosByItem[state.openId]) {
            var item = state.items.filter(function (x) { return x.id === state.openId; })[0];
            if (item && item.photo_count > 0) {
              Admin.api('/enquiries/' + state.openId + '/photos').then(function (photos) {
                state.photosByItem[state.openId] = photos;
                render();
              });
              return;
            }
          }
          render();
        });
      });
      wrap.querySelectorAll('[data-status-select]').forEach(function (sel) {
        sel.addEventListener('change', function () {
          Admin.api('/enquiries/' + sel.dataset.statusSelect, { method: 'PATCH', body: { status: sel.value } }).then(load);
        });
      });
      wrap.querySelectorAll('[data-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('Delete this entry? This cannot be undone.')) return;
          Admin.api('/enquiries/' + btn.dataset.delete, { method: 'DELETE' }).then(function () {
            state.openId = null;
            load();
          });
        });
      });
    }

    function detailHTML(item) {
      var d = item.details || {};
      var rows = [];
      rows.push(['Name', item.name]);
      if (item.email) rows.push(['Email', item.email]);
      if (item.phone) rows.push(['Phone', item.phone]);
      if (item.model_name) rows.push(['Preferred lady', item.model_name]);
      if (item.message) rows.push(['Message', item.message]);

      if (item.type === 'booking') {
        if (d.date) rows.push(['Preferred date', d.date]);
        if (d.time) rows.push(['Preferred time', d.time]);
        if (d.length) rows.push(['Session length', d.length]);
      } else {
        if (d.workingName) rows.push(['Working name', d.workingName]);
        if (d.days && d.days.length) rows.push(['Available days', d.days.join(', ')]);
        if (d.experience) rows.push(['Experience', d.experience]);
        rows.push(['18+ confirmed', d.ageConfirmed ? 'Yes' : 'No']);
        rows.push(['Applying of own free will', d.consent ? 'Yes' : 'No']);
      }

      var photos = '';
      var photoList = state.photosByItem[item.id];
      if (item.photo_count > 0 && photoList) {
        var thumbs = photoList.map(function (p) {
          return '<div class="thumb"><img src="/api/enquiries/' + item.id + '/photos/' + p.id + '" alt=""></div>';
        });
        photos = '<p class="hint" style="margin-top:16px">Photos</p><div class="thumb-grid">' + thumbs.join('') + '</div>';
      } else if (item.photo_count > 0) {
        photos = '<p class="hint" style="margin-top:16px">Loading photos&hellip;</p>';
      }

      return (
        '<div style="padding:18px 0">' +
        rows.map(function (r) { return '<p style="margin:0 0 8px"><strong>' + esc(r[0]) + ':</strong> ' + esc(r[1]) + '</p>'; }).join('') +
        '<div class="field" style="max-width:220px;margin-top:14px">' +
        '<label>Status</label>' +
        '<select data-status-select="' + item.id + '">' +
        ['new', 'contacted', 'closed']
          .map(function (s) { return '<option value="' + s + '"' + (item.status === s ? ' selected' : '') + '>' + s + '</option>'; })
          .join('') +
        '</select>' +
        '</div>' +
        photos +
        '<button type="button" class="btn btn--small btn--ghost" style="margin-top:18px" data-delete="' + item.id + '">Delete</button>' +
        '</div>'
      );
    }
  });
})();
