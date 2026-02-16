-- Rename slot -> component (terminology: slots are now called components)

ALTER TABLE parts RENAME COLUMN slot TO component;
ALTER TABLE build_parts RENAME COLUMN slot TO component;

DROP INDEX IF EXISTS build_parts_build_slot_part_unique;
CREATE UNIQUE INDEX IF NOT EXISTS build_parts_build_component_part_unique ON build_parts(build_id, component, part_id) WHERE part_id IS NOT NULL;
