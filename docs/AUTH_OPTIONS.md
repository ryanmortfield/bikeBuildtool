# Auth options evaluation (React + Cloudflare Workers + D1)

**Note:** This doc was added after implementing Clerk. For future features, evaluate options (pricing, fit, lock-in) before implementing.

---

## Current choice: Clerk

- **Free tier (Hobby):** Yes. No credit card. **50,000 MRU** (monthly retained users) per app, unlimited applications, prebuilt UIs, 7-day session lifetime.
- **Paid:** Pro from $20/mo (custom session, MFA, remove branding, etc.).
- **Fit:** React components (SignIn, SignUp, UserButton), JWT verification in Workers via `@clerk/backend`. No user DB to run; Clerk hosts identities.
- **Basic auth:** Prebuilt flows include email/password sign-up, sign-in, and **forgot password** (reset link/code). **Social login** (Google, GitHub, etc.) is available in the free tier; **Enterprise SSO** (SAML/OIDC) is a paid add-on.
- **Lock-in:** User identities live in Clerk; export available. API is standard JWT verification, so swapping the frontend auth provider later is feasible if we keep the same `userId` concept.

**Verdict:** Free for typical side projects and MVPs. Implementation is already done; no need to change unless you want to avoid a third-party user store or reduce vendor dependency.

---

## Alternatives (for future reference)

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **Better Auth** | Free (open source) | Full control, users in your DB (D1), no vendor. OAuth, email magic links, etc. | More setup; Workers + D1 need per-request auth instance (no global DB at init). Community examples exist (e.g. better-auth-cloudflare). |
| **Auth0** | Free: 25k MAU (2024) | Mature, many integrations | Another vendor; React SDK; slightly heavier than Clerk for “just email + social”. |
| **Supabase Auth** | Free tier (50k MAU) | Good DX, open source | You’re on D1, not Supabase; would add Supabase only for auth or move DB. |
| **Custom (Workers + D1)** | Free | No vendor, users in D1, full control | Most work: sessions, password hashing, optional OAuth, secure cookies. |
| **Cloudflare Access** | Paid (Zero Trust) | Good for protecting *apps* (e.g. internal) | Not aimed at “sign up and save my builds”; no self-service user accounts. |

---

## Recommendation

- **Keep Clerk** if you’re fine with a hosted identity provider and want minimal ongoing maintenance; the free tier is sufficient for this app.
- **Consider Better Auth** (or custom) later if you want users and sessions entirely in your own D1 and no third-party user store.

When adding other major features, do a short options/evaluation step (like this doc) before coding.
