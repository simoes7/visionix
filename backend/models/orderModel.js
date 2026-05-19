import pool from '../config/db.js';

export const create = async ({ user_id, total_amount, shipping_address }) => {
  const [result] = await pool.query(
    'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)',
    [user_id, total_amount, shipping_address, 'pending']
  );
  return result.insertId;
};

export const addItem = async ({ order_id, product_id, quantity, unit_price }) => {
  await pool.query(
    'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
    [order_id, product_id, quantity, unit_price]
  );
};

export const findByUser = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

export const findById = async (id) => {
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  return orders[0] || null;
};

export const findItemsByOrderId = async (orderId) => {
  const [rows] = await pool.query(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return rows;
};

export const updateStatus = async (id, status) => {
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
};
