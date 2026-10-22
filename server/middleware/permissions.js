const { pool } = require('../db');

// The owner is identified by email, not a stored flag, so it can never be
// edited away by accident through the admin-users UI.
const OWNER_EMAIL = 'hb4016@outlook.com';

// Keys match each gated section of the admin dashboard. "settings" also
// covers the Site Content page, since both read/write the same settings blob.
const PERMISSION_KEYS = ['models', 'staff', 'payslips', 'enquiries', 'settings'];

async function loadAdminUser(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { rows } = await pool.query(
    'SELECT id, email, permissions FROM admin_users WHERE id = $1',
    [req.session.userId]
  );
  if (!rows[0]) return res.status(401).json({ error: 'Not authenticated' });
  req.adminUser = {
    id: rows[0].id,
    email: rows[0].email,
    permissions: rows[0].permissions || [],
    isOwner: rows[0].email === OWNER_EMAIL
  };
  next();
}

function requirePermission(key) {
  return [
    loadAdminUser,
    (req, res, next) => {
      if (req.adminUser.isOwner || req.adminUser.permissions.indexOf(key) !== -1) return next();
      res.status(403).json({ error: 'You do not have access to this section.' });
    }
  ];
}

function requireOwner(req, res, next) {
  loadAdminUser(req, res, () => {
    if (!req.adminUser.isOwner) return res.status(403).json({ error: 'Owner access only.' });
    next();
  });
}

module.exports = { loadAdminUser, requirePermission, requireOwner, OWNER_EMAIL, PERMISSION_KEYS };
