const express = require('express');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT data FROM site_settings WHERE id = 1');
  res.json(rows[0] ? rows[0].data : {});
});

router.put('/', async (req, res) => {
  await pool.query(
    `INSERT INTO site_settings (id, data) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET data = $1`,
    [req.body]
  );
  res.json({ ok: true });
});

module.exports = router;
