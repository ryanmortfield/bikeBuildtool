import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'
import { createApp } from './index'

const getDb = () => drizzle(env.DB, { schema })
export default createApp(getDb)
