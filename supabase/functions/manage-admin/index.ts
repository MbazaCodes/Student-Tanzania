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
  action: "reset_password" | "delete_admin" | "reset_school_password" | "reset_student_password" | "delete_student";
  target_uid?: string;
  new_password?: string;
  school_code?: string;
  tsid?: string;            // for student actions
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

    // Look up caller's admin row (role + scope)
    const { data: callerAdmin } = await admin
      .from("admin_users").select("role, region, district, ref").eq("auth_uid", caller.id).maybeSingle();
    if (!callerAdmin) return json({ error: "Caller is not an administrator" }, 403);
    const isNational = callerAdmin.role === "gov" || callerAdmin.role === "admin";
    const isRegional = callerAdmin.role === "gov_region";
    const isDistrict = callerAdmin.role === "gov_district";
    const isSchool   = callerAdmin.role === "school";
    const isGovTier  = isNational || isRegional || isDistrict;

    const body = (await req.json()) as Payload;
    const { action, target_uid, new_password, school_code } = body;
    if (!action) return json({ error: "Missing action" }, 400);

    // admin-targeted actions still require National
    const adminActions = action === "reset_password" || action === "delete_admin";
    if (adminActions && !isNational) {
      return json({ error: "Only National admins can manage other admins" }, 403);
    }
    if (adminActions && !target_uid) return json({ error: "Missing target_uid" }, 400);

    // Cannot act on self for delete
    if (action === "delete_admin" && target_uid === caller.id) {
      return json({ error: "You cannot delete your own account" }, 400);
    }

    // Look up target for logging (admin actions only — others use tsid/school_code)
    let target: { name?: string; email?: string; role?: string } | null = null;
    if (adminActions && target_uid) {
      const { data } = await admin
        .from("admin_users").select("name,email,role").eq("auth_uid", target_uid).maybeSingle();
      target = data;
    }

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

    if (action === "reset_school_password") {
      if (!isGovTier) return json({ error: "Not permitted" }, 403);
      if (!school_code) return json({ error: "Missing school_code" }, 400);
      if (!new_password || new_password.length < 6) {
        return json({ error: "Password must be at least 6 characters" }, 400);
      }

      // Look up the school + its auth account
      const { data: school } = await admin
        .from("schools")
        .select("school_code, school_name, region, district, auth_uid, email")
        .eq("school_code", school_code)
        .maybeSingle();
      if (!school) return json({ error: "School not found" }, 404);
      if (!school.auth_uid) return json({ error: "This school has no login account" }, 400);

      // Scope enforcement
      if (isRegional && school.region !== callerAdmin.region) {
        return json({ error: "Regional admins can only manage schools in their own region" }, 403);
      }
      if (isDistrict && school.district !== callerAdmin.district) {
        return json({ error: "District admins can only manage schools in their own district" }, 403);
      }

      const { error } = await admin.auth.admin.updateUserById(school.auth_uid, { password: new_password });
      if (error) return json({ error: error.message }, 400);

      await admin.from("activity_logs").insert({
        action: "school:reset_password",
        message: `Reset password for school ${school.school_code} — ${school.school_name}`,
        by_name: caller.email ?? "Admin", by_role: callerAdmin.role, by_ref: school.school_code,
      });
      return json({ success: true });
    }

    if (action === "reset_student_password") {
      if (!isGovTier && !isSchool) return json({ error: "Not permitted" }, 403);
      if (!body.tsid) return json({ error: "Missing tsid" }, 400);
      if (!new_password || new_password.length < 6) return json({ error: "Password too short" }, 400);

      const { data: stu } = await admin.from("students")
        .select("tsid, fullname, region, district, school_code, auth_uid").eq("tsid", body.tsid).maybeSingle();
      if (!stu) return json({ error: "Student not found" }, 404);
      if (!stu.auth_uid) return json({ error: "Student has no login account" }, 400);

      // Scope checks
      if (isSchool && callerAdmin.ref !== stu.school_code) return json({ error: "Out of school scope" }, 403);
      if (isRegional && stu.region !== callerAdmin.region) return json({ error: "Out of region scope" }, 403);
      if (isDistrict && stu.district !== callerAdmin.district) return json({ error: "Out of district scope" }, 403);

      const { error } = await admin.auth.admin.updateUserById(stu.auth_uid, { password: new_password });
      if (error) return json({ error: error.message }, 400);
      await admin.from("activity_logs").insert({
        action: "student:reset_password", message: `Reset password for ${stu.tsid} (${stu.fullname})`,
        by_name: caller.email ?? "Admin", by_role: callerAdmin.role, by_ref: stu.tsid,
      });
      return json({ success: true });
    }

    if (action === "delete_student") {
      // National only (used when approving a delete request)
      if (!isNational) return json({ error: "Only National admins can delete students" }, 403);
      if (!body.tsid) return json({ error: "Missing tsid" }, 400);
      const { data: stu } = await admin.from("students").select("tsid, fullname, auth_uid").eq("tsid", body.tsid).maybeSingle();
      if (!stu) return json({ error: "Student not found" }, 404);
      await admin.from("students").delete().eq("tsid", body.tsid);
      if (stu.auth_uid) {
        await admin.from("admin_users").delete().eq("auth_uid", stu.auth_uid);
        await admin.from("user_roles").delete().eq("user_id", stu.auth_uid);
        await admin.auth.admin.deleteUser(stu.auth_uid);
      }
      await admin.from("activity_logs").insert({
        action: "student:delete", message: `Deleted ${stu.tsid} (${stu.fullname})`,
        by_name: caller.email ?? "Admin", by_role: callerAdmin.role, by_ref: stu.tsid,
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
