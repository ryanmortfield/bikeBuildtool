# Clerk setup – step-by-step

## 1. Create a Clerk account and application

- **Sign up / log in:** https://dashboard.clerk.com  
- **Create an application:** Dashboard → **Add application** → name it (e.g. “Bike Build Tool”) → Create.  
- **Choose sign-in options:** You can use **Email** (with password) and/or **Social** (Google, GitHub, etc.). The defaults are enough for basic auth.

## 2. Get your API keys

- In the Clerk Dashboard, open your application.  
- Go to **Configure** → **API Keys** (or **API Keys** in the sidebar).  
- You’ll see:
  - **Publishable key** – starts with `pk_test_` (dev) or `pk_live_` (prod). Safe to use in the frontend.  
  - **Secret key** – starts with `sk_test_` or `sk_live_`. **Never** put this in frontend code or commit it.

**Links:**
- Dashboard: https://dashboard.clerk.com  
- API Keys (when in an app): https://dashboard.clerk.com/last-active?path=api-keys  

## 3. Configure the app (frontend)

- In the **`app/`** folder, create a file named **`.env`** (or add to it):

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

- Replace with your real **publishable** key from step 2.  
- Restart the Vite dev server if it’s already running (`npm run dev:app`).

**Deployed app (GitHub Actions → Cloudflare Pages):**

The build runs in GitHub Actions, so the publishable key must be available there. Add a **repository secret**:

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Name: `VITE_CLERK_PUBLISHABLE_KEY`, Value: your publishable key (e.g. `pk_test_...`).
3. Re-run or push to trigger a new deploy; the workflow will pass this into the build.

(If you deploy via Cloudflare’s “Connect to Git” instead of GitHub Actions, set `VITE_CLERK_PUBLISHABLE_KEY` in the Pages project → **Settings** → **Environment variables**.)

## 4. Configure the server (backend)

The API needs the **secret** key to verify JWTs. It must not be committed to git.

**Local dev:**

- In the **`server/`** folder, create **`.dev.vars`** (or add to it):

```env
CLERK_SECRET_KEY=your_secret_key_from_clerk_dashboard
```

- Replace with your real **secret** key.  
- Add `server/.dev.vars` to **`.gitignore`** if it isn’t already (so the secret is never committed).

**Production (Cloudflare Worker):**

Use this only when you want your **deployed** Worker (on Cloudflare) to verify Clerk JWTs. It does **not** affect local dev (local dev uses `server/.dev.vars`).

1. Open a terminal and go to the **server** folder (where `wrangler.toml` lives). From the repo root:
   ```bash
   cd server
   ```
   If you run the command from the repo root or `app/`, Wrangler will error with "Required Worker name missing".
2. Run:
   ```bash
   npx wrangler secret put CLERK_SECRET_KEY
   ```
3. Wrangler will prompt: **“Enter a secret value for CLERK_SECRET_KEY”**. Paste your Clerk **secret** key (e.g. `sk_test_...` or `sk_live_...`) and press Enter. The value is not shown as you type.
4. The secret is stored in Cloudflare for this Worker. Your next deploy will have access to it via `env.CLERK_SECRET_KEY`.

You must be logged in to Cloudflare (`npx wrangler login`) and have deployed this Worker at least once before setting secrets.

## 5. Run the database migration

Builds are linked to users via a `user_id` column. Apply the migration once:

**Local D1:**

```bash
cd server
npm run db:migrate:local
```

**Remote D1 (production):**

```bash
cd server
npm run db:migrate
```

## 6. Test it

1. Start the API: from repo root, `npm run dev:server`.  
2. Start the app: `npm run dev:app`.  
3. Open http://localhost:5173 – you should see **Sign in** / **Sign up** in the header.  
4. Sign up with email (and password), then create a build – it will be tied to your account. Sign out and sign back in to confirm your builds still show.

---

## Optional: allowlisted redirect URLs (production)

When you deploy the app to a real URL (e.g. Cloudflare Pages):

- In Clerk Dashboard → **Configure** → **Paths** (or **Domains**), add your production app URL (e.g. `https://your-app.pages.dev`) to the allowlist so redirects after sign-in/sign-up work.

---

## Quick reference

| What        | Where / command |
|------------|------------------|
| Clerk Dashboard | https://dashboard.clerk.com |
| API Keys   | Dashboard → your app → **API Keys** |
| Frontend key | `app/.env` → `VITE_CLERK_PUBLISHABLE_KEY=pk_...` |
| Backend key (local) | `server/.dev.vars` → `CLERK_SECRET_KEY=sk_...` |
| Backend key (prod) | From `server/`: `npx wrangler secret put CLERK_SECRET_KEY` → paste secret when prompted |
| Migration  | `cd server && npm run db:migrate:local` (or `db:migrate`) |
