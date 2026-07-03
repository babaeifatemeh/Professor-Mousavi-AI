"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import AuthHeader from "@/components/AuthHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api-backend";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !newPassword || !repeatPassword) {
      alert("لطفاً همه فیلدها را پر کنید.");
      return;
    }

    if (newPassword !== repeatPassword) {
      alert("رمز جدید و تکرار آن یکسان نیستند.");
      return;
    }

    if (newPassword.length < 8) {
      alert("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "تغییر رمز ناموفق بود.");
        return;
      }

      alert("رمز عبور با موفقیت تغییر یافت. اکنون وارد شوید.");
      window.location.href = "/login";
    } catch {
      alert("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#eef8ef] px-6 py-10 text-green-950">
      <AuthHeader />

      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-green-100">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50">
            <KeyRound size={32} className="text-green-700" />
          </div>

          <h1 className="text-3xl font-extrabold text-green-900">
            بازیابی رمز عبور
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            ایمیل حساب کاربری و رمز جدید را وارد کنید.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-green-900">
              ایمیل
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-green-200 px-4 py-3 text-left outline-none focus:border-green-700"
              placeholder="example@gmail.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-green-900">
              رمز عبور جدید
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-green-200 px-4 py-3 text-left outline-none focus:border-green-700"
              placeholder="********"
              dir="ltr"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-green-900">
              تکرار رمز عبور جدید
            </label>

            <input
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="w-full rounded-xl border border-green-200 px-4 py-3 text-left outline-none focus:border-green-700"
              placeholder="********"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-3 font-bold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <KeyRound size={18} />
            {loading ? "در حال تغییر رمز..." : "تغییر رمز عبور"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          رمز را به خاطر آوردید؟{" "}
          <Link href="/login" className="font-bold text-green-800 hover:text-green-900">
            ورود
          </Link>
        </p>
      </div>
    </main>
  );
}