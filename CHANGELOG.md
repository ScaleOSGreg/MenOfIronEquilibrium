# Changelog

Every notable change to Mile Marker after the initial build. Newest release at the top. Each entry links the deploy that carried it and calls out any operational side-effects the person running the ministry needs to know about (schema push, new secret, dashboard toggle, etc.).

Format loosely follows [Keep a Changelog](https://keepachangelog.com). No version numbers yet — the app ships continuously from `main`; dates are the source of truth.

---

## 2026-07-01 — AI Coach + Admin roster management

### Added
- **AI SMART goal coach in the Add Goal modal.** Multi-turn chat that critiques a man's draft goal against the SMART criteria, suggests a rewrite when it needs one, and can recommend 0–2 short videos from a hand-curated list. Powered by Claude Haiku 4.5 via a new `goal-coach` Edge Function that holds the Anthropic API key server-side. Client-only conversation state — messages reset on modal close. See commits `2359c2f`, `e8b19d6`, `c471bab`.
- **Dismissible Coach nudge above the button.** First-time users see a red-tinted callout — *"Not sure this hits SMART? Coach can check it in a few seconds."* — with an Ask Coach shortcut and an X to dismiss. Dismissal persists via `localStorage['milemarker.coach_nudge_dismissed']` so return users don't keep seeing it. Commit `c045990`.
- **Curated video suggestion list** at `src/lib/coach-videos.json`. Uses YouTube search URLs (not direct video links) so results always resolve even if a specific video is taken down. Currently 8 entries spanning general SMART, faith, financial, and habits-oriented content. Edit this file over time to update the list — no Edge Function redeploy needed. Ships with commit `2359c2f`.
- **Admin can suspend / unsuspend members from the Team view.** Each non-self card in the roster shows a `⋯` menu with a Suspend (or Unsuspend) action. Suspended members disappear from mentor and mentee rosters; admins keep seeing them in a separate *Suspended* section, opacity-dimmed with a SUSPENDED pill. Confirmation dialog before either action. Commit `83bcdbc`.
- **`admin_set_profile_deleted` RPC** (migration `0002_admin_suspend.sql`). Security-definer function that lets an admin toggle another user's `profiles.deleted_at` without a service-role key touching the browser. Guards: caller must be admin; caller cannot suspend themselves. 7 pgTAP tests cover authorization + behavior. Commit `c086731`.
- **`<Inactive />` screen** at `/` for a suspended user who signs in. Instead of dropping them on a broken empty dashboard, they see a clean *"Account inactive"* page with a Sign out button. `AuthContext` now selects `deleted_at` on the profile so `<Gate />` can route them there. Commit `83bcdbc`.

### Changed
- **Coach voice rewritten to sound like Craig Groeschel** — brotherly, encouraging before challenging, reflection questions, "we/us" pronouns, no clinical scoring labels. First-generation prompt was landing on "Here's the honest take: Strong: ... Weak: Everything else." Now opens with *"Brother, I see a man naming something that matters…"* and moves into shaping. Commit `e8b19d6`.
- **`loadState` accepts caller `role`.** Admins now get all profiles including suspended (RLS already allowed this — the app-level `deleted_at IS NULL` filter was blocking them). Non-admins keep the filter as defense-in-depth. Commit `83bcdbc`.
- **Coach markdown renderer supports `*italic*` in addition to `**bold**`.** Was leaking asterisks visibly in coach responses. Commit `c471bab`.

### Deploy notes
- Ran `supabase db push` to apply migration `0002_admin_suspend.sql` to remote (project `ytohlnotrzxmaffcizpf`). Idempotent — safe to re-run.
- Deployed `goal-coach` Edge Function via `supabase functions deploy goal-coach --use-api` (Docker Desktop was crash-looping locally, so bypassed).
- New Function secret set: `ANTHROPIC_API_KEY`. Rotate via Anthropic Console → Supabase `supabase secrets set ANTHROPIC_API_KEY=...` if leaked.
- Netlify production branch moved from `claude/review-build-spec-ui-8DQtY` to `main`; the feature branch was retired on origin. Netlify auto-deploys on push to `main`.

---

## 2026-05-18 — First live cohort setup fixes

Bugs surfaced while walking through `SETUP_STEPS.md` for the first time against the live Supabase project.

### Added
- **SMTP via Resend** on `truepulseos.com`. Domain-verified with DKIM/SPF/DMARC records on Netlify DNS. Sender address: `Mile Marker <greg@truepulseos.com>`. Configured in Supabase's SMTP settings so invite emails leave the Supabase-shared mailer (which throttles at ~4/hr and lands in spam).
- **Branded HTML invite template** in Supabase Auth → Email Templates → Invite user. Subject: *"Mile Marker invitation — Equilibrium Retreat"*. Body has Mile Marker header, red 5F line, red Accept Invitation button, "Brother," greeting, "— Greg" signoff, ministry footer. Template renders correctly across clients; still lands in Junk on first send from a fresh sending domain — reputation warms with time.

### Fixed
- **`/login` never navigated after successful sign-in.** `signInWithPassword` was returning 200 but the component just set `busy=false` and stayed on the form. Added a `useEffect` in `Login.jsx` that watches the auth context session and navigates to `/` with `replace: true` when one exists. Handles both the just-signed-in and the already-logged-in cases. Commit `189beb3`.
- **`/auth/callback` never showed the Set-Password prompt.** Component was reading `window.location.hash` for `type=invite|recovery` inside a `useEffect`, but the Supabase client (with `detectSessionInUrl: true`) had already stripped the hash by then. Landed invitees on the dashboard with no password. Now: always show the password prompt when a session is present on `/auth/callback`. Commit `7d57b85`.
- **pgTAP tests 9 & 13 were asserting the wrong RLS behavior.** They expected mentor/admin write attempts to *throw*, but Postgres RLS on UPDATE silently filters rows that fail the USING expression — no exception, `UPDATE 0`. Diagnostic confirmed the schema was already secure; the test assertions were wrong. Rewrote both to use the `lives_ok + is` pattern from tests 3–4 (run the UPDATE, verify row unchanged). Plan bumped from 14 → 16. Commit `6b6e654`.
- **Local Postgres major_version drift.** `supabase/config.toml` declared 15; the live project runs 17. Aligned so `supabase test db` runs against the correct engine. Commit `3d8c5e7`.

### Deploy notes
- Rotated the leaked Supabase access token and `sb_secret_` key that had been pasted in an earlier setup chat. Fresh tokens; old ones invalidated in the Supabase dashboard.
- Site URL + Redirect URLs updated in Supabase Auth → URL Configuration to point at Netlify.
- Edge Function `SITE_URL` secret updated to the Netlify URL so invite email links resolve on the deployed site, not localhost.

---

## 2026-05-17 — Initial build + docs

### Added
- **Mile Marker on Supabase + Netlify.** React app with the 5F dashboard, Team roster, SMART goal editor, monthly Mile Marker logging, photo attachments. Supabase-backed profiles, groups, goals, mile_markers, goal_photos. RLS policies enforce mentee/mentor/admin isolation; `invite-man` Edge Function handles admin-authorized invites. Netlify deploys from `main`. Initial commit `b7da795`.
- **`KIDS_README.md`** — plain-English walkthrough of the setup steps. Commit `8d4b892`.
- **`SETUP_STEPS.md`** — copy-paste checklist for a first-time live setup (Supabase CLI install, project link, schema push, Edge Function deploy, RLS test gate, dashboard toggles, admin bootstrap, Netlify deploy). Commit `6bd9e42`.

---

## Operational reference

Environment where all the above lives:

| Piece | Location |
|---|---|
| Frontend | https://menofironequilibrium052026.netlify.app |
| Repo | https://github.com/ScaleOSGreg/MenOfIronEquilibrium (branch: `main`) |
| Supabase project | `ytohlnotrzxmaffcizpf` (East US · Postgres 17) |
| Edge Functions | `invite-man`, `goal-coach` |
| Function secrets | `SITE_URL`, `ANTHROPIC_API_KEY` (plus Supabase's auto-injected `SUPABASE_SERVICE_ROLE_KEY` etc.) |
| Sender domain | `truepulseos.com` (DNS on Netlify, DKIM/SPF/DMARC in place) |
| Mailer | Resend (`smtp.resend.com`) |
