/** Generate a new UUID for entity primary keys. Single place for ID creation (DRY). */
export function createId(): string {
  return crypto.randomUUID()
}
