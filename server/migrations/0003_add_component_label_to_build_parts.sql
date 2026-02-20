-- Preserve "additional component" row label when user adds a custom part (name/weight/price) to that row.
ALTER TABLE build_parts ADD COLUMN component_label TEXT;
