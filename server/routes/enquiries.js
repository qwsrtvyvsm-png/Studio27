const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { requirePermission } = require('../middleware/permissions');
const enquiriesAccess = requirePermission('enquiries');

const router = express.Router();

// The booking form has no file inputs but is still posted as
// multipart/form-data (see js/site.js wireForms), so it needs multer's
// field parsing even though nothing here is ever uploaded.
const parseFields = multer().none();

router.post('/', parseFields, async (req, res) => {
  const b = req.body;
  if (!b.name || !b.phone || !b.date || !b.time) {
    return res.status(400).json({ error: 'Name, mobile, date and time are required.' });
  }

  let modelId = null;
  if (b.model) {
    const { rows } = await pool.query('SELECT id FROM models WHERE name = $1', [b.model]);
    if (rows[0]) modelId = rows[0].id;
  }

  const details = { length: b.length || '', date: b.date, time: b.time, preferredModel: b.model || '' };

  await pool.query(
    `INSERT INTO enquiries (type, name, email, phone, model_id, message, details)
     VALUES ('booking', $1, $2, $3, $4, $5, $6)`,
    [b.name, b.email || null, b.phone, modelId, b.message || null, details]
  );
  res.json({ ok: true });
});

router.get('/', enquiriesAccess, async (req, res) => {
  const clauses = [];
  const params = [];
  if (req.query.type) {
    params.push(req.query.type);
    clauses.push(`e.type = $${params.length}`);
  }
  if (req.query.status) {
    params.push(req.query.status);
    clauses.push(`e.status = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT e.*, m.name AS model_name,
       (SELECT COUNT(*)::int FROM enquiry_photos p WHERE p.enquiry_id = e.id) AS photo_count
     FROM enquiries e LEFT JOIN models m ON m.id = e.model_id
     ${where}
     ORDER BY e.created_at DESC`,
    params
  );
  res.json(rows);
});

router.get('/:id/photos', enquiriesAccess, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id FROM enquiry_photos WHERE enquiry_id = $1 ORDER BY id ASC',
    [req.params.id]
  );
  res.json(rows);
});

router.get('/:id/photos/:photoId', enquiriesAccess, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT image_bytes, content_type FROM enquiry_photos WHERE id = $1 AND enquiry_id = $2',
    [req.params.photoId, req.params.id]
  );
  if (!rows[0]) return res.status(404).end();
  res.set('Content-Type', rows[0].content_type);
  res.send(rows[0].image_bytes);
});

router.patch('/:id', enquiriesAccess, async (req, res) => {
  const { status } = req.body;
  if (!['new', 'contacted', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  await pool.query('UPDATE enquiries SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', enquiriesAccess, async (req, res) => {
  await pool.query('DELETE FROM enquiries WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
