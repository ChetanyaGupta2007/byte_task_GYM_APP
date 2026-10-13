import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { formatTime } from "../format.js";
import { usePolling } from "../usePolling.js";

async function fetchSessionData(date, isMember) {
  const query = date ? `?date=${date}` : "";
  const sessionsData = await api(`/sessions${query}`);

  const booked = {};
  const waiting = {};

  if (isMember) {
    const bookingsData = await api("/bookings/mine");
    const waitlistData = await api("/waitlist/mine");

    bookingsData.bookings
      .filter((booking) => booking.status === "confirmed")
      .forEach((booking) => {
        booked[booking.session.id] = true;
      });

    waitlistData.waitlist.forEach((entry) => {
      waiting[entry.session.id] = entry.position;
    });
  }

  return { sessions: sessionsData.sessions, booked, waiting };
}

export default function SessionsPage() {
  const { user } = useAuth();
  const isMember = user.role === "member";

  const [date, setDate] = useState("");
  const [sessions, setSessions] = useState([]);
  const [booked, setBooked] = useState({});
  const [waiting, setWaiting] = useState({});
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const version = useRef(0);

  useEffect(() => {
    let ignore = false;

    async function fetchFirst() {
      try {
        const data = await fetchSessionData(date, isMember);
        if (ignore) return;

        setSessions(data.sessions);
        setBooked(data.booked);
        setWaiting(data.waiting);
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
  }, [date, isMember, reloadKey]);

  const load = useCallback(async () => {
    const startedAt = version.current;

    try {
      const data = await fetchSessionData(date, isMember);
      if (version.current !== startedAt) return;

      setSessions(data.sessions);
      setBooked(data.booked);
      setWaiting(data.waiting);
    } catch (error) {
      if (version.current === startedAt) {
        setActionError(error.message);
      }
    }
  }, [date, isMember]);

  usePolling(load, 5000, busy || status !== "ready");

  function handleDateChange(value) {
    setDate(value);
    setStatus("loading");
    setLoadError("");
    setActionError("");
  }

  function retry() {
    setStatus("loading");
    setLoadError("");
    setReloadKey((key) => key + 1);
  }

  async function run(request) {
    version.current += 1;
    setBusy(true);
    setActionError("");

    try {
      await request();
    } catch (error) {
      setActionError(error.message);
    }

    await load();
    setBusy(false);
  }

  async function book(id) {
    version.current += 1;
    const before = { sessions, booked };

    setBusy(true);
    setActionError("");
    setSessions(
      sessions.map((session) =>
        session.id === id
          ? {
              ...session,
              bookedCount: session.bookedCount + 1,
              seatsRemaining: session.seatsRemaining - 1,
            }
          : session
      )
    );
    setBooked({ ...booked, [id]: true });

    try {
      await api("/bookings", { method: "POST", body: { sessionId: id } });
    } catch (error) {
      setSessions(before.sessions);
      setBooked(before.booked);
      setActionError(error.message);
    }

    await load();
    setBusy(false);
  }

  const joinWaitlist = (id) =>
    run(() => api("/waitlist", { method: "POST", body: { sessionId: id } }));

  const leaveWaitlist = (id) =>
    run(() => api(`/waitlist/${id}`, { method: "DELETE" }));

  return (
    <section>
      <h1>Sessions</h1>

      <div>
        <label htmlFor="date">Filter by date</label>{" "}
        <input
          id="date"
          type="date"
          value={date}
          onChange={(event) => handleDateChange(event.target.value)}
        />{" "}
        {date && (
          <button type="button" onClick={() => handleDateChange("")}>
            Show upcoming
          </button>
        )}
      </div>

      {actionError && <p role="alert">Error: {actionError}</p>}

      {status === "loading" && <p role="status">Loading sessions...</p>}

      {status === "error" && (
        <div>
          <p role="alert">Error: {loadError}</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === "ready" && sessions.length === 0 && <p>No sessions found.</p>}

      {status === "ready" && sessions.length > 0 && (
        <ul>
          {sessions.map((session) => {
            const started = new Date(session.startsAt) <= new Date();
            const full = session.seatsRemaining === 0;
            const isBooked = booked[session.id];
            const position = waiting[session.id];

            return (
              <li key={session.id}>
                <h2>{formatTime(session.startsAt)}</h2>

                <p>
                  {full
                    ? "Full"
                    : `${session.seatsRemaining} of ${session.capacity} seats left`}
                </p>

                {started && <p>This session has started.</p>}

                {!started && isMember && isBooked && <p>You are booked.</p>}

                {!started && isMember && !isBooked && position && (
                  <>
                    <p>On the waitlist, position {position}.</p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => leaveWaitlist(session.id)}
                    >
                      Leave waitlist
                    </button>
                  </>
                )}

                {!started && isMember && !isBooked && !position && !full && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => book(session.id)}
                  >
                    Book
                  </button>
                )}

                {!started && isMember && !isBooked && !position && full && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => joinWaitlist(session.id)}
                  >
                    Join waitlist
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}