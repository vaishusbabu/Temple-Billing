import { useEffect, useState } from "react"

import { useApi } from "../api/hooks"
import Card from "../components/Card.jsx"
import PageHeader from "../components/ui/PageHeader.jsx"
import Button from "../components/ui/Button.jsx"
import { Field, Input } from "../components/ui/Input.jsx"

export default function BillingHistory() {
  const api = useApi()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams()
      if (from) qs.set("from", from)
      if (to) qs.set("to", to)
      const res = await api.get(`/api/bills/history?${qs.toString()}`)
      setRows(res.data || [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Billing History" subtitle="Latest 500 bills" />

      <Card
        title="Filter"
        right={
          <Button variant="secondary" size="sm" onClick={load}>
            Apply
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Field label="From">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
          </div>
          <div>
            <Field label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFrom("")
                setTo("")
                setTimeout(load, 0)
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Bills">
        {loading ? (
          <div className="text-sm text-slate-600">Loading…</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div className="overflow-auto rounded-2xl border border-slate-200/70">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Devotee</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Pooja</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-200/70 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">#{r.id}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{r.devotee_name}</td>
                    <td className="px-3 py-2 text-slate-700">{r.pooja_name}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900">
                      ₹{Number(r.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

