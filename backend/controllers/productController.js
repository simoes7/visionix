import pool from '../config/db.js';
import { FRAME_STYLES, FRAME_MATERIALS } from '../constants/frameOptions.js';

const ALLOWED_CATEGORY_SLUGS = ['optical', 'sunglasses', 'accessoires'];
const ALLOWED_CATEGORIES = [
  { name: 'Optical', slug: 'optical' },
  { name: 'Sunglasses', slug: 'sunglasses' },
  { name: 'Accessoires', slug: 'accessoires' }
];

const resolveLookupId = async (connection, table, id, name) => {
  if (id) {
    const [[row]] = await connection.query(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`, [id]);
    if (row) return row.id;
  }
  if (name) {
    const [[row]] = await connection.query(`SELECT id FROM ${table} WHERE LOWER(name) = LOWER(?) LIMIT 1`, [name]);
    if (row) return row.id;
  }
  const [[defaultRow]] = await connection.query(`SELECT id FROM ${table} ORDER BY id LIMIT 1`);
  return defaultRow?.id || null;
};

/**
 * GET /api/products
 * Supports: ?category=&search=&page=&limit=
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const { 
      category, 
      search, 
      frame_style, 
      material, 
      min_price, 
      max_price, 
      sort, 
      page = 1, 
      limit = 12 
    } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*, c.name AS category_name, GROUP_CONCAT(pi.image_url) as gallery_images,
        COALESCE(fs.name, p.frame_style) AS frame_style, COALESCE(m.name, p.material) AS material
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN frame_styles fs ON p.frame_style_id = fs.id
      LEFT JOIN materials m ON p.material_id = m.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (category) { sql += ' AND c.slug = ?'; params.push(category); }
    if (search)   { sql += ' AND p.name LIKE ?'; params.push(`%${search}%`); }
    // ... filtering continues ...
    
    // We need to add the GROUP BY before the ORDER BY
    let groupBy = ' GROUP BY p.id';
    
    // (I'll reconstruct the query building for clarity)
    if (frame_style) {
      const styles = frame_style.split(',');
      sql += ` AND COALESCE(fs.name, p.frame_style) IN (${styles.map(() => '?').join(',')})`;
      params.push(...styles);
    }
    if (material) {
      const materials = material.split(',');
      sql += ` AND COALESCE(m.name, p.material) IN (${materials.map(() => '?').join(',')})`;
      params.push(...materials);
    }
    if (min_price) { sql += ' AND p.price >= ?'; params.push(Number(min_price)); }
    if (max_price) { sql += ' AND p.price <= ?'; params.push(Number(max_price)); }

    sql += groupBy;

    // Sorting logic
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY p.price DESC';
        break;
      case 'newest':
        sql += ' ORDER BY p.created_at DESC';
        break;
      default:
        sql += ' ORDER BY p.created_at DESC';
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);
    const products = rows.map(p => {
      let parsedColors = [];
      let parsedSizes = [];
      try { parsedColors = typeof p.colors === 'string' ? JSON.parse(p.colors) : (p.colors || []); } catch(e) {}
      try { parsedSizes = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : (p.sizes || []); } catch(e) {}
      
      return {
        ...p,
        colors: parsedColors,
        sizes: parsedSizes,
        images: p.gallery_images ? p.gallery_images.split(',') : (p.image_url ? [p.image_url] : [])
      };
    });

    // Also get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN frame_styles fs ON p.frame_style_id = fs.id
      LEFT JOIN materials m ON p.material_id = m.id
      WHERE p.is_active = 1
    `;
    const countParams = [];
    if (category) { countSql += ' AND c.slug = ?'; countParams.push(category); }
    if (search)   { countSql += ' AND p.name LIKE ?'; countParams.push(`%${search}%`); }
    if (frame_style) {
      const styles = frame_style.split(',');
      countSql += ` AND COALESCE(fs.name, p.frame_style) IN (${styles.map(() => '?').join(',')})`;
      countParams.push(...styles);
    }
    if (material) {
      const materials = material.split(',');
      countSql += ` AND COALESCE(m.name, p.material) IN (${materials.map(() => '?').join(',')})`;
      countParams.push(...materials);
    }
    if (min_price) { countSql += ' AND p.price >= ?'; countParams.push(Number(min_price)); }
    if (max_price) { countSql += ' AND p.price <= ?'; countParams.push(Number(max_price)); }

    const [[{ total }]] = await pool.query(countSql, countParams);

    return res.json({ 
      products, 
      total,
      page: Number(page), 
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    await pool.query(
      `INSERT IGNORE INTO categories (name, slug) VALUES (?, ?), (?, ?), (?, ?)`,
      [
        ALLOWED_CATEGORIES[0].name, ALLOWED_CATEGORIES[0].slug,
        ALLOWED_CATEGORIES[1].name, ALLOWED_CATEGORIES[1].slug,
        ALLOWED_CATEGORIES[2].name, ALLOWED_CATEGORIES[2].slug,
      ]
    );

    const [rows] = await pool.query(
      `SELECT * FROM categories
       WHERE slug IN (?, ?, ?)
       ORDER BY FIELD(slug, ?, ?, ?)`,
      [...ALLOWED_CATEGORY_SLUGS, ...ALLOWED_CATEGORY_SLUGS]
    );
    return res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, COALESCE(fs.name, p.frame_style) AS frame_style, COALESCE(m.name, p.material) AS material
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN frame_styles fs ON p.frame_style_id = fs.id
       LEFT JOIN materials m ON p.material_id = m.id
       WHERE p.id = ? AND p.is_active = 1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    
    const product = rows[0];
    const [imgRows] = await pool.query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
    product.images = imgRows.map(r => r.image_url);
    if (product.images.length === 0 && product.image_url) {
       product.images = [product.image_url];
    }

    try { product.colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : (product.colors || []); } catch(e) { product.colors = []; }
    try { product.sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : (product.sizes || []); } catch(e) { product.sizes = []; }


    return res.json(product);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products  (admin)
 */
export const createProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, description, price, stock, category_id, images, frame_style, material, frame_style_id, material_id, frame_width_mm, frame_length_mm, colors, sizes } = req.body;

    const resolvedFrameStyleId = await resolveLookupId(connection, 'frame_styles', frame_style_id, frame_style);
    const resolvedMaterialId = await resolveLookupId(connection, 'materials', material_id, material);

    if (!resolvedFrameStyleId || !resolvedMaterialId) {
      throw new Error('Unable to resolve frame style or material. Please verify metadata exists.');
    }

    const [result] = await connection.query(
      'INSERT INTO products (name, description, price, stock, category_id, image_url, frame_style, material, frame_style_id, material_id, frame_width_mm, frame_length_mm, colors, sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, stock, category_id, images?.[0] || '', frame_style || null, material || null, resolvedFrameStyleId, resolvedMaterialId, frame_width_mm || 140.0, frame_length_mm || 45.0, JSON.stringify(colors || []), JSON.stringify(sizes || [])]
    );
    
    const productId = result.insertId;

    if (images && images.length > 0) {
      const imgValues = images.map(img => [productId, img]);
      await connection.query('INSERT INTO product_images (product_id, image_url) VALUES ?', [imgValues]);
    }

    await connection.commit();
    return res.status(201).json({ message: 'Product created', productId });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/products/:id  (admin)
 */
export const updateProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, description, price, stock, category_id, images, is_active, frame_style, material, frame_style_id, material_id, frame_width_mm, frame_length_mm, colors, sizes } = req.body;
    const productId = req.params.id;

    const resolvedFrameStyleIdU = await resolveLookupId(connection, 'frame_styles', frame_style_id, frame_style);
    const resolvedMaterialIdU = await resolveLookupId(connection, 'materials', material_id, material);

    if (!resolvedFrameStyleIdU || !resolvedMaterialIdU) {
      throw new Error('Unable to resolve frame style or material. Please verify metadata exists.');
    }

    await connection.query(
      'UPDATE products SET name=?, description=?, price=?, stock=?, category_id=?, image_url=?, is_active=?, frame_style=?, material=?, frame_style_id=?, material_id=?, frame_width_mm=?, frame_length_mm=?, colors=?, sizes=? WHERE id=?',
      [name, description, price, stock, category_id, images?.[0] || '', is_active, frame_style || null, material || null, resolvedFrameStyleIdU, resolvedMaterialIdU, frame_width_mm || 140.0, frame_length_mm || 45.0, JSON.stringify(colors || []), JSON.stringify(sizes || []), productId]
    );

    // Refresh images
    if (images && Array.isArray(images)) {
      await connection.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
      if (images.length > 0) {
        const imgValues = images.map(img => [productId, img]);
        await connection.query('INSERT INTO product_images (product_id, image_url) VALUES ?', [imgValues]);
      }
    }

    await connection.commit();
    return res.json({ message: 'Product updated' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

/**
 * DELETE /api/products/:id  (admin — soft delete)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Product removed' });
  } catch (err) {
    next(err);
  }
};
