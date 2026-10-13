const express = require('express');
const multer = require('multer');
const { pool } = require('../db');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter(req, file, cb) {
    cb(null, file.mimetype.startsWith('image/'));
  }
});

router.post('/', upload.array('photos', 10), async (req, res) => {
  const b = req.body;
  if (!b.name || !b.phone) {
    return res.status(400).json({ error: 'Name and mobile are required.' });
  }
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: 'At least one photo is required.' });
  }

  const details = {
    workingName: b.working_name || '',
    days: Array.isArray(b.days) ? b.days : (b.days ? [b.days] : []),
    experience: b.experience || '',
    ageConfirmed: b.age === 'on' || b.age === 'true',
    consent: b.consent === 'on' || b.consent === 'true'
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO enquiries (type, name, email, phone, message, details)
       VALUES ('application', $1, $2, $3, $4, $5) RETURNING id`,
      [b.name, b.email || null, b.phone, b.message || null, details]
    );
    const enquiryId = rows[0].id;
    for (const file of req.files) {
      await client.query(
        'INSERT INTO enquiry_photos (enquiry_id, image_bytes, content_type) VALUES ($1, $2, $3)',
        [enquiryId, file.buffer, file.mimetype]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to save application', err);
    res.status(500).json({ error: 'Something went wrong submitting your application. Please try again.' });
  } finally {
    client.release();
  }
});

module.exports = router;
