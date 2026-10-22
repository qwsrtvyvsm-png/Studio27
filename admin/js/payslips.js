(function () {
  'use strict';

  var esc = Admin.esc;
  var BLANK_ROWS = 8;
  var state = { models: [], modelId: null, payslips: [], editingId: null, rows: [] };

  // Postgres DATE columns arrive as full ISO timestamps once JSON-serialised;
  // <input type="date"> and the table both just want the YYYY-MM-DD part.
  function dateOnly(s) { return String(s || '').slice(0, 10); }

  Admin.requireSession(function () {
    Admin.mountShell('payslips', 'Payslips', 'Fill in a payslip for a lady, just like the paper sheet.');
    var content = document.getElementById('admin-content');
    if (!Admin.hasAccess('payslips')) { content.innerHTML = Admin.accessDeniedHTML(); return; }
    content.innerHTML =
      '<div class="admin-panel">' +
      '<div class="field" style="max-width:360px"><label for="p-model">Lady</label><select id="p-model"><option value="">Choose a lady&hellip;</option></select></div>' +
      '</div>' +
      '<div id="payslip-area"></div>';

    var modelSelect = document.getElementById('p-model');
    modelSelect.addEventListener('change', function () {
      state.modelId = modelSelect.value || null;
      state.editingId = null;
      resetRows();
      document.getElementById('payslip-area').innerHTML = state.modelId ? areaHTML() : '';
      if (state.modelId) {
        wireAreaEvents();
        loadPayslips();
      }
    });

    Admin.api('/models')
      .then(function (models) {
        state.models = models || [];
        modelSelect.innerHTML =
          '<option value="">Choose a lady&hellip;</option>' +
          state.models.map(function (m) { return '<option value="' + m.id + '">' + esc(m.name) + '</option>'; }).join('');
      })
      .catch(function () {});

    function resetRows() {
      state.rows = [];
      for (var i = 0; i < BLANK_ROWS; i++) state.rows.push({ client: '', time: '', duration: '', amount: '' });
    }
    resetRows();

    function areaHTML() {
      return (
        '<div class="admin-panel">' +
        '<h2 id="payslip-editor-title">New payslip</h2>' +
        '<form class="form" id="payslip-form">' +
        '<div class="field"><label for="p-date">Date <span class="req">*</span></label><input id="p-date" name="payDate" type="date" required></div>' +
        '<div class="field full">' +
        '<div class="rate-editor-row rate-editor-row--payslip rate-editor-header"><span>Client</span><span>Time</span><span>Duration</span><span>Amount Paid</span><span></span></div>' +
        '<div id="payslip-rows"></div>' +
        '<button type="button" class="btn btn--small btn--ghost" id="p-add-row">+ Add row</button>' +
        '</div>' +
        '<div class="field full">' +
        '<div class="payslip-total">Total Paid <strong id="payslip-total-amount">$0</strong></div>' +
        '</div>' +
        '<div class="field full">' +
        '<button type="submit" class="btn btn--pink">Save payslip</button> ' +
        '<button type="button" class="btn btn--ghost" id="p-cancel" hidden>Cancel edit</button>' +
        '<p class="form-status" role="status"></p>' +
        '</div>' +
        '</form>' +
        '</div>' +
        '<div class="admin-panel">' +
        '<h2>Past payslips</h2>' +
        '<div id="payslips-table"><p class="muted">Loading&hellip;</p></div>' +
        '</div>'
      );
    }

    function wireAreaEvents() {
      document.getElementById('p-add-row').addEventListener('click', function () {
        state.rows = collectRows();
        state.rows.push({ client: '', time: '', duration: '', amount: '' });
        renderRows();
      });
      document.getElementById('p-cancel').addEventListener('click', resetEditor);
      document.getElementById('payslip-form').addEventListener('submit', onSubmit);
      document.getElementById('p-date').valueAsDate = new Date();
      renderRows();
    }

    function renderRows() {
      var wrap = document.getElementById('payslip-rows');
      wrap.innerHTML = state.rows
        .map(function (r, i) {
          return (
            '<div class="rate-editor-row rate-editor-row--payslip" data-row="' + i + '">' +
            '<input placeholder="Client" value="' + esc(r.client) + '" data-f="client">' +
            '<input placeholder="Time" value="' + esc(r.time) + '" data-f="time">' +
            '<input placeholder="Duration" value="' + esc(r.duration) + '" data-f="duration">' +
            '<input placeholder="0" inputmode="decimal" value="' + esc(r.amount) + '" data-f="amount">' +
            '<button type="button" data-remove-row="' + i + '">&times;</button>' +
            '</div>'
          );
        })
        .join('');
      wrap.querySelectorAll('[data-remove-row]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.rows = collectRows();
          state.rows.splice(Number(btn.dataset.removeRow), 1);
          renderRows();
        });
      });
      wrap.querySelectorAll('input[data-f="amount"]').forEach(function (inp) {
        inp.addEventListener('input', updateTotal);
      });
      updateTotal();
    }

    function collectRows() {
      return Array.from(document.querySelectorAll('#payslip-rows [data-row]')).map(function (row) {
        return {
          client: row.querySelector('[data-f="client"]').value,
          time: row.querySelector('[data-f="time"]').value,
          duration: row.querySelector('[data-f="duration"]').value,
          amount: row.querySelector('[data-f="amount"]').value
        };
      });
    }

    function updateTotal() {
      var total = collectRows().reduce(function (sum, r) { return sum + (parseFloat(r.amount) || 0); }, 0);
      document.getElementById('payslip-total-amount').textContent = '$' + total.toFixed(2).replace(/\.00$/, '');
    }

    function resetEditor() {
      state.editingId = null;
      document.getElementById('payslip-editor-title').textContent = 'New payslip';
      document.getElementById('p-cancel').hidden = true;
      resetRows();
      renderRows();
      document.getElementById('p-date').valueAsDate = new Date();
      var status = document.querySelector('#payslip-form .form-status');
      status.textContent = '';
      status.className = 'form-status';
    }

    function loadPayslips() {
      var wrap = document.getElementById('payslips-table');
      wrap.innerHTML = '<p class="muted">Loading&hellip;</p>';
      Admin.api('/payslips/by-model/' + state.modelId)
        .then(function (rows) {
          state.payslips = rows || [];
          renderPayslipsTable();
        })
        .catch(function (err) {
          wrap.innerHTML = '<p class="form-status is-error">' + esc(err.message) + '</p>';
        });
    }

    function renderPayslipsTable() {
      var wrap = document.getElementById('payslips-table');
      if (!state.payslips.length) {
        wrap.innerHTML = '<div class="admin-empty">No payslips yet for this lady.</div>';
        return;
      }
      var rows = state.payslips
        .map(function (p) {
          return (
            '<tr>' +
            '<td>' + esc(dateOnly(p.payDate)) + '</td>' +
            '<td>$' + Number(p.total).toFixed(2) + '</td>' +
            '<td class="row-actions">' +
            '<button data-edit-payslip="' + p.id + '">Edit</button>' +
            '<button data-delete-payslip="' + p.id + '">Delete</button>' +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
      wrap.innerHTML =
        '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
        '<th>Date</th><th>Total Paid</th><th>Actions</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';

      wrap.querySelectorAll('[data-edit-payslip]').forEach(function (btn) {
        btn.addEventListener('click', function () { startEditPayslip(Number(btn.dataset.editPayslip)); });
      });
      wrap.querySelectorAll('[data-delete-payslip]').forEach(function (btn) {
        btn.addEventListener('click', function () { deletePayslip(Number(btn.dataset.deletePayslip)); });
      });
    }

    function startEditPayslip(id) {
      Admin.api('/payslips/' + id).then(function (p) {
        state.editingId = id;
        document.getElementById('payslip-editor-title').textContent = 'Edit payslip — ' + dateOnly(p.payDate);
        document.getElementById('p-cancel').hidden = false;
        document.getElementById('p-date').value = dateOnly(p.payDate);
        state.rows = (p.entries.length ? p.entries : []).map(function (e) {
          return { client: e.client, time: e.time, duration: e.duration, amount: e.amount };
        });
        while (state.rows.length < BLANK_ROWS) state.rows.push({ client: '', time: '', duration: '', amount: '' });
        renderRows();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    function deletePayslip(id) {
      if (!confirm('Delete this payslip? This cannot be undone.')) return;
      Admin.api('/payslips/' + id, { method: 'DELETE' }).then(loadPayslips);
    }

    function onSubmit(e) {
      e.preventDefault();
      var status = document.querySelector('#payslip-form .form-status');
      status.textContent = '';
      status.className = 'form-status';
      var body = {
        payDate: document.getElementById('p-date').value,
        entries: collectRows()
      };
      var req = state.editingId
        ? Admin.api('/payslips/' + state.editingId, { method: 'PUT', body: body })
        : Admin.api('/payslips/by-model/' + state.modelId, { method: 'POST', body: body });
      req
        .then(function () {
          status.className = 'form-status is-ok';
          status.textContent = 'Saved.';
          resetEditor();
          loadPayslips();
        })
        .catch(function (err) {
          status.className = 'form-status is-error';
          status.textContent = err.message;
        });
    }
  });
})();
