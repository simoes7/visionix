-- Normalize categories so only the approved architectural categories remain.
-- This inserts the three allowed categories if they do not exist,
-- remaps any product in an unsupported category to Accessoires,
-- then removes all other category rows.

INSERT IGNORE INTO categories (name, slug) VALUES
  ('Optical', 'optical'),
  ('Sunglasses', 'sunglasses'),
  ('Accessoires', 'accessoires');

SET @accessoires_id = (SELECT id FROM categories WHERE slug = 'accessoires');

UPDATE products p
LEFT JOIN categories c ON p.category_id = c.id
SET p.category_id = @accessoires_id
WHERE p.category_id IS NULL
   OR c.slug NOT IN ('optical', 'sunglasses', 'accessoires');

DELETE FROM categories
WHERE slug NOT IN ('optical', 'sunglasses', 'accessoires');
