-- Add frame dimensions to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS frame_width_mm DECIMAL(5,1) DEFAULT 140.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS frame_length_mm DECIMAL(5,1) DEFAULT 45.0;

-- Verify columns were added
SHOW COLUMNS FROM products WHERE Field IN ('frame_width_mm', 'frame_length_mm');
