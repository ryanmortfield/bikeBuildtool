import type { Context } from 'elysia'

/** Set status and return standard error body. Use for 404/400 to keep responses DRY. */
export function notFound(set: Context['set'], resource: string) {
  set.status = 404
  return { error: `${resource} not found` }
}

/** Set status and return standard error body for client errors. */
export function badRequest(set: Context['set'], message: string) {
  set.status = 400
  return { error: message }
}
