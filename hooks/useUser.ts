"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

/** Hook lấy user đăng nhập + profile (username, avatar). */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = supabaseBrowser();

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabaseBrowser()
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile((data as Profile) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const { data } = await supabaseBrowser()
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      alert("Chưa cấu hình Supabase — xem README.md để thiết lập.");
      return;
    }
    await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabaseBrowser().auth.signOut();
    setProfile(null);
  }, []);

  return { user, profile, loading, signInWithGoogle, signOut, refreshProfile };
}
