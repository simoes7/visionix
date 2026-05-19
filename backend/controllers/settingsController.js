import pool from '../config/db.js';

const DEFAULT_SETTINGS = {
  site_name: 'VISIONIX',
  site_tagline: 'Architectural minimalism in optics.',
  footer_text: 'Designing the future of sight through the lens of pure geometry.',
  site_email: '',
  contact_phone: '',
  whatsapp_number: '',
  contact_address: '',
  currency: 'USD',
  tax_rate: '0.00',
  maintenance_mode: false,
  low_stock_threshold: 10,
  enable_reviews: true,
  enable_wishlist: true,
  social_instagram: '',
  social_twitter: '',
  logo_type: 'text',
  site_logo_url: ''
};

/**
 * GET /api/settings
 */
export const getSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (rows.length === 0) {
      return res.json(DEFAULT_SETTINGS);
    }

    const row = rows[0];
    const settings = {
      site_name: row.store_name || DEFAULT_SETTINGS.site_name,
      site_tagline: row.site_tagline || DEFAULT_SETTINGS.site_tagline,
      footer_text: row.footer_text || DEFAULT_SETTINGS.footer_text,
      site_email: row.store_email || DEFAULT_SETTINGS.site_email,
      contact_phone: row.store_phone || DEFAULT_SETTINGS.contact_phone,
      whatsapp_number: row.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number,
      contact_address: row.store_address || DEFAULT_SETTINGS.contact_address,
      currency: row.currency || DEFAULT_SETTINGS.currency,
      tax_rate: row.tax_rate?.toString() || DEFAULT_SETTINGS.tax_rate,
      maintenance_mode: Boolean(row.maintenance_mode),
      low_stock_threshold: row.low_stock_threshold ?? DEFAULT_SETTINGS.low_stock_threshold,
      enable_reviews: Boolean(row.enable_reviews),
      enable_wishlist: Boolean(row.enable_wishlist),
      social_instagram: row.social_instagram || DEFAULT_SETTINGS.social_instagram,
      social_twitter: row.social_twitter || DEFAULT_SETTINGS.social_twitter,
      logo_type: row.logo_type || DEFAULT_SETTINGS.logo_type,
      site_logo_url: row.site_logo_url || DEFAULT_SETTINGS.site_logo_url
    };

    return res.json(settings);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/settings
 * Update multiple settings at once
 */
export const updateSettings = async (req, res, next) => {
  try {
    const {
      site_name,
      site_tagline,
      footer_text,
      site_email,
      contact_phone,
      whatsapp_number,
      contact_address,
      currency,
      tax_rate,
      maintenance_mode,
      low_stock_threshold,
      enable_reviews,
      enable_wishlist,
      social_instagram,
      social_twitter,
      logo_type,
      site_logo_url
    } = req.body;

    await pool.query(
      `INSERT INTO settings (
         id,
         store_name,
         site_tagline,
         footer_text,
         store_email,
         store_phone,
         whatsapp_number,
         store_address,
         currency,
         tax_rate,
         maintenance_mode,
         low_stock_threshold,
         enable_reviews,
         enable_wishlist,
         social_instagram,
         social_twitter,
         logo_type,
         site_logo_url
       ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         store_name = VALUES(store_name),
         site_tagline = VALUES(site_tagline),
         footer_text = VALUES(footer_text),
         store_email = VALUES(store_email),
         store_phone = VALUES(store_phone),
         whatsapp_number = VALUES(whatsapp_number),
         store_address = VALUES(store_address),
        currency = VALUES(currency),
         tax_rate = VALUES(tax_rate),
         maintenance_mode = VALUES(maintenance_mode),
         low_stock_threshold = VALUES(low_stock_threshold),
         enable_reviews = VALUES(enable_reviews),
         enable_wishlist = VALUES(enable_wishlist),
         social_instagram = VALUES(social_instagram),
         social_twitter = VALUES(social_twitter),
         logo_type = VALUES(logo_type),
         site_logo_url = VALUES(site_logo_url)
      `,
      [
        site_name,
        site_tagline,
        footer_text,
        site_email,
        contact_phone,
        whatsapp_number,
        contact_address,
        currency,
        tax_rate || '0.00',
        maintenance_mode ? 1 : 0,
        low_stock_threshold || 10,
        enable_reviews ? 1 : 0,
        enable_wishlist ? 1 : 0,
        social_instagram,
        social_twitter,
        logo_type || 'text',
        site_logo_url || ''
      ]
    );

    return res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    next(err);
  }
};
