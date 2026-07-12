require('dotenv').config();
const express = require('express');
const cors = require('cors');

const db = require('./db');
const { getWarrantyStatus } = require('./utils/calc');

const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const employeeRoutes = require('./routes/employees');
const activityRoutes = require('./routes/activities');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'assetflow-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 for unmatched API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Seed warranty-expiry notifications on boot, same rule the old frontend used:
// any asset that is Expiring Soon / Expired gets one notification, once.
const ensureWarrantyExpiryNotifications = () => {
  const assets = db.prepare('SELECT * FROM assets').all();
  const existingWarrantyAssetIds = db
    .prepare(`SELECT DISTINCT assetId FROM notifications WHERE type = 'warranty' AND assetId IS NOT NULL`)
    .all()
    .map((r) => r.assetId);

  assets.forEach((asset) => {
    const warranty = getWarrantyStatus(asset);
    if (['Expiring Soon', 'Expired'].includes(warranty.label) && !existingWarrantyAssetIds.includes(asset.id)) {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      db.prepare(
        `INSERT INTO notifications (id, type, message, assetId, unread, timestamp) VALUES (?, 'warranty', ?, ?, 1, ?)`
      ).run(id, `Warranty ${warranty.label.toLowerCase()} for ${asset.name}.`, asset.id, new Date().toISOString());
    }
  });
};

ensureWarrantyExpiryNotifications();

app.listen(PORT, () => {
  console.log(`AssetFlow backend running on http://localhost:${PORT}`);
});
