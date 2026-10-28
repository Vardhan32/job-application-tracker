import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { initials } from "../utils/format";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/" className="brand">
            <span className="brand__mark">T</span>
            <span className="brand__name">Tracker</span>
          </NavLink>

          <nav className="nav" aria-label="Main navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav__link${isActive ? " is-active" : ""}`}
            >
              <LayoutDashboard size={17} />
              <span>Applications</span>
            </NavLink>
            <NavLink
              to="/interviews"
              className={({ isActive }) => `nav__link${isActive ? " is-active" : ""}`}
            >
              <CalendarDays size={17} />
              <span>Interviews</span>
            </NavLink>
          </nav>

          <div className="topbar__user">
            <span className="avatar" title={user?.email}>
              {initials(user?.name)}
            </span>
            <span className="user-name">{user?.name?.split(" ")[0]}</span>
            <button
              type="button"
              className="icon-btn"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
