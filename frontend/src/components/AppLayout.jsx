import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../state/auth.jsx"
import Button from "./ui/Button.jsx"

const navItem = ({ isActive }) =>
  [
    "px-3 py-2 rounded-xl text-sm font-semibold transition",
    isActive
      ? "bg-indigo-600 text-white shadow-sm"
      : "text-slate-700 hover:bg-slate-100",
  ].join(" ")

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold shadow-sm">
              TB
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-slate-900 tracking-tight">
                Temple Billing
              </div>
              <div className="text-xs text-slate-500 -mt-0.5">
                Billing & Inventory
              </div>
            </div>
          </Link>
          <nav className="ml-2 hidden md:flex flex-wrap gap-1">
            <NavLink to="/dashboard" className={navItem}>
              Dashboard
            </NavLink>
            <NavLink to="/new-bill" className={navItem}>
              New Bill
            </NavLink>
            <NavLink to="/inventory" className={navItem}>
              Inventory
            </NavLink>
            <NavLink to="/history" className={navItem}>
              History
            </NavLink>
            <NavLink to="/admin" className={navItem}>
              Admin
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block text-sm text-slate-600">
              {user?.username ? (
                <>
                  <span className="font-medium text-slate-800">{user.username}</span>{" "}
                  <span className="text-slate-400">·</span> {user.role}
                </>
              ) : null}
            </div>
            <Button variant="secondary" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
        <div className="md:hidden border-t border-slate-200/70">
          <div className="mx-auto max-w-6xl px-4 py-2 flex gap-1 overflow-auto">
            <NavLink to="/dashboard" className={navItem}>
              Dashboard
            </NavLink>
            <NavLink to="/new-bill" className={navItem}>
              New Bill
            </NavLink>
            <NavLink to="/inventory" className={navItem}>
              Inventory
            </NavLink>
            <NavLink to="/history" className={navItem}>
              History
            </NavLink>
            <NavLink to="/admin" className={navItem}>
              Admin
            </NavLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

