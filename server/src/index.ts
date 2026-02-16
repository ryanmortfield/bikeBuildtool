import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'
import { COMPONENTS } from './db/components'

const getDb = () => drizzle(env.DB, { schema })

export default new Elysia({
  adapter: CloudflareAdapter,
})
  .derive(() => ({ db: getDb() }))
  .get('/', () => ({ ok: true, message: 'Bike Build API' }))
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .get('/api/components', () => COMPONENTS)
  .compile()
