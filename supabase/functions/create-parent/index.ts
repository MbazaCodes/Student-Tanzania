// Supabase Edge Function: create-parent
// Creates a Parent/Guardian login (real email) + admin_users row (role=parent)
// and links one or more children (tsids). Caller must be a school or gov admin.

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
  relationship?: string | null;
  children: string[];          // tsids to link
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
    const canCreate = ["school", "gov", "admin", "gov_region", "gov_district"].includes(callerAdmin.role);
    if (!canCreate) return json({ error: "Not allowed" }, 403);

    const p: Payload = await req.json();
    if (!p.email || !p.password || !p.name) return json({ error: "name, email, password required" }, 400);
    const children = (p.children ?? []).filter(Boolean);

    const parentRef = p.email.toLowerCase();

    // Reuse an existing parent if the email already exists (link more children).
    let parentUid: string | null = null;
    const { data: existing } = await admin.from("admin_users").select("auth_uid, ref").eq("email", parentRef).eq("role", "parent").maybeSingle();

    if (existing) {
      parentUid = existing.auth_uid;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: p.email, password: p.password, email_confirm: true,
        user_metadata: { role: "parent", name: p.name },
        app_metadata: { role: "parent" },
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? "Failed to create parent login" }, 400);
      parentUid = created.user.id;

      const { error: auErr } = await admin.from("admin_users").insert({
        auth_uid: parentUid, name: p.name, email: parentRef, role: "parent",
        region: p.region ?? null, district: p.district ?? null, ref: parentRef,
        status: "active", created_by: caller.id,
      });
      if (auErr) { await admin.auth.admin.deleteUser(parentUid); return json({ error: auErr.message }, 400); }
      await admin.from("user_roles").upsert({ user_id: parentUid, role: "parent" });
    }

    // Link children
    for (const tsid of children) {
      await admin.from("parent_children").upsert(
        { parent_ref: parentRef, parent_uid: parentUid, tsid, relationship: p.relationship ?? null },
        { onConflict: "parent_ref,tsid" },
      );
    }

    await admin.from("activity_logs").insert({
      action: "parent:create", message: `parent ${p.name} linked to ${children.length} child(ren)`,
      by_name: callerAdmin.ref ?? "admin", by_role: callerAdmin.role, by_ref: parentRef,
    });

    return json({ ok: true, parent_ref: parentRef, linked: children.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
