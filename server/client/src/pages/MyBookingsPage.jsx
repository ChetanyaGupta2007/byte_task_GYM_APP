import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { formatTime } from "../format.js";
import { usePolling } from "../usePolling.js";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchFirst() {
      try {
        const data = await api("/bookings/mine");
        if (ignore) return;

        setBookings(data.bookings);
        setLoadError("");
        setStatus("ready");
      } catch (error) {
        if (ignore) return;

        setLoadError(error.message);
        setStatus("error");
      }
    }

    fetchFirst();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const load = useCallback(async () => {
    try {
      const data = await api("/bookings/mine");
      setBookings(data.bookings);
    } catch (error) {
      setActionError(error.message);
    }
  }, []);

  usePolling(load, 10000, busy || status !== "ready");

  function retry() {
    setStatus("loading");
    setLoadError("");
    setReloadKey((key) => key + 1);
  }

  async function cancel(id) {
    setBusy(true);
    setActionError("");

    try {
      await api(`/bookings/${id}/cancel`, { method: "POST" });
    } catch (error) {
      setActionError(error.message);
    }

    await load();
    setBusy(false);
  }

  return (
    <section>
      <h1>My bookings</h1>

      {actionError && <p role="alert">Error: {actionError}</p>}

      {status === "loading" && <p role="status">Loading bookings...</p>}

      {status === "error" && (
        <div>
          <p role="alert">Error: {loadError}</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === "ready" && bookings.length === 0 && (
        <p>You have no bookings yet.</p>
      )}

      <ul>
        {bookings.map((booking) => (
          <li key={booking.id}>
            <h2>{formatTime(booking.session.startsAt)}</h2>
            <p>Status: {booking.status}</p>

            {booking.checkInCode && (
              <p>
                Check-in code: <strong>{booking.checkInCode}</strong>
              </p>
            )}

            {booking.checkedInAt && <p>You have been checked in.</p>}

            {booking.status === "confirmed" &&
              new Date(booking.session.startsAt) > new Date() && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => cancel(booking.id)}
                >
                  Cancel booking
                </button>
              )}
          </li>
        ))}
      </ul>
    </section>
  );
}