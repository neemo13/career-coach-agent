# Career Coach

An AI-native web app that analyzes a resume against a job description, runs an agentic
career-coaching workflow, and produces a personalized learning plan.

Full architecture, schema, and design rationale: see `career-coach-phase0-architecture.md`
(kept alongside this repo, not committed inside it, or copy it into `/docs` if you prefer).

---

## Phase 1 — Local Setup (Foundation)

By the end of this phase you will have:
- A Supabase project created
- The backend running locally with a working `/health` and `/health/db` endpoint
- The frontend running locally and successfully calling the backend

### A. Create your Supabase project

1. Go to https://supabase.com and sign in (GitHub login is easiest).
2. Click **New Project**.
   - **Name:** `career-coach` (anything is fine).
   - **Database password:** generate/save a strong one — you won't need it directly for this app (we use API keys instead), but Supabase requires it. Store it somewhere safe anyway.
   - **Region:** pick the one closest to you.
   - **Pricing plan:** Free.
3. Wait ~1-2 minutes while Supabase provisions the project.

### B. Get your API keys

1. In your project, go to **Project Settings** (gear icon, bottom left) → **API** (or **Data API** depending on the current dashboard layout).
2. You need three values:
   - **Project URL** → looks like `https://xxxxxxxx.supabase.co`
   - **anon / public key** → safe to use in the frontend
   - **service_role key** → secret, backend only, never put this in frontend code or commit it
3. Also under **API** → **JWT Settings**, copy the **JWT Secret** (the backend uses this to verify login tokens later in Phase 2).

### C. Create a minimal table to prove the connection works

We'll build the full schema in Phase 2. For now, just enough to verify connectivity:

1. In the Supabase dashboard, open the **SQL Editor** (left sidebar).
2. Click **New query**, paste this, and click **Run**:

```sql
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
```

3. You should see "Success. No rows returned." That table is what `/health/db` checks against.

### D. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and fill in:
```
SUPABASE_URL=<Project URL from step B>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from step B>
SUPABASE_JWT_SECRET=<JWT secret from step B>
```

Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

**Verify it:**
- Open http://localhost:8000/health in your browser → expect `{"status":"ok"}`
- Open http://localhost:8000/health/db → expect `{"status":"ok","rows_returned":0}`
  - If you see `{"status":"error","detail":"..."}`, the detail message tells you exactly what's wrong (usually a wrong URL/key — double check step B).
- Interactive API docs are auto-generated at http://localhost:8000/docs — useful for testing endpoints by hand in later phases.

### E. Frontend setup

Open a **second terminal** (keep the backend running in the first one):

```bash
cd frontend
npm install
cp .env.example .env
```

Open `.env` and fill in:
```
VITE_SUPABASE_URL=<same Project URL as backend>
VITE_SUPABASE_ANON_KEY=<anon public key from step B>
VITE_API_BASE_URL=http://localhost:8000
```

Run it:
```bash
npm run dev
```

**Verify it:**
- Open http://localhost:5173
- You should see "Career Coach — Phase 1 Checkpoint" with:
  - Backend health: **ok**
  - Supabase connection: **ok**

If both say **ok**, Phase 1 is complete and we move to Phase 2 (Authentication + full database schema).

### F. Common issues

| Symptom | Likely cause |
|---|---|
| Backend health is `ok` but DB health shows an error mentioning "relation profiles does not exist" | You skipped step C, or ran it in the wrong project |
| DB health shows an auth/key error | `SUPABASE_SERVICE_ROLE_KEY` is wrong or has extra whitespace when pasted |
| Frontend shows CORS error in browser console | `FRONTEND_ORIGIN` in backend `.env` doesn't match `http://localhost:5173` exactly |
| `npm install` fails on Node version | Use Node 18 or 20 (run `node -v` to check) |

---

---

## Phase 2 — Authentication + Full Database Schema

By the end of this phase you will have: the full schema with RLS, working
email/password sign-up and sign-in, and a protected backend endpoint (`/me`)
that proves a login → JWT → backend-verification round trip.

### A. New Supabase API key system — what changed

Supabase now issues `sb_publishable_...` / `sb_secret_...` keys instead of the
old `anon` / `service_role` JWTs. We kept the same environment variable
*names* from Phase 1 so no code has to change — only the *values*:

| Variable | Old value | New value |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` (backend) | `service_role` JWT | `sb_secret_...` |
| `VITE_SUPABASE_ANON_KEY` (frontend) | `anon` JWT | `sb_publishable_...` |
| `SUPABASE_JWT_SECRET` (backend) | unchanged | unchanged — this is a *separate* setting from the API keys above. It's what signs each user's login session token, and it's what `app/core/security.py` uses to verify that a request really came from a logged-in user. |

Get the new key values from **Project Settings → API Keys**. Get
`SUPABASE_JWT_SECRET` from **Project Settings → Data API → JWT Settings →
Legacy JWT Secret**.

### B. Run the schema migration

1. Open the Supabase **SQL Editor**.
2. Open `backend/supabase/phase2_schema.sql` from this repo, copy its full contents, paste into a new query, and click **Run**.
3. This replaces the Phase 1 smoke-test `profiles` table with the real schema and creates `resumes`, `job_descriptions`, `analyses`, `career_plans`, `coach_messages` — all with Row Level Security enabled.

### C. Data API exposure

Your project has *automatic* table exposure turned off, so every table the
app touches (via either key — backend calls go through the same Data API)
must be explicitly exposed:

1. **Project Settings → Data API → Exposed schemas/tables** (naming may vary slightly by dashboard version).
2. Add: `profiles` (already exposed), `resumes`, `job_descriptions`, `analyses`, `career_plans`, `coach_messages`.

### D. Schema, RLS, and access summary

| Table | Data API exposure | RLS policy | Why | Backend access | Frontend access |
|---|---|---|---|---|---|
| `profiles` | Yes | `select`/`update` where `auth.uid() = id` | A user only ever needs to see/edit their own profile; row is auto-created by a trigger on signup, so no `insert` policy is needed for users | Reads via `/me` to confirm auth | Not accessed directly (goes through backend) |
| `resumes` | Yes | `select`/`insert`/`delete` where `auth.uid() = user_id` | Resumes are private; a user can only ever see or remove their own | Full access (Phase 3 uploads go through the backend, which extracts text first) | Not accessed directly |
| `job_descriptions` | Yes | `select`/`insert`/`delete` where `auth.uid() = user_id` | Same reasoning as resumes | Full access | Not accessed directly |
| `analyses` | Yes | `select`/`insert` where `auth.uid() = user_id` | Analysis results are private and immutable once created (no update/delete policy — re-running analysis creates a new row) | Full access (written by the agent workflow in Phase 5) | Not accessed directly |
| `career_plans` | Yes | `select`/`insert` where `auth.uid() = user_id` | Same reasoning as analyses | Full access | Not accessed directly |
| `coach_messages` | Yes | `select`/`insert` where `auth.uid() = user_id` | Chat history is private per user | Full access | Not accessed directly |

**Design choice:** the frontend never talks to these tables directly with
Supabase's JS client — every read/write for app data goes through the
FastAPI backend, which verifies the JWT first. This is why the frontend only
needs the `publishable` key for *authentication itself* (sign up/sign in),
not for data access. RLS is still enabled on every table as defense-in-depth
in case that ever changes.

### E. Backend setup

```bash
cd backend
source .venv/bin/activate          # if not already active
pip install -r requirements.txt    # picks up supabase==2.31.0 and pyjwt
```

Update your existing `.env` with the new key values (see table in section A) —
don't recreate the file, just edit the two changed lines and confirm
`SUPABASE_JWT_SECRET` is filled in.

```bash
uvicorn app.main:app --reload --port 8000
```

`/health` and `/health/db` should still work exactly as in Phase 1 — that's the "don't break what's working" check.

### F. Frontend setup

```bash
cd frontend
npm install       # picks up @supabase/supabase-js if not already installed
```

Update `.env` with your `sb_publishable_...` key.

```bash
npm run dev
```

### G. Verify Phase 2

1. Open http://localhost:5173 — you should see a **Sign up** / **Sign in** form instead of the Phase 1 checkpoint screen.
2. Sign up with an email + password (6+ characters). Supabase sends a confirmation email by default — check your inbox and confirm, then sign in. *(To skip email confirmation during development: Supabase dashboard → Authentication → Providers → Email → toggle off "Confirm email".)*
3. Once signed in, you should see:
   - Backend health: **ok**
   - Supabase connection: **ok**
   - Signed in as: **your email**
   - Backend auth check (/me): **ok (user_id: ...)**

If `/me` shows an error, check: `SUPABASE_JWT_SECRET` is correct, the backend was restarted after editing `.env`, and `profiles` was actually recreated by the migration (query it in the SQL Editor).

### H. Optional: Google OAuth

Per the plan, Google OAuth is a nice-to-have, not a blocker. The "Continue
with Google" button is already in the UI (`src/pages/Login.jsx`) and will
work as soon as you configure it — no code changes needed:

1. Supabase dashboard → **Authentication → Providers → Google** → enable it.
2. You'll need a Google Cloud OAuth Client ID/Secret — Supabase's provider page links directly to the exact Google Cloud Console setup screen and lists the redirect URI to paste in.
3. Add that same redirect URI in **Google Cloud Console → Credentials → OAuth Client**.

If this takes more than about 30–45 minutes to get working, stop and stick
with email/password — email/password is fully sufficient for the portfolio
project and interview defensibility.

---

## Coming up

- **Phase 3:** Resume upload + PDF extraction, job description input, saved to the database via the backend.
