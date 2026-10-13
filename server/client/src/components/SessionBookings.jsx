import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatTime } from "../format.js";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export default function SessionBookings({ refreshKey }) {
  const [date, setDate] = useState(todayUtc);
  const [sessions, setSessions] = useState([]);
  const [sessionsStatus, setSessionsStatus] = useState("loading");
  const [sessionsError, setSessionsError] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [details, setDetails] = useState(null);
  const [detailsStatus, setDetailsStatus] = useState("idle");
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchSessions() {
      try {
        const data = await api(`/sessions?date=${date}`);
        if (ignore) return;

        setSessions(data.sessions);
        setSessionsError("");
        setSessionsStatus("ready");
      } catch (error) {
        if (ignore) return;

        setSessionsError(error.message);
        setSessionsStatus("error");
      }
    }

    fetchSessions();

    return () => {
      ignore = true;
    };
  }, [date, refreshKey]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    let ignore = false;

    async function fetchBookings() {
      try {
        const data = await api(`/admin/sessions/${selectedId}/bookings`);
        if (ignore) return;

        setDetails(data);
        setDetailsError("");
        setDetailsStatus("ready");
      } catch (error) {
        if (ignore) return;

        setDetailsError(error.message);
        setDetailsStatus("error");
      }
    }

    fetchBookings();

    return () => {
      ignore = true;
    };
  }, [selectedId, refreshKey]);

  function handleDateChange(value) {
    if (!value) {
      return;
    }
    setDate(value);
    setSessionsStatus("loading");
    setSelectedId("");
    setDetails(null);
    setDetailsStatus("idle");
  }

  function selectSession(id) {
    setSelectedId(id);
    setDetails(null);
    setDetailsError("");
    setDetailsStatus("loading");
  }

  return (
    <div>
      <h2>Session bookings</h2>

      <label htmlFor="bookings-date">Date (UTC)</label>{" "}
      <input
        id="bookings-date"
        type="date"
        value={date}
        onChange={(event) => handleDateChange(event.target.value)}
      />

      {sessionsStatus === "loading" && <p role="status">Loading sessions...</p>}

      {sessionsStatus === "error" && (
        <p role="alert">Error: {sessionsError}</p>
      )}

      {sessionsStatus === "ready" && sessions.length === 0 && (
        <p>No sessions on this date.</p>
      )}

      {sessionsStatus === "ready" && sessions.length > 0 && (
        <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              {formatTime(session.startsAt)} - {session.bookedCount} of{" "}
              {session.capacity} booked{" "}
              <button type="button" onClick={() => selectSession(session.id)}>
                View bookings
              </button>
            </li>
          ))}
        </ul>
      )}

      {detailsStatus === "loading" && <p role="status">Loading bookings...</p>}

      {detailsStatus === "error" && <p role="alert">Error: {detailsError}</p>}

      {detailsStatus === "ready" && details && (
        <div>
          <h3>Bookings for {formatTime(details.session.startsAt)}</h3>

          {details.bookings.length === 0 && <p>No bookings yet.</p>}

          {details.bookings.length > 0 && (
            <ul>
              {details.bookings.map((booking) => (
                <li key={booking.id}>
                  {booking.member.name} ({booking.member.email}) - {booking.status}
                  {booking.checkedInAt && " - checked in"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}