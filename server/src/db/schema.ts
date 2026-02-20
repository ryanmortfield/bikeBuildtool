import {
  sqliteTable,
  text,
  integer,
  real,
} from 'drizzle-orm/sqlite-core'

/**
 * User builds (projects).
 */
export const builds = sqliteTable('builds', {
  id: text('id').primaryKey(),
  userId: text('user_id'), // Clerk user id when authenticated; null = anonymous/legacy
  name: text('name').notNull(),
  bikeType: text('bike_type').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

/**
 * Per-build categories (e.g. Drivetrain, Braking). User can add/remove/rename/reorder.
 */
export const buildCategories = sqliteTable('build_categories', {
  id: text('id').primaryKey(),
  buildId: text('build_id')
    .notNull()
    .references(() => builds.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

/**
 * Per-build groups: named set of slots (e.g. "Crankset"). Movable between categories.
 */
export const buildGroups = sqliteTable('build_groups', {
  id: text('id').primaryKey(),
  buildId: text('build_id')
    .notNull()
    .references(() => builds.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => buildCategories.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
})

/**
 * Per-build slots: one row in the scaffold. Each slot has a component type and lives in a category (and optionally in a group).
 */
export const buildSlots = sqliteTable('build_slots', {
  id: text('id').primaryKey(),
  buildId: text('build_id')
    .notNull()
    .references(() => builds.id, { onDelete: 'cascade' }),
  categoryId: text('category_id')
    .notNull()
    .references(() => buildCategories.id, { onDelete: 'cascade' }),
  groupId: text('group_id').references(() => buildGroups.id, { onDelete: 'set null' }),
  componentKey: text('component_key').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

/**
 * Catalog of parts. component (key) must be one of the component keys; optional sub-types for crankset and handlebars_stem.
 */
export const parts = sqliteTable('parts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  component: text('component').notNull(),
  weightG: integer('weight_g'),
  price: real('price'),
  currency: text('currency'),
  sourceUrl: text('source_url'),
  sourceName: text('source_name'),
  compatibilityTags: text('compatibility_tags'), // JSON array of strings
  notes: text('notes'),
  cranksetComponentType: text('crankset_component_type'), // null | 'crank_arms' | 'chainrings' | 'crankset_hardware'
  handlebarsStemComponentType: text('handlebars_stem_component_type'), // null | 'handlebars' | 'stem'
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

/**
 * Junction: which part(s) are on which slot per build.
 * References build_slots; component is denormalized for compatibility.
 */
export const buildParts = sqliteTable('build_parts', {
  id: text('id').primaryKey(),
  buildId: text('build_id')
    .notNull()
    .references(() => builds.id, { onDelete: 'cascade' }),
  buildSlotId: text('build_slot_id').references(() => buildSlots.id, { onDelete: 'cascade' }),
  /** Denormalized from slot's component_key; kept for backfill and compatibility. */
  component: text('component').notNull(),
  partId: text('part_id').references(() => parts.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull().default(1),
  notes: text('notes'),
  componentLabel: text('component_label'),
  customName: text('custom_name'),
  customWeightG: integer('custom_weight_g'),
  customPrice: real('custom_price'),
  customCurrency: text('custom_currency'),
})

// Partial unique index (build_id, component, part_id) WHERE part_id IS NOT NULL is created in migration SQL.

export type Build = typeof builds.$inferSelect
export type NewBuild = typeof builds.$inferInsert
export type BuildCategory = typeof buildCategories.$inferSelect
export type NewBuildCategory = typeof buildCategories.$inferInsert
export type BuildGroup = typeof buildGroups.$inferSelect
export type NewBuildGroup = typeof buildGroups.$inferInsert
export type BuildSlot = typeof buildSlots.$inferSelect
export type NewBuildSlot = typeof buildSlots.$inferInsert
export type Part = typeof parts.$inferSelect
export type NewPart = typeof parts.$inferInsert
export type BuildPart = typeof buildParts.$inferSelect
export type NewBuildPart = typeof buildParts.$inferInsert
