import pool from '../config/db.js';

/**
 * GET /api/content/:pageName
 * Fetch all content for a specific page
 */
export const getPageContent = async (req, res, next) => {
  try {
    const { pageName } = req.params;
    const [rows] = await pool.query(
      'SELECT section_key, content_value, content_type FROM page_content WHERE page_name = ?',
      [pageName]
    );
    
    // Transform rows into a key-value object
    const content = rows.reduce((acc, row) => {
      acc[row.section_key] = row.content_value;
      return acc;
    }, {});
    
    res.json(content);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/content/:pageName
 * Update content for a specific page
 */
export const updatePageContent = async (req, res, next) => {
  try {
    const { pageName } = req.params;
    const updates = req.body; // Expecting { section_key: content_value, ... }

    for (const [key, value] of Object.entries(updates)) {
      const [existing] = await pool.query(
        'SELECT id FROM page_content WHERE page_name = ? AND section_key = ?',
        [pageName, key]
      );
      
      const contentType = key.endsWith('image') ? 'image' : 'text';
      
      if (existing.length > 0) {
        await pool.query(
          'UPDATE page_content SET content_value = ? WHERE page_name = ? AND section_key = ?',
          [value, pageName, key]
        );
      } else {
        await pool.query(
          'INSERT INTO page_content (page_name, section_key, content_type, content_value) VALUES (?, ?, ?, ?)',
          [pageName, key, contentType, value]
        );
      }
    }

    res.json({ message: `${pageName} content updated successfully.` });
  } catch (err) {
    next(err);
  }
};
