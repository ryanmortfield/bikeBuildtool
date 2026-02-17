import { Elysia, t } from 'elysia'
import * as buildsService from '../services/builds'
import { notFound } from '../lib/responses'
import { createBuildBody, updateBuildBody, idParam, errorResponse } from '../schemas/api'
import type { AppDb } from '../services/builds'

/** Builds CRUD. Thin HTTP layer: validate, call service, map to response (SOLID: single responsibility). */
export const buildsRoutes = (getDb: () => AppDb) =>
  new Elysia({ prefix: '/api' })
  .derive(() => ({ db: getDb() }))
  .get('/builds', async ({ db }) => {
    return buildsService.listBuilds(db)
  })
  .post('/builds', async ({ db, body, set }) => {
    const name = body.name ?? 'Untitled Build'
    const bikeType = body.bikeType ?? body.bike_type ?? 'road'
    const row = await buildsService.createBuild(db, { name: String(name), bikeType: String(bikeType) })
    return row
  }, {
    body: createBuildBody,
    response: { 200: t.Any(), 400: errorResponse },
  })
  .get('/builds/:id', async ({ db, params, set }) => {
    const row = await buildsService.getBuildById(db, params.id)
    if (!row) return notFound(set, 'Build')
    return row
  }, {
    params: idParam,
    response: { 200: t.Any(), 404: errorResponse },
  })
  .patch('/builds/:id', async ({ db, params, body, set }) => {
    const existing = await buildsService.getBuildById(db, params.id)
    if (!existing) return notFound(set, 'Build')
    const updates = { name: body.name, bikeType: body.bikeType ?? body.bike_type }
    const row = await buildsService.updateBuild(db, params.id, updates as { name?: string; bikeType?: string })
    return row ?? existing
  }, {
    params: idParam,
    body: updateBuildBody,
    response: { 200: t.Any(), 404: errorResponse },
  })
  .delete('/builds/:id', async ({ db, params, set }) => {
    const ok = await buildsService.deleteBuild(db, params.id)
    if (!ok) return notFound(set, 'Build')
    return { deleted: true as const }
  }, {
    params: idParam,
    response: { 200: t.Object({ deleted: t.Literal(true) }), 404: errorResponse },
  })
