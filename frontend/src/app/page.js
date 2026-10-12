"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  apiFetch,
  getCollection,
  getErrorMessage,
  formatPrice,
  getToken,
} from "@/lib/api";

function getStaffId(staff) {
  return staff?.staffId ?? staff?.staffProfileId ?? staff?.id;
}

function getStaffName(staff) {
  if (staff?.name) return staff.name;

  const user = staff?.user;

  if (user) {
    const name = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ");

    return name || user.name || user.email || "Stylist";
  }

  return "Stylist";
}

function getSlotTime(slot) {
  const value =
    typeof slot === "string"
      ? slot
      : slot?.startTime ?? slot?.start ?? "";

  if (!value) return "";

  const time = value.includes("T") ? value.split("T")[1] : value;

  return time.slice(0, 5);
}

function getStartTimestamp(date, slot) {
  const value =
    typeof slot === "string"
      ? slot
      : slot?.startTime ?? slot?.start ?? "";

  if (!value) return "";

  // Preserve timestamps that already contain a timezone.
  if (value.includes("T")) {
    if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
      return value;
    }

    // Treat timezone-less timestamps as Indian Standard Time.
    return `${value}+05:30`;
  }

  const time = value.length === 5 ? `${value}:00` : value;

  return `${date}T${time}+05:30`;
}

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState("");

  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");

  const [availability, setAvailability] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [bookingError, setBookingError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [notes, setNotes] = useState("");

  const [reviews, setReviews] = useState([]);

  // Initialize the date and load services & reviews on mount.
  useEffect(() => {
    const tomorrow = getTomorrow();

    setMinDate(tomorrow);
    setDate(tomorrow);

    async function loadData() {
      try {
        const payload = await apiFetch("/services");
        setServices(getCollection(payload, "services"));
      } catch (error) {
        setServiceError(getErrorMessage(error));
      } finally {
        setLoadingServices(false);
      }

      try {
        const reviewsPayload = await apiFetch("/reviews");
        setReviews(reviewsPayload?.data?.reviews || []);
      } catch (e) {
        console.error("Failed to fetch reviews:", e);
      }
    }

    loadData();
  }, []);

  async function findAvailability(event) {
    event.preventDefault();

    setBookingError("");
    setNotice("");
    setSelectedSlot(null);
    setAvailability([]);

    if (!selectedService || !date) {
      setBookingError("Please choose a service and date.");
      return;
    }

    setLoadingSlots(true);

    try {
      const query = new URLSearchParams({
        serviceId: selectedService,
        date,
      });

      const payload = await apiFetch(
        `/availability?${query.toString()}`
      );

      const staff = payload?.data?.staff ?? payload?.staff ?? [];

      setAvailability(Array.isArray(staff) ? staff : []);

      if (!Array.isArray(staff) || staff.length === 0) {
        setNotice(
          "No available appointments found for this date. Try another date."
        );
      }
    } catch (error) {
      setBookingError(getErrorMessage(error));
    } finally {
      setLoadingSlots(false);
    }
  }

  async function bookAppointment() {
    if (!selectedSlot) {
      setBookingError("Please select a time slot.");
      return;
    }

    if (!getToken()) {
      window.location.href = "/login";
      return;
    }

    const startTime = getStartTimestamp(date, selectedSlot.slot);

    if (!startTime) {
      setBookingError("The selected time slot is invalid. Please try again.");
      return;
    }

    setBooking(true);
    setBookingError("");
    setNotice("");

    try {
      await apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify({
          serviceId: Number(selectedService),
          staffId: Number(selectedSlot.staffId),
          startTime,
          notes: notes.trim() || undefined,
        }),
      });

      window.location.href = "/appointments?booked=1";
    } catch (error) {
      setBookingError(getErrorMessage(error));
    } finally {
      setBooking(false);
    }
  }

  const chosenService = services.find(
    (service) => String(service.id) === String(selectedService)
  );

  return (
    <>
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-600/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-rose-300">
              Your moment. Your style.
            </p>

            <h1 className="max-w-2xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
              A little time for{" "}
              <span className="text-rose-300">yourself.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-300">
              Discover your next look, choose your stylist, and book your
              salon appointment in just a few clicks.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#booking"
                className="rounded-full bg-rose-600 px-7 py-3.5 font-semibold text-white transition hover:bg-rose-500"
              >
                Book an appointment
              </a>

              <a
                href="#services"
                className="rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Explore services
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 text-sm text-stone-300">
              <div>
                <p className="text-2xl font-semibold text-white">Easy</p>
                <p>Online booking</p>
              </div>

              <div>
                <p className="text-2xl font-semibold text-white">
                  Your choice
                </p>
                <p>Choose your stylist</p>
              </div>

              <div>
                <p className="text-2xl font-semibold text-white">Flexible</p>
                <p>Find available times</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur sm:p-8">
              <div className="rounded-2xl bg-rose-100 p-6 text-stone-900">
                <p className="text-sm font-semibold uppercase tracking-widest text-rose-700">
                  The SalonFlow experience
                </p>

                <p className="mt-4 text-3xl font-semibold">
                  Good hair. Good mood.
                </p>

                <p className="mt-3 leading-7 text-stone-600">
                  Find a service that suits you, pick a time that works, and
                  leave the rest to your stylist.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-2 text-sm">
                    ✦ Haircuts
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 text-sm">
                    ✦ Styling
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 text-sm">
                    ✦ Care
                  </span>
                </div>
              </div>

              <p className="px-2 pt-5 text-sm text-stone-300">
                Your next appointment is just a few steps away.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 lg:px-8"
      >
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
              Our menu
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Services made for you
            </h2>
          </div>

          <p className="max-w-lg text-stone-500">
            Explore our services and choose the treatment that fits your style.
          </p>
        </div>

        {loadingServices ? (
          <p className="py-10 text-stone-500">Loading services...</p>
        ) : serviceError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {serviceError}
            <p className="mt-2 text-sm">
              Make sure your backend is running and the API URL is correct.
            </p>
          </div>
        ) : services.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-stone-500">
            No services are available right now.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <article
                key={service.id}
                className={`rounded-3xl border p-6 transition hover:-translate-y-1 hover:shadow-lg ${
                  String(selectedService) === String(service.id)
                    ? "border-rose-500 bg-rose-50"
                    : "border-stone-200 bg-white"
                }`}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-xl text-rose-700">
                  {["✂", "✦", "♡"][index % 3]}
                </div>

                <h3 className="text-xl font-semibold">{service.name}</h3>

                {service.description && (
                  <p className="mt-2 min-h-12 text-sm leading-6 text-stone-500">
                    {service.description}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold">
                      {formatPrice(service.pricePaise)}
                    </p>

                    <p className="mt-1 text-sm text-stone-500">
                      {service.durationMinutes} minutes
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(String(service.id));
                      setSelectedSlot(null);
                      setAvailability([]);
                      setBookingError("");
                      setNotice("");

                      document.getElementById("booking")?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    className="rounded-full border border-stone-300 px-4 py-2.5 text-sm font-semibold transition hover:border-rose-500 hover:text-rose-700"
                  >
                    Select
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="booking" className="scroll-mt-20 bg-rose-50 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
              Reserve your time
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Book your appointment
            </h2>

            <p className="mt-4 text-stone-600">
              Choose your service and date to see available stylists and times.
            </p>

            <form
              onSubmit={findAvailability}
              className="mt-8 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="service"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Service
                  </label>

                  <select
                    id="service"
                    value={selectedService}
                    onChange={(event) => {
                      setSelectedService(event.target.value);
                      setAvailability([]);
                      setSelectedSlot(null);
                      setBookingError("");
                      setNotice("");
                    }}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  >
                    <option value="">Choose a service</option>

                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} — {formatPrice(service.pricePaise)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="date"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Appointment date
                  </label>

                  <input
                    id="date"
                    type="date"
                    value={date}
                    min={minDate}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setAvailability([]);
                      setSelectedSlot(null);
                      setBookingError("");
                      setNotice("");
                    }}
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              </div>

              {chosenService && (
                <div className="mt-5 rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
                  <span className="font-semibold text-stone-900">
                    {chosenService.name}
                  </span>
                  {" · "}
                  {chosenService.durationMinutes} minutes
                  {" · "}
                  {formatPrice(chosenService.pricePaise)}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingSlots || loadingServices}
                className="mt-6 w-full rounded-full bg-stone-900 px-6 py-3.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingSlots
                  ? "Finding available times..."
                  : "Find available times"}
              </button>
            </form>

            {bookingError && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {bookingError}
              </div>
            )}

            {notice && (
              <div className="mt-5 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
                {notice}
              </div>
            )}

            {availability.length > 0 && (
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold">
                    Available appointments
                  </h3>

                  <p className="mt-1 text-sm text-stone-500">
                    Choose a time with one of our available stylists.
                  </p>
                </div>

                {availability.map((staff, index) => {
                  const staffId = getStaffId(staff);
                  const slots = Array.isArray(staff.slots)
                    ? staff.slots
                    : [];

                  return (
                    <div
                      key={staffId ?? index}
                      className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold">
                          {getStaffName(staff)}
                        </h4>

                        <span className="text-sm text-stone-500">
                          {slots.length} available{" "}
                          {slots.length === 1 ? "time" : "times"}
                        </span>
                      </div>

                      {slots.length === 0 ? (
                        <p className="mt-4 text-sm text-stone-500">
                          No available times for this stylist.
                        </p>
                      ) : (
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {slots.map((slot, slotIndex) => {
                            const time = getSlotTime(slot);

                            const active =
                              String(selectedSlot?.staffId) ===
                                String(staffId) &&
                              selectedSlot?.slot === slot;

                            return (
                              <button
                                type="button"
                                key={`${staffId}-${time}-${slotIndex}`}
                                onClick={() => {
                                  setSelectedSlot({
                                    staffId,
                                    staffName: getStaffName(staff),
                                    slot,
                                  });

                                  setBookingError("");
                                  setNotice("");
                                }}
                                className={`rounded-xl border px-2 py-3 text-sm font-medium transition ${
                                  active
                                    ? "border-rose-600 bg-rose-600 text-white"
                                    : "border-stone-200 hover:border-rose-400 hover:bg-rose-50"
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {selectedSlot && (
                  <div className="rounded-2xl border border-rose-200 bg-white p-6">
                    <h3 className="text-lg font-semibold">
                      Confirm your selection
                    </h3>

                    <div className="mt-3 space-y-1 text-sm text-stone-600">
                      <p>
                        <span className="font-medium text-stone-900">
                          Service:
                        </span>{" "}
                        {chosenService?.name}
                      </p>

                      <p>
                        <span className="font-medium text-stone-900">
                          Stylist:
                        </span>{" "}
                        {selectedSlot.staffName}
                      </p>

                      <p>
                        <span className="font-medium text-stone-900">
                          Date:
                        </span>{" "}
                        {date}
                      </p>

                      <p>
                        <span className="font-medium text-stone-900">
                          Time:
                        </span>{" "}
                        {getSlotTime(selectedSlot.slot)}
                      </p>

                      <p>
                        <span className="font-medium text-stone-900">
                          Price:
                        </span>{" "}
                        {formatPrice(chosenService?.pricePaise)}
                      </p>
                    </div>

                    <div className="mt-5">
                      <label
                        htmlFor="notes"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Notes for your stylist (optional)
                      </label>

                      <textarea
                        id="notes"
                        rows={3}
                        maxLength={1000}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Any preferences you'd like us to know?"
                        className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                      />
                    </div>

                    {!getToken() && (
                      <p className="mt-4 text-sm text-stone-500">
                        You'll need to sign in before confirming your
                        appointment.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={bookAppointment}
                      disabled={booking}
                      className="mt-5 w-full rounded-full bg-rose-600 px-6 py-3.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {booking
                        ? "Booking appointment..."
                        : getToken()
                          ? "Confirm appointment"
                          : "Sign in to book"}
                    </button>

                    <p className="mt-3 text-center text-xs text-stone-500">
                      Your appointment is confirmed only after the server
                      accepts your booking.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Customer Reviews & Feedback Section */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
            Real Experiences
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl text-stone-900">
            What our clients say
          </h2>
          <p className="mt-3 text-stone-500">
            Verified ratings and customer feedback from recent salon visits.
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center text-stone-500">
            <p>✦ Be the first to book and leave a review for your favorite stylist!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-500 text-lg">
                      {"★".repeat(rev.rating)}
                      {"☆".repeat(5 - rev.rating)}
                    </span>
                    <span className="text-xs text-stone-400">
                      {rev.service?.name}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-stone-700 italic">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="mt-6 border-t border-stone-100 pt-4">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold text-stone-900">
                      {rev.customer?.name || "Client"}
                    </span>
                    <span>with {rev.staff?.user?.name || "Stylist"}</span>
                  </div>

                  {rev.staffResponse && (
                    <div className="mt-3 rounded-xl bg-stone-50 p-3 text-xs text-stone-600 border-l-2 border-rose-500">
                      <span className="font-semibold text-stone-800">Salon Response: </span>
                      {rev.staffResponse}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-stone-900 p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Your next great look starts here.
            </h2>

            <p className="mt-3 text-stone-300">
              Already booked? Check your upcoming appointments anytime.
            </p>
          </div>

          <Link
            href="/appointments"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-stone-900 hover:bg-rose-100"
          >
            My appointments
          </Link>
        </div>
      </section>
    </>
  );
}
