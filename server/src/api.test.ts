import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp } from './index'
import * as buildsService from './services/builds'
import * as partsService from './services/parts'
import * as buildPartsService from './services/build-parts'

vi.mock('./services/builds')
vi.mock('./services/parts')
vi.mock('./services/build-parts')

/** Create app with a no-op getDb (services are mocked). */
const getDb = () => ({} as ReturnType<typeof import('drizzle-orm/d1').drizzle>)

describe('API', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.mocked(buildsService.listBuilds).mockResolvedValue([])
    vi.mocked(buildsService.getBuildById).mockResolvedValue(null)
    vi.mocked(partsService.listParts).mockResolvedValue([])
    vi.mocked(partsService.getPartById).mockResolvedValue(null)
    vi.mocked(buildPartsService.listByBuildId).mockResolvedValue([])
    vi.mocked(buildPartsService.requireBuildExists).mockResolvedValue(false)
    vi.mocked(buildPartsService.getBuildPartByRowId).mockResolvedValue(null)
    app = createApp(getDb)
  })

  describe('root and health', () => {
    it('GET / returns ok and message', async () => {
      const res = await app.handle(new Request('http://localhost/'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({ ok: true, message: 'Bike Build API' })
    })

    it('GET /api/health returns status and timestamp', async () => {
      const res = await app.handle(new Request('http://localhost/api/health'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('ok')
      expect(typeof body.timestamp).toBe('string')
    })

    it('GET /api/components returns component list', async () => {
      const res = await app.handle(new Request('http://localhost/api/components'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThan(0)
      expect(body[0]).toHaveProperty('key')
      expect(body[0]).toHaveProperty('label')
      expect(body[0]).toHaveProperty('group')
    })
  })

  describe('builds', () => {
    it('GET /api/builds returns list from service', async () => {
      const fakeBuild = {
        id: 'id-1',
        name: 'Test',
        bikeType: 'road',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(buildsService.listBuilds).mockResolvedValue([fakeBuild])
      const res = await app.handle(new Request('http://localhost/api/builds'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveLength(1)
      expect(body[0].name).toBe('Test')
    })

    it('POST /api/builds calls createBuild and returns build', async () => {
      const created = {
        id: 'new-id',
        name: 'New Build',
        bikeType: 'gravel',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(buildsService.createBuild).mockResolvedValue(created)
      const res = await app.handle(
        new Request('http://localhost/api/builds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Build', bikeType: 'gravel' }),
        })
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.id).toBe('new-id')
      expect(body.name).toBe('New Build')
      expect(buildsService.createBuild).toHaveBeenCalledWith(expect.anything(), {
        name: 'New Build',
        bikeType: 'gravel',
        userId: null,
      })
    })

    it('GET /api/builds/:id returns 404 when build not found', async () => {
      vi.mocked(buildsService.getBuildById).mockResolvedValue(null)
      const res = await app.handle(new Request('http://localhost/api/builds/unknown-id'))
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toContain('not found')
    })

    it('GET /api/builds/:id returns build when found', async () => {
      const build = {
        id: 'b-1',
        name: 'My Build',
        bikeType: 'mtb',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(buildsService.getBuildById).mockResolvedValue(build)
      const res = await app.handle(new Request('http://localhost/api/builds/b-1'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.id).toBe('b-1')
      expect(body.name).toBe('My Build')
    })

    it('PATCH /api/builds/:id returns 404 when build not found', async () => {
      vi.mocked(buildsService.getBuildById).mockResolvedValue(null)
      const res = await app.handle(
        new Request('http://localhost/api/builds/unknown', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated' }),
        })
      )
      expect(res.status).toBe(404)
    })

    it('DELETE /api/builds/:id returns 404 when build not found', async () => {
      vi.mocked(buildsService.deleteBuild).mockResolvedValue(false)
      const res = await app.handle(new Request('http://localhost/api/builds/unknown', { method: 'DELETE' }))
      expect(res.status).toBe(404)
    })

    it('DELETE /api/builds/:id returns 200 and deleted when found', async () => {
      vi.mocked(buildsService.deleteBuild).mockResolvedValue(true)
      const res = await app.handle(new Request('http://localhost/api/builds/b-1', { method: 'DELETE' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.deleted).toBe(true)
    })
  })

  describe('parts', () => {
    it('GET /api/parts returns list from service', async () => {
      const fakePart = {
        id: 'p-1',
        name: 'Crankset',
        component: 'crankset',
        weightG: 500,
        price: 199,
        currency: 'USD',
        sourceUrl: null,
        sourceName: null,
        compatibilityTags: null,
        notes: null,
        cranksetComponentType: null,
        handlebarsStemComponentType: null,
        createdAt: new Date(),
      }
      vi.mocked(partsService.listParts).mockResolvedValue([fakePart])
      const res = await app.handle(new Request('http://localhost/api/parts'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveLength(1)
      expect(body[0].component).toBe('crankset')
    })

    it('GET /api/parts?component=frame passes component to service', async () => {
      await app.handle(new Request('http://localhost/api/parts?component=frame'))
      expect(partsService.listParts).toHaveBeenCalledWith(expect.anything(), 'frame')
    })

    it('POST /api/parts returns 400 when createPart returns null', async () => {
      vi.mocked(partsService.createPart).mockResolvedValue(null)
      const res = await app.handle(
        new Request('http://localhost/api/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Part', component: 'invalid' }),
        })
      )
      expect(res.status).toBe(400)
    })

    it('GET /api/parts/:id returns 404 when not found', async () => {
      vi.mocked(partsService.getPartById).mockResolvedValue(null)
      const res = await app.handle(new Request('http://localhost/api/parts/unknown'))
      expect(res.status).toBe(404)
    })

    it('DELETE /api/parts/:id returns 200 when deletePart returns true', async () => {
      vi.mocked(partsService.deletePart).mockResolvedValue(true)
      const res = await app.handle(new Request('http://localhost/api/parts/p-1', { method: 'DELETE' }))
      expect(res.status).toBe(200)
      expect((await res.json()).deleted).toBe(true)
    })
  })

  describe('build-parts', () => {
    it('GET /api/builds/:id/parts returns list from service', async () => {
      vi.mocked(buildPartsService.listByBuildId).mockResolvedValue([
        { id: 'bp-1', buildId: 'b-1', component: 'frame', partId: null, quantity: 1, notes: null, customName: 'TBD', customWeightG: null, customPrice: null, customCurrency: null, part: null },
      ])
      const res = await app.handle(new Request('http://localhost/api/builds/b-1/parts'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveLength(1)
      expect(body[0].component).toBe('frame')
      expect(body[0].customName).toBe('TBD')
    })

    it('POST /api/builds/:id/parts returns 404 when build does not exist', async () => {
      vi.mocked(buildPartsService.requireBuildExists).mockResolvedValue(false)
      const res = await app.handle(
        new Request('http://localhost/api/builds/unknown/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ component: 'frame', customName: 'TBD' }),
        })
      )
      expect(res.status).toBe(404)
    })

    it('POST /api/builds/:id/parts returns 400 when addBuildPart returns null', async () => {
      vi.mocked(buildPartsService.requireBuildExists).mockResolvedValue(true)
      vi.mocked(buildPartsService.addBuildPart).mockResolvedValue(null)
      const res = await app.handle(
        new Request('http://localhost/api/builds/b-1/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ component: 'frame' }),
        })
      )
      expect(res.status).toBe(400)
    })

    it('POST /api/builds/:id/parts returns 200 and row when addBuildPart succeeds', async () => {
      vi.mocked(buildPartsService.requireBuildExists).mockResolvedValue(true)
      vi.mocked(buildPartsService.addBuildPart).mockResolvedValue({
        row: {
          id: 'bp-1',
          buildId: 'b-1',
          component: 'frame',
          partId: null,
          quantity: 1,
          notes: null,
          customName: 'TBD',
          customWeightG: null,
          customPrice: null,
          customCurrency: null,
        },
        part: null,
      })
      const res = await app.handle(
        new Request('http://localhost/api/builds/b-1/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ component: 'frame', customName: 'TBD' }),
        })
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.component).toBe('frame')
      expect(body.customName).toBe('TBD')
    })

    it('PATCH /api/builds/:id/parts/:rowId returns 404 when build part not found', async () => {
      vi.mocked(buildPartsService.getBuildPartByRowId).mockResolvedValue(null)
      const res = await app.handle(
        new Request('http://localhost/api/builds/b-1/parts/bp-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customName: 'Updated' }),
        })
      )
      expect(res.status).toBe(404)
    })

    it('DELETE /api/builds/:id/parts/:rowId returns 404 when removeBuildPart returns false', async () => {
      vi.mocked(buildPartsService.removeBuildPart).mockResolvedValue(false)
      const res = await app.handle(new Request('http://localhost/api/builds/b-1/parts/bp-1', { method: 'DELETE' }))
      expect(res.status).toBe(404)
    })

    it('DELETE /api/builds/:id/parts/:rowId returns 200 when removeBuildPart returns true', async () => {
      vi.mocked(buildPartsService.removeBuildPart).mockResolvedValue(true)
      const res = await app.handle(new Request('http://localhost/api/builds/b-1/parts/bp-1', { method: 'DELETE' }))
      expect(res.status).toBe(200)
      expect((await res.json()).deleted).toBe(true)
    })
  })
})
