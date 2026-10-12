const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("salonflow_token");
}

export function setToken(token) {
  localStorage.setItem("salonflow_token", token);
}

export function removeToken() {
  localStorage.removeItem("salonflow_token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload.message ||
        payload.error ||
        `Request failed with status ${response.status}`
    );
  }

  return payload;
}

export function getCollection(payload, key) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

export function formatPrice(pricePaise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(pricePaise || 0) / 100);
}

export function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}