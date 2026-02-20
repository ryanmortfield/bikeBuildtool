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
}
