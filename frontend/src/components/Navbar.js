"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch, getToken, removeToken } from "@/lib/api";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }

    apiFetch("/auth/me")
      .then((data) => {
        setUser(data?.data?.user || null);
      })
      .catch(() => {
        setUser(null);
      });
  }, [pathname]);

  function logout() {
    removeToken();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold tracking-tight text-stone-900">
            Salon<span className="text-rose-600">Flow</span>
          </Link>

          <Link href="/#services" className="hidden text-sm font-medium text-stone-600 hover:text-rose-600 sm:block">
            Services
          </Link>
          <a
            href="http://localhost:5000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm font-medium text-stone-600 hover:text-rose-600 md:block"
          >
            API Docs ↗
          </a>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                href="/appointments"
                className="text-stone-600 hover:text-rose-600"
              >
                My bookings
              </Link>
              <Link
                href="/profile"
                className="text-stone-600 hover:text-rose-600"
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-stone-300 px-4 py-2 hover:border-rose-500 hover:text-rose-600"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full bg-stone-900 px-5 py-2.5 text-white transition hover:bg-rose-700"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}