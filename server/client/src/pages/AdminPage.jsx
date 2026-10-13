import { useState } from "react";
import CreateSessionForm from "../components/CreateSessionForm.jsx";
import CheckInForm from "../components/CheckInForm.jsx";
import SessionBookings from "../components/SessionBookings.jsx";

export default function AdminPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((key) => key + 1);

  return (
    <section>
      <h1>Admin</h1>
      <CreateSessionForm onCreated={refresh} />
      <hr />
      <CheckInForm onCheckedIn={refresh} />
      <hr />
      <SessionBookings refreshKey={refreshKey} />
    </section>
  );
}