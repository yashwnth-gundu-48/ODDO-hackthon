# AssetFlow Backend

A REST API backend for the AssetFlow Pro frontend (Odoo Hackathon). Built with
Node.js + Express + SQLite (via `better-sqlite3`) — no external database
server to install, everything lives in a single file at `data/assetflow.db`.

It mirrors the exact data model your frontend already used in `localStorage`
(`assetflow_assets`, `assetflow_employees`, `assetflow_activities`,
`assetflow_notifications`), so switching from localStorage to real API calls
shouldn't change any field names.

## 1. Setup

```bash
cd assetflow-backend
npm install
cp .env.example .env
npm start
```

Server runs at `http://localhost:4000` by default. It seeds itself on first
run with the same sample assets/employees/demo users your frontend already had.

## 2. Demo login accounts (same as before)

| Role     | Email                    | Password     |
|----------|---------------------------|--------------|
| Admin    | admin@assetflow.com       | admin123     |
| Employee | employee@assetflow.com    | employee123  |

## 3. Auth

All routes except `/api/auth/login` and `/api/auth/register` require a JWT:

```
Authorization: Bearer <token>
```

You get the token back from `/api/auth/login`.

## 4. Endpoints

### Auth
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | returns `{ token, user }` |
| POST | `/api/auth/register` | `{ name, email, password }` | "Create Account" button, role defaults to Employee |
| GET | `/api/auth/me` | — | current user from token |

### Assets
| Method | Route | Notes |
|---|---|---|
| GET | `/api/assets?search=&category=&status=` | list + filter |
| GET | `/api/assets/:id` | single asset (includes `healthScore`, `warrantyStatus`, `warrantyRemaining`) |
| GET | `/api/assets/:id/timeline` | activity history for that asset |
| POST | `/api/assets` | create — body matches the "New Asset" form fields |
| PUT | `/api/assets/:id` | update any field |
| DELETE | `/api/assets/:id` | remove |
| POST | `/api/assets/:id/assign` | `{ employeeId }` — must be `Available` |
| POST | `/api/assets/:id/return` | unassign, back to `Available` |

### Employees
| Method | Route | Notes |
|---|---|---|
| GET | `/api/employees?search=&department=&assetFilter=hasAssets\|noAssets` | list + filter |
| GET | `/api/employees/:id` | includes `assignedAssets: [assetId, ...]` |
| POST | `/api/employees` | create |
| PUT | `/api/employees/:id` | update |
| DELETE | `/api/employees/:id` | deletes employee, returns their assets to Available |

### Activities / Notifications
| Method | Route |
|---|---|
| GET | `/api/activities?limit=12` |
| GET | `/api/notifications` |
| POST | `/api/notifications/:id/read` |
| POST | `/api/notifications/read-all` |
| DELETE | `/api/notifications` (clear all) |

### Dashboard & Reports
| Method | Route | Notes |
|---|---|---|
| GET | `/api/dashboard/stats` | powers the 7 dashboard cards + recent activity |
| GET | `/api/reports/summary` | status/category/warranty/department breakdowns + last-6-months activity, for the 4 charts on `reports.html` |

## 5. Wiring up the existing frontend

Your `script.js` currently reads/writes `localStorage` directly via
`getStorage`/`setStorage`. To connect it to this backend, the cleanest path
is to replace those two functions with `fetch` calls to the endpoints above,
and store the JWT (from login) in place of the old `assetflow_user` key.

If you'd like, I can go through `script.js` and rewire it to call this API
instead of localStorage — just say the word and I'll do that next.

## 6. Project structure

```
assetflow-backend/
├── server.js              # entry point
├── db.js                  # schema + seed data
├── middleware/auth.js      # JWT verification
├── utils/calc.js           # health score & warranty calculations (ported from script.js)
├── utils/ids.js             # AST-/EMP- style ID generation
└── routes/
    ├── auth.js
    ├── assets.js
    ├── employees.js
    ├── activities.js
    ├── notifications.js
    ├── reports.js
    └── dashboard.js
```
