"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage, setToken } from "@/lib/api";

function extractToken(payload) {
  return (
    payload?.token ??
    payload?.data?.token ??
    payload?.accessToken ??
    payload?.data?.accessToken
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const endpoint =
        mode === "login" ? "/auth/login" : "/auth/register";

      const body =
        mode === "login"
          ? { email, password }
          : { name: name.trim(), email, password };

      const payload = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const token = extractToken(payload);

      if (token) {
        setToken(token);
        router.push("/");
        router.refresh();
        return;
      }

      if (mode === "register") {
        setNotice("Account created. Please sign in with your new credentials.");
        setMode("login");
        setPassword("");
      } else {
        setError(
          "Login succeeded, but no token was found in the response. Check the response shape from your backend."
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[75vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="text-sm font-medium text-stone-500 hover:text-rose-600">
          ← Back to SalonFlow
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-rose-600">
          Welcome to SalonFlow
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          {mode === "login"
            ? "Sign in to book and manage your appointments."
            : "Create an account to reserve your next appointment."}
        </p>

        <div className="mt-7 grid grid-cols-2 rounded-xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setNotice("");
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
              mode === "login" ? "bg-white shadow-sm" : "text-stone-500"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setNotice("");
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
              mode === "register" ? "bg-white shadow-sm" : "text-stone-500"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {notice && (
          <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {mode === "register" && (
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-rose-600 px-6 py-3.5 font-semibold text-white transition hover:bg-rose-700"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          By continuing, you agree to use SalonFlow responsibly.
        </p>
      </div>
    </section>
  );
}