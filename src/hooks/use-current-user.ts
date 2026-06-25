import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminTier, type Role } from "@/lib/tsid";

export type CurrentUser = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  role: Role | null;
  /** admin_users.ref — school code for schools, TSID for students, null otherwise */
  ref: string | null;
  /** convenience: ref when role === 'school' */
  schoolCode: string | null;
  /** convenience: ref when role === 'student' */
  tsid: string | null;
  fullName: string | null;
  /** region this admin manages (null = national) */
  region: string | null;
  /** district this admin manages (null = national/regional) */
  district: string | null;
  /** 0 national, 1 regional, 2 district, null = non-gov */
  tier: 0 | 1 | 2 | null;
};

export function useCurrentUser(): CurrentUser {
  const [state, setState] = useState<CurrentUser>({
    loading: true, userId: null, email: null, role: null, ref: null,
    schoolCode: null, tsid: null, fullName: null, region: null, district: null, tier: null,
  });
  // Track mounted state to prevent setState after unmount
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted.current) return;

      if (!user) {
        setState({ loading: false, userId: null, email: null, role: null, ref: null,
          schoolCode: null, tsid: null, fullName: null, region: null, district: null, tier: null });
        return;
      }

      // 1. Try admin_users table first
      const { data: prof } = await supabase
        .from("admin_users")
        .select("role, ref, name, region, district")
        .eq("auth_uid", user.id)
        .maybeSingle();

      if (!mounted.current) return;

      // 2. Fallback to auth app_metadata
      let role = (prof?.role as Role | undefined) ?? (user.app_metadata?.role as Role | undefined) ?? null;

      // 3. Fallback to user_roles table
      if (!role) {
        const { data: urRow } = await supabase
          .from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
        if (urRow?.role) role = urRow.role as Role;
      }

      const ref = prof?.ref ?? null;
      setState({
        loading: false,
        userId: user.id,
        email: user.email ?? null,
        role,
        ref,
        schoolCode: role === "school" ? ref : null,
        tsid: role === "student" ? ref : null,
        fullName: prof?.name ?? user.email ?? null,
        region: prof?.region ?? null,
        district: prof?.district ?? null,
        tier: adminTier(role),
      });
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (mounted.current) load();
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
