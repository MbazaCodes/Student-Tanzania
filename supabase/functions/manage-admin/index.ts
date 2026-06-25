// Supabase Edge Function: manage-admin
// National-admin-only actions that require the service-role key:
//   - reset_password: set a new password for an admin
//   - delete_admin:   delete an admin (auth user + admin_users row)
//
// Verifies the CALLER is a National admin before doing anything.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  action: "reset_password" | "delete_admin";
  target_uid: string;
  new_password?: string;
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

    // Caller must be National admin
    const { data: callerAdmin } = await admin
      .from("admin_users").select("role").eq("auth_uid", caller.id).maybeSingle();
    const isNational = callerAdmin?.role === "gov" || callerAdmin?.role === "admin";
    if (!isNational) return json({ error: "Only National admins can perform this action" }, 403);

    const { action, target_uid, new_password } = (await req.json()) as Payload;
    if (!action || !target_uid) return json({ error: "Missing action or target_uid" }, 400);

    // Cannot act on self for delete
    if (action === "delete_admin" && target_uid === caller.id) {
      return json({ error: "You cannot delete your own account" }, 400);
    }

    // Look up target for logging
    const { data: target } = await admin
      .from("admin_users").select("name,email,role").eq("auth_uid", target_uid).maybeSingle();

    if (action === "reset_password") {
      if (!new_password || new_password.length < 6) {
        return json({ error: "Password must be at least 6 characters" }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(target_uid, { password: new_password });
      if (error) return json({ error: error.message }, 400);

      await admin.from("activity_logs").insert({
        action: "admin:reset_password",
        message: `Reset password for ${target?.name ?? target_uid} (${target?.email ?? ""})`,
        by_name: caller.email ?? "National Admin", by_role: callerAdmin.role, by_ref: caller.id,
      });
      return json({ success: true });
    }

    if (action === "delete_admin") {
      // Delete admin_users row first, then auth user
      await admin.from("admin_users").delete().eq("auth_uid", target_uid);
      await admin.from("user_roles").delete().eq("user_id", target_uid);
      const { error } = await admin.auth.admin.deleteUser(target_uid);
      if (error) return json({ error: error.message }, 400);

      await admin.from("activity_logs").insert({
        action: "admin:delete",
        message: `Deleted admin ${target?.name ?? target_uid} (${target?.email ?? ""})`,
        by_name: caller.email ?? "National Admin", by_role: callerAdmin.role, by_ref: caller.id,
      });
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
