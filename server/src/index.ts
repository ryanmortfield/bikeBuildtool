import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import * as schema from './db/schema'
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
