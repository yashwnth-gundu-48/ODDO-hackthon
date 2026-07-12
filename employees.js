const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { nextPrefixedId } = require('../utils/ids');

const router = express.Router();
router.use(requireAuth);

const logActivity = (message, assetId = null, employeeId = null) => {
  db.prepare(`INSERT INTO activities (message, assetId, employeeId, timestamp) VALUES (?, ?, ?, ?)`)
    .run(message, assetId, employeeId, new Date().toISOString());
};

const createNotification = ({ type, message, employeeId = null }) => {
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(
    `INSERT INTO notifications (id, type, message, employeeId, unread, timestamp) VALUES (?, ?, ?, ?, 1, ?)`
  ).run(id, type, message, employeeId, new Date().toISOString());
};

const withAssignedAssets = (employee) => {
  const assignedAssets = db.prepare('SELECT id FROM assets WHERE assignedTo = ?').all(employee.id).map((r) => r.id);
  return { ...employee, assignedAssets };
};

const REQUIRED_FIELDS = ['name', 'role', 'department', 'email', 'phone', 'location'];

// GET /api/employees?search=&department=&assetFilter=hasAssets|noAssets
router.get('/', (req, res) => {
  const { search, department, assetFilter } = req.query;
  let rows = db.prepare('SELECT * FROM employees').all().map(withAssignedAssets);

  if (department && department !== 'all') rows = rows.filter((e) => e.department === department);
  if (assetFilter === 'hasAssets') rows = rows.filter((e) => e.assignedAssets.length > 0);
  if (assetFilter === 'noAssets') rows = rows.filter((e) => e.assignedAssets.length === 0);
  if (search) {
    const q = String(search).toLowerCase();
    rows = rows.filter((e) =>
      [e.name, e.id, e.role, e.department, e.email, e.location].some((v) => (v || '').toLowerCase().includes(q))
    );
  }

  res.json({ employees: rows });
});

// GET /api/employees/:id
router.get('/:id', (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });
  res.json({ employee: withAssignedAssets(employee) });
});

// POST /api/employees
router.post('/', (req, res) => {
  const body = req.body || {};
  const missing = REQUIRED_FIELDS.filter((f) => !body[f]);
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  const id = body.id && String(body.id).trim() ? String(body.id).trim() : nextPrefixedId(db, 'employees', 'EMP', 1000);

  const existing = db.prepare('SELECT id FROM employees WHERE id = ?').get(id);
  if (existing) return res.status(409).json({ error: `Employee ID ${id} already exists.` });

  db.prepare(`
    INSERT INTO employees (id, name, role, department, email, phone, location)
    VALUES (@id, @name, @role, @department, @email, @phone, @location)
  `).run({ id, name: body.name, role: body.role, department: body.department, email: body.email, phone: body.phone, location: body.location });

  logActivity(`${body.name} added as a new team member.`, null, id);
  createNotification({ type: 'employee', message: `${body.name} joined ${body.department}.`, employeeId: id });

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  res.status(201).json({ employee: withAssignedAssets(employee) });
});

// PUT /api/employees/:id
router.put('/:id', (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });

  const body = req.body || {};
  const updated = {
    name: body.name ?? employee.name,
    role: body.role ?? employee.role,
    department: body.department ?? employee.department,
    email: body.email ?? employee.email,
    phone: body.phone ?? employee.phone,
    location: body.location ?? employee.location,
  };

  db.prepare(`
    UPDATE employees SET name=@name, role=@role, department=@department, email=@email, phone=@phone, location=@location
    WHERE id=@id
  `).run({ ...updated, id: employee.id });

  const fresh = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee.id);
  res.json({ employee: withAssignedAssets(fresh) });
});

// DELETE /api/employees/:id
router.delete('/:id', (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });

  // Free up any assets assigned to this employee before deleting
  db.prepare(`UPDATE assets SET status='Available', assignedTo=NULL, updatedAt=datetime('now') WHERE assignedTo=?`)
    .run(employee.id);

  db.prepare('DELETE FROM employees WHERE id = ?').run(employee.id);
  logActivity(`${employee.name} removed from directory. Their assets were returned to Available.`, null, employee.id);

  res.json({ success: true });
});

module.exports = router;
