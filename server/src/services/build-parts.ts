import { eq, and } from 'drizzle-orm'
import { buildParts, parts, builds } from '../db/schema'
import { isComponentKey } from '../db/components'
import { createId } from '../lib/id'
import type { BuildPart } from '../db/schema'
import type { AppDb } from './builds'

function pickStr(b: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) if (typeof b[k] === 'string') return b[k] as string
  return null
}
function pickNum(b: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) if (typeof b[k] === 'number') return b[k] as number
  return null
}

/** Single responsibility: build-parts junction data access. */
export async function listByBuildId(db: AppDb, buildId: string) {
  const rows = await db.select().from(buildParts).where(eq(buildParts.buildId, buildId))
  const partIds = [...new Set(rows.map((r) => r.partId).filter(Boolean))] as string[]
  const partMap = new Map<string, (typeof parts.$inferSelect) | null>()
  for (const id of partIds) {
    const [p] = await db.select().from(parts).where(eq(parts.id, id))
    partMap.set(id, p ?? null)
  }
  return rows.map((r) => ({
    ...r,
    part: r.partId ? partMap.get(r.partId) ?? null : null,
  }))
}

export async function requireBuildExists(db: AppDb, buildId: string): Promise<boolean> {
  const [b] = await db.select().from(builds).where(eq(builds.id, buildId))
  return !!b
}

export async function addBuildPart(db: AppDb, buildId: string, body: Record<string, unknown>): Promise<{ row: BuildPart; part: (typeof parts.$inferSelect) | null } | null> {
  const component = pickStr(body, 'component')
  if (!component || !isComponentKey(component)) return null
  const partId = pickStr(body, 'part_id', 'partId')
  const customName = pickStr(body, 'custom_name', 'customName')
  if (!partId && !customName) return null
  const id = createId()
  const quantity = pickNum(body, 'quantity') ?? 1
  await db.insert(buildParts).values({
    id,
    buildId,
    component,
    partId: partId || null,
    quantity,
    notes: typeof body.notes === 'string' ? body.notes : null,
    customName: customName || null,
    customWeightG: pickNum(body, 'custom_weight_g', 'customWeightG'),
    customPrice: pickNum(body, 'custom_price', 'customPrice'),
    customCurrency: pickStr(body, 'custom_currency', 'customCurrency'),
  })
  const [row] = await db.select().from(buildParts).where(eq(buildParts.id, id))
  if (!row) return null
  const part = row.partId ? (await db.select().from(parts).where(eq(parts.id, row.partId)))[0] ?? null : null
  return { row, part }
}

export async function getBuildPartByRowId(db: AppDb, buildId: string, rowId: string): Promise<BuildPart | null> {
  const [row] = await db
    .select()
    .from(buildParts)
    .where(and(eq(buildParts.buildId, buildId), eq(buildParts.id, rowId)))
  return row ?? null
}

export async function updateBuildPart(db: AppDb, buildId: string, rowId: string, body: Record<string, unknown>): Promise<BuildPart | null> {
  const existing = await getBuildPartByRowId(db, buildId, rowId)
  if (!existing) return null
  const updates: Record<string, unknown> = {}
  if (body.quantity !== undefined) updates.quantity = Number(body.quantity)
  if (body.notes !== undefined) updates.notes = body.notes === null ? null : String(body.notes)
  if (body.custom_name !== undefined || body.customName !== undefined) updates.customName = body.custom_name ?? body.customName
  if (body.custom_weight_g !== undefined || body.customWeightG !== undefined) updates.customWeightG = body.custom_weight_g ?? body.customWeightG
  if (body.custom_price !== undefined || body.customPrice !== undefined) updates.customPrice = body.custom_price ?? body.customPrice
  if (body.custom_currency !== undefined || body.customCurrency !== undefined) updates.customCurrency = body.custom_currency ?? body.customCurrency
  if (Object.keys(updates).length === 0) return existing
  const [row] = await db.update(buildParts).set(updates).where(eq(buildParts.id, rowId)).returning()
  return row ?? null
}

export async function removeBuildPart(db: AppDb, buildId: string, rowId: string): Promise<boolean> {
  const existing = await getBuildPartByRowId(db, buildId, rowId)
  if (!existing) return false
  await db.delete(buildParts).where(eq(buildParts.id, rowId))
  return true
}
