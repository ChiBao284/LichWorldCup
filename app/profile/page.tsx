"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { AVATARS } from "@/lib/avatars";
import Avatar from "@/components/Avatar";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signInWithGoogle, refreshProfile } = useUser();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadedProfileId, setLoadedProfileId] = useState<string | null>(null);

  // Đổ dữ liệu profile vào form đúng một lần khi profile tải xong
  if (profile && profile.id !== loadedProfileId) {
    setLoadedProfileId(profile.id);
    setUsername(profile.username);
    setAvatar(profile.avatar);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="shimmer h-64 rounded-3xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mb-4 text-6xl">🔐</div>
        <h1 className="mb-4 text-3xl font-black">Bạn chưa đăng nhập</h1>
        <button
          onClick={signInWithGoogle}
          className="rounded-full bg-gradient-to-r from-neon to-ice px-7 py-3 font-bold text-pitch transition hover:scale-105"
        >
          Đăng nhập bằng Google
        </button>
      </div>
    );
  }

  async function save() {
    if (!user || !username.trim() || saving) return;
    setSaving(true);
    await supabaseBrowser()
      .from("profiles")
      .upsert({ id: user.id, username: username.trim(), avatar });
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/");
    }, 900);
  }

  // Ảnh đại diện Google (nếu đăng nhập bằng Gmail) — cho phép chọn lại
  const googlePhoto: string | undefined =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 sm:p-8"
      >
        <h1 className="mb-1 text-3xl font-black">
          Hồ sơ <span className="text-gradient">của bạn</span>
        </h1>
        <p className="mb-8 text-sm text-muted2">
          Tên và avatar này sẽ hiện khi bạn pick đội & đặt nước.
        </p>

        {/* Preview */}
        <div className="mb-8 flex items-center gap-4">
          <motion.div
            key={avatar}
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-card text-5xl shadow-sm"
          >
            <Avatar value={avatar} />
          </motion.div>
          <div>
            <p className="text-xl font-black">{username || "Tên của bạn"}</p>
            <p className="text-xs text-muted3">{user.email}</p>
          </div>
        </div>

        <label className="mb-2 block text-sm font-bold">Tên hiển thị</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={30}
          placeholder="vd: Trùm kèo trà sữa"
          className="mb-6 w-full rounded-xl border border-hairline bg-soft px-4 py-3 outline-none placeholder:text-muted3 focus:border-neon/50"
        />

        <label className="mb-2 block text-sm font-bold">Chọn avatar đại diện</label>

        {/* Dùng lại ảnh Google */}
        {googlePhoto && (
          <button
            onClick={() => setAvatar(googlePhoto)}
            className={`mb-3 flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              avatar === googlePhoto
                ? "border-accent bg-accent/10"
                : "border-hairline hover:bg-soft"
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-soft">
              <Avatar value={googlePhoto} />
            </span>
            Dùng ảnh Google của bạn
          </button>
        )}

        <div className="mb-8 grid grid-cols-8 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`flex aspect-square items-center justify-center rounded-xl text-2xl transition hover:scale-110 ${
                avatar === a
                  ? "bg-neon/20 ring-2 ring-neon"
                  : "bg-soft hover:bg-soft2"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving || !username.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-neon to-ice py-3 font-black text-pitch transition hover:opacity-90 disabled:opacity-50"
        >
          {saved ? "Đã lưu! 🎉" : saving ? "Đang lưu..." : "Lưu hồ sơ"}
        </button>
      </motion.div>
    </div>
  );
}
