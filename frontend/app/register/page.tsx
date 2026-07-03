"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import AuthHeader from "@/components/AuthHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api-backend";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!fullName || !email || !password) {
      alert("لطفاً همه فیلدها را پر کنید.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "ثبت‌نام ناموفق بود.");
        return;
      }

      alert("ثبت‌نام با موفقیت انجام شد. اکنون وارد شوید.");
      router.push("/login");
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
            عضویت در سایت
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            برای ذخیره تاریخچه گفتگوها، ابتدا حساب کاربری بسازید.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-green-900">
              نام و نام خانوادگی
            </label>

            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-green-200 px-4 py-3 outline-none focus:border-green-700"
              placeholder="مثلاً سید علی موسوی"
            />
          </div>

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
            <UserPlus size={18} />
            {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/login" className="font-bold text-green-800 hover:text-green-900">
            ورود
          </Link>
        </p>
      </div>
    </main>
  );
}