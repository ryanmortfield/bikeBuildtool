-- Clear all build-related data so we start fresh with scaffold/slot-based model.
-- Parts catalog is left intact.

DELETE FROM build_parts;
DELETE FROM build_slots;
DELETE FROM build_groups;
DELETE FROM build_categories;
DELETE FROM builds;
