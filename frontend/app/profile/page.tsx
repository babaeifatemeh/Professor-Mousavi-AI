"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  KeyRound,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  User,
} from "lucide-react";

type UserData = {
  id: number;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_active?: boolean;
};

type ProfileStats = {
  conversations_count: number;
  messages_count: number;
  latest_conversation_at: string | null;
};

type ToastData = {
  message: string;
  type: "success" | "error" | "info";
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api-backend";

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    conversations_count: 0,
    messages_count: 0,
    latest_conversation_at: null,
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      window.location.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as UserData;
      setUser(parsedUser);
      setFullName(parsedUser.full_name);
      setEmail(parsedUser.email);
      loadProfile(parsedUser.id);
    } catch {
      localStorage.removeItem("user");
      window.location.replace("/login");
    }
  }, []);

  function showToast(message: string, type: ToastData["type"] = "info") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }

  async function loadProfile(userId: number) {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/profile/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || "خطا در دریافت اطلاعات پروفایل.", "error");
        return;
      }

      setUser(data.user);
      setFullName(data.user.full_name);
      setEmail(data.user.email);
      setStats(data.stats || stats);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch {
      showToast("خطا در ارتباط با سرور.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    if (!user) return;

    try {
      setSavingProfile(true);

      const response = await fetch(`${API_URL}/auth/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || "ویرایش پروفایل ناموفق بود.", "error");
        return;
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      showToast(data.message || "پروفایل ذخیره شد.", "success");
    } catch {
      showToast("خطا در ارتباط با سرور هنگام ذخیره پروفایل.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (!user) return;

    if (newPassword.length < 8) {
      showToast("رمز عبور جدید باید حداقل ۸ کاراکتر باشد.", "error");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(`${API_URL}/auth/profile/${user.id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || "تغییر رمز عبور ناموفق بود.", "error");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      showToast(data.message || "رمز عبور تغییر کرد.", "success");
    } catch {
      showToast("خطا در ارتباط با سرور هنگام تغییر رمز.", "error");
    } finally {
      setChangingPassword(false);
    }
  }

  function logout() {
    localStorage.removeItem("user");
    window.location.replace("/");
  }

  const latestConversation = stats.latest_conversation_at
    ? new Date(stats.latest_conversation_at).toLocaleString("fa-IR")
    : "هنوز گفتگویی ثبت نشده است";

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-green-50 to-white px-4 py-6 text-green-950 sm:px-6 lg:px-10">
      {toast && (
        <div
          className={`fixed left-4 top-4 z-[9999] rounded-2xl px-5 py-3 text-sm font-bold shadow-2xl ${
            toast.type === "success"
              ? "bg-green-700 text-white"
              : toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-white text-green-900"
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-green-800 shadow-sm">
              <ArrowRight size={18} />
              بازگشت به سایت
            </Link>
            <h1 className="text-3xl font-extrabold text-green-900">پروفایل کاربری</h1>
            <p className="mt-2 text-sm text-gray-600">اطلاعات حساب، آمار گفتگوها و تنظیمات امنیتی شما</p>
          </div>

          {user?.is_admin && (
            <Link href="/admin" className="rounded-2xl bg-green-800 px-5 py-3 text-center font-bold text-white shadow-lg shadow-green-200 transition hover:bg-green-900">
              ورود به پنل مدیریت
            </Link>
          )}
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-bold text-gray-500 shadow-xl">در حال دریافت اطلاعات پروفایل...</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <aside className="rounded-3xl border border-green-100 bg-white p-6 shadow-xl shadow-green-100/70">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-800">
                  <User size={42} />
                </div>
                <h2 className="mt-4 text-2xl font-extrabold text-green-900">{user?.full_name}</h2>
                <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
                <span className="mt-4 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
                  {user?.is_admin ? "مدیر سامانه" : "کاربر سامانه"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-green-50 p-4 text-center">
                  <MessageSquareText className="mx-auto text-green-700" size={24} />
                  <div className="mt-2 text-2xl font-extrabold">{stats.conversations_count}</div>
                  <div className="text-xs text-gray-600">گفتگو</div>
                </div>
                <div className="rounded-2xl bg-green-50 p-4 text-center">
                  <BookOpen className="mx-auto text-green-700" size={24} />
                  <div className="mt-2 text-2xl font-extrabold">{stats.messages_count}</div>
                  <div className="text-xs text-gray-600">پیام</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-green-100 bg-white p-4 text-sm leading-8 text-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <span>وضعیت حساب</span>
                  <b className="text-green-800">{user?.is_active === false ? "غیرفعال" : "فعال"}</b>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>نقش</span>
                  <b className="text-green-800">{user?.is_admin ? "مدیر" : "کاربر"}</b>
                </div>
                <div className="mt-2 border-t border-green-50 pt-2">
                  <span className="block text-gray-500">آخرین گفتگوی ثبت‌شده</span>
                  <b className="block text-green-900">{latestConversation}</b>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-3 font-extrabold text-red-700 transition hover:bg-red-100"
              >
                <LogOut size={18} />
                خروج از حساب
              </button>
            </aside>

            <section className="space-y-6">
              <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-xl shadow-green-100/70">
                <div className="mb-5 flex items-center gap-3">
                  <ShieldCheck className="text-green-700" />
                  <h2 className="text-xl font-extrabold text-green-900">ویرایش اطلاعات حساب</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-green-900">نام و نام خانوادگی</span>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="w-full rounded-2xl border border-green-200 px-4 py-3 outline-none focus:border-green-700"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-green-900">ایمیل</span>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-green-200 px-4 py-3 text-left outline-none focus:border-green-700"
                      dir="ltr"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={updateProfile}
                  disabled={savingProfile}
                  className="mt-5 rounded-2xl bg-green-800 px-7 py-3 font-extrabold text-white transition hover:bg-green-900 disabled:bg-gray-300"
                >
                  {savingProfile ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
              </div>

              <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-xl shadow-green-100/70">
                <div className="mb-5 flex items-center gap-3">
                  <KeyRound className="text-green-700" />
                  <h2 className="text-xl font-extrabold text-green-900">تغییر رمز عبور</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-green-900">رمز عبور فعلی</span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="w-full rounded-2xl border border-green-200 px-4 py-3 outline-none focus:border-green-700"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-green-900">رمز عبور جدید</span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full rounded-2xl border border-green-200 px-4 py-3 outline-none focus:border-green-700"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={changePassword}
                  disabled={changingPassword}
                  className="mt-5 rounded-2xl border border-green-700 px-7 py-3 font-extrabold text-green-800 transition hover:bg-green-50 disabled:border-gray-300 disabled:text-gray-400"
                >
                  {changingPassword ? "در حال تغییر..." : "تغییر رمز عبور"}
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
