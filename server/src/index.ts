import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'

export default new Elysia({
  adapter: CloudflareAdapter,
})
  .get('/', () => ({ ok: true, message: 'Bike Build API' }))
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .compile()
