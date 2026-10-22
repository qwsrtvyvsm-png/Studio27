const express = require('express');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, role, status, days, time, display_order
     FROM staff ORDER BY display_order ASC, id ASC`
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const b = req.body;
  if (!b.name) return res.status(400).json({ error: 'Name is required.' });
  const { rows } = await pool.query(
    `INSERT INTO staff (name, role, status, days, time, display_order)
     VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(MAX(display_order), -1) + 1 FROM staff))
     RETURNING id`,
    [b.name, b.role || '', b.status || 'active', Array.isArray(b.days) ? b.days : [], b.time || '']
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
      await client.query('UPDATE staff SET display_order = $1 WHERE id = $2', [i, order[i]]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to reorder staff', err);
    res.status(500).json({ error: 'Failed to reorder staff.' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const b = req.body;
  if (!b.name) return res.status(400).json({ error: 'Name is required.' });
  await pool.query(
    `UPDATE staff SET name=$1, role=$2, status=$3, days=$4, time=$5 WHERE id = $6`,
    [b.name, b.role || '', b.status || 'active', Array.isArray(b.days) ? b.days : [], b.time || '', req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM staff WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
