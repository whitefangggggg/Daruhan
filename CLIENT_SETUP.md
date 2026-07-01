# New client setup checklist (frontend)

Use this when branding the UI for a new venue.  
**Backend / database** — SQL migrations live in `supabase/` (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)).

---

## 1. Repository

- [ ] Duplicate or clone this repo into a new folder / remote for the client
- [ ] Update `package.json` `name` if desired (optional)

---

## 2. Branding (`src/config/site.js`)

Edit **`src/config/site.js`** — the main switch for a new venue:

| Field | What to change |
|--------|----------------|
| `name` | Short brand (navbar, login) |
| `legalName` | Footer / copyright |
| `slug` | Payment QR demo payload prefix |
| `storagePrefix` | Session keys prefix (unique lowercase slug per client) |
| `venue.courtCount` / `maxCourtQuantity` | How many courts they have |
| `venue.hoursLabel` / `cityLine` | e.g. `Open 24/7`, `Cebu City` |
| `contact.*` | Email, Facebook, address, Waze, Maps links |
| `features.*` | Toggle open play, trainer, multi-court booking |
| `copy.*` | Hero, footer, about blurb strings |

Also update manually:

- [ ] **`index.html`** — `<title>` and favicon (`public/logo.png`)
- [ ] **`src/assets/logo.png`** (and any hero images on Landing)
- [ ] **`src/pages/Landing.jsx`** — marketing sections, feature cards, photos
- [ ] **`src/content/userGuide.js`** and **`adminGuide.js`** — help copy
- [ ] Search repo for old venue name (e.g. `PaddleHub`, old city, old email)

---

## 3. Pricing (UI)

**Frontend display rates** — `src/lib/pricing.js`  
Shown in the booking grid and review step.

**Trainer rate (UI)** — `src/utils/parseBookingNotes.js` → `TRAINER_RATE`

Server-side totals must match whatever the separate backend enforces.

---

## 4. Environment

- [ ] Copy `.env.example` → `.env.local` (dev) and set hosting env vars (prod):

```env
VITE_SUPABASE_URL=https://YOUR_API_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Point these at the **backend project** for this client. Never put `service_role` in the frontend.

---

## 5. Deploy

- [ ] Deploy to Netlify / Vercel (or similar)
- [ ] Add deploy URL to backend Auth redirect allowlist (handled in the backend project)

---

## 6. Smoke test (against live backend)

- [ ] Register → onboarding → book court (all wizard steps)
- [ ] Hold created → submit payment reference
- [ ] Admin: verify payment → booking confirmed
- [ ] Cancel booking (user + admin)
- [ ] Open play post (if enabled)

---

## Quick file map

| Purpose | Location |
|---------|----------|
| Brand & contact | `src/config/site.js` |
| Hourly rates (UI) | `src/lib/pricing.js` |
| Trainer rate (UI) | `src/utils/parseBookingNotes.js` |
| Landing marketing | `src/pages/Landing.jsx` |
| Player / admin help | `src/content/userGuide.js`, `adminGuide.js` |
| API client | `src/lib/supabaseClient.js` |
