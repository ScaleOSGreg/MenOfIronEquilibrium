// ============================================================================
//  storage.js — the single seam from the prototype, now backed by Supabase.
//
//  The prototype kept all data in a {people, goals, marks} object held in
//  React state and persisted via loadState/saveState. We preserve that shape
//  so the UI is unchanged, but each mutation now writes through to Supabase.
//
//  RLS does the security filtering on read: a mentee sees only themselves,
//  a mentor sees their groups, an admin sees everyone.
// ============================================================================

import { supabase } from "./supabase.js";
import { compressForUpload } from "./compress.js";

const BUCKET = "goal-photos";

/* ---------- read ---------------------------------------------------------- */

export async function loadState(currentUserId, role) {
  // Admins need to see suspended profiles to be able to unsuspend them; for
  // every other role we keep the application-level deleted_at filter as
  // defense-in-depth (the RLS policies do not filter deleted_at themselves).
  const profilesQuery = supabase.from("profiles").select("*");
  if (role !== "admin") profilesQuery.is("deleted_at", null);

  const [profilesRes, goalsRes, marksRes, photosRes] = await Promise.all([
    profilesQuery,
    supabase.from("goals").select("*").is("deleted_at", null),
    supabase.from("mile_markers").select("*"),
    supabase.from("goal_photos").select("*"),
  ]);

  for (const r of [profilesRes, goalsRes, marksRes, photosRes]) {
    if (r.error) throw r.error;
  }

  const people = {};
  for (const p of profilesRes.data) {
    people[p.id] = {
      id: p.id,
      name: p.full_name,
      role: p.role,
      retreat: "Equilibrium Retreat",
      photo: p.photo_url ?? "",
      group_id: p.group_id,
      is_suspended: !!p.deleted_at,
    };
  }

  const goals = {};
  const goalIdToOwner = {};
  for (const g of goalsRes.data) {
    goalIdToOwner[g.id] = g.owner_id;
    if (!goals[g.owner_id]) goals[g.owner_id] = [];
    goals[g.owner_id].push({
      id: g.id,
      f: g.f,
      title: g.title,
      smart: { s: g.smart_s, m: g.smart_m, a: g.smart_a, r: g.smart_r, t: g.smart_t },
      note: g.note ?? "",
      photos: [], // photos hydrated below
    });
  }

  const marks = {};
  for (const m of marksRes.data) {
    if (!marks[m.goal_id]) marks[m.goal_id] = [];
    marks[m.goal_id].push({
      month: m.month,
      pct: m.pct,
      rag: m.rag,
      note: m.note ?? "",
      blockers: m.blockers ?? "",
      commitment: m.commitment ?? "",
      commitment_kept: m.commitment_kept,
      ts: new Date(m.created_at).getTime(),
    });
  }

  // Hydrate photo gallery on the matching goal. We hand back signed URLs
  // so private storage works without going public.
  const photosByGoal = {};
  for (const ph of photosRes.data) {
    if (!photosByGoal[ph.goal_id]) photosByGoal[ph.goal_id] = [];
    photosByGoal[ph.goal_id].push(ph);
  }
  for (const ownerId of Object.keys(goals)) {
    for (const g of goals[ownerId]) {
      const phs = photosByGoal[g.id] ?? [];
      if (!phs.length) continue;
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(phs.map((p) => p.storage_path), 60 * 60);
      g.photos = phs.map((p, i) => ({
        id: p.id,
        dataUrl: signed?.[i]?.signedUrl ?? "",
        storage_path: p.storage_path,
        ts: new Date(p.taken_at).getTime(),
      }));
    }
  }

  return { people, goals, marks, currentUserId };
}

/* ---------- profile ------------------------------------------------------- */

export async function updateProfile(userId, { name, photo }) {
  const patch = { full_name: name };
  if (photo !== undefined) patch.photo_url = photo || null;
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

/* ---------- goals --------------------------------------------------------- */

export async function upsertGoal(ownerId, goal) {
  const row = {
    owner_id: ownerId,
    f: goal.f,
    title: goal.title,
    smart_s: goal.smart?.s ?? "",
    smart_m: goal.smart?.m ?? "",
    smart_a: goal.smart?.a ?? "",
    smart_r: goal.smart?.r ?? "",
    smart_t: goal.smart?.t ?? "",
    note: goal.note ?? "",
  };
  if (goal.id) {
    const { data, error } = await supabase
      .from("goals").update(row).eq("id", goal.id).select().single();
    if (error) throw error;
    return data.id;
  }
  const { data, error } = await supabase.from("goals").insert(row).select().single();
  if (error) throw error;
  return data.id;
}

export async function deleteGoal(goalId) {
  // soft-delete: keep history, hide from queries via the partial index
  const { error } = await supabase
    .from("goals").update({ deleted_at: new Date().toISOString() }).eq("id", goalId);
  if (error) throw error;
}

/* ---------- mile markers -------------------------------------------------- */

export async function upsertMark(goalId, mark) {
  const row = {
    goal_id: goalId,
    month: mark.month,
    pct: mark.pct,
    rag: mark.rag,
    note: mark.note ?? "",
    blockers: mark.blockers ?? "",
    commitment: mark.commitment ?? "",
  };
  const { error } = await supabase
    .from("mile_markers").upsert(row, { onConflict: "goal_id,month" });
  if (error) throw error;
}

/* ---------- photos -------------------------------------------------------- */

export async function addPhoto(ownerId, goalId, file) {
  const small = await compressForUpload(file);
  const path = `${ownerId}/${goalId}/${small.name}`;
  const up = await supabase.storage.from(BUCKET).upload(path, small, {
    cacheControl: "3600",
    upsert: false,
    contentType: "image/jpeg",
  });
  if (up.error) throw up.error;

  const ins = await supabase
    .from("goal_photos")
    .insert({ goal_id: goalId, owner_id: ownerId, storage_path: path })
    .select()
    .single();
  if (ins.error) throw ins.error;

  const { data: signed } = await supabase.storage
    .from(BUCKET).createSignedUrl(path, 60 * 60);

  return {
    id: ins.data.id,
    dataUrl: signed?.signedUrl ?? "",
    storage_path: path,
    ts: Date.now(),
  };
}

export async function deletePhoto(photoId, storagePath) {
  // delete the row first; if RLS denies we never touch the file.
  const del = await supabase.from("goal_photos").delete().eq("id", photoId);
  if (del.error) throw del.error;
  if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath]);
}

/* ---------- admin: suspend / unsuspend ----------------------------------- */

export async function setProfileSuspended(targetId, isSuspended) {
  const { error } = await supabase.rpc("admin_set_profile_deleted", {
    target_id: targetId,
    is_deleted: isSuspended,
  });
  if (error) throw error;
}

/* ---------- coach (Edge Function) ---------------------------------------- */

export async function askCoach({ goal, messages, videos }) {
  const { data, error } = await supabase.functions.invoke("goal-coach", {
    body: { goal, messages, videos },
  });
  if (error) throw error;
  return data;
}

/* ---------- invite (Edge Function) --------------------------------------- */

export async function inviteMan({ email, full_name, group_id, role = "mentee" }) {
  const { data, error } = await supabase.functions.invoke("invite-man", {
    body: { email, full_name, group_id, role },
  });
  if (error) throw error;
  return data;
}
