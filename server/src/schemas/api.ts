import { t } from 'elysia'

/** Shared API response and request schemas (Elysia best practice: single source of truth for validation + types). */

export const errorResponse = t.Object({
  error: t.String(),
})

export const deletedResponse = t.Object({
  deleted: t.Literal(true),
})

/** Builds */
export const createBuildBody = t.Object({
  name: t.Optional(t.String()),
  bikeType: t.Optional(t.String()),
  bike_type: t.Optional(t.String()),
})

export const updateBuildBody = t.Object({
  name: t.Optional(t.String()),
  bikeType: t.Optional(t.String()),
  bike_type: t.Optional(t.String()),
})

/** Parts – component is required and validated in handler against COMPONENT_KEYS. */
export const createPartBody = t.Object({
  name: t.String(),
  component: t.String(),
  weight_g: t.Optional(t.Number()),
  weightG: t.Optional(t.Number()),
  price: t.Optional(t.Union([t.Number(), t.Null()])),
  currency: t.Optional(t.Nullable(t.String())),
  source_url: t.Optional(t.Nullable(t.String())),
  sourceUrl: t.Optional(t.Nullable(t.String())),
  source_name: t.Optional(t.Nullable(t.String())),
  sourceName: t.Optional(t.Nullable(t.String())),
  compatibility_tags: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  compatibilityTags: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  notes: t.Optional(t.Nullable(t.String())),
  crankset_component_type: t.Optional(t.Nullable(t.String())),
  cranksetComponentType: t.Optional(t.Nullable(t.String())),
  handlebars_stem_component_type: t.Optional(t.Nullable(t.String())),
  handlebarsStemComponentType: t.Optional(t.Nullable(t.String())),
})

/** Update part: all fields optional. */
export const updatePartBody = t.Object({
  name: t.Optional(t.String()),
  component: t.Optional(t.String()),
  weight_g: t.Optional(t.Number()),
  weightG: t.Optional(t.Number()),
  price: t.Optional(t.Union([t.Number(), t.Null()])),
  currency: t.Optional(t.Nullable(t.String())),
  source_url: t.Optional(t.Nullable(t.String())),
  sourceUrl: t.Optional(t.Nullable(t.String())),
  source_name: t.Optional(t.Nullable(t.String())),
  sourceName: t.Optional(t.Nullable(t.String())),
  compatibility_tags: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  compatibilityTags: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  notes: t.Optional(t.Nullable(t.String())),
  crankset_component_type: t.Optional(t.Nullable(t.String())),
  cranksetComponentType: t.Optional(t.Nullable(t.String())),
  handlebars_stem_component_type: t.Optional(t.Nullable(t.String())),
  handlebarsStemComponentType: t.Optional(t.Nullable(t.String())),
})

/** Build parts – either catalog part or custom. */
export const createBuildPartBody = t.Object({
  component: t.String(),
  part_id: t.Optional(t.Nullable(t.String())),
  partId: t.Optional(t.Nullable(t.String())),
  quantity: t.Optional(t.Number()),
  notes: t.Optional(t.Nullable(t.String())),
  custom_name: t.Optional(t.Nullable(t.String())),
  customName: t.Optional(t.Nullable(t.String())),
  custom_weight_g: t.Optional(t.Nullable(t.Number())),
  customWeightG: t.Optional(t.Nullable(t.Number())),
  custom_price: t.Optional(t.Nullable(t.Number())),
  customPrice: t.Optional(t.Nullable(t.Number())),
  custom_currency: t.Optional(t.Nullable(t.String())),
  customCurrency: t.Optional(t.Nullable(t.String())),
})

export const updateBuildPartBody = t.Object({
  quantity: t.Optional(t.Number()),
  notes: t.Optional(t.Nullable(t.String())),
  custom_name: t.Optional(t.Nullable(t.String())),
  customName: t.Optional(t.Nullable(t.String())),
  custom_weight_g: t.Optional(t.Nullable(t.Number())),
  customWeightG: t.Optional(t.Nullable(t.Number())),
  custom_price: t.Optional(t.Nullable(t.Number())),
  customPrice: t.Optional(t.Nullable(t.Number())),
  custom_currency: t.Optional(t.Nullable(t.String())),
  customCurrency: t.Optional(t.Nullable(t.String())),
})

/** Query: optional component filter for list parts. */
export const listPartsQuery = t.Object({
  component: t.Optional(t.String()),
})

/** Path params: resource id. */
export const idParam = t.Object({
  id: t.String(),
})

export const buildPartRowIdParam = t.Object({
  id: t.String(),
  rowId: t.String(),
})
