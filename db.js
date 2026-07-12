const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'data', 'assetflow.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Employee',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    serial TEXT,
    purchaseDate TEXT,
    warrantyStart TEXT,
    warrantyEnd TEXT,
    location TEXT,
    condition TEXT DEFAULT 'Good',
    status TEXT DEFAULT 'Available',
    maintenanceCount INTEGER DEFAULT 0,
    assignedTo TEXT REFERENCES employees(id) ON DELETE SET NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    department TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    assetId TEXT,
    employeeId TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    assetId TEXT,
    employeeId TEXT,
    unread INTEGER NOT NULL DEFAULT 1,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---- Seed on first run only ----
const assetCount = db.prepare('SELECT COUNT(*) AS c FROM assets').get().c;

if (assetCount === 0) {
  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)`
  );
  const insertAsset = db.prepare(`
    INSERT INTO assets (id, name, category, serial, purchaseDate, warrantyStart, warrantyEnd, location, condition, status, maintenanceCount, assignedTo)
    VALUES (@id, @name, @category, @serial, @purchaseDate, @warrantyStart, @warrantyEnd, @location, @condition, @status, @maintenanceCount, @assignedTo)
  `);
  const insertEmployee = db.prepare(`
    INSERT INTO employees (id, name, role, department, email, phone, location)
    VALUES (@id, @name, @role, @department, @email, @phone, @location)
  `);
  const insertActivity = db.prepare(
    `INSERT INTO activities (message, assetId, timestamp) VALUES (?, ?, ?)`
  );

  const seedTx = db.transaction(() => {
    // Demo login accounts - same as DEMO_USERS in the old frontend script.js
    insertUser.run('USR-1001', 'Administrator', 'admin@assetflow.com', bcrypt.hashSync('admin123', 10), 'Admin');
    insertUser.run('USR-1002', 'Employee User', 'employee@assetflow.com', bcrypt.hashSync('employee123', 10), 'Employee');

    insertEmployee.run({
      id: 'EMP-1001', name: 'Neha Sharma', role: 'Operations Manager', department: 'Operations',
      email: 'neha.sharma@assetflow.com', phone: '+91 98765 43210', location: 'Head Office',
    });
    insertEmployee.run({
      id: 'EMP-1002', name: 'Rohan Patel', role: 'Network Engineer', department: 'Technology',
      email: 'rohan.patel@assetflow.com', phone: '+91 91234 56789', location: 'IT Lab',
    });

    insertAsset.run({
      id: 'AST-1201', name: 'Dell Latitude 5430', category: 'Laptop', serial: 'DL5430-2981',
      purchaseDate: '2023-09-12', warrantyStart: '2023-09-12', warrantyEnd: '2025-09-12',
      location: 'Head Office - 4th Floor', condition: 'Excellent', status: 'Available',
      maintenanceCount: 1, assignedTo: null,
    });
    insertAsset.run({
      id: 'AST-1202', name: 'HP LaserJet Pro M428fdw', category: 'Printer', serial: 'HP-M428-5502',
      purchaseDate: '2024-02-18', warrantyStart: '2024-02-18', warrantyEnd: '2025-02-18',
      location: 'Marketing Team', condition: 'Good', status: 'Assigned',
      maintenanceCount: 2, assignedTo: 'EMP-1002',
    });
    insertAsset.run({
      id: 'AST-1203', name: 'Apple iPad Air', category: 'Tablet', serial: 'IPAD-23-77A',
      purchaseDate: '2024-01-22', warrantyStart: '2024-01-22', warrantyEnd: '2025-01-22',
      location: 'Sales Team', condition: 'Excellent', status: 'Available',
      maintenanceCount: 0, assignedTo: null,
    });
    insertAsset.run({
      id: 'AST-1204', name: 'Lenovo ThinkVision T27i', category: 'Monitor', serial: 'TNV-27T-994',
      purchaseDate: '2023-11-08', warrantyStart: '2023-11-08', warrantyEnd: '2024-11-08',
      location: 'Admin Desk', condition: 'Good', status: 'In Repair',
      maintenanceCount: 3, assignedTo: null,
    });

    const now = Date.now();
    const activities = [
      'HP LaserJet Pro assigned to Rohan Patel.',
      'New Dell Latitude added to inventory.',
      'Lenovo monitor moved to repair queue.',
      'Payroll tablet audited by IT.',
    ];
    activities.forEach((message, index) => {
      insertActivity.run(message, null, new Date(now - index * 60000).toISOString());
    });
  });

  seedTx();
  console.log('Database seeded with demo assets, employees, users, and activity log.');
}

module.exports = db;
