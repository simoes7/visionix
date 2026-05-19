import pool from '../config/db.js';

/**
 * User model — raw SQL helpers.
 * Controllers call these instead of writing SQL inline.
 */

export const findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

export const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

export const createUser = async ({ name, email, password, role = 'customer' }) => {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role]
  );
  return result.insertId;
};

export const updateUser = async (id, fields) => {
  const entries = Object.entries(fields);
  const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, val]) => val);
  await pool.query(`UPDATE users SET ${setClauses} WHERE id = ?`, [...values, id]);
};
