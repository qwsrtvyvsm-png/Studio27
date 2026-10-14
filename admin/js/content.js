(function () {
  'use strict';

  var esc = Admin.esc;
  var data = {};
  var EXPERIENCE_COUNT = 3;
  var VALUES_COUNT = 4;

  Admin.requireSession(function () {
    Admin.mountShell('content', 'Site Content', 'Edit the hero, about, experience and FAQ text shown on the public site.');
    var content = document.getElementById('admin-content');
    content.innerHTML = '<p class="muted">Loading&hellip;</p>';

    Admin.api('/settings')
      .then(function (res) {
        data = res || {};
        data.content = data.content || {};
        data.content.welcome = data.content.welcome || { lead: '', paragraphs: [] };
        data.content.experience = data.content.experience || [];
        data.content.about = data.content.about || { lead: '', paragraphs: [], values: [] };
        data.content.faq = data.content.faq || [];
        data.content.news = data.content.news || { paragraphs: [] };
        render();
      })
      .catch(function (err) {
        content.innerHTML = '<p class="form-status is-error">' + esc(err.message) + '</p>';
      });

    function render() {
      content.innerHTML =
        '<form id="content-form">' +
        panel('Homepage &mdash; Welcome section', welcomeFields()) +
        panel('Homepage &mdash; "The Experience" section', experienceFields()) +
        panel('About page', aboutFields()) +
        panel('FAQ', faqFields()) +
        panel('News &amp; Updates page', newsFields()) +
        '<div class="admin-panel">' +
        '<button type="submit" class="btn btn--pink">Save changes</button>' +
        '<p class="form-status" role="status"></p>' +
        '</div>' +
        '</form>';

      wireFaqRows();
      document.getElementById('content-form').addEventListener('submit', onSubmit);
    }

    function panel(title, body) {
      return '<div class="admin-panel"><h2>' + title + '</h2>' + body + '</div>';
    }

    function textField(label, id, value) {
      return (
        '<div class="field full">' +
        '<label for="' + id + '">' + esc(label) + '</label>' +
        '<input id="' + id + '" value="' + esc(value || '') + '">' +
        '</div>'
      );
    }

    function paragraphsField(label, id, paragraphs) {
      return (
        '<div class="field full">' +
        '<label for="' + id + '">' + esc(label) + '</label>' +
        '<textarea id="' + id + '" rows="4" placeholder="One paragraph per line">' + esc((paragraphs || []).join('\n')) + '</textarea>' +
        '</div>'
      );
    }

    function readParagraphs(id) {
      var el = document.getElementById(id);
      if (!el) return [];
      return el.value.split('\n').map(function (p) { return p.trim(); }).filter(Boolean);
    }

    function welcomeFields() {
      var w = data.content.welcome;
      return (
        '<div class="form">' +
        textField('Intro sentence (shown large)', 'welcome-lead', w.lead) +
        paragraphsField('Body paragraphs', 'welcome-paragraphs', w.paragraphs) +
        '</div>'
      );
    }

    function experienceFields() {
      return (
        '<div class="form">' +
        data.content.experience
          .concat(Array(Math.max(0, EXPERIENCE_COUNT - data.content.experience.length)).fill({ heading: '', body: '' }))
          .slice(0, EXPERIENCE_COUNT)
          .map(function (item, i) {
            return (
              '<div class="field"><label for="exp-h-' + i + '">Card ' + (i + 1) + ' heading</label>' +
              '<input id="exp-h-' + i + '" value="' + esc(item.heading || '') + '"></div>' +
              '<div class="field"><label for="exp-b-' + i + '">Card ' + (i + 1) + ' text</label>' +
              '<input id="exp-b-' + i + '" value="' + esc(item.body || '') + '"></div>'
            );
          })
          .join('') +
        '</div>'
      );
    }

    function aboutFields() {
      var a = data.content.about;
      var values = a.values.concat(Array(Math.max(0, VALUES_COUNT - a.values.length)).fill({ heading: '', body: '' })).slice(0, VALUES_COUNT);
      return (
        '<div>' +
        '<div class="form">' +
        textField('Intro sentence (shown large)', 'about-lead', a.lead) +
        paragraphsField('Body paragraphs', 'about-paragraphs', a.paragraphs) +
        '</div>' +
        '<h3 class="h3" style="font-size:1rem;margin:24px 0 10px">Values cards</h3>' +
        '<div class="form">' +
        values
          .map(function (item, i) {
            return (
              '<div class="field"><label for="val-h-' + i + '">Card ' + (i + 1) + ' heading</label>' +
              '<input id="val-h-' + i + '" value="' + esc(item.heading || '') + '"></div>' +
              '<div class="field"><label for="val-b-' + i + '">Card ' + (i + 1) + ' text</label>' +
              '<input id="val-b-' + i + '" value="' + esc(item.body || '') + '"></div>'
            );
          })
          .join('') +
        '</div>' +
        '</div>'
      );
    }

    function faqFields() {
      return (
        '<div>' +
        data.content.faq
          .map(function (group, gi) {
            return (
              '<div class="faq-group-editor" data-faq-group="' + gi + '" style="margin-bottom:26px;padding-bottom:20px;border-bottom:1px solid var(--line-soft)">' +
              '<div style="display:flex;gap:10px;align-items:flex-end;max-width:420px">' +
              '<div class="field full">' +
              '<label for="faq-title-' + gi + '">Group title</label>' +
              '<input id="faq-title-' + gi + '" value="' + esc(group.title || '') + '" data-faq-group-title>' +
              '</div>' +
              '<button type="button" data-remove-faq-group="' + gi + '" title="Remove group" style="background:none;border:1px solid var(--line);color:var(--muted);border-radius:4px;height:38px;width:36px;cursor:pointer">&times;</button>' +
              '</div>' +
              '<div data-faq-items="' + gi + '">' +
              (group.items || []).map(function (item, ii) { return faqItemRow(gi, ii, item); }).join('') +
              '</div>' +
              '<button type="button" class="btn btn--small btn--ghost" data-add-faq-item="' + gi + '">+ Add question</button>' +
              '</div>'
            );
          })
          .join('') +
        '<button type="button" class="btn btn--small btn--ghost" id="add-faq-group">+ Add group</button>' +
        '</div>'
      );
    }

    function faqItemRow(gi, ii, item) {
      return (
        '<div class="rate-editor-row" style="grid-template-columns:1fr 1fr 36px" data-faq-item-row="' + ii + '">' +
        '<input placeholder="Question" value="' + esc(item.question || '') + '" data-faq-question>' +
        '<input placeholder="Answer" value="' + esc(item.answer || '') + '" data-faq-answer>' +
        '<button type="button" data-remove-faq-item="' + gi + ':' + ii + '">&times;</button>' +
        '</div>'
      );
    }

    function wireFaqRows() {
      var addGroupBtn = document.getElementById('add-faq-group');
      if (addGroupBtn) {
        addGroupBtn.addEventListener('click', function () {
          data.content.faq = collectFaq();
          data.content.faq.push({ title: '', items: [] });
          rerender();
        });
      }
      content.querySelectorAll('[data-remove-faq-group]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var all = collectFaq();
          all.splice(Number(btn.dataset.removeFaqGroup), 1);
          data.content.faq = all;
          rerender();
        });
      });
      content.querySelectorAll('[data-add-faq-item]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          data.content.faq = collectFaq();
          var gi = Number(btn.dataset.addFaqItem);
          data.content.faq[gi].items.push({ question: '', answer: '' });
          rerender();
        });
      });
      content.querySelectorAll('[data-remove-faq-item]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var all = collectFaq();
          var parts = btn.dataset.removeFaqItem.split(':');
          all[Number(parts[0])].items.splice(Number(parts[1]), 1);
          data.content.faq = all;
          rerender();
        });
      });
    }

    function rerender() {
      var scrollY = window.scrollY;
      render();
      window.scrollTo(0, scrollY);
    }

    function collectFaq() {
      return Array.from(content.querySelectorAll('[data-faq-group]')).map(function (groupEl) {
        var items = Array.from(groupEl.querySelectorAll('[data-faq-item-row]')).map(function (row) {
          return {
            question: row.querySelector('[data-faq-question]').value.trim(),
            answer: row.querySelector('[data-faq-answer]').value.trim()
          };
        });
        return { title: groupEl.querySelector('[data-faq-group-title]').value.trim(), items: items };
      });
    }

    function newsFields() {
      var n = data.content.news;
      return (
        '<div class="form">' +
        paragraphsField('Body paragraphs', 'news-paragraphs', n.paragraphs) +
        '</div>'
      );
    }

    function collectExperience() {
      var out = [];
      for (var i = 0; i < EXPERIENCE_COUNT; i++) {
        var h = document.getElementById('exp-h-' + i);
        var b = document.getElementById('exp-b-' + i);
        if (!h) break;
        out.push({ heading: h.value.trim(), body: b.value.trim() });
      }
      return out;
    }

    function collectValues() {
      var out = [];
      for (var i = 0; i < VALUES_COUNT; i++) {
        var h = document.getElementById('val-h-' + i);
        var b = document.getElementById('val-b-' + i);
        if (!h) break;
        out.push({ heading: h.value.trim(), body: b.value.trim() });
      }
      return out;
    }

    function onSubmit(e) {
      e.preventDefault();
      var form = e.target;
      var status = form.querySelector('.form-status');
      var next = Object.assign({}, data);
      next.content = {
        welcome: {
          lead: document.getElementById('welcome-lead').value.trim(),
          paragraphs: readParagraphs('welcome-paragraphs')
        },
        experience: collectExperience(),
        about: {
          lead: document.getElementById('about-lead').value.trim(),
          paragraphs: readParagraphs('about-paragraphs'),
          values: collectValues()
        },
        faq: collectFaq(),
        news: {
          paragraphs: readParagraphs('news-paragraphs')
        }
      };

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
