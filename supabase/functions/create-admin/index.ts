// Supabase Edge Function: create-admin
// Creates a hierarchical admin (Regional / District) using the service-role key.
// Bypasses email-domain validation and skips confirmation emails.
//
// Security: verifies the CALLER is an authenticated admin with permission to
// create the requested admin level before doing anything.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
  role: "gov_region" | "gov_district";
  region: string;
  district?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client bound to the CALLER's JWT — used to identify who is calling
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client with service role — used to create the new user
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Identify the caller
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) {
      return json({ error: "Unauthorized" }, 401);
    }

    // 2. Look up caller's admin row to verify permission
    const { data: callerAdmin } = await admin
      .from("admin_users")
      .select("role, region, district")
      .eq("auth_uid", caller.id)
      .maybeSingle();

    if (!callerAdmin) {
      return json({ error: "Caller is not an administrator" }, 403);
    }

    const payload = (await req.json()) as CreateAdminPayload;
    const { name, email, password, role, region } = payload;
    const district = payload.district ?? null;

    if (!name || !email || !password || !role || !region) {
      return json({ error: "Missing required fields" }, 400);
    }

    // 3. Permission checks
    const callerRole = callerAdmin.role;
    const isNational  = callerRole === "gov" || callerRole === "admin";
    const isRegional  = callerRole === "gov_region";

    if (role === "gov_region" && !isNational) {
      return json({ error: "Only National admins can create Regional admins" }, 403);
    }
    if (role === "gov_district") {
      if (isRegional && region !== callerAdmin.region) {
        return json({ error: "Regional admins can only create District admins in their own region" }, 403);
      }
      if (!isNational && !isRegional) {
        return json({ error: "You do not have permission to create District admins" }, 403);
      }
    }
    if (role === "gov_district" && !district) {
      return json({ error: "District is required for District admins" }, 400);
    }

    // 4. Create the auth user (email auto-confirmed, no validation block)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, name },
      app_metadata: { role },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Failed to create user" }, 400);
    }
    const newUid = created.user.id;

    // 5. Insert admin_users row
    const { error: insErr } = await admin.from("admin_users").insert({
      auth_uid: newUid,
      name, email, role, region,
      district: role === "gov_district" ? district : null,
      ministry: "Ministry of Education, Science and Technology",
      status: "active",
      created_by: caller.id,
    });
    if (insErr) {
      // Roll back the auth user so we don't leave an orphan
      await admin.auth.admin.deleteUser(newUid);
      return json({ error: insErr.message }, 400);
    }

    // 6. Mirror into user_roles
    await admin.from("user_roles").upsert({ user_id: newUid, role });

    // 7. Activity log
    await admin.from("activity_logs").insert({
      action: "admin:create",
      message: `Created ${role === "gov_region" ? "Regional" : "District"} admin ${name} (${email})`,
      by_name: caller.email ?? "Admin",
      by_role: callerRole,
      by_ref: caller.id,
    });

    return json({ success: true, user_id: newUid, email });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
