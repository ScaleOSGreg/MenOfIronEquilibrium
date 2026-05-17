// ============================================================================
//  invite-man — server-side admin/mentor invites a new man.
//
//  The Supabase auth admin API requires the SERVICE ROLE / sb_secret_ key.
//  That key MUST NOT live in the browser. This Edge Function is the only place
//  it is used: it validates the caller's JWT, checks role IN ('admin','mentor'),
//  enforces that mentors can only invite into one of their own groups, then
//  calls inviteUserByEmail with the new man's metadata.
//
//  Deploy:  supabase functions deploy invite-man
//  Secrets: supabase secrets set SUPABASE_SECRET_KEY=sb_secret_xxx
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SECRET_KEY =
  Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "missing bearer token" }, 401);

  // 1. Identify the caller using their JWT.
  const userClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
  const { data: userResp, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userResp?.user) return json({ error: "invalid jwt" }, 401);
  const callerId = userResp.user.id;

  // 2. Look up the caller's profile + role/group with the admin client.
  const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });
  const { data: caller, error: callerErr } = await admin
    .from("profiles")
    .select("id, role, group_id")
    .eq("id", callerId)
    .single();
  if (callerErr || !caller) return json({ error: "caller profile not found" }, 403);
  if (caller.role !== "admin" && caller.role !== "mentor") {
    return json({ error: "forbidden: admin or mentor only" }, 403);
  }

  // 3. Parse body.
  let body: { email?: string; full_name?: string; group_id?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json body" }, 400);
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const full_name = (body.full_name ?? "").trim();
  const role = (body.role ?? "mentee").trim();
  const group_id = body.group_id ?? caller.group_id ?? null;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "valid email required" }, 400);
  }
  if (!full_name) return json({ error: "full_name required" }, 400);
  if (!["mentee", "mentor"].includes(role)) {
    return json({ error: "role must be mentee or mentor" }, 400);
  }
  if (role === "mentor" && caller.role !== "admin") {
    return json({ error: "only admins can invite mentors" }, 403);
  }

  // 4. Mentor scoping: a mentor can only invite into a group they oversee.
  if (caller.role === "mentor") {
    if (!group_id) return json({ error: "group_id required" }, 400);
    const { count } = await admin
      .from("mentor_groups")
      .select("*", { count: "exact", head: true })
      .eq("mentor_id", callerId)
      .eq("group_id", group_id);
    if (!count) return json({ error: "mentor cannot invite into this group" }, 403);
  }

  // 5. Send the invite. Metadata is read by the handle_new_user trigger when
  //    the invitee accepts the link and the auth.users row is created.
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback`,
    data: {
      full_name,
      role,
      group_id: group_id ?? "",
      invited_by: callerId,
    },
  });
  if (inviteErr) return json({ error: inviteErr.message }, 400);

  return json({ ok: true, user_id: invited.user?.id });
});
