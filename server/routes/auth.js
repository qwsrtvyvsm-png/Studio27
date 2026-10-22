const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { requireOwner, OWNER_EMAIL, PERMISSION_KEYS } = require('../middleware/permissions');
const { record } = require('../middleware/activityLog');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' }
});

router.get('/needs-setup', async (req, res) => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM admin_users');
  res.json({ needsSetup: rows[0].count === 0 });
});

router.post('/setup', authLimiter, async (req, res) => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM admin_users');
  if (rows[0].count > 0) {
    return res.status(403).json({ error: 'Setup has already been completed.' });
  }

  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: 'A valid email and a password of at least 8 characters are required.' });
  }

  const hash = await bcrypt.hash(password, 12);
  const inserted = await pool.query(
    'INSERT INTO admin_users (email, password_hash, last_login_at) VALUES ($1, $2, now()) RETURNING id',
    [email, hash]
  );
  req.session.userId = inserted.rows[0].id;
  res.json({ ok: true });
});

router.post('/login', authLimiter, async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { rows } = await pool.query(
    'SELECT id, password_hash FROM admin_users WHERE email = $1',
    [email]
  );
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  await pool.query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [user.id]);
  req.session.userId = user.id;
  record(user.id, 'Logged in', 'POST', 'auth/login');
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', async (req, res) => {
  if (!(req.session && req.session.userId)) {
    return res.json({ authenticated: false });
  }
  const { rows } = await pool.query(
    'SELECT id, email, permissions FROM admin_users WHERE id = $1',
    [req.session.userId]
  );
  const user = rows[0];
  res.json({
    authenticated: true,
    id: user ? user.id : null,
    email: user ? user.email : null,
    permissions: user ? user.permissions || [] : [],
    isOwner: user ? user.email === OWNER_EMAIL : false
  });
});

router.put('/password', requireAuth, authLimiter, async (req, res) => {
  const currentPassword = req.body.currentPassword || '';
  const newPassword = req.body.newPassword || '';
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const { rows } = await pool.query('SELECT email, password_hash FROM admin_users WHERE id = $1', [req.session.userId]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(currentPassword, user.password_hash));
  if (!ok) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const hash = await bcrypt.hash(newPassword, 12);

  // The owner changes their own password immediately. Anyone else's change
  // is held as a request until the owner approves it.
  if (user.email === OWNER_EMAIL) {
    await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, req.session.userId]);
    record(req.session.userId, 'Changed their password', 'PUT', 'auth/password');
    return res.json({ ok: true });
  }

  record(req.session.userId, 'Requested a password change', 'PUT', 'auth/password');
  await pool.query(
    'INSERT INTO admin_password_requests (admin_user_id, new_password_hash) VALUES ($1, $2)',
    [req.session.userId, hash]
  );
  res.json({ ok: true, pending: true });
});

router.put('/email', requireAuth, authLimiter, async (req, res) => {
  const currentPassword = req.body.currentPassword || '';
  const newEmail = (req.body.newEmail || '').trim().toLowerCase();
  if (!newEmail || !newEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  const { rows } = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [req.session.userId]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(currentPassword, user.password_hash));
  if (!ok) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  try {
    await pool.query('UPDATE admin_users SET email = $1 WHERE id = $2', [newEmail, req.session.userId]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That email is already in use.' });
    }
    throw err;
  }
  res.json({ ok: true, email: newEmail });
});

router.get('/admin-users', requireOwner, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, created_at, last_login_at, permissions FROM admin_users ORDER BY created_at ASC'
  );
  res.json(rows.map((u) => ({ ...u, isOwner: u.email === OWNER_EMAIL })));
});

router.post('/admin-users', requireOwner, authLimiter, async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  if (!email || !email.includes('@') || !password || password.length < 8) {
    return res.status(400).json({ error: 'A valid email and a password of at least 8 characters are required.' });
  }

  const hash = await bcrypt.hash(password, 12);
  try {
    const inserted = await pool.query(
      'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at, last_login_at, permissions',
      [email, hash]
    );
    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That email is already in use.' });
    }
    throw err;
  }
});

router.put('/admin-users/:id/permissions', requireOwner, async (req, res) => {
  const { rows } = await pool.query('SELECT email FROM admin_users WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  if (rows[0].email === OWNER_EMAIL) {
    return res.status(400).json({ error: 'The owner always has full access.' });
  }
  const permissions = (Array.isArray(req.body.permissions) ? req.body.permissions : []).filter((p) =>
    PERMISSION_KEYS.includes(p)
  );
  await pool.query('UPDATE admin_users SET permissions = $1 WHERE id = $2', [permissions, req.params.id]);
  res.json({ ok: true, permissions });
});

router.delete('/admin-users/:id', requireOwner, authLimiter, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.userId) {
    return res.status(400).json({ error: 'You cannot remove your own account.' });
  }

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM admin_users');
  if (rows[0].count <= 1) {
    return res.status(400).json({ error: 'At least one admin account must remain.' });
  }

  await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
  res.json({ ok: true });
});

router.get('/password-requests', requireOwner, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.created_at AS "createdAt", u.email
     FROM admin_password_requests r JOIN admin_users u ON u.id = r.admin_user_id
     WHERE r.status = 'pending' ORDER BY r.created_at ASC`
  );
  res.json(rows);
});

router.post('/password-requests/:id/approve', requireOwner, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT admin_user_id, new_password_hash FROM admin_password_requests WHERE id = $1 AND status = 'pending'`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [
    rows[0].new_password_hash,
    rows[0].admin_user_id
  ]);
  await pool.query(
    `UPDATE admin_password_requests SET status = 'approved', resolved_at = now() WHERE id = $1`,
    [req.params.id]
  );
  record(req.session.userId, 'Approved a password change request', 'POST', 'auth/password-requests/' + req.params.id + '/approve');
  res.json({ ok: true });
});

router.post('/password-requests/:id/deny', requireOwner, async (req, res) => {
  const { rows } = await pool.query(`SELECT id FROM admin_password_requests WHERE id = $1 AND status = 'pending'`, [
    req.params.id
  ]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  await pool.query(`UPDATE admin_password_requests SET status = 'denied', resolved_at = now() WHERE id = $1`, [
    req.params.id
  ]);
  record(req.session.userId, 'Denied a password change request', 'POST', 'auth/password-requests/' + req.params.id + '/deny');
  res.json({ ok: true });
});

router.get('/activity', requireOwner, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.id, l.action, l.created_at AS "createdAt", u.email AS "adminEmail"
     FROM admin_activity_log l LEFT JOIN admin_users u ON u.id = l.admin_user_id
     ORDER BY l.created_at DESC LIMIT 300`
  );
  res.json(rows);
});

module.exports = router;
