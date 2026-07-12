// Generates readable, prefixed IDs consistent with the sample data style
// (AST-1201, EMP-1001, notif-...) instead of raw UUIDs.

const nextPrefixedId = (db, table, prefix, startAt = 1000) => {
  const row = db.prepare(`SELECT id FROM ${table} WHERE id LIKE ? ORDER BY id DESC`).all(`${prefix}-%`);
  let max = startAt;
  row.forEach((r) => {
    const num = parseInt(String(r.id).split('-')[1], 10);
    if (!Number.isNaN(num) && num > max) max = num;
  });
  return `${prefix}-${max + 1}`;
};

const notificationId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

module.exports = { nextPrefixedId, notificationId };
