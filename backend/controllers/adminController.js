import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: 'Start and end dates required.' });

    // Current Period Filter
    const currentFilter = ' AND created_at BETWEEN ? AND ?';
    const currentParams = [startDate, endDate];

    // Calculate Previous Period (Same duration as current)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.abs(end - start);
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;

    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - diffDays);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStartDateStr = prevStart.toISOString().split('T')[0];
    const prevEndDateStr = prevEnd.toISOString().split('T')[0];
    const prevFilter = ' AND created_at BETWEEN ? AND ?';
    const prevParams = [prevStartDateStr, prevEndDateStr];

    console.log(`Analyzing: Current (${startDate} to ${endDate}) vs Previous (${prevStartDateStr} to ${prevEndDateStr})`);

    const getMetrics = async (filter, params) => {
      const [rev] = await pool.query(`SELECT COALESCE(SUM(total_amount), 0) as val FROM orders WHERE status != 'cancelled' ${filter}`, params);
      const [ord] = await pool.query(`SELECT COUNT(*) as val FROM orders WHERE status != 'cancelled' ${filter}`, params);
      const [aov] = await pool.query(`SELECT COALESCE(AVG(total_amount), 0) as val FROM orders WHERE status != 'cancelled' ${filter}`, params);
      const [cust] = await pool.query(`SELECT COUNT(*) as val FROM users WHERE role = 'customer' ${filter}`, params);
      return {
        revenue: Number(rev[0].val),
        orders: Number(ord[0].val),
        aov: Number(aov[0].val),
        customers: Number(cust[0].val)
      };
    };

    const current = await getMetrics(currentFilter, currentParams);
    const previous = await getMetrics(prevFilter, prevParams);

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    const conversionRate = current.orders > 0
      ? ((current.orders / Math.max(current.customers, 1)) * 100).toFixed(2)
      : 0;

    const [historyRows] = await pool.query(
      `SELECT DATE(created_at) as day,
              COALESCE(SUM(total_amount), 0) AS revenue,
              COUNT(*) AS orders
       FROM orders
       WHERE status != 'cancelled' ${currentFilter}
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at)`,
      currentParams
    );

    const historyMap = new Map(historyRows.map((row) => [row.day, {
      revenue: Number(row.revenue),
      orders: Number(row.orders)
    }]));

    const chartHistory = [];
    const iterDate = new Date(start);
    const finalDate = new Date(end);
    while (iterDate <= finalDate) {
      const dateKey = iterDate.toISOString().split('T')[0];
      const point = historyMap.get(dateKey) || { revenue: 0, orders: 0 };
      chartHistory.push({ date: dateKey, ...point });
      iterDate.setDate(iterDate.getDate() + 1);
    }

    res.json({
      totalRevenue: current.revenue,
      totalOrders: current.orders,
      avgOrderValue: current.aov,
      newCustomers: current.customers,
      conversionRate: Number(conversionRate),
      revenueGrowth: calcGrowth(current.revenue, previous.revenue),
      ordersGrowth: calcGrowth(current.orders, previous.orders),
      aovGrowth: calcGrowth(current.aov, previous.aov),
      customersGrowth: calcGrowth(current.customers, previous.customers),
      conversionGrowth: Number(conversionRate) - Number(((previous.orders > 0 ? (previous.orders / Math.max(previous.customers, 1)) * 100 : 0).toFixed(2))),
      history: chartHistory
    });
  } catch (error) {
    console.error("Dashboard stats fatal error:", error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = ' AND o.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    console.log("Fetching top products with params:", params);

    const [products] = await pool.query(`
      SELECT p.id, p.name, p.image_url, c.name as category_name, 
             SUM(oi.quantity) as total_sold, 
             SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled' ${dateFilter}
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `, params);

    res.json(products);
  } catch (error) {
    console.error("Top products error details:", error);
    res.status(500).json({ message: 'Error fetching top products' });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = ' WHERE o.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    console.log("Fetching recent orders with params:", params);

    const [orders] = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, u.name as customer_name,
             GROUP_CONCAT(p.name SEPARATOR ', ') as ordered_products
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      ${dateFilter}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `, params);

    res.json(orders);
  } catch (error) {
    console.error("Recent orders error details:", error);
    res.status(500).json({ message: 'Error fetching recent orders' });
  }
};

/**
 * GET /api/admin/low-stock
 */
export const getLowStockProducts = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT id, name, stock 
      FROM products 
      WHERE stock < 10 
      ORDER BY stock ASC 
      LIMIT 10
    `);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock products' });
  }
};

/**
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    console.log("Fetching customer registry...");
    const [users] = await pool.query("SELECT id, name, email, role, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC");
    console.log(`Synchronization complete. Found ${users.length} subjects.`);
    res.json(users);
  } catch (error) {
    console.error("Registry synchronization error:", error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

/**
 * POST /api/admin/users
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'customer']
    );
    res.status(201).json({ message: 'User created', userId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Error creating user' });
  }
};

/**
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const userId = req.params.id;

    let sql = 'UPDATE users SET name=?, email=?, role=?';
    const params = [name, email, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      sql += ', password=?';
      params.push(hashedPassword);
    }

    sql += ' WHERE id=?';
    params.push(userId);

    await pool.query(sql, params);
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
};

/**
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

/**
 * GET /api/admin/settings
 */
export const getSettings = async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (settings.length === 0) {
      // Return default settings if none exist
      return res.json({
        storeName: 'VISIONIX',
        storeEmail: '',
        storePhone: '',
        storeAddress: '',
        currency: 'USD',
        taxRate: 0,
        lowStockThreshold: 10,
        enableReviews: true,
        enableWishlist: true
      });
    }
    res.json(settings[0]);
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

/**
 * PUT /api/admin/settings
 */
export const updateSettings = async (req, res) => {
  try {
    const {
      storeName,
      storeEmail,
      storePhone,
      storeAddress,
      currency,
      taxRate,
      lowStockThreshold,
      enableReviews,
      enableWishlist
    } = req.body;

    // Check if settings exist
    const [existing] = await pool.query('SELECT id FROM settings WHERE id = 1');

    if (existing.length === 0) {
      // Insert new settings
      await pool.query(
        `INSERT INTO settings (id, store_name, store_email, store_phone, store_address, currency, tax_rate, low_stock_threshold, enable_reviews, enable_wishlist)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          storeName,
          storeEmail,
          storePhone,
          storeAddress,
          currency,
          taxRate,
          lowStockThreshold,
          enableReviews ? 1 : 0,
          enableWishlist ? 1 : 0
        ]
      );
    } else {
      // Update existing settings
      await pool.query(
        `UPDATE settings 
         SET store_name = ?, store_email = ?, store_phone = ?, store_address = ?, 
             currency = ?, tax_rate = ?, low_stock_threshold = ?, 
             enable_reviews = ?, enable_wishlist = ?
         WHERE id = 1`,
        [
          storeName,
          storeEmail,
          storePhone,
          storeAddress,
          currency,
          taxRate,
          lowStockThreshold,
          enableReviews ? 1 : 0,
          enableWishlist ? 1 : 0
        ]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};
