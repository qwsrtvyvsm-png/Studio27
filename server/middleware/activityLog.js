const { pool } = require('../db');

const NOUNS = {
  models: 'lady profile',
  staff: 'staff member',
  payslips: 'payslip',
  divisions: 'division',
  settings: 'site settings',
  enquiries: 'enquiry',
  applications: 'application',
  'admin-users': 'admin user'
};

const VERBS = { POST: 'Added', PUT: 'Updated', DELETE: 'Deleted' };

function describe(method, pathParts) {
  // pathParts e.g. ['api','models','8','photos'] or ['api','auth','admin-users','5','permissions']
  let section = pathParts[1];
  let rest = pathParts.slice(2);

  if (section === 'auth') {
    const sub = rest[0];
    if (sub === 'admin-users') {
      if (rest[1] === undefined) return VERBS[method] ? `${VERBS[method]} an admin user` : null;
      if (rest[2] === 'permissions') return `Updated permissions for admin user #${rest[1]}`;
      return `${VERBS[method] || 'Changed'} admin user #${rest[1]}`;
    }
    if (sub === 'email') return 'Changed their email';
    return null; // login/logout/setup/password are logged explicitly where they happen
  }

  const noun = NOUNS[section] || section;
  const verb = VERBS[method] || method;
  if (section === 'models' && rest[1] === 'photos') {
    return `${verb} a photo for lady #${rest[0]}`;
  }
  if (section === 'payslips' && rest[0] === 'by-model') {
    return `${verb} a payslip for lady #${rest[1]}`;
  }
  const id = rest[0] && /^\d+$/.test(rest[0]) ? rest[0] : null;
  return id ? `${verb} ${noun} #${id}` : `${verb} ${noun}`;
}

function record(adminUserId, action, method, path) {
  if (!action) return;
  pool
    .query(
      'INSERT INTO admin_activity_log (admin_user_id, action, method, path) VALUES ($1, $2, $3, $4)',
      [adminUserId, action, method, path]
    )
    .catch((err) => console.error('Failed to record admin activity', err));
}

// Auto-logs any successful mutating admin API request. Routes that need a
// clearer label (login, logout) call record() directly instead.
function activityLog(req, res, next) {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return next();
  res.on('finish', () => {
    if (res.statusCode >= 400) return;
    if (!req.session || !req.session.userId) return;
    const pathParts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
    const action = describe(req.method, pathParts);
    record(req.session.userId, action, req.method, pathParts.join('/'));
  });
  next();
}

module.exports = { activityLog, record };
