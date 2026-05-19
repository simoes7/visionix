-- Migration: Convert ENUM columns into lookup tables and reference by id
-- WARNING: backup your database before running.

START TRANSACTION;

-- 1) Create lookup tables
CREATE TABLE IF NOT EXISTS frame_styles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) Populate lookup tables with canonical values (idempotent)
INSERT IGNORE INTO frame_styles (name) VALUES
('Full-Rim'),('Semi-Rimless / Half-Rim'),('Rimless'),('Round'),('Square'),('Rectangle'),('Oval'),('Aviator'),('Cat-Eye'),('Geometric'),('Hexagonal'),('Browline'),('Wayfarer'),('Clubmaster'),('Oversized'),('Wraparound'),('Shield'),('Pilot'),('Butterfly'),('Navigator'),('Sport'),('Retro / Vintage'),('Transparent / Clear'),('Thick Frame'),('Thin Frame');

INSERT IGNORE INTO materials (name) VALUES
('Acetate'),('TR90'),('Plastic'),('Metal'),('Titanium'),('Stainless Steel'),('Aluminum'),('Memory Metal'),('Monel'),('Flexon'),('Carbon Fiber'),('Wood'),('Buffalo Horn'),('Bamboo'),('Nylon'),('Polycarbonate'),('Ultem'),('Gold'),('Silver'),('Mixed Material'),('Eco-Friendly / Recycled Materials');

-- 3) Add new foreign-key columns to products
ALTER TABLE products
  ADD COLUMN frame_style_id INT NULL AFTER frame_style,
  ADD COLUMN material_id INT NULL AFTER material;

-- 4) Populate the new id columns by matching existing enum names
-- Use explicit COLLATE to avoid collation mismatch errors when comparing enum values
UPDATE products p
LEFT JOIN frame_styles fs ON fs.name COLLATE utf8mb4_general_ci = p.frame_style COLLATE utf8mb4_general_ci
SET p.frame_style_id = fs.id
WHERE p.frame_style IS NOT NULL;

UPDATE products p
LEFT JOIN materials m ON m.name COLLATE utf8mb4_general_ci = p.material COLLATE utf8mb4_general_ci
SET p.material_id = m.id
WHERE p.material IS NOT NULL;

-- 5) Ensure defaults exist and set NOT NULL with default ids
SET @default_frame_style = (SELECT id FROM frame_styles WHERE name = 'Full-Rim' LIMIT 1);
SET @default_material = (SELECT id FROM materials WHERE name = 'Acetate' LIMIT 1);

UPDATE products SET frame_style_id = @default_frame_style WHERE frame_style_id IS NULL;
UPDATE products SET material_id = @default_material WHERE material_id IS NULL;

ALTER TABLE products
  MODIFY COLUMN frame_style_id INT NOT NULL,
  MODIFY COLUMN material_id INT NOT NULL;

-- 6) Add foreign key constraints
ALTER TABLE products
  ADD CONSTRAINT fk_products_frame_style FOREIGN KEY (frame_style_id) REFERENCES frame_styles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_products_material FOREIGN KEY (material_id) REFERENCES materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- 7) Optional: keep old enum columns for a while, or drop them. We'll drop to normalize.
ALTER TABLE products
  DROP COLUMN frame_style,
  DROP COLUMN material;

COMMIT;

-- End migration
