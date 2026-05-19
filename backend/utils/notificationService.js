import pool from '../config/db.js';

export const createNotificationForUser = async (userId, title, message, link = null, type = 'system') => {
  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, message, link]
  );
};

export const createNotificationForAdmins = async (title, message, link = null, type = 'system') => {
  const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
  if (!admins || admins.length === 0) return;
  const values = admins.map(a => [a.id, type, title, message, link]);
  // Bulk insert
  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES ?',
    [values]
  );
};

export default { createNotificationForUser, createNotificationForAdmins };
