import { eq, desc } from 'drizzle-orm'
import { parts } from '../db/schema'
import { createId } from '../lib/id'
import { isComponentKey } from '../db/components'
import type { Part } from '../db/schema'
import type { AppDb } from './builds'

function tagsToText(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return JSON.stringify(v)
  return null
}

function pickStr(b: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) if (typeof b[k] === 'string') return b[k] as string
  return null
}
function pickNum(b: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) if (typeof b[k] === 'number') return b[k] as number
  return null
}

export async function listParts(db: AppDb, component?: string) {
  if (component && isComponentKey(component))
    return db.select().from(parts).where(eq(parts.component, component)).orderBy(desc(parts.createdAt))
  return db.select().from(parts).orderBy(desc(parts.createdAt))
}

export async function getPartById(db: AppDb, id: string): Promise<Part | null> {
  const [row] = await db.select().from(parts).where(eq(parts.id, id))
  return row ?? null
}

export async function createPart(db: AppDb, body: Record<string, unknown>): Promise<Part | null> {
  const component = pickStr(body, 'component')
  if (!component || !isComponentKey(component)) return null
  const id = createId()
  const now = new Date()
  await db.insert(parts).values({
    id,
    name: String(body.name ?? ''),
    component,
    weightG: pickNum(body, 'weight_g', 'weightG'),
    price: typeof body.price === 'number' ? body.price : null,
    currency: typeof body.currency === 'string' ? body.currency : null,
    sourceUrl: pickStr(body, 'source_url', 'sourceUrl'),
    sourceName: pickStr(body, 'source_name', 'sourceName'),
    compatibilityTags: tagsToText(body.compatibility_tags ?? body.compatibilityTags),
    notes: typeof body.notes === 'string' ? body.notes : null,
    cranksetComponentType: pickStr(body, 'crankset_component_type', 'cranksetComponentType'),
    handlebarsStemComponentType: pickStr(body, 'handlebars_stem_component_type', 'handlebarsStemComponentType'),
    createdAt: now,
  })
  return getPartById(db, id)
}

export async function updatePart(db: AppDb, id: string, body: Record<string, unknown>): Promise<Part | null> {
  const [existing] = await db.select().from(parts).where(eq(parts.id, id))
  if (!existing) return null
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = String(body.name)
  if (body.component !== undefined && isComponentKey(String(body.component))) updates.component = body.component
  if (body.weight_g !== undefined || body.weightG !== undefined) updates.weightG = pickNum(body, 'weight_g', 'weightG') ?? body.weightG
  if (body.price !== undefined) updates.price = body.price === null ? null : Number(body.price)
  if (body.currency !== undefined) updates.currency = body.currency === null ? null : String(body.currency)
  if (body.source_url !== undefined || body.sourceUrl !== undefined) updates.sourceUrl = body.source_url ?? body.sourceUrl
  if (body.source_name !== undefined || body.sourceName !== undefined) updates.sourceName = body.source_name ?? body.sourceName
  if (body.compatibility_tags !== undefined || body.compatibilityTags !== undefined) updates.compatibilityTags = tagsToText(body.compatibility_tags ?? body.compatibilityTags)
  if (body.notes !== undefined) updates.notes = body.notes === null ? null : String(body.notes)
  if (body.crankset_component_type !== undefined || body.cranksetComponentType !== undefined) updates.cranksetComponentType = body.crankset_component_type ?? body.cranksetComponentType
  if (body.handlebars_stem_component_type !== undefined || body.handlebarsStemComponentType !== undefined) updates.handlebarsStemComponentType = body.handlebars_stem_component_type ?? body.handlebarsStemComponentType
  if (Object.keys(updates).length === 0) return existing
  const [row] = await db.update(parts).set(updates).where(eq(parts.id, id)).returning()
  return row ?? null
}

export async function deletePart(db: AppDb, id: string): Promise<boolean> {
  const [existing] = await db.select().from(parts).where(eq(parts.id, id))
  if (!existing) return false
  await db.delete(parts).where(eq(parts.id, id))
  return true
}
