/** Shapes matching the server API (camelCase from Drizzle). */

export interface Build {
  id: string
  name: string
  bikeType: string
  createdAt: number
  updatedAt: number
}

export interface Part {
  id: string
  name: string
  component: string
  weightG: number | null
  price: number | null
  currency: string | null
  sourceUrl: string | null
  sourceName: string | null
  compatibilityTags: string | null
  notes: string | null
  cranksetComponentType: string | null
  handlebarsStemComponentType: string | null
  createdAt: number
}

export interface BuildPart {
  id: string
  buildId: string
  /** When using scaffold, part is tied to this slot. */
  buildSlotId?: string | null
  component: string
  partId: string | null
  quantity: number
  notes: string | null
  /** Display label for "additional component" rows; preserved when adding a custom part to the row. */
  componentLabel?: string | null
  customName: string | null
  customWeightG: number | null
  customPrice: number | null
  customCurrency: string | null
}

/** Build part row with optional joined part (from POST /builds/:id/parts). */
export interface BuildPartWithPart extends BuildPart {
  part?: Part | null
}

export interface ComponentDef {
  key: string
  label: string
  group: string
  /** When set, this component is shown inside a combination card with others sharing the same compositeGroup. */
  compositeGroup?: string
}

/** Scaffold: categories and slots for a build (from GET /api/builds/:id/scaffold). */
export interface ScaffoldSlot {
  id: string
  componentKey: string
  sortOrder: number
  groupId: string | null
  group: { id: string; name: string } | null
}

export interface ScaffoldCategory {
  id: string
  name: string
  sortOrder: number
  slots: ScaffoldSlot[]
}

export interface Scaffold {
  categories: ScaffoldCategory[]
  groups: Array<{ id: string; name: string; categoryId: string | null; sortOrder: number }>
}
