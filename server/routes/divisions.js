const express = require('express');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM divisions ORDER BY name ASC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Name is required.' });
  const { rows } = await pool.query(
    'INSERT INTO divisions (name) VALUES ($1) RETURNING id',
    [req.body.name]
  );
  res.json({ id: rows[0].id });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM divisions WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
