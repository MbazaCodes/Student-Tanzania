// Supabase Edge Function: create-school
// Creates a school + a real Supabase Auth account for its admin, so the
// school can log in via signInWithPassword like any other user.
//
// Verifies the CALLER is a gov-tier admin (national/regional/district) and
// enforces scope (regional → own region, district → own district).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  school_code: string;
  school_name: string;
  type: string;
  region: string;
  district: string;
  ward: string;
  address?: string | null;
  phone?: string | null;
  reg_number?: string | null;
  email: string;        // login email for the school account
  password: string;     // temp password
  category?: string;        // 'normal' | 'special' | 'hardship'
  fee_exempt?: boolean;     // special/hardship schools → free services
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

    // Identify caller
    const { data: { user: caller }, error: cErr } = await callerClient.auth.getUser();
    if (cErr || !caller) return json({ error: "Unauthorized" }, 401);

    const { data: callerAdmin } = await admin
      .from("admin_users").select("role, region, district").eq("auth_uid", caller.id).maybeSingle();
    if (!callerAdmin) return json({ error: "Caller is not an administrator" }, 403);

    const role = callerAdmin.role;
    const isNational = role === "gov" || role === "admin";
    const isRegional = role === "gov_region";
    const isDistrict = role === "gov_district";
    if (!isNational && !isRegional && !isDistrict) {
      return json({ error: "You do not have permission to register schools" }, 403);
    }

    const p = (await req.json()) as Payload;
    if (!p.school_code || !p.school_name || !p.region || !p.district || !p.email || !p.password) {
      return json({ error: "Missing required fields" }, 400);
    }

    // Scope enforcement
    if (isRegional && p.region !== callerAdmin.region) {
      return json({ error: "Regional admins can only register schools in their own region" }, 403);
    }
    if (isDistrict && p.district !== callerAdmin.district) {
      return json({ error: "District admins can only register schools in their own district" }, 403);
    }

    // 1. Create the auth user for the school
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: p.email,
      password: p.password,
      email_confirm: true,
      user_metadata: { role: "school", name: p.school_name, school_code: p.school_code },
      app_metadata: { role: "school" },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Failed to create school login" }, 400);
    }
    const schoolUid = created.user.id;

    // 2. Insert school row
    const { error: insErr } = await admin.from("schools").insert({
      school_code: p.school_code,
      school_name: p.school_name,
      type: p.type,
      region: p.region,
      district: p.district,
      ward: p.ward,
      address: p.address ?? null,
      phone: p.phone ?? null,
      reg_number: p.reg_number ?? null,
      email: p.email,
      cred_username: p.email,
      category: p.category ?? "normal",
      fee_exempt: p.fee_exempt ?? false,
      status: "active",
      auth_uid: schoolUid,
    });
    if (insErr) {
      await admin.auth.admin.deleteUser(schoolUid);   // rollback
      return json({ error: insErr.message }, 400);
    }

    // 3. admin_users row so role lookup + scope work for the school account
    await admin.from("admin_users").insert({
      auth_uid: schoolUid,
      name: p.school_name,
      email: p.email,
      role: "school",
      region: p.region,
      district: p.district,
      ref: p.school_code,
      status: "active",
      created_by: caller.id,
    });

    // 4. user_roles mirror
    await admin.from("user_roles").upsert({ user_id: schoolUid, role: "school" });

    // 5. Log
    await admin.from("activity_logs").insert({
      action: "school:create",
      message: `Registered school ${p.school_code} — ${p.school_name}`,
      by_name: caller.email ?? "Admin", by_role: role, by_ref: p.school_code,
    });

    return json({ success: true, school_code: p.school_code, email: p.email });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
