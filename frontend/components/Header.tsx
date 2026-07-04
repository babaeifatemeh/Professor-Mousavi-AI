"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, LogOut, User } from "lucide-react";

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    <nav className="relative z-30 mx-auto flex max-w-7xl flex-col gap-5 rounded-3xl border border-green-100 bg-white/95 px-4 py-5 text-center shadow-xl shadow-green-200/50 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-9 lg:py-7 lg:text-right">
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-green-200 bg-green-50 sm:h-20 sm:w-20">
          <BookOpen size={34} className="text-green-700 sm:size-10" />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-9 text-green-900 sm:text-2xl lg:text-3xl">
            پایگاه جامع درسی
          </h1>

          <p className="mt-1 text-sm leading-7 text-green-900 sm:text-base lg:mt-2">
            استاد علامه سید علی موسوی(ره)
          </p>
        </div>
      </div>

      <div
        className="relative flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:w-auto lg:justify-end"
        ref={menuRef}
      >
        {!user ? (
          <>
            <Link
              href="/login"
              className="w-full rounded-xl border border-green-700 px-5 py-3 text-center font-semibold text-green-800 transition hover:bg-green-50 sm:w-auto sm:px-7"
            >
              ورود
            </Link>

            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-800 sm:w-auto sm:px-7"
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
              className="flex w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3 font-semibold text-green-900 transition hover:bg-green-100 sm:w-auto sm:max-w-xs lg:justify-start"
            >
              <User size={18} className="shrink-0" />
              <span className="truncate">{user.full_name}</span>
              <ChevronDown size={18} className="shrink-0" />
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-14 z-50 w-full rounded-2xl border border-green-100 bg-white p-3 text-right shadow-2xl shadow-green-200/60 sm:w-72 lg:top-16">
                <div className="border-b border-green-100 px-3 py-3">
                  <div className="truncate font-bold text-green-900">
                    {user.full_name}
                  </div>
                  <div className="mt-1 truncate text-xs text-gray-500">
                    {user.email}
                  </div>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-right text-green-900 transition hover:bg-green-50"
                >
                  <span>👤</span>
                  پروفایل من
                </Link>

                {user.is_admin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-right text-green-900 transition hover:bg-green-50"
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
