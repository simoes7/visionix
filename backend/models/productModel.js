import pool from '../config/db.js';

export const findAll = async ({ categoryId, search, limit = 12, offset = 0 } = {}) => {
  let sql = `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  const params = [];
  if (categoryId) { sql += ' AND p.category_id = ?'; params.push(categoryId); }
  if (search)     { sql += ' AND p.name LIKE ?'; params.push(`%${search}%`); }
  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
};

export const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? AND p.is_active = 1`,
    [id]
  );
  return rows[0] || null;
};

export const create = async (data) => {
  const { name, description, price, stock, category_id, image_url, frame_style, material, frame_width_mm, frame_length_mm } = data;
  const [result] = await pool.query(
    'INSERT INTO products (name, description, price, stock, category_id, image_url, frame_style, material, frame_width_mm, frame_length_mm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description, price, stock, category_id, image_url, frame_style, material, frame_width_mm || 140.0, frame_length_mm || 45.0]
  );
  return result.insertId;
};

export const update = async (id, data) => {
  const entries = Object.entries(data);
  const set = entries.map(([k]) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE products SET ${set} WHERE id = ?`, [...entries.map(([, v]) => v), id]);
};

export const softDelete = async (id) => {
  await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
};
