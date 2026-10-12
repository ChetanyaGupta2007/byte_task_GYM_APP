
import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { formatTime } from "../format.js";

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

  const load = useCallback(async (silent = false) => {
    try {
      const query = date ? `?date=${date}` : "";

      const [sessionsData, bookingsData, waitlistData] =
        await Promise.all([
          api(`/sessions${query}`),
          isMember ? api("/bookings/mine") : { bookings: [] },
          isMember ? api("/waitlist/mine") : { waitlist: [] },
        ]);

      const bookedMap = {};
      bookingsData.bookings
        .filter((booking) => booking.status === "confirmed")
        .forEach((booking) => {
          bookedMap[booking.session.id] = true;
        });

      const waitingMap = {};
      waitlistData.waitlist.forEach((entry) => {
        waitingMap[entry.session.id] = entry.position;
      });

      setSessions(sessionsData.sessions);
      setBooked(bookedMap);
      setWaiting(waitingMap);
      setStatus("ready");
      setLoadError("");
    } catch (error) {
      if (silent) {
        setActionError(error.message);
      } else {
        setLoadError(error.message);
        setStatus("error");
      }
    }
  }, [date, isMember]);

  useEffect(() => {
  let ignore = false;

  async function fetchSessions() {
    try {
      const query = date ? `?date=${date}` : "";

      const [sessionsData, bookingsData, waitlistData] =
        await Promise.all([
          api(`/sessions${query}`),
          isMember ? api("/bookings/mine") : { bookings: [] },
          isMember ? api("/waitlist/mine") : { waitlist: [] },
        ]);

      if (ignore) return;

      const bookedMap = {};
      bookingsData.bookings
        .filter((booking) => booking.status === "confirmed")
        .forEach((booking) => {
          bookedMap[booking.session.id] = true;
        });

      const waitingMap = {};
      waitlistData.waitlist.forEach((entry) => {
        waitingMap[entry.session.id] = entry.position;
      });

      setSessions(sessionsData.sessions);
      setBooked(bookedMap);
      setWaiting(waitingMap);
      setLoadError("");
      setStatus("ready");
    } catch (error) {
      if (ignore) return;

      setLoadError(error.message);
      setStatus("error");
    }
  }

  fetchSessions();

  return () => {
    ignore = true;
  };
}, [date, isMember]);

  function handleDateChange(value) {
    setDate(value);
    setStatus("loading");
    setLoadError("");
    setActionError("");
  }

  async function run(request) {
    setBusy(true);
    setActionError("");

    try {
      await request();
      await load(true);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  }

  const book = (id) =>
    run(() =>
      api("/bookings", {
        method: "POST",
        body: { sessionId: id },
      })
    );

  const joinWaitlist = (id) =>
    run(() =>
      api("/waitlist", {
        method: "POST",
        body: { sessionId: id },
      })
    );

  const leaveWaitlist = (id) =>
    run(() => api(`/waitlist/${id}`, { method: "DELETE" }));

  return (
    <section>
      <h1>Sessions</h1>

      <div className="filter">
        <label htmlFor="date">Filter by date</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(event) => handleDateChange(event.target.value)}
        />

        {date && (
          <button
            type="button"
            onClick={() => handleDateChange("")}
          >
            Show upcoming
          </button>
        )}
      </div>

      {actionError && (
        <p role="alert" className="error">
          Error: {actionError}
        </p>
      )}

      {status === "loading" && (
        <p role="status">Loading sessions...</p>
      )}

      {status === "error" && (
        <div>
          <p role="alert" className="error">
            Error: {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setLoadError("");
              load(false);
            }}
          >
            Try again
          </button>
        </div>
      )}

      {status === "ready" && sessions.length === 0 && (
        <p>No sessions found.</p>
      )}

      {status === "ready" && sessions.length > 0 && (
        <ul className="cards">
          {sessions.map((session) => {
            const started = new Date(session.startsAt) <= new Date();
            const full = session.seatsRemaining === 0;
            const isBooked = booked[session.id];
            const position = waiting[session.id];

            return (
              <li key={session.id} className="card">
                <h2>{formatTime(session.startsAt)}</h2>

                <p>
                  {full
                    ? "Full"
                    : `${session.seatsRemaining} of ${session.capacity} seats left`}
                </p>

                {started && <p>This session has started.</p>}

                {!started && isMember && isBooked && (
                  <p>You are booked.</p>
                )}

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
                    className="primary"
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
