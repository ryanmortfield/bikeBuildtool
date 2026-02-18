-- Associate builds with users (Clerk user id). Null = anonymous/legacy.
ALTER TABLE builds ADD COLUMN user_id TEXT;
