# Mile Marker

5F Game Plan for the men of **Equilibrium Retreat** · *A ministry of Men of Iron.*

This is the implementation of the build spec — the prototype UI wired to Supabase, with the security model from the spec enforced at the database. Invite-only. Mentors see their groups. Admins see all.

---

## What's in here

```
.
├── src/                       React + Vite frontend
│   ├── MileMarker.jsx         The original prototype, now reading/writing Supabase
│   ├── App.jsx                Router + auth gate
│   ├── auth/                  AuthProvider, Login, invite-callback
│   └── lib/
│       ├── supabase.js        Client (uses sb_publishable_ key)
│       ├── storage.js         The single data seam — replaces window.storage
│       └── compress.js        Strip EXIF + resize photos before upload
├── supabase/
│   ├── migrations/0001_init.sql   Tables, RLS, storage bucket, triggers
│   ├── functions/invite-man/      Edge Function — the ONLY place the
│   │                              service-role/sb_secret key is used
│   └── tests/rls.test.sql         pgTAP — the Phase 1 gate
├── netlify.toml               SPA redirects + node 20 + sane security headers
└── public/manifest.webmanifest  Installable PWA
```

---

## Quick start

### 1. Local dev

```bash
npm install
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_KEY from Settings > API Keys
# (use the sb_publishable_… key, NOT the legacy anon key)
npm run dev
```

### 2. Stand up Supabase

```bash
npm install -g supabase
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push                     # applies 0001_init.sql
supabase functions deploy invite-man
supabase secrets set SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxx \
                    SITE_URL=https://your-netlify-site.netlify.app
```

In the Supabase dashboard:
- **Auth → Providers → Email**: turn OFF "Enable email signups" (invite-only).
- **Auth → URL Configuration**: set Site URL + Redirect URLs to your Netlify URL and `http://localhost:5173/auth/callback`.
- **Auth → SMTP Settings**: configure Resend / Postmark / SendGrid. The default Supabase SMTP is rate-limited (~4 emails/hour) and ends up in spam — invites will silently fail without this.

### 3. Run the RLS gate **before** anyone real uses this

```bash
supabase test db
```

All 14 tests in `supabase/tests/rls.test.sql` must pass. They cover:

- mentee A cannot read mentee B's goals
- mentee A cannot UPDATE or INSERT under B's ownership
- mentee A cannot self-promote to admin
- mentor sees own group only, **read-only**
- admin reads all, but cannot write to another man's goal
- anonymous reader sees nothing

If any one fails, **do not deploy.** This is the gate.

### 4. Bootstrap your first admin

Sign yourself up via the Supabase dashboard (Auth → Users → Add user, Auto-confirm), then in SQL editor:

```sql
update profiles set role = 'admin' where id = '<your-user-id>';
insert into groups (id, name) values (gen_random_uuid(), 'Cohort 1');
```

Everyone else gets in via the **Invite** button in the app header.

### 5. Deploy to Netlify

Connect the Git repo. Netlify reads `netlify.toml`. Set the two env vars in **Site settings → Environment variables**:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `VITE_SUPABASE_KEY` | `sb_publishable_…` |

**Critical:** the `VITE_` prefix is required, otherwise the build cannot see the variables and the app runs blind. This is the most common Netlify+Vite+Supabase failure.

---

## What the build spec asked for, and where it landed

| Spec phase | Status |
|---|---|
| Phase 0 — Vite scaffold + Supabase client | ✅ done |
| Phase 1 — 6 tables, RLS, isolation test | ✅ schema + pgTAP gate written; run `supabase db push` + `supabase test db` |
| Phase 2 — Auth + storage rewire | ✅ `loadState` / per-action mutators in `src/lib/storage.js` |
| Phase 3 — Mentor/admin/invite | ✅ Edge Function `invite-man` + InviteModal in the header |
| Phase 4 — Photos to Storage, password reset, deploy | ✅ `goal-photos` bucket with RLS, EXIF strip + resize on upload, reset flow in `Login.jsx`, `netlify.toml` |

## Improvements over the original spec

These came out of the review and are baked in:

- **Edge Function for invites** — the spec implied the frontend would call `auth.admin.inviteUserByEmail`, which requires the service-role key. That key cannot live in the browser. `supabase/functions/invite-man` is the correct boundary.
- **Storage RLS** — the spec only covered table RLS. The `goal-photos` bucket has its own policies; mentees see own folder only, mentors see their groups.
- **`handle_new_user()` trigger** — auto-creates the `profiles` row when the invitee accepts the link, preserving the `group_id` / `role` / `invited_by` passed in invite metadata.
- **`UNIQUE (goal_id, month)`** on `mile_markers` — DB-level guarantee that one goal can't have two markers for the same month.
- **Soft delete** — `deleted_at` on `profiles`, `goals`, `groups`. Years of a man's reflections shouldn't disappear because someone clicked X.
- **`commitment_kept boolean`** — the accountability column the prototype was missing.
- **Profile role can't be self-promoted** — RLS policy explicitly compares the new role against the existing role.
- **Photos uploaded as compressed JPEGs**, not base64 dataURLs. EXIF stripped (GPS removed).
- **PWA manifest** — installable on a phone for monthly check-ins.

## Known TODOs

- **Custom SMTP** — must be configured in Supabase or invite emails won't land reliably.
- **Monthly reminder email** — a cron-backed edge function ("Mile Marker due in 5 days") is the obvious next add.
- **Mentor private notes** table — for "what should I bring up with him next time" notes invisible to the mentee.
- **Export-my-game-plan PDF** — handy for the retreat handout.
- **A11y pass** — focus management in modals, ESC-to-close, focus rings on F cards.

---

*Iron sharpens iron · Faith · Family · Friends · Fitness · Finances*
