import { Elysia, t } from 'elysia'
import * as buildPartsService from '../services/build-parts'
import { notFound, badRequest } from '../lib/responses'
import { createBuildPartBody, updateBuildPartBody, idParam, buildPartRowIdParam, errorResponse } from '../schemas/api'
import type { AppDb } from '../services/builds'

/** Build-parts CRUD. Thin HTTP layer: validate, call service, map to response. */
export const buildPartsRoutes = (getDb: () => AppDb) =>
  new Elysia({ prefix: '/api' })
  .derive(() => ({ db: getDb() }))
  .get('/builds/:id/parts', async ({ db, params }) => {
    return buildPartsService.listByBuildId(db, params.id)
  }, {
    params: idParam,
  })
  .post('/builds/:id/parts', async ({ db, params, body, set }) => {
    const buildExists = await buildPartsService.requireBuildExists(db, params.id)
    if (!buildExists) return notFound(set, 'Build')
    const result = await buildPartsService.addBuildPart(db, params.id, body as Record<string, unknown>)
    if (!result) return badRequest(set, 'Invalid component or provide partId (catalog) or customName (custom part)')
    return { ...result.row, part: result.part }
  }, {
    params: idParam,
    body: createBuildPartBody,
    response: { 200: t.Any(), 400: errorResponse, 404: errorResponse },
  })
  .patch('/builds/:id/parts/:rowId', async ({ db, params, body, set }) => {
    const existing = await buildPartsService.getBuildPartByRowId(db, params.id, params.rowId)
    if (!existing) return notFound(set, 'Build part')
    const row = await buildPartsService.updateBuildPart(db, params.id, params.rowId, body as Record<string, unknown>)
    return row ?? existing
  }, {
    params: buildPartRowIdParam,
    body: updateBuildPartBody,
    response: { 200: t.Any(), 404: errorResponse },
  })
  .delete('/builds/:id/parts/:rowId', async ({ db, params, set }) => {
    const ok = await buildPartsService.removeBuildPart(db, params.id, params.rowId)
    if (!ok) return notFound(set, 'Build part')
    return { deleted: true as const }
  }, {
    params: buildPartRowIdParam,
    response: { 200: t.Object({ deleted: t.Literal(true) }), 404: errorResponse },
  })
