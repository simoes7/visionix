import pool from '../config/db.js';
import { createNotificationForAdmins, createNotificationForUser } from '../utils/notificationService.js';

/**
 * POST /api/orders  (protected)
 */
export const createOrder = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { items, shipping_address } = req.body;
    const userId = req.user.id;

    // Calculate total
    let total = 0;
    for (const item of items) {
      const [rows] = await conn.query('SELECT price, stock FROM products WHERE id = ?', [item.product_id]);
      if (rows.length === 0) throw new Error(`Product ${item.product_id} not found`);
      if (rows[0].stock < item.quantity) throw new Error(`Insufficient stock for product ${item.product_id}`);
      total += rows[0].price * item.quantity;
    }

    // Create order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)',
      [userId, total, shipping_address, 'pending']
    );
    const orderId = orderResult.insertId;

    // Insert order items & decrement stock
    for (const item of items) {
      const [rows] = await conn.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, rows[0].price]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);

      // If stock drops low, notify admins
      const [pRows] = await conn.query('SELECT stock, name FROM products WHERE id = ?', [item.product_id]);
      const stockLeft = pRows?.[0]?.stock ?? 0;
      if (stockLeft <= 10) {
        await createNotificationForAdmins(
          'Low stock alert',
          `${pRows[0].name} inventory is low (${stockLeft} left).`,
          `/admin/products`,
          'stock'
        );
      }
    }

    await conn.commit();

    // Notify admins of new order
    await createNotificationForAdmins(
      'New order placed',
      `Order #${orderId} placed by ${req.user.name || 'Customer'}.`,
      `/admin/orders`,
      'order'
    );
    return res.status(201).json({ message: 'Order placed', orderId });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * GET /api/orders  (protected — own orders)
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json(orders);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/:id  (protected)
 */
export const getOrderById = async (req, res, next) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

    const [items] = await pool.query(
      `SELECT oi.*, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    return res.json({ ...orders[0], items });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/all  (admin)
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    return res.json(orders);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/orders/:id/status  (admin)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

    // Notify customer of status change
    const [orderRows] = await pool.query('SELECT user_id FROM orders WHERE id = ?', [req.params.id]);
    if (orderRows && orderRows.length > 0) {
      const userId = orderRows[0].user_id;
      await createNotificationForUser(userId, 'Order update', `Your order #${req.params.id} status changed to ${status}.`, `/orders/${req.params.id}`, 'order');
    }

    return res.json({ message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
};
