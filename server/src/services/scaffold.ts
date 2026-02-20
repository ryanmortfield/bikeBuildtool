import { eq, and, isNull } from 'drizzle-orm'
import { buildCategories, buildSlots, buildGroups, buildParts } from '../db/schema'
import { COMPONENTS, type ComponentKey } from '../db/components'
import { createId } from '../lib/id'
import type { AppDb } from './builds'

const DEFAULT_GROUP_ORDER: string[] = [
  'Frameset',
  'Drivetrain',
  'Braking & control',
  'Wheelset',
  'Cockpit',
]

/**
 * Ensures the build has a scaffold (categories + slots). If missing, creates default from COMPONENTS and backfills build_parts.build_slot_id.
 */
export async function ensureBuildLayout(db: AppDb, buildId: string): Promise<void> {
  const [existing] = await db.select().from(buildCategories).where(eq(buildCategories.buildId, buildId))
  if (existing) return

  const categoryIdsByGroup = new Map<string, string>()
  let sortOrder = 0
  for (const groupName of DEFAULT_GROUP_ORDER) {
    const id = createId()
    await db.insert(buildCategories).values({
      id,
      buildId,
      name: groupName,
      sortOrder: sortOrder++,
    })
    categoryIdsByGroup.set(groupName, id)
  }

  const customKeyToGroup: Record<string, string> = {
    custom_frameset: 'Frameset',
    custom_drivetrain: 'Drivetrain',
    custom_braking: 'Braking & control',
    custom_wheelset: 'Wheelset',
    custom_cockpit: 'Cockpit',
  }
  let slotSortOrder = 0
  for (const comp of COMPONENTS) {
    const categoryId = categoryIdsByGroup.get(comp.group)
    if (!categoryId) continue
    const slotId = createId()
    await db.insert(buildSlots).values({
      id: slotId,
      buildId,
      categoryId,
      componentKey: comp.key,
      sortOrder: slotSortOrder++,
    })
    await db
      .update(buildParts)
      .set({ buildSlotId: slotId })
      .where(and(eq(buildParts.buildId, buildId), eq(buildParts.component, comp.key)))
  }
  for (const [customKey, groupName] of Object.entries(customKeyToGroup)) {
    const categoryId = categoryIdsByGroup.get(groupName)
    if (!categoryId) continue
    const slotId = createId()
    await db.insert(buildSlots).values({
      id: slotId,
      buildId,
      categoryId,
      componentKey: customKey as ComponentKey,
      sortOrder: slotSortOrder++,
    })
    await db
      .update(buildParts)
      .set({ buildSlotId: slotId })
      .where(and(eq(buildParts.buildId, buildId), eq(buildParts.component, customKey)))
  }

  const legacyParts = await db
    .select()
    .from(buildParts)
    .where(and(eq(buildParts.buildId, buildId), isNull(buildParts.buildSlotId)))
  if (legacyParts.length === 0) return

  const slots = await db.select().from(buildSlots).where(eq(buildSlots.buildId, buildId))
  const slotByComponent = new Map(slots.map((s) => [s.componentKey, s.id]))
  for (const bp of legacyParts) {
    const slotId = slotByComponent.get(bp.component)
    if (slotId) await db.update(buildParts).set({ buildSlotId: slotId }).where(eq(buildParts.id, bp.id))
  }
}

export interface CategoryWithSlots {
  id: string
  name: string
  sortOrder: number
  slots: Array<{
    id: string
    componentKey: string
    sortOrder: number
    groupId: string | null
    group: { id: string; name: string } | null
  }>
}

export async function getScaffold(db: AppDb, buildId: string): Promise<{
  categories: CategoryWithSlots[]
  groups: Array<{ id: string; name: string; categoryId: string | null; sortOrder: number }>
}> {
  await ensureBuildLayout(db, buildId)

  const categories = await db
    .select()
    .from(buildCategories)
    .where(eq(buildCategories.buildId, buildId))
    .orderBy(buildCategories.sortOrder)
  const groups = await db
    .select()
    .from(buildGroups)
    .where(eq(buildGroups.buildId, buildId))
    .orderBy(buildGroups.sortOrder)
  const slots = await db
    .select()
    .from(buildSlots)
    .where(eq(buildSlots.buildId, buildId))
    .orderBy(buildSlots.sortOrder)

  const groupMap = new Map(groups.map((g) => [g.id, g]))
  const categoriesWithSlots: CategoryWithSlots[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    sortOrder: cat.sortOrder,
    slots: slots
      .filter((s) => s.categoryId === cat.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        id: s.id,
        componentKey: s.componentKey,
        sortOrder: s.sortOrder,
        groupId: s.groupId,
        group: s.groupId ? (groupMap.get(s.groupId) ? { id: groupMap.get(s.groupId)!.id, name: groupMap.get(s.groupId)!.name } : null) : null,
      })),
  }))

  return {
    categories: categoriesWithSlots,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      categoryId: g.categoryId,
      sortOrder: g.sortOrder,
    })),
  }
}
