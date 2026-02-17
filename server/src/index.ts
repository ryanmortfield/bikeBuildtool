import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { openapi } from '@elysiajs/openapi'
import { COMPONENTS } from './db/components'
import { buildsRoutes } from './routes/builds'
import { partsRoutes } from './routes/parts'
import { buildPartsRoutes } from './routes/build-parts'
import type { AppDb } from './services/builds'

/** Create app with injected getDb (allows test DB). Production entry uses worker.ts. */
export function createApp(getDb: () => AppDb) {
  return new Elysia({
    adapter: CloudflareAdapter,
  })
    .use(
      openapi({
        path: '/openapi',
        documentation: {
          info: {
            title: 'Bike Build API',
            description: 'API for the Bike Build Tool: builds, parts catalog, and build-parts (components per build).',
            version: '0.1.0',
          },
          tags: [
            { name: 'Builds', description: 'Build (project) CRUD' },
            { name: 'Parts', description: 'Parts catalog CRUD' },
            { name: 'Build parts', description: 'Parts assigned to a build per component' },
          ],
        },
      })
    )
    .onError(({ code, error, set }) => {
      if (code === 'VALIDATION') {
        set.status = 400
        return { error: error?.message ?? 'Validation failed' }
      }
      throw error
    })
    .get('/', () => ({ ok: true, message: 'Bike Build API' }))
    .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
    .get('/api/components', () => COMPONENTS)
    .use(buildsRoutes(getDb))
    .use(partsRoutes(getDb))
    .use(buildPartsRoutes(getDb))
    .compile()
}
