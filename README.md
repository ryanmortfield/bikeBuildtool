# Bike Build Tool

Plan custom bike builds: track parts, compatibility, weight, price, and chat with an AI assistant (Vertex AI Agent Engine). Frontend on **Cloudflare Pages**, API on **Cloudflare Workers**, DB on **D1**.

## Repo layout

- **`app/`** – Vite + React + Tailwind (deploy to Cloudflare Pages).
- **`server/`** – Elysia on Cloudflare Workers + D1 (deploy with Wrangler).
- **`agent/`** – Python ADK for Vertex AI Agent Engine (separate deploy; add later).

## Local dev

1. **Install dependencies** (from repo root):

   ```bash
   npm install
   ```

2. **Run the API** (Worker):

   ```bash
   npm run dev:server
   ```

   API: http://localhost:8787  
   - `GET /` – hello  
   - `GET /api/health` – health check  

3. **Run the app** (Vite):

   ```bash
   npm run dev:app
   ```

   App: http://localhost:5173 (proxies `/api` to the Worker).

## Create D1 and deploy (Wrangler)

1. **Create a D1 database** (once):

   ```bash
   cd server
   npx wrangler d1 create bike-build-db
   ```

   Copy the `database_id` from the output.

2. **Put the ID in `server/wrangler.toml`**:

   In `[[d1_databases]]`, set `database_id = "YOUR_DATABASE_ID"` (replace `REPLACE_AFTER_D1_CREATE`). Deploy will fail until this is a real D1 database ID.

3. **Log in to Cloudflare** (if needed):

   ```bash
   npx wrangler login
   ```

4. **Deploy the Worker**:

   ```bash
   cd server
   npx wrangler deploy
   ```

   You’ll get a URL like `https://bike-build-api.<your-subdomain>.workers.dev`.

## Deploy the frontend (Pages)

1. Push this repo to **GitHub**.
2. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select this repo; set **Build configuration**:
   - **Framework preset**: Vite  
   - **Root directory**: `app`  
   - **Build command**: `npm run build` (or `npm ci && npm run build` if you use root install)  
   - **Build output directory**: `dist`  
4. Add **Environment variable** `VITE_API_URL` = your Worker URL (e.g. `https://bike-build-api.<subdomain>.workers.dev`) if the app uses it.
5. Deploy. Your app will be at `https://<project>.pages.dev`.

## Authentication (Clerk) – save builds per user

The app uses **Clerk** for sign-in/sign-up so users can save builds and see them on another device. Without Clerk configured, the app still works with anonymous builds (no account).

**→ Full step-by-step with links:** [docs/CLERK_SETUP.md](docs/CLERK_SETUP.md)

**Short version:** Create an app at [dashboard.clerk.com](https://dashboard.clerk.com) → get **publishable** and **secret** keys → put `VITE_CLERK_PUBLISHABLE_KEY` in `app/.env` and `CLERK_SECRET_KEY` in `server/.dev.vars` (local) or `npx wrangler secret put CLERK_SECRET_KEY` (production) → run `cd server && npm run db:migrate:local`.

## Next steps

- Add Drizzle schema and migrations for `builds`, `parts`, `build_parts` in `server/`.
- Point the app’s API base URL at the deployed Worker (env or build-time).
- Add the Python ADK agent and deploy to Vertex AI Agent Engine.


