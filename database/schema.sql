-- ============================================================
--  GlassStore -- MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS glassstore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE glassstore;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  price       DECIMAL(10, 2) NOT NULL,
  stock       INT UNSIGNED NOT NULL DEFAULT 0,
  image_url   VARCHAR(500),
  category_id INT UNSIGNED,
  frame_style VARCHAR(50),
  material    VARCHAR(50),
  frame_width_mm  DECIMAL(5,1) DEFAULT 140.0,
  frame_length_mm DECIMAL(5,1) DEFAULT 45.0,
  colors      JSON NULL,
  sizes       JSON NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  total_amount     DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT NOT NULL,
  status           ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_item_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_item_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT
);

-- Product Images (Gallery)
CREATE TABLE IF NOT EXISTS product_images (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED NOT NULL,
  image_url   VARCHAR(500) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_image_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id                    INT UNSIGNED PRIMARY KEY,
  store_name            VARCHAR(255) DEFAULT 'VISIONIX',
  site_tagline          VARCHAR(255),
  footer_text           TEXT,
  store_email           VARCHAR(255),
  store_phone           VARCHAR(50),
  whatsapp_number       VARCHAR(50),
  store_address         TEXT,
  support_hours         VARCHAR(255),
  currency              VARCHAR(10) DEFAULT 'USD',
  tax_rate              DECIMAL(5, 2) DEFAULT 0,
  maintenance_mode      TINYINT(1) DEFAULT 0,
  low_stock_threshold   INT UNSIGNED DEFAULT 10,
  enable_reviews        TINYINT(1) DEFAULT 1,
  enable_wishlist       TINYINT(1) DEFAULT 1,
  social_instagram      VARCHAR(255),
  social_twitter        VARCHAR(255),
  logo_type             VARCHAR(25) DEFAULT 'text',
  site_logo_url         VARCHAR(500),
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type VARCHAR(50) DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
