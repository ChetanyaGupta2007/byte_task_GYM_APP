import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <nav aria-label="Main">
          <NavLink to="/" end>
            Sessions
          </NavLink>
          {user.role === "member" && <NavLink to="/bookings">My bookings</NavLink>}
          {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="user">
          <span>{user.name}</span>
          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main id="main" className="container">
        <Outlet />
      </main>
    </>
  );
}