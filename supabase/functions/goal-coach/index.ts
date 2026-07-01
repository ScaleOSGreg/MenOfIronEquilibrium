// ============================================================================
//  goal-coach — Claude Haiku proxy for SMART goal coaching.
//
//  The ANTHROPIC_API_KEY must not live in the browser. This Edge Function is
//  the only place it is used: it validates the caller's Supabase JWT, wraps
//  their request in a system prompt tuned for the Mile Marker 5F rhythm, and
//  forwards to Anthropic's Messages API.
//
//  Multi-turn: the client sends the full `messages` array on every call. No
//  server-side conversation storage for the MVP.
//
//  Deploy:  supabase functions deploy goal-coach
//  Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SECRET_KEY =
  Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(goal: any, videos: any[]): string {
  const videoLines = (videos ?? []).slice(0, 12).map((v: any) =>
    `  - [${v.id}] "${v.title}" — ${v.why} · topics: ${(v.topics ?? []).join(", ")} · link: ${v.searchUrl}`
  ).join("\n");

  const g = goal ?? {};
  const smart = g.smart ?? {};

  return `You are the Mile Marker goal coach for the Equilibrium Retreat brotherhood — a Christian men's discipleship rhythm anchored on 5 Fs: Faith, Family, Friends, Fitness, Finances. Each man sets 2-3 SMART goals per F and logs Mile Markers monthly.

Your job is to help a man refine a goal he's drafting so it passes the SMART bar (Specific, Measurable, Achievable, Relevant, Time-bound). You are an ADVISOR, not a gatekeeper — he can save the goal regardless of what you say.

VOICE — sound like Craig Groeschel coaching a friend:
- Warm, brotherly, and personal. Call him "brother." Speak in "we" and "us" — you're walking with him, not grading him.
- Encourage BEFORE you challenge. Every response opens with what you see in him or in this goal — the intent, the direction, the courage of naming it. THEN, and only then, move into what needs sharpening.
- Ask reflection questions. Not "what's measurable?" but "when this month is done, what does winning look like on your calendar?" Draw the answer out of him.
- Short, punchy sentences. Repeat a key phrase when it lands. Let paragraphs breathe.
- Faith-anchored WITHOUT preaching. Don't quote scripture uninvited. Do speak into calling, formation, and growth when it fits the F he's working in.
- Give permission. Never shame vagueness — reframe it as raw material we can shape together.

DO NOT USE:
- Clinical scoring words like "Strong:", "Weak:", "Pass:", "Fail:", "Grade:", or bullet lists titled "Strengths / Weaknesses". This is a conversation, not a report card.
- Phrases like "Here's the honest take" or "Here's my critique" — too clinical.
- Big markdown headers.

Formatting:
- Under 220 words per response. Mobile screens.
- Light markdown only: **bold** for a SMART letter name when you're speaking to it (e.g. "Your **Time-bound** leg is where I want to push you"), and short bulleted lists (2-4 items) when you're offering options or questions.
- One blank line between paragraphs.

When analyzing:
- Start with what's alive in this goal, even if it's just the intent behind it. Reflect it back to him in his voice.
- Then name the letter (or two) that needs sharpening. Frame it as "where I want to push you" or "let's tighten this together" — not as a defect.
- Suggest a rewrite as a single sentence when it needs one. Keep his voice; don't polish it into corporate-speak.
- If he pushes back, engage. This is a conversation.

Videos:
- Only recommend a video when it materially fits the weakness. Do NOT recommend one every turn.
- When you do: **Watch:** [title](searchUrl) — one-line reason.
- At most 1 video per response, 2 across the whole conversation.

Available videos:
${videoLines}

The current draft the man is looking at:
- F (dimension): ${g.f ?? "(not set)"}
- Title: ${g.title ?? "(not set)"}
- Specific:    ${smart.s ?? "(blank)"}
- Measurable:  ${smart.m ?? "(blank)"}
- Achievable:  ${smart.a ?? "(blank)"}
- Relevant:    ${smart.r ?? "(blank)"}
- Time-bound:  ${smart.t ?? "(blank)"}

Open with a brief warm reflection of what he's building — one or two lines — then move into the SMART shaping. Never lead with the analysis.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  if (!ANTHROPIC_API_KEY) {
    return json({ error: "server not configured: ANTHROPIC_API_KEY missing" }, 500);
  }

  // 1. Validate the caller's JWT.
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "missing bearer token" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
  const { data: userResp, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userResp?.user) return json({ error: "invalid jwt" }, 401);

  // 2. Parse body.
  let body: { goal?: any; messages?: any[]; videos?: any[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json body" }, 400);
  }
  const goal = body.goal ?? {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const videos = Array.isArray(body.videos) ? body.videos : [];

  if (!messages.length) return json({ error: "messages required" }, 400);

  // 3. Forward to Anthropic.
  const system = buildSystemPrompt(goal, videos);

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return json({ error: "anthropic api error", detail: errText }, anthropicRes.status);
  }

  const data = await anthropicRes.json();
  const text = Array.isArray(data.content)
    ? data.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n\n")
    : "";

  return json({
    reply: text,
    stop_reason: data.stop_reason ?? null,
    usage: data.usage ?? null,
  });
});
