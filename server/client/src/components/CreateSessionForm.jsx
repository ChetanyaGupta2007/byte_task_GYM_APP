import { useState } from "react";
import { api } from "../api.js";
import Field from "./Field.jsx";

export default function CreateSessionForm({ onCreated }) {
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("6");
  const [capacity, setCapacity] = useState("20");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    setMessage("");

    const hourNumber = Number(hour);
    const size = Number(capacity);
    const startsAt = `${date}T${String(hourNumber).padStart(2, "0")}:00:00Z`;
    const found = {};

    if (!date) {
      found.date = "Date is required";
    } else if (new Date(startsAt) <= new Date()) {
      found.date = "Session must start in the future";
    }

    if (hour === "" || !Number.isInteger(hourNumber) || hourNumber < 0 || hourNumber > 23) {
      found.hour = "Hour must be a whole number from 0 to 23";
    }

    if (!Number.isInteger(size) || size < 1 || size > 20) {
      found.capacity = "Capacity must be a whole number from 1 to 20";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await api("/sessions", {
        method: "POST",
        body: { startsAt, capacity: size },
      });
      setMessage("Session created.");
      onCreated();
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Create a session</h2>

      <Field
        id="session-date"
        label="Date"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        error={errors.date}
      />

      <Field
        id="session-hour"
        label="Start hour (UTC, 0-23)"
        type="number"
        value={hour}
        onChange={(event) => setHour(event.target.value)}
        error={errors.hour}
      />

      <Field
        id="session-capacity"
        label="Capacity"
        type="number"
        value={capacity}
        onChange={(event) => setCapacity(event.target.value)}
        error={errors.capacity}
      />

      {serverError && <p role="alert">Error: {serverError}</p>}
      {message && <p role="status">{message}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create session"}
      </button>
    </form>
  );
}