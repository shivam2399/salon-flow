"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch, getErrorMessage, formatPrice, getToken } from "@/lib/api";

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, appointments, users, services, staff

  // Stats
  const [stats, setStats] = useState(null);

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  // Users
  const [users, setUsers] = useState([]);

  // Services
  const [services, setServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(45);
  const [newServicePriceRs, setNewServicePriceRs] = useState(500);

  // Staff
  const [staffList, setStaffList] = useState([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffBio, setNewStaffBio] = useState("");

  // Status/Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    try {
      const userRes = await apiFetch("/auth/me");
      const user = userRes?.data?.user;
      setCurrentUser(user);

      if (user?.role !== "admin") {
        setLoading(false);
        return;
      }

      // Load stats
      const statsRes = await apiFetch("/admin/stats");
      setStats(statsRes?.data || null);

      // Load appointments
      const apptRes = await apiFetch(`/admin/appointments${statusFilter ? `?status=${statusFilter}` : ""}`);
      setAppointments(apptRes?.data?.appointments || []);

      // Load users
      const usersRes = await apiFetch("/admin/users");
      setUsers(usersRes?.data?.users || []);

      // Load services
      const srvRes = await apiFetch("/services?includeInactive=true");
      setServices(srvRes?.data?.services || []);

      // Load staff
      const stfRes = await apiFetch("/staff");
      setStaffList(stfRes?.data?.staff || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update appointment status
  async function handleUpdateStatus(id, newStatus) {
    setActionLoading(true);
    setMessage("");
    setError("");
    try {
      await apiFetch(`/admin/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setMessage(`Appointment #${id} status changed to ${newStatus}.`);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  // Toggle user status
  async function handleToggleUser(userId, currentActive) {
    setActionLoading(true);
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setMessage(`User account status updated.`);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  // Create Service
  async function handleCreateService(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch("/services", {
        method: "POST",
        body: JSON.stringify({
          name: newServiceName,
          description: newServiceDesc,
          durationMinutes: Number(newServiceDuration),
          pricePaise: Number(newServicePriceRs) * 100,
        }),
      });
      setMessage("Service added successfully!");
      setNewServiceName("");
      setNewServiceDesc("");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  // Create Staff
  async function handleCreateStaff(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch("/staff", {
        method: "POST",
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          password: "StylistPassword123!",
          bio: newStaffBio,
          specialties: ["Hair styling"],
          serviceIds: services.map((s) => s.id),
        }),
      });
      setMessage("Staff member created successfully!");
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffBio("");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  // Trigger reminders
  async function handleTriggerReminders() {
    setActionLoading(true);
    try {
      const res = await apiFetch("/admin/reminders/trigger", {
        method: "POST",
      });
      setMessage(`Reminders check completed. Sent ${res?.data?.sent || 0} reminder emails.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <p className="py-20 text-center text-stone-500">Loading admin dashboard...</p>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold text-stone-900">Admin Access Required</h1>
        <p className="mt-3 text-stone-600">
          You must be logged in as an administrator to access the admin panel.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Demo Admin: <code className="bg-stone-100 p-1 rounded font-mono">admin@salonflow.local</code>
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"
        >
          Sign in as Admin
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 uppercase tracking-widest">
            Salon Administrator
          </span>
          <h1 className="mt-2 text-3xl font-bold text-stone-900">SalonFlow Management Dashboard</h1>
          <p className="mt-1 text-sm text-stone-500">
            Control customer bookings, services menu, stylists, and automated reminder tasks.
          </p>
        </div>

        <button
          onClick={handleTriggerReminders}
          disabled={actionLoading}
          className="rounded-full bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
        >
          ⏰ Run Upcoming Reminders Check
        </button>
      </div>

      {message && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-stone-500">Total Revenue</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">
              {formatPrice(stats.totalRevenuePaise)}
            </p>
            <p className="mt-1 text-xs text-stone-400">From completed appointments</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-stone-500">Total Bookings</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{stats.totalAppointments}</p>
            <p className="mt-1 text-xs text-stone-400">
              {stats.statusCounts?.confirmed || 0} confirmed · {stats.statusCounts?.completed || 0} completed
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-stone-500">Registered Customers</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{stats.totalUsers}</p>
            <p className="mt-1 text-xs text-stone-400">Active accounts</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-stone-500">Active Services & Staff</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">
              {stats.totalServices} services / {stats.totalStaff} staff
            </p>
            <p className="mt-1 text-xs text-stone-400">Currently available</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex gap-2 border-b border-stone-200 pb-3">
        {[
          { key: "overview", label: "All Appointments" },
          { key: "users", label: "Customers & Users" },
          { key: "services", label: "Services Menu" },
          { key: "staff", label: "Stylists & Staff" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Appointments Management */}
      {activeTab === "overview" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900">Appointment Management</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600 uppercase">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Service</th>
                  <th className="px-5 py-4">Stylist</th>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Change Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-stone-500">
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-stone-50">
                      <td className="px-5 py-4 font-mono font-medium">#{appt.id}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-stone-900">{appt.customer?.name || "Customer"}</p>
                        <p className="text-xs text-stone-500">{appt.customer?.email}</p>
                      </td>
                      <td className="px-5 py-4 font-medium">{appt.service?.name}</td>
                      <td className="px-5 py-4">{appt.staff?.user?.name || "Stylist"}</td>
                      <td className="px-5 py-4">
                        {new Date(appt.startTime).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: "Asia/Kolkata",
                        })}
                      </td>
                      <td className="px-5 py-4 font-bold">{formatPrice(appt.pricePaise)}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold capitalize">
                          {appt.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={appt.status}
                          disabled={actionLoading}
                          onChange={(e) => handleUpdateStatus(appt.id, e.target.value)}
                          className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-medium outline-none"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no_show">No Show</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === "users" && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-bold text-stone-900">Customer Account Management</h2>
          <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600 uppercase">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="px-5 py-4 font-mono font-medium">#{u.id}</td>
                    <td className="px-5 py-4 font-semibold text-stone-900">{u.name}</td>
                    <td className="px-5 py-4">{u.email}</td>
                    <td className="px-5 py-4">{u.phone || "—"}</td>
                    <td className="px-5 py-4 capitalize">{u.role}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u.id, u.isActive)}
                          className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-stone-900"
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Services Menu */}
      {activeTab === "services" && (
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-stone-900 mb-4">Current Salon Services</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((s) => (
                <div key={s.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-stone-900 text-lg">{s.name}</h3>
                    <span className="text-sm font-bold text-rose-600">{formatPrice(s.pricePaise)}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{s.durationMinutes} minutes</p>
                  <p className="mt-2 text-sm text-stone-600">{s.description || "No description provided."}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-900">Add New Service</h3>
              <form onSubmit={handleCreateService} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Service Name</label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g. Beard Trim & Shape"
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    min={15}
                    step={15}
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Price (INR)</label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={newServicePriceRs}
                    onChange={(e) => setNewServicePriceRs(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Description</label>
                  <textarea
                    rows={2}
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full rounded-full bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Create Service
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Staff Management */}
      {activeTab === "staff" && (
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-stone-900 mb-4">Stylists & Staff Profiles</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {staffList.map((st) => (
                <div key={st.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-stone-900 text-lg">{st.user?.name || "Stylist"}</h3>
                  <p className="text-xs text-stone-500">{st.user?.email}</p>
                  <p className="mt-2 text-sm text-stone-600">{st.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {st.specialties?.map((sp, idx) => (
                      <span key={idx} className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-900">Add New Stylist</h3>
              <form onSubmit={handleCreateStaff} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Vikram Sethi"
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Staff Email</label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="vikram@salonflow.local"
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Bio & Experience</label>
                  <textarea
                    rows={2}
                    value={newStaffBio}
                    onChange={(e) => setNewStaffBio(e.target.value)}
                    placeholder="Senior hair specialist with 5 years experience"
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full rounded-full bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Add Stylist
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
