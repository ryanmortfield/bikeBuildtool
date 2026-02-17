import { Elysia, t } from 'elysia'
import * as partsService from '../services/parts'
import { notFound, badRequest } from '../lib/responses'
import { createPartBody, updatePartBody, listPartsQuery, idParam, errorResponse } from '../schemas/api'
import type { AppDb } from '../services/builds'

/** Parts CRUD. Thin HTTP layer: validate, call service, map to response. */
export const partsRoutes = (getDb: () => AppDb) =>
  new Elysia({ prefix: '/api' })
  .derive(() => ({ db: getDb() }))
  .get('/parts', async ({ db, query }) => {
    const component = query.component
    return partsService.listParts(db, component)
  }, {
    query: listPartsQuery,
  })
  .post('/parts', async ({ db, body, set }) => {
    const part = await partsService.createPart(db, body as Record<string, unknown>)
    if (!part) return badRequest(set, 'Invalid or missing component')
    return part
  }, {
    body: createPartBody,
    response: { 200: t.Any(), 400: errorResponse },
  })
  .get('/parts/:id', async ({ db, params, set }) => {
    const row = await partsService.getPartById(db, params.id)
    if (!row) return notFound(set, 'Part')
    return row
  }, {
    params: idParam,
    response: { 200: t.Any(), 404: errorResponse },
  })
  .patch('/parts/:id', async ({ db, params, body, set }) => {
    const existing = await partsService.getPartById(db, params.id)
    if (!existing) return notFound(set, 'Part')
    const row = await partsService.updatePart(db, params.id, body as Record<string, unknown>)
    return row ?? existing
  }, {
    params: idParam,
    body: updatePartBody,
    response: { 200: t.Any(), 404: errorResponse },
  })
  .delete('/parts/:id', async ({ db, params, set }) => {
    const ok = await partsService.deletePart(db, params.id)
    if (!ok) return notFound(set, 'Part')
    return { deleted: true as const }
  }, {
    params: idParam,
    response: { 200: t.Object({ deleted: t.Literal(true) }), 404: errorResponse },
  })
