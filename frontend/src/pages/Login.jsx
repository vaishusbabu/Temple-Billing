import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { API_BASE_URL } from "../api/client"
import { useAuth } from "../state/auth.jsx"
import Button from "../components/ui/Button.jsx"
import { Field, Input } from "../components/ui/Input.jsx"

export default function Login() {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin123")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Login failed")
      setAuth(data.access_token, data.user)
      navigate("/dashboard")
    } catch (err) {
      setError(err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm">
              <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold shadow-sm">
                TB
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-slate-900">
                  Temple Billing & Inventory
                </div>
                <div className="text-sm text-slate-600">
                  Simple billing • Auto stock deduction • Dashboard
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="font-semibold text-slate-900">Designed for temple staff</div>
                <div className="mt-1">
                  Clean screens, big buttons, and minimal typing—works on phone, tablet, and
                  desktop.
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="font-semibold text-slate-900">Inventory updates automatically</div>
                <div className="mt-1">
                  When a pooja is billed, the assigned items and quantities are deducted from stock.
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white shadow-sm">
              <div className="p-6 border-b border-slate-200/70">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sign in</h1>
                <p className="mt-1 text-sm text-slate-600">Use your staff/admin account.</p>
              </div>
              <form className="p-6 space-y-4" onSubmit={onSubmit}>
                <Field label="Username">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </Field>
                <Field label="Password">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="current-password"
                  />
                </Field>
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                <Button className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
                <div className="text-xs text-slate-500">
                  Backend: <span className="font-medium">{API_BASE_URL}</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

