import { eq, desc } from 'drizzle-orm'
import { builds } from '../db/schema'
import { createId } from '../lib/id'
import type { Build } from '../db/schema'

/** Database instance type (Drizzle with schema). Dependency inversion: services depend on this abstraction. */
export type AppDb = ReturnType<typeof import('drizzle-orm/d1').drizzle>

/** List builds. When userId is set, only that user's builds. When null (unauthenticated), only legacy builds (userId null). */
export async function listBuilds(db: AppDb, userId: string | null) {
  const condition = userId === null ? eq(builds.userId, null) : eq(builds.userId, userId)
  return db.select().from(builds).where(condition).orderBy(desc(builds.updatedAt))
}

export async function getBuildById(db: AppDb, id: string): Promise<Build | null> {
  const [row] = await db.select().from(builds).where(eq(builds.id, id))
  return row ?? null
}

/** When userId is set, only builds owned by that user (or with null userId) can be mutated. */
export function canMutateBuild(build: Build, userId: string | null): boolean {
  if (!userId) return true // unauthenticated: allow only legacy (null) builds
  return build.userId === null || build.userId === userId
}

export async function createBuild(
  db: AppDb,
  input: { name: string; bikeType: string; userId?: string | null }
): Promise<Build> {
  const id = createId()
  const now = new Date()
  const [row] = await db
    .insert(builds)
    .values({
      id,
      userId: input.userId ?? null,
      name: input.name,
      bikeType: input.bikeType,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return row ?? { id, userId: input.userId ?? null, name: input.name, bikeType: input.bikeType, createdAt: now, updatedAt: now } as Build
}

export async function updateBuild(
  db: AppDb,
  id: string,
  input: { name?: string; bikeType?: string },
  userId: string | null = null
): Promise<Build | null> {
  const [existing] = await db.select().from(builds).where(eq(builds.id, id))
  if (!existing) return null
  if (userId !== null && !canMutateBuild(existing, userId)) return null
  const updates: { name?: string; bikeType?: string; updatedAt: Date } = { updatedAt: new Date() }
  if (input.name !== undefined) updates.name = input.name
  if (input.bikeType !== undefined) updates.bikeType = input.bikeType
  const [row] = await db.update(builds).set(updates).where(eq(builds.id, id)).returning()
  return row ?? null
}

export async function deleteBuild(db: AppDb, id: string, userId: string | null = null): Promise<boolean> {
  const [existing] = await db.select().from(builds).where(eq(builds.id, id))
  if (!existing) return false
  if (userId !== null && !canMutateBuild(existing, userId)) return false
  await db.delete(builds).where(eq(builds.id, id))
  return true
}
