const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) {
      onUnauthorized();
    }
    const error = new Error(data.error?.message || "Something went wrong");
    error.details = data.error?.details;
    throw error;
  }

  return data;
}