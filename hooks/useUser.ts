"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { isAnonymousName } from "@/lib/avatars";
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

    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      let prof = (data as Profile) ?? null;

      // Backfill từ Google: nếu profile vẫn còn nguyên trạng "ẩn danh"
      // (người dùng chưa tự đặt tên) thì lấy tên + ảnh từ tài khoản Gmail.
      const gName: string | undefined =
        user.user_metadata?.full_name || user.user_metadata?.name;
      const gPhoto: string | undefined =
        user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (prof && isAnonymousName(prof.username) && (gName || gPhoto)) {
        const { data: updated } = await supabase
          .from("profiles")
          .update({
            username: gName || prof.username,
            avatar: gPhoto || prof.avatar,
          })
          .eq("id", user.id)
          .select()
          .single();
        if (updated) prof = updated as Profile;
      }

      if (!cancelled) setProfile(prof);
    })();

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
      // Quay lại đúng trang đang đứng (phải nằm trong Redirect URLs allowlist
      // ở Supabase → Auth → URL Configuration, nếu không sẽ rơi về Site URL).
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabaseBrowser().auth.signOut();
    setProfile(null);
  }, []);

  return { user, profile, loading, signInWithGoogle, signOut, refreshProfile };
}
