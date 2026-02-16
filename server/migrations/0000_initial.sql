-- Bike Build Tool: initial schema
-- Apply with: wrangler d1 migrations apply bike-build-db [--remote]

CREATE TABLE IF NOT EXISTS builds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bike_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slot TEXT NOT NULL,
  weight_g INTEGER,
  price REAL,
  currency TEXT,
  source_url TEXT,
  source_name TEXT,
  compatibility_tags TEXT,
  notes TEXT,
  crankset_component_type TEXT,
  handlebars_stem_component_type TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS build_parts (
  id TEXT PRIMARY KEY,
  build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  part_id TEXT REFERENCES parts(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  custom_name TEXT,
  custom_weight_g INTEGER,
  custom_price REAL,
  custom_currency TEXT
);

CREATE INDEX IF NOT EXISTS build_parts_build_id_idx ON build_parts(build_id);
CREATE INDEX IF NOT EXISTS build_parts_part_id_idx ON build_parts(part_id);

-- Partial unique index: same catalog part cannot appear twice in a slot; multiple custom rows (part_id NULL) allowed per slot
CREATE UNIQUE INDEX IF NOT EXISTS build_parts_build_slot_part_unique ON build_parts(build_id, slot, part_id) WHERE part_id IS NOT NULL;
