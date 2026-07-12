const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 24').all();
  res.json({
    notifications: rows.map((n) => ({ ...n, unread: Boolean(n.unread) })),
    unreadCount: rows.filter((n) => n.unread).length,
  });
});

// POST /api/notifications/:id/read
router.post('/:id/read', (req, res) => {
  const result = db.prepare('UPDATE notifications SET unread = 0 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Notification not found.' });
  res.json({ success: true });
});

// POST /api/notifications/read-all
router.post('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET unread = 0').run();
  res.json({ success: true });
});

// DELETE /api/notifications  (clear all)
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM notifications').run();
  res.json({ success: true });
});

module.exports = router;
