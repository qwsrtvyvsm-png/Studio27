(function () {
  'use strict';

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var esc = Admin.esc;
  var state = { models: [], divisions: [], editingId: null, openPhotosFor: null };

  Admin.requireSession(function () {
    Admin.mountShell('models', 'Models & Roster', 'Add and edit profiles, photos and the roster order.');
    var content = document.getElementById('admin-content');
    content.innerHTML =
      '<div class="admin-panel">' +
      '<h2 id="editor-title">Add a model</h2>' +
      '<form class="form" id="model-form">' +
      '<div class="field"><label for="m-name">Name <span class="req">*</span></label><input id="m-name" name="name" required></div>' +
      '<div class="field"><label for="m-division">Division</label><select id="m-division" name="division_id"><option value="">None</option></select></div>' +
      '<div class="field"><label for="m-age">Age</label><input id="m-age" name="age" type="number" min="18"></div>' +
      '<div class="field"><label for="m-status">Status</label><select id="m-status" name="status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>' +
      '<div class="field"><label for="m-time">Shift time</label><input id="m-time" name="time" placeholder="e.g. 10am – 6pm"></div>' +
      '<div class="field"><label class="check" style="margin-top:14px"><input id="m-isnew" name="isNew" type="checkbox"> Show &ldquo;New&rdquo; tag</label></div>' +
      '<div class="field full"><label for="m-intro">Intro</label><textarea id="m-intro" name="intro"></textarea></div>' +
      '<div class="field full"><fieldset><legend>Available days</legend><div class="options" id="m-days"></div></fieldset></div>' +
      '<div class="field full">' +
      '<button type="submit" class="btn btn--pink">Save</button> ' +
      '<button type="button" class="btn btn--ghost" id="m-cancel" hidden>Cancel edit</button>' +
      '<p class="form-status" role="status"></p>' +
      '</div>' +
      '</form>' +
      '</div>' +
      '<div class="admin-panel">' +
      '<h2>All models</h2>' +
      '<div id="models-table"><p class="muted">Loading&hellip;</p></div>' +
      '</div>';

    content.querySelector('#m-days').innerHTML = DAYS.map(function (d) {
      return '<label class="check"><input type="checkbox" name="days" value="' + d + '"> ' + d + '</label>';
    }).join('');

    var form = document.getElementById('model-form');
    var status = form.querySelector('.form-status');
    var cancelBtn = document.getElementById('m-cancel');

    cancelBtn.addEventListener('click', resetForm);
    form.addEventListener('submit', onSubmit);

    loadAll();

    function loadAll() {
      Promise.all([Admin.api('/divisions'), Admin.api('/models')])
        .then(function (results) {
          state.divisions = results[0] || [];
          state.models = results[1] || [];
          renderDivisionOptions();
          renderTable();
        })
        .catch(function (err) {
          document.getElementById('models-table').innerHTML =
            '<p class="form-status is-error">' + esc(err.message) + '</p>';
        });
    }

    function renderDivisionOptions() {
      var sel = document.getElementById('m-division');
      var current = sel.value;
      sel.innerHTML =
        '<option value="">None</option>' +
        state.divisions.map(function (d) { return '<option value="' + d.id + '">' + esc(d.name) + '</option>'; }).join('') +
        '<option value="__new">+ Add new division&hellip;</option>';
      sel.value = current;
      sel.onchange = function () {
        if (sel.value !== '__new') return;
        var name = prompt('New division name:');
        sel.value = '';
        if (!name) return;
        Admin.api('/divisions', { method: 'POST', body: { name: name.trim() } }).then(function (res) {
          state.divisions.push({ id: res.id, name: name.trim() });
          renderDivisionOptions();
          sel.value = res.id;
        });
      };
    }

    function renderTable() {
      var wrap = document.getElementById('models-table');
      if (!state.models.length) {
        wrap.innerHTML = '<div class="admin-empty">No models yet &mdash; add your first one above.</div>';
        return;
      }
      var rows = state.models
        .map(function (m, i) {
          var division = state.divisions.filter(function (d) { return d.id === m.division_id; })[0];
          var mainRow =
            '<tr>' +
            '<td>' +
            '<button data-up="' + m.id + '" ' + (i === 0 ? 'disabled' : '') + ' title="Move up">&uarr;</button> ' +
            '<button data-down="' + m.id + '" ' + (i === state.models.length - 1 ? 'disabled' : '') + ' title="Move down">&darr;</button>' +
            '</td>' +
            '<td>' + esc(m.name) + (m.isNew ? ' <span class="badge badge--new">New</span>' : '') + '</td>' +
            '<td>' + esc(division ? division.name : '—') + '</td>' +
            '<td><span class="badge badge--' + m.status + '">' + esc(m.status) + '</span></td>' +
            '<td>' + esc(m.age || '—') + '</td>' +
            '<td class="wrap">' + esc((m.days || []).join(', ') || '—') + '</td>' +
            '<td class="row-actions">' +
            '<button data-edit="' + m.id + '">Edit</button>' +
            '<button data-photos="' + m.id + '">Photos</button>' +
            '<button data-delete="' + m.id + '">Delete</button>' +
            '</td>' +
            '</tr>';
          var photosRow =
            state.openPhotosFor === m.id
              ? '<tr><td colspan="7"><div id="photos-panel-' + m.id + '"></div></td></tr>'
              : '';
          return mainRow + photosRow;
        })
        .join('');

      wrap.innerHTML =
        '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
        '<th>Order</th><th>Name</th><th>Division</th><th>Status</th><th>Age</th><th>Days</th><th>Actions</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';

      if (state.openPhotosFor) renderPhotosPanel(state.openPhotosFor);

      wrap.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () { startEdit(Number(btn.dataset.edit)); });
      });
      wrap.querySelectorAll('[data-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteModel(Number(btn.dataset.delete)); });
      });
      wrap.querySelectorAll('[data-photos]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = Number(btn.dataset.photos);
          state.openPhotosFor = state.openPhotosFor === id ? null : id;
          renderTable();
        });
      });
      wrap.querySelectorAll('[data-up]').forEach(function (btn) {
        btn.addEventListener('click', function () { move(Number(btn.dataset.up), -1); });
      });
      wrap.querySelectorAll('[data-down]').forEach(function (btn) {
        btn.addEventListener('click', function () { move(Number(btn.dataset.down), 1); });
      });
    }

    function move(id, dir) {
      var i = state.models.findIndex(function (m) { return m.id === id; });
      var j = i + dir;
      if (j < 0 || j >= state.models.length) return;
      var tmp = state.models[i];
      state.models[i] = state.models[j];
      state.models[j] = tmp;
      renderTable();
      Admin.api('/models/reorder', {
        method: 'PUT',
        body: { order: state.models.map(function (m) { return m.id; }) }
      }).catch(function () { loadAll(); });
    }

    function startEdit(id) {
      var m = state.models.filter(function (x) { return x.id === id; })[0];
      if (!m) return;
      state.editingId = id;
      document.getElementById('editor-title').textContent = 'Edit ' + m.name;
      form.name.value = m.name || '';
      form.division_id.value = m.division_id || '';
      form.age.value = m.age || '';
      form.status.value = m.status || 'active';
      form.time.value = m.time || '';
      form.isNew.checked = !!m.isNew;
      form.intro.value = m.intro || '';
      form.querySelectorAll('input[name="days"]').forEach(function (cb) {
        cb.checked = (m.days || []).indexOf(cb.value) !== -1;
      });
      cancelBtn.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
      state.editingId = null;
      document.getElementById('editor-title').textContent = 'Add a model';
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
        division_id: form.division_id.value || null,
        age: form.age.value || null,
        status: form.status.value,
        time: form.time.value.trim(),
        isNew: form.isNew.checked,
        intro: form.intro.value.trim(),
        days: days
      };
      var req = state.editingId
        ? Admin.api('/models/' + state.editingId, { method: 'PUT', body: body })
        : Admin.api('/models', { method: 'POST', body: body });
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

    function deleteModel(id) {
      var m = state.models.filter(function (x) { return x.id === id; })[0];
      if (!m || !confirm('Delete ' + m.name + '? This also removes their photos. This cannot be undone.')) return;
      Admin.api('/models/' + id, { method: 'DELETE' }).then(loadAll);
    }

    function renderPhotosPanel(modelId) {
      var panel = document.getElementById('photos-panel-' + modelId);
      if (!panel) return;
      panel.innerHTML = '<p class="muted">Loading photos&hellip;</p>';

      function render(photos) {
        panel.innerHTML =
          '<div class="thumb-grid">' +
          photos
            .map(function (p) {
              return (
                '<div class="thumb"><img src="/api/models/' + modelId + '/photos/' + p.id + '" alt="">' +
                '<button data-del-photo="' + p.id + '" title="Delete photo">&times;</button></div>'
              );
            })
            .join('') +
          '</div>' +
          '<div class="field" style="margin-top:14px;max-width:360px">' +
          '<label>Upload photos</label>' +
          '<input type="file" id="photo-upload-' + modelId + '" accept="image/*" multiple>' +
          '</div>' +
          '<p class="form-status" id="photo-status-' + modelId + '"></p>';

        panel.querySelectorAll('[data-del-photo]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (!confirm('Delete this photo?')) return;
            Admin.api('/models/' + modelId + '/photos/' + btn.dataset.delPhoto, { method: 'DELETE' }).then(function () {
              renderPhotosPanel(modelId);
            });
          });
        });

        document.getElementById('photo-upload-' + modelId).addEventListener('change', function (e) {
          var files = e.target.files;
          if (!files.length) return;
          var fd = new FormData();
          Array.from(files).forEach(function (f) { fd.append('photos', f); });
          var pStatus = document.getElementById('photo-status-' + modelId);
          pStatus.textContent = 'Uploading…';
          pStatus.className = 'form-status';
          Admin.api('/models/' + modelId + '/photos', { method: 'POST', body: fd })
            .then(function () { renderPhotosPanel(modelId); })
            .catch(function (err) {
              pStatus.className = 'form-status is-error';
              pStatus.textContent = err.message;
            });
        });
      }

      Admin.api('/models/' + modelId + '/photos')
        .then(render)
        .catch(function () { render([]); });
    }
  });
})();
