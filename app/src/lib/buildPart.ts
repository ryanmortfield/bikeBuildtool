import type { BuildPartWithPart } from '@/types/api'

/** Resolve build part row id from API response (camelCase or snake_case). Use for PATCH/DELETE /api/builds/:id/parts/:rowId. */
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
 * Replaces by id if present; otherwise replaces any part with same slot key and appends.
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

/** Row label: prefer component label (e.g. "Bottle cage"), then part/custom name. API may return componentLabel/component_label, customName/custom_name. */
export function getBuildPartDisplayName(bp: BuildPartWithPart | (BuildPartWithPart & { custom_name?: string | null; component_label?: string | null })): string {
  const componentLabel = bp.componentLabel ?? (bp as { component_label?: string | null }).component_label
  if (componentLabel) return componentLabel
  const name = bp.customName ?? (bp as { custom_name?: string | null }).custom_name
  if (name) return name
  if (bp.part?.name) return bp.part.name
  return 'Custom component'
}

/** Part name for combobox/display (catalog part name or custom part name). Handles part from API (camelCase or snake_case). */
export function getBuildPartPartName(bp: BuildPartWithPart | (BuildPartWithPart & { custom_name?: string | null; part?: { name?: string } | null })): string | null {
  const partName = bp.part?.name ?? (bp as { part?: { name?: string } }).part?.name
  if (partName) return partName
  const name = bp.customName ?? (bp as { custom_name?: string | null }).custom_name
  return name ?? null
}
