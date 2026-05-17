# Mile Marker setup — explain it like I'm in 5th grade

This is the plain-English version of the **Quick start** in `README.md`. If anything in the grown-up README trips you up, come back here and read the matching step.

---

## The big picture, in one sentence

> We're building a **clubhouse on the internet** where the men of Equilibrium Retreat can write down their goals, check in once a month, and let their mentor cheer them on — and we have to make sure nobody walks into the wrong man's clubhouse by accident.

There are three pieces:

1. **The front door (Netlify)** — the website everyone visits in their browser.
2. **The clubhouse (Supabase)** — the locked building where every man's notes and photos live.
3. **The bouncer (RLS, Row Level Security)** — the rule that says *"you can only look in your own locker, no peeking at anyone else's."*

If the bouncer goes home, anyone can walk in. So **most of the setup is about hiring and training the bouncer before we let people inside.**

---

## Step 1 — Try it on your own computer first

**What the grown-up README says:** `npm install`, copy `.env.example` to `.env.local`, fill in two keys, run `npm run dev`.

**In kid words:** Before you open the clubhouse to your friends, you build a tiny play-version on your own desk first.

- `npm install` is like dumping out all the Lego pieces from the box so you can build with them.
- `.env.example` is a piece of paper that says "write your two secret passwords here." You make your own copy called `.env.local` and write the real passwords in.
- The two passwords (`VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`) tell your computer **which clubhouse to talk to** and **the loud-speaker password** anyone is allowed to hear. (The *quiet* password we'll talk about in Step 2.)
- `npm run dev` starts your tiny play-clubhouse. Click around at `http://localhost:5173` — nothing you do shows up to anyone else.

> 🚨 **The one trick to remember:** the password names *have* to start with `VITE_`. Forget those four letters and the app turns into a robot that can't hear anything. This is the #1 mistake grown-ups make.

---

## Step 2 — Build the real clubhouse

**What the grown-up README says:** install the Supabase CLI, link your project, `supabase db push`, deploy the `invite-man` function, set secrets.

**In kid words:** Now you actually build the real clubhouse on the internet, with rooms and lockers and a bouncer.

- **`supabase login`** — you tell Supabase, "Hi, it's me!" with your username and password.
- **`supabase link --project-ref <ref>`** — you point at the specific clubhouse you want to work on. (A `<ref>` is like the building's street address.)
- **`supabase db push`** — this is the **big magic spell.** It takes the blueprint in `supabase/migrations/0001_init.sql` and builds:
  - 6 rooms (called *tables*): one for groups, one for profiles, one for goals, one for monthly check-ins, one for photos, and one for matching mentors to groups.
  - The **bouncer's rulebook (RLS)** — the rules that say who's allowed to peek at what.
  - The **photo locker** (Supabase Storage) where pictures get saved, with its own rules.
- **`supabase functions deploy invite-man`** — this puts a little robot named **invite-man** in the back of the clubhouse. His only job: when a mentor says "I want to invite Bob," the robot mails Bob a special letter with a link.
  - Why does Bob need a robot to invite him? Because mailing the invite needs the **quiet** secret password (the `sb_secret_` one), and that password is so powerful it can open every locker. **It must never, ever leave the back room.** The robot keeps it safe.
- **`supabase secrets set …`** — this is how you whisper the quiet password to the robot. You only do it once.

In the Supabase website (the dashboard) you also have to flip three switches:

1. **Turn OFF "Enable email signups."** Strangers can't walk up and create their own account — only invited men get in.
2. **Tell Supabase the website's address** (Site URL) so the invite-letter links know where to send Bob's browser.
3. **Hire a real mail carrier (custom SMTP).** Supabase has a built-in mail carrier but he's slow (only 4 letters per hour) and his letters often land in the trash folder. Sign up for Resend or Postmark — both free — so invites actually show up.

---

## Step 3 — Give the bouncer a pop-quiz 🔒

**What the grown-up README says:** `supabase test db`. All 14 pgTAP tests must pass.

**In kid words:** This is the **most important step.** Before you let any real man into the clubhouse, you give the bouncer a quiz to make sure he won't let the wrong people into other people's lockers.

The quiz lives in `supabase/tests/rls.test.sql`. It pretends to be **four different people**:

| Pretend person | What we make sure they can/can't do |
|---|---|
| 👤 Mentee A (a regular guy) | Sees their own goals ✅ — but **cannot** peek at Mentee B ❌, **cannot** rewrite B's goals ❌, **cannot** promote themselves to boss ❌ |
| 👤 Mentee B (another regular guy) | Same — locked in their own locker. |
| 🧑‍🏫 Mentor C | Can **read** the men in their group ✅ — **cannot edit** them ❌, **cannot** peek at men in another group ❌ |
| 👑 Admin D (the boss) | Can read everyone ✅ — but still **cannot rewrite** another man's goals ❌ |
| 👻 A stranger with no password | Sees **absolutely nothing** ❌ |

There are **14 questions on the quiz.** If even **one** is wrong, the bouncer fails and **you do not open the clubhouse.** You go back and fix the rule that broke.

This step matters because in real life (January 2026) a company called Moltbook skipped this quiz and leaked **4.75 million private records** — including private messages — because their bouncer was sleeping. We're not going to be that company.

---

## Step 4 — Give yourself the boss-key

**What the grown-up README says:** sign up in the dashboard, then update your role to `admin` in SQL.

**In kid words:** The clubhouse exists, but nobody is inside yet. Someone has to be the very first person, and that person needs to be the boss so they can invite everyone else.

- Add yourself through the Supabase dashboard (there's no public signup — remember, we turned that off).
- Then run a tiny SQL spell:
  ```sql
  update profiles set role = 'admin' where id = '<your-user-id>';
  ```
  That writes "👑 BOSS" on your name tag.
- Also create the first group: `insert into groups (id, name) values (gen_random_uuid(), 'Cohort 1');` — that's the room your group hangs out in.

After that, every other man gets in by you clicking the **Invite** button in the top corner of the app. Robot-`invite-man` does the rest.

---

## Step 5 — Open the front door to the world

**What the grown-up README says:** connect the Git repo to Netlify, set the two `VITE_*` env vars.

**In kid words:** Right now your clubhouse lives on the internet, but the front door is closed because nobody knows where it is. Netlify is the **doorman who hangs out the sign** so visitors can find it.

- Tell Netlify "watch this folder on GitHub." Whenever you push new code, Netlify rebuilds the website automatically.
- The `netlify.toml` file (already in the repo) tells Netlify three things:
  1. How to build the site (`npm run build`).
  2. To use a recent enough version of Node (20).
  3. That every URL should land on the same page so the React router can take over.
- Set the two passwords (the same two from Step 1) in Netlify's settings.
- Netlify hands you a public URL like `mile-marker-xyz.netlify.app`. **That's your front door.** Give it a real name later.

---

## A real man's day, once it's all set up

1. **Greg (admin)** clicks **Invite** and types Bob's name + email.
2. **Robot-`invite-man`** sends Bob a letter (email) with a magic link.
3. **Bob** clicks the link → lands at `/auth/callback` → sets his password.
4. Bob is now in! He sees only his own goals (because the bouncer is watching).
5. Once a month, Bob logs his **Mile Marker** — how far along he is on each goal, and what he'll do next month.
6. His mentor logs in, sees Bob's progress (read-only), and they talk about it at their meeting.

---

*Iron sharpens iron · Faith · Family · Friends · Fitness · Finances*
