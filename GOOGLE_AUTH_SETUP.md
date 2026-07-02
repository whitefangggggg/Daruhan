# Google sign-in — Daruhan (from scratch)

The **Continue with Google** button in the app talks to **your Daruhan Supabase project only**.  
Nothing in the frontend code is tied to PaddleHub or any other client.

Google credentials live in **two dashboards** (not in this repo):

| Where | What you create |
|-------|-----------------|
| **Google Cloud Console** | New OAuth client for *Daruhan* |
| **Supabase (Daruhan project)** | Paste that client ID + secret |

If Supabase still has Google credentials from another project, **replace them** — do not reuse the old PaddleHub Google app.

---

## Your Daruhan Supabase project

From `.env.local`:

| | Value |
|---|--------|
| **Project ref** | `pvjvpbffrcrdwqxewuxa` |
| **Project URL** | `https://pvjvpbffrcrdwqxewuxa.supabase.co` |

**Google redirect URI** (copy exactly into Google Cloud):

```
https://pvjvpbffrcrdwqxewuxa.supabase.co/auth/v1/callback
```

**Supabase app callback URLs** (Authentication → URL configuration → Redirect URLs):

```
http://localhost:5173/auth/callback
```

Add your production URL when you deploy, e.g.:

```
https://your-site.netlify.app/auth/callback
```

---

## Step 1 — Google Cloud Console (new project)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Top bar → **Select a project** → **New project**
   - Name: `Daruhan` (or `Daruhan Gighub`)
   - Create
3. Make sure **Daruhan** is the active project

### 1a. OAuth consent screen

**APIs & Services → OAuth consent screen**

| Field | Value |
|-------|--------|
| User type | **External** |
| App name | `Daruhan` |
| User support email | Your email |
| Developer contact | Your email |

- **Scopes:** click Edit → add only `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid` (or leave defaults Supabase uses)
- **Test users:** while status is **Testing**, add every Gmail you want to test with (e.g. yours + the venue owner’s)

Save.

### 1b. OAuth client ID

**APIs & Services → Credentials → Create credentials → OAuth client ID**

| Field | Value |
|-------|--------|
| Application type | **Web application** |
| Name | `Daruhan Web` |

**Authorized JavaScript origins** — Add:

```
http://localhost:5173
```

(Add production origin later, e.g. `https://your-site.netlify.app`)

**Authorized redirect URIs** — Add **only** this Supabase URL:

```
https://pvjvpbffrcrdwqxewuxa.supabase.co/auth/v1/callback
```

> Do **not** put `http://localhost:5173/auth/callback` here. Google sends users to Supabase first; Supabase then sends them to your app.

Click **Create** → copy:

- **Client ID** (ends in `.apps.googleusercontent.com`)
- **Client secret**

Keep the secret private.

---

## Step 2 — Supabase Dashboard (Daruhan project)

Open [supabase.com/dashboard](https://supabase.com/dashboard) → project **pvjvpbffrcrdwqxewuxa**.

### 2a. Clear old Google config (if any)

**Authentication → Providers → Google**

- If Client ID / Secret are filled from another project → **clear them**
- Toggle off, save, then continue below

### 2b. Enable Google with new credentials

**Authentication → Providers → Google**

| Field | Value |
|-------|--------|
| Enable | **On** |
| Client ID | Paste from Google Cloud |
| Client Secret | Paste from Google Cloud |

Save.

### 2c. URL configuration

**Authentication → URL configuration**

| Field | Value |
|-------|--------|
| **Site URL** | `http://localhost:5173` (change to production URL when live) |
| **Redirect URLs** | `http://localhost:5173/auth/callback` (+ production `/auth/callback` when deployed) |

---

## Step 3 — Run migrations (if not done yet)

Google sign-in still needs the `profiles` table + trigger. In **SQL Editor**, run in order:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_functions_rls.sql`
3. `supabase/migrations/003_rpc_triggers.sql`
4. `supabase/seed.sql`

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

---

## Step 4 — Test locally

```bash
npm run dev
```

1. Open `http://localhost:5173/login`
2. **Continue with Google**
3. Pick a **test user** Gmail (must be listed while app is in Testing)
4. You should land on `/auth/callback` → onboarding (first time) → `/home`

If you tried to open `/book` first, you should end up on `/book` after onboarding.

---

## Flow diagram

```
Login page
    → Google account picker
    → Supabase (pvjvpbffrcrdwqxewuxa.supabase.co)
    → /auth/callback (your app)
    → /onboarding (new users)
    → /book or /home
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` | Google redirect URI must be exactly `https://pvjvpbffrcrdwqxewuxa.supabase.co/auth/v1/callback` |
| `Provider is not enabled` | Turn on Google in **this** Supabase project and save |
| `access_denied` | User not in **Test users** list (while app is Testing) |
| Signs into wrong / empty data | `.env.local` must point at `pvjvpbffrcrdwqxewuxa` — restart `npm run dev` after changes |
| Button redirects then fails | Add `http://localhost:5173/auth/callback` to Supabase **Redirect URLs** |
| `PKCE code verifier not found` | Don’t refresh `/auth/callback`. Go to `/login` and tap **Continue with Google** again in the **same browser tab**. Avoid starting sign-in in one tab and finishing in another. |

---

## Before public launch

1. Add production domain to Google **JavaScript origins** + Supabase **Redirect URLs**
2. Google Cloud → OAuth consent screen → **Publish app** (move out of Testing)
3. Set Supabase **Site URL** to your live domain

Never commit `.env.local`, Google Client Secret, or Supabase `service_role` key.
