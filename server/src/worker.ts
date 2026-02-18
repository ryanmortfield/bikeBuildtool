import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'
import { createApp } from './index'

const getDb = () => drizzle(env.DB, { schema })
const getClerkSecretKey = () => (env as { CLERK_SECRET_KEY?: string }).CLERK_SECRET_KEY
export default createApp(getDb, getClerkSecretKey)
