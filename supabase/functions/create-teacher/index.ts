// Supabase Edge Function: create-teacher
// Creates a Teacher/Educator login (email) + admin_users row (role=teacher)
// and assigns them to one or more classes in the caller's school.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role_title?: string | null;      // Class Teacher / Instructor / Dean
  school_code: string;
  levels: string[];                // assigned classes
  region?: string | null;
  district?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: { user: caller }, error: cErr } = await callerClient.auth.getUser();
    if (cErr || !caller) return json({ error: "Unauthorized" }, 401);

    const { data: callerAdmin } = await admin
      .from("admin_users").select("role, region, district, ref").eq("auth_uid", caller.id).maybeSingle();
    if (!callerAdmin) return json({ error: "Caller is not authorized" }, 403);
    const isSchool = callerAdmin.role === "school";
    const isGov = ["gov", "admin", "gov_region", "gov_district"].includes(callerAdmin.role);
    if (!isSchool && !isGov) return json({ error: "Not allowed" }, 403);

    const p: Payload = await req.json();
    if (!p.email || !p.password || !p.name || !p.school_code) return json({ error: "name, email, password, school_code required" }, 400);
    if (isSchool && callerAdmin.ref !== p.school_code) return json({ error: "Schools can only add teachers to their own school" }, 403);
    const levels = (p.levels ?? []).filter(Boolean);
    const teacherRef = p.email.toLowerCase();

    // Reuse existing teacher by email (add classes)
    let teacherUid: string | null = null;
    const { data: existing } = await admin.from("admin_users").select("auth_uid").eq("email", teacherRef).eq("role", "teacher").maybeSingle();
    if (existing) {
      teacherUid = existing.auth_uid;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: p.email, password: p.password, email_confirm: true,
        user_metadata: { role: "teacher", name: p.name },
        app_metadata: { role: "teacher" },
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? "Failed to create teacher login" }, 400);
      teacherUid = created.user.id;
      const { error: auErr } = await admin.from("admin_users").insert({
        auth_uid: teacherUid, name: p.name, email: teacherRef, role: "teacher",
        region: p.region ?? null, district: p.district ?? null, ref: teacherRef,
        status: "active", created_by: caller.id,
      });
      if (auErr) { await admin.auth.admin.deleteUser(teacherUid); return json({ error: auErr.message }, 400); }
      await admin.from("user_roles").upsert({ user_id: teacherUid, role: "teacher" });
    }

    for (const level of levels) {
      await admin.from("teacher_assignments").upsert(
        { teacher_ref: teacherRef, teacher_uid: teacherUid, school_code: p.school_code, level, role_title: p.role_title ?? "Class Teacher" },
        { onConflict: "teacher_ref,school_code,level" },
      );
    }

    return json({ ok: true, teacher_ref: teacherRef, classes: levels.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
