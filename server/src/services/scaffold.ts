import { eq, and, isNull, inArray } from 'drizzle-orm'
import { buildCategories, buildSlots, buildGroups, buildParts } from '../db/schema'
import { COMPONENTS, COMPONENT_KEYS, isComponentKey, type ComponentKey } from '../db/components'
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

/**
 * Create a build group and assign the given slots to it. Uses first slot's category for the group.
 */
export async function createGroup(
  db: AppDb,
  buildId: string,
  input: { name: string; slotIds: string[] }
): Promise<{ id: string; name: string } | null> {
  if (!input.name.trim() || input.slotIds.length === 0) return null
  const slots = await db
    .select()
    .from(buildSlots)
    .where(and(eq(buildSlots.buildId, buildId), inArray(buildSlots.id, input.slotIds)))
  if (slots.length === 0) return null
  const categoryId = slots[0].categoryId
  const existingGroups = await db
    .select({ sortOrder: buildGroups.sortOrder })
    .from(buildGroups)
    .where(eq(buildGroups.buildId, buildId))
  const maxOrder = existingGroups.length
    ? Math.max(...existingGroups.map((g) => g.sortOrder))
    : -1
  const groupId = createId()
  await db.insert(buildGroups).values({
    id: groupId,
    buildId,
    name: input.name.trim(),
    categoryId,
    sortOrder: maxOrder + 1,
  })
  await db
    .update(buildSlots)
    .set({ groupId })
    .where(and(eq(buildSlots.buildId, buildId), inArray(buildSlots.id, input.slotIds)))
  return { id: groupId, name: input.name.trim() }
}

/**
 * Reorder slots within a category. slotIds must be the full ordered list of slot ids for that category.
 */
export async function reorderSlots(
  db: AppDb,
  buildId: string,
  categoryId: string,
  slotIds: string[]
): Promise<boolean> {
  if (slotIds.length === 0) return true
  const slots = await db
    .select()
    .from(buildSlots)
    .where(and(eq(buildSlots.buildId, buildId), eq(buildSlots.categoryId, categoryId), inArray(buildSlots.id, slotIds)))
  if (slots.length !== slotIds.length) return false
  for (let i = 0; i < slotIds.length; i++) {
    await db.update(buildSlots).set({ sortOrder: i }).where(eq(buildSlots.id, slotIds[i]!))
  }
  return true
}

const CUSTOM_KEY_TO_GROUP: Record<string, string> = {
  custom_frameset: 'Frameset',
  custom_drivetrain: 'Drivetrain',
  custom_braking: 'Braking & control',
  custom_wheelset: 'Wheelset',
  custom_cockpit: 'Cockpit',
}

/**
 * Add a slot (component row) to a category. componentKey must be valid for the category's group.
 */
export async function addSlot(
  db: AppDb,
  buildId: string,
  categoryId: string,
  componentKey: string
): Promise<{ id: string; componentKey: string; sortOrder: number } | null> {
  if (!isComponentKey(componentKey)) return null
  const [category] = await db
    .select()
    .from(buildCategories)
    .where(and(eq(buildCategories.buildId, buildId), eq(buildCategories.id, categoryId)))
  if (!category) return null
  const comp = COMPONENTS.find((c) => c.key === componentKey)
  const groupForKey = comp ? comp.group : CUSTOM_KEY_TO_GROUP[componentKey]
  if (!groupForKey || groupForKey !== category.name) return null
  const slotsInCategory = await db
    .select({ sortOrder: buildSlots.sortOrder })
    .from(buildSlots)
    .where(and(eq(buildSlots.buildId, buildId), eq(buildSlots.categoryId, categoryId)))
  const nextOrder = slotsInCategory.length > 0 ? Math.max(...slotsInCategory.map((r) => r.sortOrder)) + 1 : 0
  const slotId = createId()
  await db.insert(buildSlots).values({
    id: slotId,
    buildId,
    categoryId,
    componentKey: componentKey as ComponentKey,
    sortOrder: nextOrder,
  })
  return { id: slotId, componentKey, sortOrder: nextOrder }
}

/**
 * Remove a slot (component row) and all build parts attached to it.
 */
export async function removeSlot(db: AppDb, buildId: string, slotId: string): Promise<boolean> {
  const [slot] = await db
    .select()
    .from(buildSlots)
    .where(and(eq(buildSlots.buildId, buildId), eq(buildSlots.id, slotId)))
  if (!slot) return false
  await db.delete(buildParts).where(eq(buildParts.buildSlotId, slotId))
  await db.delete(buildSlots).where(eq(buildSlots.id, slotId))
  return true
}
