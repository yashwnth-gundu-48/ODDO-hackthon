const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getWarrantyStatus, calculateAssetHealth } = require('../utils/calc');

const router = express.Router();
router.use(requireAuth);

const getAverageHealth = (assets) => {
  if (!assets.length) return 0;
  const scores = assets.map((a) => calculateAssetHealth(a));
  return Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length);
};

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  const assets = db.prepare('SELECT * FROM assets').all();
  const employees = db.prepare('SELECT * FROM employees').all();
  const recentActivity = db.prepare('SELECT * FROM activities ORDER BY timestamp DESC LIMIT 6').all();

  const stats = {
    total: assets.length,
    available: assets.filter((a) => a.status === 'Available').length,
    assigned: assets.filter((a) => a.status === 'Assigned').length,
    pending: assets.filter((a) => a.status === 'In Repair').length,
    employees: employees.length,
    categories: new Set(assets.map((a) => a.category)).size,
    averageHealth: getAverageHealth(assets),
    warrantyExpiringSoon: assets.filter((a) => getWarrantyStatus(a).label === 'Expiring Soon').length,
  };

  const unreadCount = db.prepare('SELECT COUNT(*) AS c FROM notifications WHERE unread = 1').get().c;

  res.json({ stats, recentActivity, unreadNotifications: unreadCount });
});

module.exports = router;
