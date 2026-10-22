(function () {
  'use strict';

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var esc = Admin.esc;
  var state = { staff: [], editingId: null };

  Admin.requireSession(function () {
    Admin.mountShell('staff', 'Staff Roster', 'Add staff and fill in their weekly shifts.');
    var content = document.getElementById('admin-content');
    if (!Admin.hasAccess('staff')) { content.innerHTML = Admin.accessDeniedHTML(); return; }
    content.innerHTML =
      '<div class="admin-panel">' +
      '<h2 id="editor-title">Add a staff member</h2>' +
      '<form class="form" id="staff-form">' +
      '<div class="field"><label for="s-name">Name <span class="req">*</span></label><input id="s-name" name="name" required></div>' +
      '<div class="field"><label for="s-role">Role</label><input id="s-role" name="role" placeholder="e.g. Reception"></div>' +
      '<div class="field"><label for="s-status">Status</label><select id="s-status" name="status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>' +
      '<div class="field"><label for="s-time">Shift time</label><input id="s-time" name="time" placeholder="e.g. 9am – 5pm"></div>' +
      '<div class="field full"><fieldset><legend>Working days</legend><div class="options" id="s-days"></div></fieldset></div>' +
      '<div class="field full">' +
      '<button type="submit" class="btn btn--pink">Save</button> ' +
      '<button type="button" class="btn btn--ghost" id="s-cancel" hidden>Cancel edit</button>' +
      '<p class="form-status" role="status"></p>' +
      '</div>' +
      '</form>' +
      '</div>' +
      '<div class="admin-panel">' +
      '<h2>All staff</h2>' +
      '<div id="staff-table"><p class="muted">Loading&hellip;</p></div>' +
      '</div>';

    content.querySelector('#s-days').innerHTML = DAYS.map(function (d) {
      return '<label class="check"><input type="checkbox" name="days" value="' + d + '"> ' + d + '</label>';
    }).join('');

    var form = document.getElementById('staff-form');
    var status = form.querySelector('.form-status');
    var cancelBtn = document.getElementById('s-cancel');

    cancelBtn.addEventListener('click', resetForm);
    form.addEventListener('submit', onSubmit);

    loadAll();

    function loadAll() {
      Admin.api('/staff')
        .then(function (rows) {
          state.staff = rows || [];
          renderTable();
        })
        .catch(function (err) {
          document.getElementById('staff-table').innerHTML =
            '<p class="form-status is-error">' + esc(err.message) + '</p>';
        });
    }

    function renderTable() {
      var wrap = document.getElementById('staff-table');
      if (!state.staff.length) {
        wrap.innerHTML = '<div class="admin-empty">No staff yet &mdash; add your first one above.</div>';
        return;
      }
      var rows = state.staff
        .map(function (s, i) {
          return (
            '<tr>' +
            '<td>' +
            '<button data-up="' + s.id + '" ' + (i === 0 ? 'disabled' : '') + ' title="Move up">&uarr;</button> ' +
            '<button data-down="' + s.id + '" ' + (i === state.staff.length - 1 ? 'disabled' : '') + ' title="Move down">&darr;</button>' +
            '</td>' +
            '<td>' + esc(s.name) + '</td>' +
            '<td>' + esc(s.role || '—') + '</td>' +
            '<td><span class="badge badge--' + s.status + '">' + esc(s.status) + '</span></td>' +
            '<td class="wrap">' + esc((s.days || []).join(', ') || '—') + '</td>' +
            '<td>' + esc(s.time || '—') + '</td>' +
            '<td class="row-actions">' +
            '<button data-edit="' + s.id + '">Edit</button>' +
            '<button data-delete="' + s.id + '">Delete</button>' +
            '</td>' +
            '</tr>'
          );
        })
        .join('');

      wrap.innerHTML =
        '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
        '<th>Order</th><th>Name</th><th>Role</th><th>Status</th><th>Days</th><th>Time</th><th>Actions</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';

      wrap.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () { startEdit(Number(btn.dataset.edit)); });
      });
      wrap.querySelectorAll('[data-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteStaff(Number(btn.dataset.delete)); });
      });
      wrap.querySelectorAll('[data-up]').forEach(function (btn) {
        btn.addEventListener('click', function () { move(Number(btn.dataset.up), -1); });
      });
      wrap.querySelectorAll('[data-down]').forEach(function (btn) {
        btn.addEventListener('click', function () { move(Number(btn.dataset.down), 1); });
      });
    }

    function move(id, dir) {
      var i = state.staff.findIndex(function (s) { return s.id === id; });
      var j = i + dir;
      if (j < 0 || j >= state.staff.length) return;
      var tmp = state.staff[i];
      state.staff[i] = state.staff[j];
      state.staff[j] = tmp;
      renderTable();
      Admin.api('/staff/reorder', {
        method: 'PUT',
        body: { order: state.staff.map(function (s) { return s.id; }) }
      }).catch(function () { loadAll(); });
    }

    function startEdit(id) {
      var s = state.staff.filter(function (x) { return x.id === id; })[0];
      if (!s) return;
      state.editingId = id;
      document.getElementById('editor-title').textContent = 'Edit ' + s.name;
      form.name.value = s.name || '';
      form.role.value = s.role || '';
      form.status.value = s.status || 'active';
      form.time.value = s.time || '';
      form.querySelectorAll('input[name="days"]').forEach(function (cb) {
        cb.checked = (s.days || []).indexOf(cb.value) !== -1;
      });
      cancelBtn.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
      state.editingId = null;
      document.getElementById('editor-title').textContent = 'Add a staff member';
      form.reset();
      cancelBtn.hidden = true;
      status.textContent = '';
      status.className = 'form-status';
    }

    function onSubmit(e) {
      e.preventDefault();
      status.textContent = '';
      status.className = 'form-status';
      var days = Array.from(form.querySelectorAll('input[name="days"]:checked')).map(function (cb) { return cb.value; });
      var body = {
        name: form.name.value.trim(),
        role: form.role.value.trim(),
        status: form.status.value,
        time: form.time.value.trim(),
        days: days
      };
      var req = state.editingId
        ? Admin.api('/staff/' + state.editingId, { method: 'PUT', body: body })
        : Admin.api('/staff', { method: 'POST', body: body });
      req
        .then(function () {
          status.className = 'form-status is-ok';
          status.textContent = 'Saved.';
          resetForm();
          loadAll();
        })
        .catch(function (err) {
          status.className = 'form-status is-error';
          status.textContent = err.message;
        });
    }

    function deleteStaff(id) {
      var s = state.staff.filter(function (x) { return x.id === id; })[0];
      if (!s || !confirm('Delete ' + s.name + '? This cannot be undone.')) return;
      Admin.api('/staff/' + id, { method: 'DELETE' }).then(loadAll);
    }
  });
})();
