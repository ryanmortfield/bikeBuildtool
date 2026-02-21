import type { BuildPartWithPart } from '@/types/api'

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
