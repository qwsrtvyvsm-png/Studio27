const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter(req, file, cb) {
    cb(null, file.mimetype.startsWith('image/'));
  }
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, division_id, status, age, ethnicity, size, intro, about, days, time, is_new AS "isNew", display_order
     FROM models ORDER BY display_order ASC, id ASC`
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const b = req.body;
  if (!b.name) return res.status(400).json({ error: 'Name is required.' });
  const { rows } = await pool.query(
    `INSERT INTO models (name, division_id, status, age, ethnicity, size, intro, about, days, time, is_new, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, (SELECT COALESCE(MAX(display_order), -1) + 1 FROM models))
     RETURNING id`,
    [
      b.name,
      b.division_id || null,
      b.status || 'active',
      b.age || null,
      b.ethnicity || '',
      b.size || '',
      b.intro || '',
      b.about || '',
      Array.isArray(b.days) ? b.days : [],
      b.time || '',
      !!b.isNew
    ]
  );
  res.json({ id: rows[0].id });
});

// Must come before '/:id' so it isn't swallowed by the id param route.
router.put('/reorder', async (req, res) => {
  const order = Array.isArray(req.body.order) ? req.body.order : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < order.length; i++) {
      await client.query('UPDATE models SET display_order = $1 WHERE id = $2', [i, order[i]]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to reorder models', err);
    res.status(500).json({ error: 'Failed to reorder models.' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const b = req.body;
  if (!b.name) return res.status(400).json({ error: 'Name is required.' });
  await pool.query(
    `UPDATE models SET name=$1, division_id=$2, status=$3, age=$4, ethnicity=$5, size=$6, intro=$7, about=$8, days=$9, time=$10, is_new=$11
     WHERE id = $12`,
    [
      b.name,
      b.division_id || null,
      b.status || 'active',
      b.age || null,
      b.ethnicity || '',
      b.size || '',
      b.intro || '',
      b.about || '',
      Array.isArray(b.days) ? b.days : [],
      b.time || '',
      !!b.isNew,
      req.params.id
    ]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM models WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

router.get('/:id/photos', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, sort_order AS "sortOrder" FROM model_photos WHERE model_id = $1 ORDER BY sort_order ASC, id ASC',
    [req.params.id]
  );
  res.json(rows);
});

router.post('/:id/photos', upload.array('photos', 10), async (req, res) => {
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: 'No photos received.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS max FROM model_photos WHERE model_id = $1',
      [req.params.id]
    );
    let next = rows[0].max + 1;
    for (const file of req.files) {
      await client.query(
        'INSERT INTO model_photos (model_id, image_bytes, content_type, sort_order) VALUES ($1, $2, $3, $4)',
        [req.params.id, file.buffer, file.mimetype, next++]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to upload photos', err);
    res.status(500).json({ error: 'Failed to upload photos.' });
  } finally {
    client.release();
  }
});

router.put('/:modelId/photos/reorder', async (req, res) => {
  const order = Array.isArray(req.body.order) ? req.body.order : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < order.length; i++) {
      await client.query(
        'UPDATE model_photos SET sort_order = $1 WHERE id = $2 AND model_id = $3',
        [i, order[i], req.params.modelId]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to reorder photos', err);
    res.status(500).json({ error: 'Failed to reorder photos.' });
  } finally {
    client.release();
  }
});

router.delete('/:modelId/photos/:photoId', async (req, res) => {
  await pool.query('DELETE FROM model_photos WHERE id = $1 AND model_id = $2', [
    req.params.photoId,
    req.params.modelId
  ]);
  res.json({ ok: true });
});

router.get('/:modelId/photos/:photoId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT image_bytes, content_type FROM model_photos WHERE id = $1 AND model_id = $2',
    [req.params.photoId, req.params.modelId]
  );
  if (!rows[0]) return res.status(404).end();
  res.set('Content-Type', rows[0].content_type);
  res.send(rows[0].image_bytes);
});

module.exports = router;
