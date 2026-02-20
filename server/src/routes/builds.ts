import { Elysia, t } from 'elysia'
import * as buildsService from '../services/builds'
import { getScaffold, createGroup, reorderSlots } from '../services/scaffold'
import { getUserIdFromRequest } from '../lib/auth'
import { notFound } from '../lib/responses'
import { createBuildBody, updateBuildBody, createGroupBody, reorderSlotsBody, idParam, errorResponse } from '../schemas/api'
import type { AppDb } from '../services/builds'

/** Builds CRUD. Resolves optional userId from Clerk JWT; scopes list/create/mutate by user. */
export const buildsRoutes = (
  getDb: () => AppDb,
  getClerkSecretKey: () => string | undefined
) =>
  new Elysia({ prefix: '/api' })
    .derive(() => ({ db: getDb() }))
    .resolve(async ({ request }) => {
      const auth = (request as Request).headers?.get?.('Authorization')
      const userId = await getUserIdFromRequest(auth ?? undefined, getClerkSecretKey())
      return { userId: userId ?? null }
    })
    .get('/builds', async ({ db, userId }) => {
      return buildsService.listBuilds(db, userId)
    })
    .post('/builds', async ({ db, userId, body, set }) => {
      const name = body.name ?? 'Untitled Build'
      const bikeType = body.bikeType ?? body.bike_type ?? 'road'
      const row = await buildsService.createBuild(db, {
        name: String(name),
        bikeType: String(bikeType),
        userId,
      })
      return row
    }, {
      body: createBuildBody,
      response: { 200: t.Any(), 400: errorResponse },
    })
    .get('/builds/:id', async ({ db, userId, params, set }) => {
      const row = await buildsService.getBuildById(db, params.id)
      if (!row) return notFound(set, 'Build')
      if (row.userId && row.userId !== userId) return notFound(set, 'Build')
      return row
    }, {
      params: idParam,
      response: { 200: t.Any(), 404: errorResponse },
    })
    .get('/builds/:id/scaffold', async ({ db, userId, params, set }) => {
      const build = await buildsService.getBuildById(db, params.id)
      if (!build) return notFound(set, 'Build')
      if (build.userId && build.userId !== userId) return notFound(set, 'Build')
      return getScaffold(db, params.id)
    }, {
      params: idParam,
      response: { 200: t.Any(), 404: errorResponse },
    })
    .post('/builds/:id/groups', async ({ db, userId, params, body, set }) => {
      const build = await buildsService.getBuildById(db, params.id)
      if (!build) return notFound(set, 'Build')
      if (build.userId && build.userId !== userId) return notFound(set, 'Build')
      const group = await createGroup(db, params.id, {
        name: body.name,
        slotIds: body.slotIds,
      })
      if (!group) {
        set.status = 400
        return { error: 'Invalid name or slotIds' }
      }
      return group
    }, {
      params: idParam,
      body: createGroupBody,
      response: { 200: t.Object({ id: t.String(), name: t.String() }), 400: t.Object({ error: t.String() }), 404: errorResponse },
    })
    .put('/builds/:id/categories/:categoryId/slots/reorder', async ({ db, userId, params, body, set }) => {
      const build = await buildsService.getBuildById(db, params.id)
      if (!build) return notFound(set, 'Build')
      if (build.userId && build.userId !== userId) return notFound(set, 'Build')
      const ok = await reorderSlots(db, params.id, params.categoryId, body.slotIds)
      if (!ok) {
        set.status = 400
        return { error: 'Invalid category or slotIds' }
      }
      return { ok: true as const }
    }, {
      params: t.Object({ id: t.String(), categoryId: t.String() }),
      body: reorderSlotsBody,
      response: { 200: t.Object({ ok: t.Literal(true) }), 400: t.Object({ error: t.String() }), 404: errorResponse },
    })
    .patch('/builds/:id', async ({ db, userId, params, body, set }) => {
      const existing = await buildsService.getBuildById(db, params.id)
      if (!existing) return notFound(set, 'Build')
      const updates = { name: body.name, bikeType: body.bikeType ?? body.bike_type }
      const row = await buildsService.updateBuild(
        db,
        params.id,
        updates as { name?: string; bikeType?: string },
        userId
      )
      if (!row) return notFound(set, 'Build')
      return row
    }, {
      params: idParam,
      body: updateBuildBody,
      response: { 200: t.Any(), 404: errorResponse },
    })
    .delete('/builds/:id', async ({ db, userId, params, set }) => {
      const ok = await buildsService.deleteBuild(db, params.id, userId)
      if (!ok) return notFound(set, 'Build')
      return { deleted: true as const }
    }, {
      params: idParam,
      response: { 200: t.Object({ deleted: t.Literal(true) }), 404: errorResponse },
    })
