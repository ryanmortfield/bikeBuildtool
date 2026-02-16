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
  name: text('name').notNull(),
  bikeType: text('bike_type').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
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
 * Junction: which part(s) are in which component per build.
 * Either catalog part (partId set) or custom/wildcard (partId null, customName required).
 */
export const buildParts = sqliteTable('build_parts', {
  id: text('id').primaryKey(),
  buildId: text('build_id')
    .notNull()
    .references(() => builds.id, { onDelete: 'cascade' }),
  component: text('component').notNull(),
  partId: text('part_id').references(() => parts.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull().default(1),
  notes: text('notes'),
  customName: text('custom_name'),
  customWeightG: integer('custom_weight_g'),
  customPrice: real('custom_price'),
  customCurrency: text('custom_currency'),
})

// Partial unique index (build_id, component, part_id) WHERE part_id IS NOT NULL is created in migration SQL.

export type Build = typeof builds.$inferSelect
export type NewBuild = typeof builds.$inferInsert
export type Part = typeof parts.$inferSelect
export type NewPart = typeof parts.$inferInsert
export type BuildPart = typeof buildParts.$inferSelect
export type NewBuildPart = typeof buildParts.$inferInsert
