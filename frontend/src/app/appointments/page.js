"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  apiFetch,
  getCollection,
  getErrorMessage,
  formatPrice,
  getToken,
} from "@/lib/api";

function getServiceName(appointment) {
  return appointment.service?.name || "Salon service";
}

function getStaffName(appointment) {
  const staff = appointment.staff;
  if (!staff) return "Assigned stylist";
  if (staff.name) return staff.name;

  const user = staff.user;
  if (user) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.name || "Assigned stylist";
  }

  return "Assigned stylist";
}

function formatDateTime(value) {
  if (!value) return "Date not available";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function statusClass(status) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "cancelled":
      return "bg-stone-100 text-stone-600";
    case "completed":
      return "bg-blue-50 text-blue-700";
    case "in_progress":
      return "bg-purple-50 text-purple-700";
    default:
      return "bg-stone-100 text-stone-600";
  }
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Reschedule State
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newSlots, setNewSlots] = useState([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Review State
  const [reviewingAppt, setReviewingAppt] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Payment State
  const [payingId, setPayingId] = useState(null);

  const loadAppointments = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = await apiFetch("/appointments/my");
      setAppointments(getCollection(payload, "appointments"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isBooked = new URLSearchParams(window.location.search).get("booked") === "1";
    const isPaid = new URLSearchParams(window.location.search).get("paid") === "1";

    if (isPaid) {
      setMessage("Payment completed successfully! Your booking is confirmed.");
    } else if (isBooked) {
      setMessage("Your appointment was booked successfully. A confirmation email has been sent!");
    }

    loadAppointments();
  }, [loadAppointments]);

  async function cancelAppointment(id) {
    const confirmed = window.confirm("Are you sure you want to cancel this appointment?");
    if (!confirmed) return;

    setCancellingId(id);
    setError("");
    setMessage("");

    try {
      await apiFetch(`/appointments/${id}/cancel`, {
        method: "PATCH",
      });

      setMessage("Appointment cancelled successfully. A confirmation email has been sent.");
      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  // Load available slots for reschedule
  async function searchRescheduleSlots(dateVal) {
    setNewDate(dateVal);
    setSelectedSlotTime("");
    if (!dateVal || !reschedulingAppt) return;

    setLoadingSlots(true);
    try {
      const serviceId = reschedulingAppt.service?.id || reschedulingAppt.serviceId;
      const staffId = reschedulingAppt.staff?.id || reschedulingAppt.staffId;
      const res = await apiFetch(`/availability?serviceId=${serviceId}&date=${dateVal}&staffId=${staffId}`);
      const staffList = res?.data?.staff || [];
      const slots = staffList[0]?.slots || [];
      setNewSlots(slots);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleConfirmReschedule() {
    if (!selectedSlotTime) {
      alert("Please select a time slot.");
      return;
    }

    setRescheduleLoading(true);
    try {
      await apiFetch(`/appointments/${reschedulingAppt.id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({
          startTime: selectedSlotTime,
        }),
      });

      setMessage("Appointment rescheduled successfully! A confirmation email has been sent.");
      setReschedulingAppt(null);
      await loadAppointments();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setRescheduleLoading(false);
    }
  }

  // Handle Pay Online
  async function handlePayOnline(appointment) {
    setPayingId(appointment.id);
    setError("");

    try {
      const res = await apiFetch(`/appointments/${appointment.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          paymentMethod: "stripe",
          transactionId: `stripe_txn_${Date.now()}`,
        }),
      });

      setMessage("Payment processed successfully! Invoice is now ready for download.");
      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPayingId(null);
    }
  }

  // Download Invoice PDF
  async function handleDownloadInvoice(appointmentId) {
    try {
      const token = getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/appointments/${appointmentId}/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${appointmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // Submit Review
  async function handleSubmitReview() {
    if (!reviewComment.trim()) {
      alert("Please write a comment.");
      return;
    }

    setReviewLoading(true);
    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          appointmentId: reviewingAppt.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      setMessage("Thank you! Your review has been recorded.");
      setReviewingAppt(null);
      setReviewComment("");
      await loadAppointments();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setReviewLoading(false);
    }
  }

  if (!getToken() && !loading) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-3xl font-semibold">Sign in to see your bookings</h1>
        <p className="mt-3 text-stone-500">
          Your appointments will appear here once you sign in.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex rounded-full bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"
        >
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto min-h-[70vh] max-w-5xl px-5 py-14 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
            Your SalonFlow account
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            My appointments
          </h1>
          <p className="mt-3 text-stone-500">
            Review your bookings, make payments, download invoices, or reschedule.
          </p>
        </div>

        <Link
          href="/#booking"
          className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Book another appointment
        </Link>
      </div>

      {message && (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-stone-500">
          Loading your appointments...
        </p>
      ) : appointments.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <div className="text-4xl">✦</div>
          <h2 className="mt-4 text-xl font-semibold">No appointments yet</h2>
          <p className="mt-2 text-stone-500">
            Your next salon visit is waiting to be booked.
          </p>
          <Link
            href="/#booking"
            className="mt-6 inline-flex rounded-full bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"
          >
            Find a time
          </Link>
        </div>
      ) : (
        <div className="mt-9 space-y-5">
          {appointments.map((appointment) => {
            const status = appointment.status;
            const isFuture = new Date(appointment.startTime).getTime() > Date.now();
            const canCancelOrReschedule = ["pending", "confirmed"].includes(status) && isFuture;
            const isCompleted = status === "completed";
            const isPaid = appointment.payment?.status === "completed";

            return (
              <article
                key={appointment.id}
                className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7"
              >
                <div className="flex flex-col justify-between gap-5 sm:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-stone-900">
                        {getServiceName(appointment)}
                      </h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(status)}`}>
                        {status?.replaceAll("_", " ") || "Unknown"}
                      </span>
                      {isPaid ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          ✓ Paid Online
                        </span>
                      ) : (
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                          Payment Pending
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-1.5 text-sm text-stone-600">
                      <p>
                        <span className="font-medium text-stone-900">Date:</span>{" "}
                        {formatDateTime(appointment.startTime)}
                      </p>
                      <p>
                        <span className="font-medium text-stone-900">Stylist:</span>{" "}
                        {getStaffName(appointment)}
                      </p>
                      <p>
                        <span className="font-medium text-stone-900">Duration:</span>{" "}
                        {appointment.durationMinutes} minutes
                      </p>
                      {appointment.notes && (
                        <p>
                          <span className="font-medium text-stone-900">Notes:</span>{" "}
                          {appointment.notes}
                        </p>
                      )}
                    </div>

                    {/* Customer Review Section */}
                    {appointment.review ? (
                      <div className="mt-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 p-4">
                        <div className="flex items-center gap-1 text-amber-500 text-sm">
                          {"★".repeat(appointment.review.rating)}
                          {"☆".repeat(5 - appointment.review.rating)}
                          <span className="ml-2 font-medium text-stone-700">Your Review</span>
                        </div>
                        <p className="mt-1 text-sm text-stone-700 italic">"{appointment.review.comment}"</p>
                        {appointment.review.staffResponse && (
                          <div className="mt-2.5 pl-3 border-l-2 border-amber-400 text-xs text-stone-600">
                            <span className="font-semibold text-stone-800">Stylist Response:</span> {appointment.review.staffResponse}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <p className="text-2xl font-bold text-stone-900">
                      {formatPrice(appointment.pricePaise)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {/* Pay Online */}
                      {!isPaid && status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => handlePayOnline(appointment)}
                          disabled={payingId === appointment.id}
                          className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
                        >
                          {payingId === appointment.id ? "Processing..." : "💳 Pay Online (Stripe)"}
                        </button>
                      )}

                      {/* Download Invoice */}
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(appointment.id)}
                        className="rounded-full border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:border-stone-900"
                      >
                        📄 Tax Invoice
                      </button>

                      {/* Reschedule */}
                      {canCancelOrReschedule && (
                        <button
                          type="button"
                          onClick={() => {
                            setReschedulingAppt(appointment);
                            setNewDate("");
                            setNewSlots([]);
                            setSelectedSlotTime("");
                          }}
                          className="rounded-full border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:border-stone-900"
                        >
                          🗓 Reschedule
                        </button>
                      )}

                      {/* Cancel */}
                      {canCancelOrReschedule && (
                        <button
                          type="button"
                          onClick={() => cancelAppointment(appointment.id)}
                          disabled={cancellingId === appointment.id}
                          className="rounded-full border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {cancellingId === appointment.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}

                      {/* Leave Review */}
                      {isCompleted && !appointment.review && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingAppt(appointment);
                            setReviewRating(5);
                            setReviewComment("");
                          }}
                          className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          ★ Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-bold text-stone-900">
              Reschedule Appointment
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              {getServiceName(reschedulingAppt)} with {getStaffName(reschedulingAppt)}
            </p>

            <div className="mt-5">
              <label className="block text-sm font-medium text-stone-700">Choose New Date</label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={newDate}
                onChange={(e) => searchRescheduleSlots(e.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 outline-none focus:border-rose-500"
              />
            </div>

            {loadingSlots && <p className="mt-4 text-sm text-stone-500">Checking stylist availability...</p>}

            {newDate && !loadingSlots && (
              <div className="mt-5">
                <label className="block text-sm font-medium text-stone-700">Choose New Time Slot</label>
                {newSlots.length === 0 ? (
                  <p className="mt-2 text-sm text-stone-500">No slots available on this date. Please pick another date.</p>
                ) : (
                  <div className="mt-2 grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {newSlots.map((s, idx) => {
                      const timeStr = s.startTime.split("T")[1].slice(0, 5);
                      const isSelected = selectedSlotTime === s.startTime;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlotTime(s.startTime)}
                          className={`rounded-xl border py-2 text-xs font-semibold transition ${
                            isSelected
                              ? "bg-rose-600 text-white border-rose-600"
                              : "border-stone-200 text-stone-700 hover:border-rose-400"
                          }`}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReschedulingAppt(null)}
                className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedSlotTime || rescheduleLoading}
                onClick={handleConfirmReschedule}
                className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {rescheduleLoading ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-bold text-stone-900">
              Leave Feedback & Review
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              How was your {getServiceName(reviewingAppt)}?
            </p>

            <div className="mt-5">
              <label className="block text-sm font-medium text-stone-700">Rating (1 to 5 Stars)</label>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl transition ${
                      star <= reviewRating ? "text-amber-500" : "text-stone-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-stone-700">Your Feedback</label>
              <textarea
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with the stylist..."
                className="mt-2 w-full rounded-xl border border-stone-300 p-3 outline-none focus:border-rose-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewingAppt(null)}
                className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700"
              >
                Close
              </button>
              <button
                type="button"
                disabled={reviewLoading}
                onClick={handleSubmitReview}
                className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}