const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/activities?limit=12
router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 12, 100);
  const rows = db.prepare('SELECT * FROM activities ORDER BY timestamp DESC LIMIT ?').all(limit);
  res.json({ activities: rows });
});

module.exports = router;
