/* ==========================================================
   STUDIO 27 — ADMIN SHARED HELPERS
   ========================================================== */
(function () {
  'use strict';

  var NAV = [
    { href: 'index.html', label: 'Dashboard', id: 'dashboard' },
    { href: 'models.html', label: 'Models & Roster', id: 'models' },
    { href: 'enquiries.html', label: 'Enquiries & Applications', id: 'enquiries' },
    { href: 'settings.html', label: 'Site Settings', id: 'settings' },
    { href: 'content.html', label: 'Site Content', id: 'content' }
  ];

  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function api(path, options) {
    options = options || {};
    options.credentials = 'include';
    if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
      options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
      options.body = JSON.stringify(options.body);
    }
    return fetch('/api' + path, options).then(function (res) {
      if (res.status === 204) return null;
      return res
        .json()
        .catch(function () { return null; })
        .then(function (data) {
          if (!res.ok) {
            var err = new Error((data && data.error) || 'Request failed');
            err.status = res.status;
            throw err;
          }
          return data;
        });
    });
  }

  function sidebarHTML(page) {
    var links = NAV.map(function (n) {
      return '<li><a href="' + n.href + '" data-nav="' + n.id + '"' + (n.id === page ? ' aria-current="page"' : '') + '>' +
        '<span class="admin-nav__label">' + n.label + '</span></a></li>';
    }).join('');
    return '' +
      '<aside class="admin-sidebar">' +
      '<a class="brand" href="index.html"><span class="brand__mark">27</span><span class="brand__name">Studio 27<br>Admin</span></a>' +
      '<nav class="admin-nav"><ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">' + links + '</ul></nav>' +
      '<button type="button" class="logout-btn" data-logout>Log out</button>' +
      '</aside>';
  }

  function mountShell(page, title, subtitle, actionsHTML) {
    var root = document.getElementById('admin-root');
    if (!root) return;
    root.insertAdjacentHTML(
      'afterbegin',
      sidebarHTML(page) +
        '<main class="admin-main">' +
        '<div class="admin-topbar"><div><h1>' + esc(title) + '</h1>' +
        (subtitle ? '<p>' + esc(subtitle) + '</p>' : '') +
        '</div>' + (actionsHTML || '') + '</div>' +
        '<div id="admin-content"></div>' +
        '</main>'
    );
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-logout]')) {
        api('/auth/logout', { method: 'POST' }).then(function () {
          location.href = 'login.html';
        });
      }
    });
  }

  function setNavBadge(page, count) {
    var link = document.querySelector('.admin-nav a[data-nav="' + page + '"]');
    if (!link) return;
    var existing = link.querySelector('.admin-nav__badge');
    if (!count) {
      if (existing) existing.remove();
      return;
    }
    if (!existing) {
      existing = document.createElement('span');
      existing.className = 'admin-nav__badge';
      link.appendChild(existing);
    }
    existing.textContent = count;
  }

  function requireSession(onReady) {
    api('/auth/me')
      .then(function (data) {
        if (!data || !data.authenticated) {
          location.href = 'login.html';
          return;
        }
        onReady();
      })
      .catch(function () {
        location.href = 'login.html';
      });
  }

  window.Admin = { api: api, esc: esc, mountShell: mountShell, requireSession: requireSession, setNavBadge: setNavBadge };
})();
