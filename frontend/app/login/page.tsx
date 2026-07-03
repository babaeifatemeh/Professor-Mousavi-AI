"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import AuthHeader from "@/components/AuthHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api-backend";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !password) {
      alert("لطفاً ایمیل و رمز عبور را وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "ورود ناموفق بود.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      alert("ورود با موفقیت انجام شد.");
      router.push("/");
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
          <h1 className="text-3xl font-extrabold text-green-900">
            ورود به حساب کاربری
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            برای مشاهده تاریخچه گفتگوها وارد شوید.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
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
              رمز عبور
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <LogIn size={18} />
            {loading ? "در حال ورود..." : "ورود"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-bold text-green-800 hover:text-green-900">
            رمز عبور را فراموش کرده‌اید؟
          </Link>

          <Link href="/register" className="font-bold text-green-800 hover:text-green-900">
            عضویت
          </Link>
        </div>
      </div>
    </main>
  );
}