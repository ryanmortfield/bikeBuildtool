import { verifyToken } from '@clerk/backend'

/**
 * Extract optional Clerk user id from request.
 * Reads Authorization: Bearer <token> and verifies with CLERK_SECRET_KEY.
 * Returns null if no token, invalid token, or secret not configured.
 */
export async function getUserIdFromRequest(
  authorization: string | undefined,
  clerkSecretKey: string | undefined
): Promise<string | null> {
  if (!clerkSecretKey?.trim()) return null
  const raw = authorization?.trim()
  if (!raw?.startsWith('Bearer ')) return null
  const token = raw.slice(7).trim()
  if (!token) return null
  try {
    const { sub } = await verifyToken(token, {
      secretKey: clerkSecretKey,
      authorizedParties: undefined, // optional: set to your frontend origins in production
    })
    return sub ?? null
  } catch {
    return null
  }
}
