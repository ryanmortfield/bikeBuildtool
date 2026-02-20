-- Option A: build-scoped categories, slots, groups; build_parts reference slot.

CREATE TABLE IF NOT EXISTS build_categories (
  id TEXT PRIMARY KEY,
  build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS build_categories_build_id_idx ON build_categories(build_id);

CREATE TABLE IF NOT EXISTS build_groups (
  id TEXT PRIMARY KEY,
  build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES build_categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS build_groups_build_id_idx ON build_groups(build_id);
CREATE INDEX IF NOT EXISTS build_groups_category_id_idx ON build_groups(category_id);

CREATE TABLE IF NOT EXISTS build_slots (
  id TEXT PRIMARY KEY,
  build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES build_categories(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES build_groups(id) ON DELETE SET NULL,
  component_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS build_slots_build_id_idx ON build_slots(build_id);
CREATE INDEX IF NOT EXISTS build_slots_category_id_idx ON build_slots(category_id);
CREATE INDEX IF NOT EXISTS build_slots_group_id_idx ON build_slots(group_id);

ALTER TABLE build_parts ADD COLUMN build_slot_id TEXT DEFAULT NULL REFERENCES build_slots(id);
CREATE INDEX IF NOT EXISTS build_parts_build_slot_id_idx ON build_parts(build_slot_id);
