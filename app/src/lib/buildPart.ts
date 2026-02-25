import type { BuildPartWithPart } from '@/types/api'

/** Resolve build part row id. Use for PATCH/DELETE /api/builds/:id/parts/:rowId. */
export function getBuildPartRowId(bp: BuildPartWithPart | null | undefined): string | null {
  if (!bp) return null
  const rowId = (bp as BuildPartWithPart).id ?? (bp as Record<string, unknown>).id
  return typeof rowId === 'string' ? rowId : null
}

/** Slot key for grouping (must match BuildDetail buildPartsBySlot). */
export function getBuildPartSlotKey(bp: BuildPartWithPart | Record<string, unknown>): string {
  const r = bp as Record<string, unknown>
  return (r.buildSlotId ?? r.build_slot_id ?? r.component) as string
}

/** First build part for a slot (same grouping as BuildDetail getPartsForSlot). */
export function getPrimaryPartForSlot(
  parts: BuildPartWithPart[],
  buildSlotId: string | null | undefined,
  componentKey: string
): BuildPartWithPart | null {
  const key = buildSlotId ?? componentKey
  const list = parts.filter((p) => getBuildPartSlotKey(p) === key)
  return list[0] ?? null
}

/**
 * Merge a single build part (from PATCH/POST response) into the cached list.
 */
export function mergeBuildPartIntoList(
  list: BuildPartWithPart[],
  part: BuildPartWithPart
): BuildPartWithPart[] {
  const id = getBuildPartRowId(part)
  if (!id) return list
  const idx = list.findIndex((p) => getBuildPartRowId(p) === id)
  if (idx >= 0) {
    const next = [...list]
    next[idx] = part
    return next
  }
  const key = getBuildPartSlotKey(part)
  const filtered = list.filter((p) => getBuildPartSlotKey(p) !== key)
  return [...filtered, part]
}

/** Display name for a build part: part name. */
export function getBuildPartDisplayName(bp: BuildPartWithPart | { part?: { name?: string } | null }): string {
  const name = bp.part?.name ?? (bp as { part?: { name?: string } }).part?.name
  return name ?? 'Part'
}

/** Part name (from joined part). */
export function getBuildPartPartName(bp: BuildPartWithPart | { part?: { name?: string } | null }): string | null {
  const name = bp.part?.name ?? (bp as { part?: { name?: string } }).part?.name
  return name ?? null
}
