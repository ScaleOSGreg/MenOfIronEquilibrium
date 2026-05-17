# Mile Marker — step-by-step setup checklist

Copy each block into your terminal one at a time. After each one, glance at the **"What good output looks like"** note — if it matches, move on. If not, see **"If it fails"** below the block.

You'll need:
- Your laptop (macOS, Windows, or Linux).
- **Docker Desktop** running (needed for the RLS test in Step 7). Download: https://www.docker.com/products/docker-desktop/
- Your Supabase project — you already have one (ref `ytohlnotrzxmaffcizpf`).
- About 30 minutes the first time.

> 🚨 **Before you start:** the credentials you pasted in chat are exposed. Rotate them now:
> 1. Delete the access token at https://supabase.com/dashboard/account/tokens
> 2. Roll the `sb_secret_…` key at Project Settings → API Keys
> Then come back and use the fresh ones below.

---

## 1. Install the Supabase CLI

**macOS (Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Windows (Scoop):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux:**
```bash
curl -fsSL -o /tmp/supabase.tgz https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz
tar -xzf /tmp/supabase.tgz -C /tmp
sudo mv /tmp/supabase /usr/local/bin/
```

**Verify:**
```bash
supabase --version
```

**What good output looks like:** something like `2.98.2`.

**If it fails:** open https://github.com/supabase/cli/releases and download the right binary by hand.

---

## 2. Clone the repo

```bash
cd ~/Documents              # or wherever you keep code
git clone https://github.com/ScaleOSGreg/MenOfIronEquilibrium.git
cd MenOfIronEquilibrium
git checkout claude/review-build-spec-ui-8DQtY
```

**What good output looks like:** `Switched to a new branch 'claude/review-build-spec-ui-8DQtY'` (or similar).

**If it fails:** if you already have the repo, just `cd` into it and run `git fetch && git checkout claude/review-build-spec-ui-8DQtY`.

---

## 3. Log into Supabase from the CLI

```bash
supabase login
```

This opens a browser. Approve the login. The CLI saves a token in `~/.supabase` on your machine — **never** in the repo.

**What good output looks like:** `Logged in successfully` and a token preview.

**If it fails:** make sure your default browser is signed into the Supabase account that owns project `ytohlnotrzxmaffcizpf`.

---

## 4. Link this repo to your Supabase project

```bash
supabase link --project-ref ytohlnotrzxmaffcizpf
```

It will prompt for the **database password**. That's the postgres password for your project (Project Settings → Database → reveal password). It's different from the API keys.

**What good output looks like:** `Finished supabase link.`

**If it fails:**
- `connection refused` → wait a minute, your project might be paused/warming up.
- `permission denied` → wrong DB password.

---

## 5. Apply the schema (the big spell from Step 2 of `KIDS_README.md`)

```bash
supabase db push
```

**What good output looks like:** lists `0001_init.sql` and says `Applying migration ...` then `Finished supabase db push.`

**If it fails:**
- `relation "X" already exists` → your project isn't empty. Tell me and I'll write a migration that adapts instead of recreates.
- `extension "pgcrypto" not available` → enable it in Database → Extensions, then rerun.

**Verify it worked (optional but smart):** in the Supabase dashboard, **Database → Tables**, you should see: `groups`, `profiles`, `mentor_groups`, `goals`, `mile_markers`, `goal_photos`. **Database → Storage**, you should see a bucket `goal-photos`.

---

## 6. Deploy the invite-man Edge Function + set its secret

Generate a **fresh** `sb_secret_…` key (you rotated the old one — right?) at Project Settings → API Keys → reveal the secret key, then:

```bash
supabase functions deploy invite-man
```

```bash
supabase secrets set \
  SUPABASE_SECRET_KEY=<paste-fresh-sb_secret-here> \
  SITE_URL=http://localhost:5173
```

(We'll change `SITE_URL` to your Netlify URL in Step 10. Localhost is fine for now.)

**What good output looks like:** `Deployed Function invite-man` and `Finished supabase secrets set.`

**If it fails:**
- `Docker not running` for the deploy step → start Docker Desktop, retry.
- Edge Functions sometimes take a minute to propagate — wait 60 seconds before testing.

---

## 7. 🔒 Run the RLS pop-quiz (the gate from Step 3 of `KIDS_README.md`)

**This is the most important step. Do not skip it.**

Make sure Docker Desktop is running, then:

```bash
supabase test db
```

**What good output looks like:** `1..14` then 14 lines of `ok N - …` then `# All tests passed.`

**If even ONE test fails:**
- **Stop here.** Don't proceed to Step 8.
- Copy the failed test name and send it to me. I'll fix the policy.
- Re-run Step 5 (`supabase db push`) after the fix, then re-run this step.

This is the gate. If it's red, your data is leakable.

---

## 8. Flip three dashboard switches

These aren't CLI — you click them in https://supabase.com/dashboard/project/ytohlnotrzxmaffcizpf:

1. **Authentication → Providers → Email** → turn OFF *"Enable email signups"*. (Invite-only.)
2. **Authentication → URL Configuration:**
   - **Site URL:** `http://localhost:5173` for now (we'll change to Netlify in Step 10).
   - **Redirect URLs:** add both `http://localhost:5173/auth/callback` and your Netlify URL once you have it.
3. **Authentication → SMTP Settings:** the built-in Supabase mailer sends max 4 emails/hour and lands in spam. Sign up for **Resend** (https://resend.com, free 3,000/mo) or **Postmark** and paste the SMTP host/user/pass here. Otherwise your invites won't arrive reliably.

---

## 9. Bootstrap your first admin

In the Supabase dashboard:

1. **Authentication → Users → Add user** → enter your own email + password → **check "Auto Confirm User"** → Create.
2. Note your user UUID (it shows in the users list).
3. **SQL Editor**, paste and run:
   ```sql
   update profiles set role = 'admin', full_name = 'Greg Serio' where id = '<paste-your-uuid>';
   insert into groups (id, name) values (gen_random_uuid(), 'Cohort 1');
   -- attach yourself to that group:
   update profiles set group_id = (select id from groups where name = 'Cohort 1') where id = '<paste-your-uuid>';
   ```

**What good output looks like:** `UPDATE 1`, `INSERT 0 1`, `UPDATE 1`.

---

## 10. Run the frontend locally

Make sure you have Node 20+: `node --version`. If not: https://nodejs.org/

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your project values:
```
VITE_SUPABASE_URL=https://ytohlnotrzxmaffcizpf.supabase.co
VITE_SUPABASE_KEY=<your sb_publishable_ key from Project Settings → API Keys>
```

(Use the **publishable** key, NOT the secret one. The publishable key is safe in the browser.)

```bash
npm install
npm run dev
```

**What good output looks like:** `Local: http://localhost:5173/` — open it in a browser. You should see the login screen.

Sign in with the admin email + password you set in Step 9. You should land on an empty dashboard.

---

## 11. First end-to-end test: invite a man

1. Click **Invite** in the header.
2. Type a real second email you can check (a personal email works).
3. Click **Send invite.**
4. Check that inbox (and spam folder). You should get a Supabase invite email within ~30 seconds.
5. Click the link → it should land at `http://localhost:5173/auth/callback` → set a password.
6. You're now signed in as the new man. Add a goal, log a Mile Marker, refresh the page — it should persist.
7. Sign out, sign back in as admin, click **Team** — you should see the new man in the roster.

**If the invite email never arrives:** SMTP isn't set up — go back to Step 8 part 3.

**If clicking the link gives a 404 or error:** Redirect URLs aren't allowlisted — Step 8 part 2.

---

## 12. Deploy to Netlify

1. Go to https://app.netlify.com → **Add new site → Import an existing project → GitHub → MenOfIronEquilibrium**.
2. Branch to deploy: `claude/review-build-spec-ui-8DQtY` (or merge it to `main` first and pick `main`).
3. Netlify reads `netlify.toml` — build command and publish dir are already correct. Don't override them.
4. **Site settings → Environment variables → Add a variable** (do this twice):
   - `VITE_SUPABASE_URL` = `https://ytohlnotrzxmaffcizpf.supabase.co`
   - `VITE_SUPABASE_KEY` = your `sb_publishable_…` key
5. **Deploy site.** Wait ~1 minute. You'll get a URL like `https://courageous-otter-12345.netlify.app`.
6. Test it: open the URL, sign in, log a Mile Marker.
7. Now update Step 8 dashboard settings:
   - **Site URL** in Supabase → your Netlify URL
   - **Redirect URLs** → add `https://your-netlify-url/auth/callback`
   - **`SITE_URL`** secret on the Edge Function:
     ```bash
     supabase secrets set SITE_URL=https://your-netlify-url
     ```
8. Test once more by inviting another email from the live Netlify URL.

---

## 13. After everything is green

- Rename the Netlify site to something nice in Site settings → Site information.
- (Optional) point a custom domain at it.
- **Rotate your `sb_secret_` key one more time** to invalidate the one you used during setup, then update the Edge Function secret:
  ```bash
  supabase secrets set SUPABASE_SECRET_KEY=<new sb_secret_>
  ```
- Invite the real men.

---

## When you hit a wall

Paste the failing command + its output into chat. I'll diagnose and either patch the repo or hand you the exact fix. Most failures are one of:

- `relation "X" already exists` → DB wasn't empty after all.
- `Bucket not found` → migration 5 didn't apply; rerun `supabase db push`.
- `Invalid JWT` calling invite-man → Edge Function deploy didn't finish; redeploy.
- Invite email never arrives → SMTP not configured.

*Iron sharpens iron · Faith · Family · Friends · Fitness · Finances*
