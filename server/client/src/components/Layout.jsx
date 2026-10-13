import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const linkStyle = ({ isActive }) => ({
  fontWeight: isActive ? "bold" : "normal",
});

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <nav aria-label="Main">
        <NavLink to="/" end style={linkStyle}>
          Sessions
        </NavLink>
        {user.role === "member" && (
          <>
            {" | "}
            <NavLink to="/bookings" style={linkStyle}>
              My bookings
            </NavLink>
          </>
        )}
        {user.role === "admin" && (
          <>
            {" | "}
            <NavLink to="/admin" style={linkStyle}>
              Admin
            </NavLink>
          </>
        )}
      </nav>
      <p>
        Signed in as {user.name}{" "}
        <button type="button" onClick={logout}>
          Log out
        </button>
      </p>
      <hr />
      <main>
        <Outlet />
      </main>
    </>
  );
}