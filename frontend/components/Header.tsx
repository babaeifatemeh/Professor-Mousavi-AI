"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, LogOut, Settings, User } from "lucide-react";

type UserData = {
  id: number;
  full_name: string;
  email: string;
  is_admin: boolean;
};

export default function Header() {
  const [user, setUser] = useState<UserData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    window.location.replace("/");
  }

  return (
    <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between rounded-3xl border border-green-100 bg-white/90 px-9 py-7 shadow-xl shadow-green-200/50">
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-green-200 bg-green-50">
          <BookOpen size={40} className="text-green-700" />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-green-900">
            پایگاه جامع درسی
          </h1>

          <p className="mt-2 text-base text-green-900">
            استاد علامه سید علی موسوی(ره)
          </p>
        </div>
      </div>

      <div className="relative flex items-center gap-4" ref={menuRef}>
        {!user ? (
          <>
            <Link
              href="/login"
              className="rounded-xl border border-green-700 px-7 py-3 font-semibold text-green-800 transition hover:bg-green-50"
            >
              ورود
            </Link>

            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-green-700 px-7 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              <User size={18} />
              عضویت
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl bg-green-50 px-5 py-3 font-semibold text-green-900 transition hover:bg-green-100"
            >
              <User size={18} />
              <span>{user.full_name}</span>
              <ChevronDown size={18} />
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-16 z-50 w-64 rounded-2xl border border-green-100 bg-white p-3 shadow-2xl shadow-green-200/60">
                <div className="border-b border-green-100 px-3 py-3">
                  <div className="font-bold text-green-900">
                    {user.full_name}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {user.email}
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-right font-bold text-red-700 transition hover:bg-red-100"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={18} />
                  پروفایل
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-right text-green-900 transition hover:bg-green-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings size={18} />
                  تنظیمات
                </button>

                {user.is_admin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-right text-green-900 transition hover:bg-green-50"
                  >
                    <span>🛠</span>
                    پنل مدیریت
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-right font-bold text-red-700 transition hover:bg-red-100"
                >
                  <LogOut size={18} />
                  خروج
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}