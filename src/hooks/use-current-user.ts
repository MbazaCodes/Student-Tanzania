import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/tsid";

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
};

export function useCurrentUser(): CurrentUser {
  const [state, setState] = useState<CurrentUser>({
    loading: true, userId: null, email: null, role: null, ref: null, schoolCode: null, tsid: null, fullName: null,
  });
  // Track mounted state to prevent setState after unmount
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted.current) return;

      if (!user) {
        setState({ loading: false, userId: null, email: null, role: null, ref: null, schoolCode: null, tsid: null, fullName: null });
        return;
      }

      const { data: prof } = await supabase
        .from("admin_users")
        .select("role, ref, name")
        .eq("auth_uid", user.id)
        .maybeSingle();

      if (!mounted.current) return;

      const role = (prof?.role as Role | undefined) ?? null;
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
