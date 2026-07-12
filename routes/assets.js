const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { enrichAsset } = require('../utils/calc');
const { nextPrefixedId } = require('../utils/ids');

const router = express.Router();
router.use(requireAuth);

const logActivity = (message, assetId = null, employeeId = null) => {
  db.prepare(`INSERT INTO activities (message, assetId, employeeId, timestamp) VALUES (?, ?, ?, ?)`)
    .run(message, assetId, employeeId, new Date().toISOString());
};

const createNotification = ({ type, message, assetId = null, employeeId = null }) => {
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(
    `INSERT INTO notifications (id, type, message, assetId, employeeId, unread, timestamp) VALUES (?, ?, ?, ?, ?, 1, ?)`
  ).run(id, type, message, assetId, employeeId, new Date().toISOString());
  return id;
};

const REQUIRED_FIELDS = ['name', 'category', 'serial', 'purchaseDate', 'warrantyStart', 'warrantyEnd', 'location', 'condition', 'status'];

// GET /api/assets?search=&category=&status=
router.get('/', (req, res) => {
  const { search, category, status } = req.query;
  let rows = db.prepare('SELECT * FROM assets').all();

  if (category && category !== 'all') rows = rows.filter((a) => a.category === category);
  if (status && status !== 'all') rows = rows.filter((a) => a.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    rows = rows.filter((a) =>
      [a.name, a.id, a.category, a.location].some((v) => (v || '').toLowerCase().includes(q))
    );
  }

  res.json({ assets: rows.map(enrichAsset) });
});

// GET /api/assets/:id
router.get('/:id', (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });
  res.json({ asset: enrichAsset(asset) });
});

// GET /api/assets/:id/timeline
router.get('/:id/timeline', (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const rows = db.prepare('SELECT * FROM activities ORDER BY timestamp ASC').all();
  const nameLower = asset.name.toLowerCase();
  const idLower = asset.id.toLowerCase();

  const timeline = rows
    .filter((a) => a.assetId === asset.id || a.message.toLowerCase().includes(idLower) || a.message.toLowerCase().includes(nameLower))
    .map((a) => ({ timestamp: a.timestamp, message: a.message }));

  res.json({ timeline });
});

// POST /api/assets
router.post('/', (req, res) => {
  const body = req.body || {};
  const missing = REQUIRED_FIELDS.filter((f) => !body[f]);
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  const id = body.id && String(body.id).trim() ? String(body.id).trim() : nextPrefixedId(db, 'assets', 'AST', 1200);

  const existing = db.prepare('SELECT id FROM assets WHERE id = ?').get(id);
  if (existing) return res.status(409).json({ error: `Asset ID ${id} already exists.` });

  db.prepare(`
    INSERT INTO assets (id, name, category, serial, purchaseDate, warrantyStart, warrantyEnd, location, condition, status, maintenanceCount, assignedTo)
    VALUES (@id, @name, @category, @serial, @purchaseDate, @warrantyStart, @warrantyEnd, @location, @condition, @status, @maintenanceCount, @assignedTo)
  `).run({
    id,
    name: body.name,
    category: body.category,
    serial: body.serial,
    purchaseDate: body.purchaseDate,
    warrantyStart: body.warrantyStart,
    warrantyEnd: body.warrantyEnd,
    location: body.location,
    condition: body.condition,
    status: body.status,
    maintenanceCount: Number(body.maintenanceCount || 0),
    assignedTo: body.assignedTo || null,
  });

  logActivity(`New ${body.name} added to inventory.`, id);

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
  res.status(201).json({ asset: enrichAsset(asset) });
});

// PUT /api/assets/:id
router.put('/:id', (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  const body = req.body || {};
  const updated = {
    name: body.name ?? asset.name,
    category: body.category ?? asset.category,
    serial: body.serial ?? asset.serial,
    purchaseDate: body.purchaseDate ?? asset.purchaseDate,
    warrantyStart: body.warrantyStart ?? asset.warrantyStart,
    warrantyEnd: body.warrantyEnd ?? asset.warrantyEnd,
    location: body.location ?? asset.location,
    condition: body.condition ?? asset.condition,
    status: body.status ?? asset.status,
    maintenanceCount: body.maintenanceCount !== undefined ? Number(body.maintenanceCount) : asset.maintenanceCount,
    assignedTo: body.assignedTo !== undefined ? body.assignedTo : asset.assignedTo,
  };

  db.prepare(`
    UPDATE assets SET name=@name, category=@category, serial=@serial, purchaseDate=@purchaseDate,
      warrantyStart=@warrantyStart, warrantyEnd=@warrantyEnd, location=@location, condition=@condition,
      status=@status, maintenanceCount=@maintenanceCount, assignedTo=@assignedTo, updatedAt=datetime('now')
    WHERE id=@id
  `).run({ ...updated, id: asset.id });

  if (updated.status !== asset.status) {
    logActivity(`${updated.name} status changed to ${updated.status}.`, asset.id);
    if (updated.status === 'In Repair') {
      logActivity(`${updated.name} moved to repair queue.`, asset.id);
    }
  }

  const fresh = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset.id);
  res.json({ asset: enrichAsset(fresh) });
});

// DELETE /api/assets/:id
router.delete('/:id', (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  db.prepare('DELETE FROM assets WHERE id = ?').run(asset.id);
  logActivity(`${asset.name} removed from inventory.`, asset.id);

  res.json({ success: true });
});

// POST /api/assets/:id/assign  { employeeId }
router.post('/:id/assign', (req, res) => {
  const { employeeId } = req.body || {};
  if (!employeeId) return res.status(400).json({ error: 'employeeId is required.' });

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });
  if (asset.status !== 'Available') return res.status(400).json({ error: 'Only available assets can be assigned.' });

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });

  db.prepare(`UPDATE assets SET status='Assigned', assignedTo=?, updatedAt=datetime('now') WHERE id=?`)
    .run(employeeId, asset.id);

  logActivity(`${asset.name} assigned to ${employee.name}.`, asset.id, employeeId);
  createNotification({
    type: 'assigned',
    message: `${asset.name} assigned to ${employee.name}.`,
    assetId: asset.id,
    employeeId,
  });

  const fresh = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset.id);
  res.json({ asset: enrichAsset(fresh) });
});

// POST /api/assets/:id/return
router.post('/:id/return', (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });
  if (!asset.assignedTo) return res.status(400).json({ error: 'Asset is not currently assigned.' });

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(asset.assignedTo);

  db.prepare(`UPDATE assets SET status='Available', assignedTo=NULL, updatedAt=datetime('now') WHERE id=?`)
    .run(asset.id);

  logActivity(`${asset.name} returned by ${employee ? employee.name : 'employee'}.`, asset.id);
  createNotification({
    type: 'returned',
    message: `${asset.name} returned by ${employee ? employee.name : 'employee'}.`,
    assetId: asset.id,
  });

  const fresh = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset.id);
  res.json({ asset: enrichAsset(fresh) });
});

module.exports = router;
