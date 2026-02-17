import { eq, desc } from 'drizzle-orm'
import { builds } from '../db/schema'
import { createId } from '../lib/id'
import type { Build } from '../db/schema'

/** Database instance type (Drizzle with schema). Dependency inversion: services depend on this abstraction. */
export type AppDb = ReturnType<typeof import('drizzle-orm/d1').drizzle>

/** Single responsibility: build data access. All build DB operations in one place. */
export async function listBuilds(db: AppDb) {
  return db.select().from(builds).orderBy(desc(builds.updatedAt))
}

export async function getBuildById(db: AppDb, id: string): Promise<Build | null> {
  const [row] = await db.select().from(builds).where(eq(builds.id, id))
  return row ?? null
}

export async function createBuild(
  db: AppDb,
  input: { name: string; bikeType: string }
): Promise<Build> {
  const id = createId()
  const now = new Date()
  const [row] = await db
    .insert(builds)
    .values({
      id,
      name: input.name,
      bikeType: input.bikeType,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return row ?? { id, name: input.name, bikeType: input.bikeType, createdAt: now, updatedAt: now } as Build
}

export async function updateBuild(
  db: AppDb,
  id: string,
  input: { name?: string; bikeType?: string }
): Promise<Build | null> {
  const updates: { name?: string; bikeType?: string; updatedAt: Date } = { updatedAt: new Date() }
  if (input.name !== undefined) updates.name = input.name
  if (input.bikeType !== undefined) updates.bikeType = input.bikeType
  const [row] = await db.update(builds).set(updates).where(eq(builds.id, id)).returning()
  return row ?? null
}

export async function deleteBuild(db: AppDb, id: string): Promise<boolean> {
  const [existing] = await db.select().from(builds).where(eq(builds.id, id))
  if (!existing) return false
  await db.delete(builds).where(eq(builds.id, id))
  return true
}
