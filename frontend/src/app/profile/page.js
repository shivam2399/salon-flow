"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getErrorMessage, getToken } from "@/lib/api";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferences, setPreferences] = useState({
    preferredStylist: "",
    remindersEmail: true,
    remindersSms: false,
    quietAppointment: false,
    hairNotes: "",
  });

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    async function loadProfile() {
      try {
        const payload = await apiFetch("/auth/profile");
        const user = payload?.data?.user;
        if (user) {
          setName(user.name || "");
          setEmail(user.email || "");
          setPhone(user.phone || "");
          if (user.preferences) {
            setPreferences((prev) => ({ ...prev, ...user.preferences }));
          }
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          phone,
          preferences,
        }),
      });

      setSuccess("Profile and preferences updated successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!getToken() && !loading) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-3xl font-semibold">Sign in to manage your profile</h1>
        <p className="mt-3 text-stone-500">You must be logged in to access this page.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"
        >
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
          Account Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">
          Profile & Preferences
        </h1>
        <p className="mt-2 text-stone-500">
          Manage your personal contact details and salon styling preferences.
        </p>
      </div>

      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-stone-500">Loading profile...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Personal Info Card */}
          <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-900">Personal Information</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-900">Salon & Appointment Preferences</h2>
            <p className="mt-1 text-sm text-stone-500">Customize how your stylists prepare for your appointments.</p>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Preferred Stylist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={preferences.preferredStylist || ""}
                  onChange={(e) => setPreferences({ ...preferences, preferredStylist: e.target.value })}
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Personal Styling Notes & Hair Quirks</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Sensitive scalp, prefer scissors only, allergic to ammonia"
                  value={preferences.hairNotes || ""}
                  onChange={(e) => setPreferences({ ...preferences, hairNotes: e.target.value })}
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div className="space-y-4 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.remindersEmail}
                    onChange={(e) => setPreferences({ ...preferences, remindersEmail: e.target.checked })}
                    className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-sm font-medium text-stone-800">Receive email reminders for upcoming appointments</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.quietAppointment}
                    onChange={(e) => setPreferences({ ...preferences, quietAppointment: e.target.checked })}
                    className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-sm font-medium text-stone-800">Quiet appointment (minimal talking for quiet relaxation)</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-rose-600 px-8 py-3.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? "Saving Changes..." : "Save Preferences"}
          </button>
        </form>
      )}
    </div>
  );
}

