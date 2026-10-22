const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/site', async (req, res) => {
  const { rows } = await pool.query('SELECT data FROM site_settings WHERE id = 1');
  res.json(rows[0] ? rows[0].data : {});
});

router.get('/models', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, age, ethnicity, size, intro, about, days, time, is_new AS "isNew"
     FROM models WHERE status = 'active' ORDER BY display_order ASC, id ASC`
  );

  const ids = rows.map((r) => r.id);
  const photosByModel = {};
  if (ids.length) {
    const { rows: photoRows } = await pool.query(
      `SELECT id, model_id FROM model_photos WHERE model_id = ANY($1) ORDER BY sort_order ASC, id ASC`,
      [ids]
    );
    photoRows.forEach((p) => {
      if (!photosByModel[p.model_id]) photosByModel[p.model_id] = [];
      photosByModel[p.model_id].push(`/api/public/models/${p.model_id}/photos/${p.id}`);
    });
  }

  res.json(
    rows.map((m) => ({
      ...m,
      photo: (photosByModel[m.id] && photosByModel[m.id][0]) || '',
      photos: photosByModel[m.id] || []
    }))
  );
});

router.get('/models/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, age, ethnicity, size, intro, about, days, time, is_new AS "isNew"
     FROM models WHERE id = $1 AND status = 'active'`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  const { rows: photoRows } = await pool.query(
    'SELECT id FROM model_photos WHERE model_id = $1 ORDER BY sort_order ASC, id ASC',
    [req.params.id]
  );
  const photos = photoRows.map((p) => `/api/public/models/${req.params.id}/photos/${p.id}`);

  res.json({ ...rows[0], photo: photos[0] || '', photos });
});

router.get('/models/:modelId/photos/:photoId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT image_bytes, content_type FROM model_photos WHERE id = $1 AND model_id = $2',
    [req.params.photoId, req.params.modelId]
  );
  if (!rows[0]) return res.status(404).end();
  res.set('Content-Type', rows[0].content_type);
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(rows[0].image_bytes);
});

module.exports = router;
