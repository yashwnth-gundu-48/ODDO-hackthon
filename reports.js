const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { enrichAsset, getWarrantyStatus, calculateAssetHealth } = require('../utils/calc');

const router = express.Router();
router.use(requireAuth);

const getAverageHealth = (assets) => {
  if (!assets.length) return 0;
  const scores = assets.map((a) => calculateAssetHealth(a));
  return Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length);
};

const groupCount = (items, keyFn) => {
  const counts = {};
  items.forEach((item) => {
    const key = keyFn(item) || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

// GET /api/reports/summary
router.get('/summary', (req, res) => {
  const assets = db.prepare('SELECT * FROM assets').all();
  const employees = db.prepare('SELECT * FROM employees').all();
  const activities = db.prepare('SELECT * FROM activities ORDER BY timestamp DESC').all();

  const statusCounts = groupCount(assets, (a) => a.status);
  const categoryCounts = groupCount(assets, (a) => a.category);

  const warrantyCounts = { Active: 0, 'Expiring Soon': 0, Expired: 0 };
  assets.forEach((a) => {
    const label = getWarrantyStatus(a).label;
    warrantyCounts[label] = (warrantyCounts[label] || 0) + 1;
  });

  // Department asset distribution — assignments per department
  const departmentCounts = {};
  employees.forEach((e) => {
    const assignedCount = db.prepare('SELECT COUNT(*) AS c FROM assets WHERE assignedTo = ?').get(e.id).c;
    const dept = e.department || 'Unknown';
    departmentCounts[dept] = (departmentCounts[dept] || 0) + assignedCount;
  });

  // Monthly activity for the last 6 months
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-IN', { month: 'short' }) };
  });
  const monthlyCounts = Object.fromEntries(months.map((m) => [m.key, 0]));
  activities.forEach((a) => {
    const d = new Date(a.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in monthlyCounts) monthlyCounts[key] += 1;
  });

  res.json({
    totals: {
      assets: assets.length,
      available: statusCounts.Available || 0,
      assigned: statusCounts.Assigned || 0,
      inRepair: statusCounts['In Repair'] || 0,
      employees: employees.length,
      averageHealth: getAverageHealth(assets),
      warrantyExpiringSoon: warrantyCounts['Expiring Soon'] || 0,
    },
    statusBreakdown: statusCounts,
    categoryDistribution: categoryCounts,
    warrantySummary: warrantyCounts,
    departmentDistribution: departmentCounts,
    monthlyActivity: {
      labels: months.map((m) => m.label),
      values: months.map((m) => monthlyCounts[m.key]),
    },
    assets: assets.map(enrichAsset),
  });
});

module.exports = router;
