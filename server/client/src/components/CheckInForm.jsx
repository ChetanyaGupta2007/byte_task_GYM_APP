import { useState } from "react";
import { api } from "../api.js";
import Field from "./Field.jsx";

export default function CheckInForm({ onCheckedIn }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setResult(null);

    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setError("Code must be 6 characters");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const data = await api("/admin/checkin", {
        method: "POST",
        body: { code: trimmed },
      });
      setResult(data.checkIn);
      setCode("");
      onCheckedIn();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Check in a member</h2>

      <Field
        id="checkin-code"
        label="Check-in code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        error={error}
        maxLength={6}
      />

      {result && (
        <p role="status">
          Checked in: {result.member.name} ({result.member.email})
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? "Checking..." : "Check in"}
      </button>
    </form>
  );
}