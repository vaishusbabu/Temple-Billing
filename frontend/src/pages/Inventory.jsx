import { useEffect, useMemo, useState } from "react"

import { useApi } from "../api/hooks"
import Card from "../components/Card.jsx"
import PageHeader from "../components/ui/PageHeader.jsx"
import Button from "../components/ui/Button.jsx"
import Badge from "../components/ui/Badge.jsx"
import { Field, Input, Select } from "../components/ui/Input.jsx"

export default function Inventory() {
  const api = useApi()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [restockItemId, setRestockItemId] = useState("")
  const [restockQty, setRestockQty] = useState("")
  const [restockCost, setRestockCost] = useState("")
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await api.get("/api/inventory")
      setItems(res.data || [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(
    () => items.find((i) => String(i.id) === String(restockItemId)),
    [items, restockItemId],
  )

  const onRestock = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post("/api/inventory/restock", {
        item_id: Number(restockItemId),
        quantity_added: Number(restockQty),
        cost_per_unit: restockCost === "" ? null : Number(restockCost),
        note: "Restock",
      })
      setRestockQty("")
      setRestockCost("")
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.message || "Restock failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        subtitle="Stock updates automatically when billing"
        right={
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        }
      />

      <Card title="Current stock">
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
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Item</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Stock</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Min</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Cost/unit</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr
                    key={i.id}
                    className={[
                      "border-t border-slate-200/70",
                      i.is_low ? "bg-red-50/60" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{i.name}</div>
                      <div className="text-xs text-slate-500">{i.unit}</div>
                    </td>
                    <td className="px-3 py-2 text-right">{Number(i.current_stock).toFixed(3)}</td>
                    <td className="px-3 py-2 text-right">{Number(i.minimum_stock_alert).toFixed(3)}</td>
                    <td className="px-3 py-2 text-right">₹{Number(i.cost_per_unit).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      {i.is_low ? <Badge tone="danger">Low</Badge> : <Badge tone="ok">OK</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Add stock (restock)">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-3" onSubmit={onRestock}>
          <div className="sm:col-span-1">
            <Field label="Item" hint="Required">
              <Select value={restockItemId} onChange={(e) => setRestockItemId(e.target.value)}>
                <option value="">Select item</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div>
            <Field
              label="Quantity"
              hint={selected?.unit ? `Unit: ${selected.unit}` : ""}
            >
              <Input
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                placeholder="e.g. 5"
              />
            </Field>
          </div>
          <div>
            <Field label="Cost per unit" hint="Optional">
              <Input
                value={restockCost}
                onChange={(e) => setRestockCost(e.target.value)}
                placeholder="e.g. 600"
              />
            </Field>
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <Button disabled={saving || !restockItemId || !restockQty}>
              {saving ? "Saving..." : "Add Stock"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

