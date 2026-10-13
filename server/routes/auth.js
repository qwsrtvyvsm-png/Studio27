const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');

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
    'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) RETURNING id',
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

  req.session.userId = user.id;
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', async (req, res) => {
  if (!(req.session && req.session.userId)) {
    return res.json({ authenticated: false });
  }
  const { rows } = await pool.query('SELECT email FROM admin_users WHERE id = $1', [req.session.userId]);
  res.json({ authenticated: true, email: rows[0] ? rows[0].email : null });
});

router.put('/password', requireAuth, authLimiter, async (req, res) => {
  const currentPassword = req.body.currentPassword || '';
  const newPassword = req.body.newPassword || '';
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const { rows } = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [req.session.userId]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(currentPassword, user.password_hash));
  if (!ok) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, req.session.userId]);
  res.json({ ok: true });
});

module.exports = router;
