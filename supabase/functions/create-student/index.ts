// Supabase Edge Function: create-student
// Creates a student record + an auth account so students can log in with
// their TSID + password. The auth email is synthetic: <tsid>@students.tsid.go.tz
// (lowercased). Students never see/enter this email — only their TSID.
//
// Caller must be a school admin (inserts for own school) or a gov-tier admin.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Synthetic login email derived from TSID
function tsidEmail(tsid: string): string {
  return `${tsid.toLowerCase().replace(/[^a-z0-9-]/g, "")}@students.tsid.go.tz`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: { user: caller }, error: cErr } = await callerClient.auth.getUser();
    if (cErr || !caller) return json({ error: "Unauthorized" }, 401);

    const { data: callerAdmin } = await admin
      .from("admin_users").select("role, region, district, ref").eq("auth_uid", caller.id).maybeSingle();
    if (!callerAdmin) return json({ error: "Caller is not authorized" }, 403);

    const role = callerAdmin.role;
    const isNational = role === "gov" || role === "admin";
    const isRegional = role === "gov_region";
    const isDistrict = role === "gov_district";
    const isSchool   = role === "school";
    if (!isNational && !isRegional && !isDistrict && !isSchool) {
      return json({ error: "You cannot register students" }, 403);
    }

    const p = await req.json();
    const tsid: string = p.tsid;
    const password: string = p.password;
    if (!tsid || !password || !p.fullname || !p.school_code) {
      return json({ error: "Missing required fields (tsid, fullname, school_code, password)" }, 400);
    }

    // Scope: school can only add to own school; regional/district by area
    if (isSchool && callerAdmin.ref !== p.school_code) {
      return json({ error: "Schools can only register their own students" }, 403);
    }
    if (isRegional && p.region !== callerAdmin.region) {
      return json({ error: "Out of region scope" }, 403);
    }
    if (isDistrict && p.district !== callerAdmin.district) {
      return json({ error: "Out of district scope" }, 403);
    }

    const email = tsidEmail(tsid);

    // 1. Create auth account
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "student", name: p.fullname, tsid },
      app_metadata: { role: "student" },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Failed to create student login" }, 400);
    }
    const studentUid = created.user.id;

    // 2. Insert student row
    const { error: insErr } = await admin.from("students").insert({
      tsid,
      fullname: p.fullname,
      dob: p.dob ?? null,
      gender: p.gender ?? null,
      nationality: p.nationality ?? "Tanzanian",
      level: p.level ?? null,
      school_code: p.school_code,
      school_name: p.school_name ?? null,
      region: p.region ?? null,
      district: p.district ?? null,
      ward: p.ward ?? null,
      school_contact: p.school_contact ?? null,
      enrollment_date: p.enrollment_date ?? null,
      blood_group: p.blood_group ?? null,
      issue_date: p.issue_date ?? null,
      parent_name: p.parent_name ?? null,
      parent_nida: p.parent_nida ?? null,
      relationship: p.relationship ?? null,
      parent_phone: p.parent_phone ?? null,
      cred_username: tsid,
      status: "active",
      auth_uid: studentUid,
    });
    if (insErr) {
      await admin.auth.admin.deleteUser(studentUid);  // rollback
      return json({ error: insErr.message }, 400);
    }

    // 3. admin_users row so role lookup + scope work for the student account
    await admin.from("admin_users").insert({
      auth_uid: studentUid,
      name: p.fullname,
      email,
      role: "student",
      region: p.region ?? null,
      district: p.district ?? null,
      ref: tsid,
      status: "active",
      created_by: caller.id,
    });
    await admin.from("user_roles").upsert({ user_id: studentUid, role: "student" });

    // 4. Log
    await admin.from("activity_logs").insert({
      action: "student:register",
      message: `Registered ${tsid} (${p.fullname})`,
      by_name: caller.email ?? "School", by_role: role, by_ref: p.school_code,
    });

    return json({ success: true, tsid, login_tsid: tsid });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
