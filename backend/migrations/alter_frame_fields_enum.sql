-- Migration: Convert frame_style and material to ENUM constrained types
-- Run this against your `glassstore` database (make a backup first):
-- mysql -u root -p glassstore < backend/migrations/alter_frame_fields_enum.sql

ALTER TABLE `products`
  MODIFY COLUMN `frame_style` ENUM(
    'Full-Rim','Semi-Rimless / Half-Rim','Rimless','Round','Square','Rectangle','Oval','Aviator','Cat-Eye','Geometric','Hexagonal','Browline','Wayfarer','Clubmaster','Oversized','Wraparound','Shield','Pilot','Butterfly','Navigator','Sport','Retro / Vintage','Transparent / Clear','Thick Frame','Thin Frame'
  ) NOT NULL DEFAULT 'Full-Rim',
  MODIFY COLUMN `material` ENUM(
    'Acetate','TR90','Plastic','Metal','Titanium','Stainless Steel','Aluminum','Memory Metal','Monel','Flexon','Carbon Fiber','Wood','Buffalo Horn','Bamboo','Nylon','Polycarbonate','Ultem','Gold','Silver','Mixed Material','Eco-Friendly / Recycled Materials'
  ) NOT NULL DEFAULT 'Acetate';
