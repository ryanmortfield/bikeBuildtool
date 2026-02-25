-- Greenfield: a part is a part. Drop legacy custom_* and component_label; part_id required.

CREATE TABLE build_parts_new (
  id TEXT PRIMARY KEY,
  build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  build_slot_id TEXT REFERENCES build_slots(id) ON DELETE CASCADE,
  component TEXT NOT NULL,
  part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);

INSERT INTO build_parts_new (id, build_id, build_slot_id, component, part_id, quantity, notes)
SELECT id, build_id, build_slot_id, component, part_id, quantity, notes
FROM build_parts
WHERE part_id IS NOT NULL;

DROP TABLE build_parts;

ALTER TABLE build_parts_new RENAME TO build_parts;

CREATE INDEX IF NOT EXISTS build_parts_build_id_idx ON build_parts(build_id);
CREATE INDEX IF NOT EXISTS build_parts_part_id_idx ON build_parts(part_id);
CREATE INDEX IF NOT EXISTS build_parts_build_slot_id_idx ON build_parts(build_slot_id);
