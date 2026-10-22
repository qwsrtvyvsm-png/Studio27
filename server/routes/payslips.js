const express = require('express');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

function cleanEntries(entries) {
  return (Array.isArray(entries) ? entries : [])
    .map((e) => ({
      client: (e.client || '').toString(),
      time: (e.time || '').toString(),
      duration: (e.duration || '').toString(),
      amount: Number(e.amount) || 0
    }))
    .filter((e) => e.client || e.time || e.duration || e.amount);
}

router.get('/by-model/:modelId', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.pay_date AS "payDate", p.created_at AS "createdAt",
            COALESCE(SUM(e.amount), 0) AS total
     FROM payslips p LEFT JOIN payslip_entries e ON e.payslip_id = p.id
     WHERE p.model_id = $1
     GROUP BY p.id ORDER BY p.pay_date DESC, p.id DESC`,
    [req.params.modelId]
  );
  res.json(rows);
});

router.post('/by-model/:modelId', async (req, res) => {
  const b = req.body;
  if (!b.payDate) return res.status(400).json({ error: 'Date is required.' });
  const entries = cleanEntries(b.entries);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO payslips (model_id, pay_date) VALUES ($1, $2) RETURNING id',
      [req.params.modelId, b.payDate]
    );
    const payslipId = rows[0].id;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      await client.query(
        'INSERT INTO payslip_entries (payslip_id, client, time, duration, amount, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
        [payslipId, e.client, e.time, e.duration, e.amount, i]
      );
    }
    await client.query('COMMIT');
    res.json({ id: payslipId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to create payslip', err);
    res.status(500).json({ error: 'Failed to create payslip.' });
  } finally {
    client.release();
  }
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.model_id AS "modelId", p.pay_date AS "payDate", m.name AS "modelName"
     FROM payslips p JOIN models m ON m.id = p.model_id WHERE p.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  const { rows: entries } = await pool.query(
    `SELECT id, client, time, duration, amount FROM payslip_entries
     WHERE payslip_id = $1 ORDER BY sort_order ASC, id ASC`,
    [req.params.id]
  );
  res.json({ ...rows[0], entries });
});

router.put('/:id', async (req, res) => {
  const b = req.body;
  if (!b.payDate) return res.status(400).json({ error: 'Date is required.' });
  const entries = cleanEntries(b.entries);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE payslips SET pay_date = $1 WHERE id = $2', [b.payDate, req.params.id]);
    await client.query('DELETE FROM payslip_entries WHERE payslip_id = $1', [req.params.id]);
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      await client.query(
        'INSERT INTO payslip_entries (payslip_id, client, time, duration, amount, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.params.id, e.client, e.time, e.duration, e.amount, i]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to update payslip', err);
    res.status(500).json({ error: 'Failed to update payslip.' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM payslips WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
