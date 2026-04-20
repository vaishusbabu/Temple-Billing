import { useEffect, useMemo, useState } from "react"

import { useApi } from "../api/hooks"
import Card from "../components/Card.jsx"
import ReceiptModal from "../components/ReceiptModal.jsx"
import PageHeader from "../components/ui/PageHeader.jsx"
import Button from "../components/ui/Button.jsx"
import { Field, Input, Select, Textarea } from "../components/ui/Input.jsx"

function formatMoney(n) {
  return `₹${Number(n || 0).toFixed(2)}`
}

export default function NewBill() {
  const api = useApi()
  const [poojas, setPoojas] = useState([])
  const [poojaId, setPoojaId] = useState("")
  const [devoteeName, setDevoteeName] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [receipt, setReceipt] = useState(null)
  const [receiptOpen, setReceiptOpen] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api.get("/api/poojas")
      if (!alive) return
      setPoojas(res.data || [])
      if ((res.data || []).length) setPoojaId(String(res.data[0].id))
    })()
    return () => {
      alive = false
    }
  }, [api])

  const selected = useMemo(
    () => poojas.find((p) => String(p.id) === String(poojaId)),
    [poojas, poojaId],
  )

  const onGenerate = async (e) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const res = await api.post("/api/bills/create", {
        pooja_id: Number(poojaId),
        devotee_name: devoteeName,
        notes,
      })
      setReceipt(res.data)
      setReceiptOpen(true)
      setDevoteeName("")
      setNotes("")
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to create bill")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Bill" subtitle="Select a pooja and generate receipt" />

      <Card title="Billing">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={onGenerate}>
          <div className="sm:col-span-2">
            <Field label="Pooja">
              <Select value={poojaId} onChange={(e) => setPoojaId(e.target.value)}>
                {poojas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatMoney(p.price)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Devotee name" hint="Required">
              <Input
                value={devoteeName}
                onChange={(e) => setDevoteeName(e.target.value)}
                placeholder="Enter name"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Notes" hint="Optional">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any note"
              />
            </Field>
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
            <div className="text-sm text-slate-700">
              Amount{" "}
              <span className="text-slate-400">·</span>{" "}
              <span className="font-semibold text-slate-900">
                {formatMoney(selected?.price)}
              </span>
            </div>
            <Button disabled={saving || !poojaId || !devoteeName.trim()}>
              {saving ? "Generating..." : "Generate Bill"}
            </Button>
          </div>

          {error ? (
            <div className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </form>
      </Card>

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        data={receipt}
      />
    </div>
  )
}

