import { useEffect, useMemo, useState } from "react"

import { useApi } from "../api/hooks"
import Card from "../components/Card.jsx"
import PageHeader from "../components/ui/PageHeader.jsx"
import Button from "../components/ui/Button.jsx"
import { Field, Input, Select, Textarea } from "../components/ui/Input.jsx"

function money(n) {
  return Number(n || 0).toFixed(2)
}

export default function AdminPanel() {
  const api = useApi()

  const [inventory, setInventory] = useState([])
  const [poojas, setPoojas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Add inventory
  const [invName, setInvName] = useState("")
  const [invUnit, setInvUnit] = useState("piece")
  const [invStock, setInvStock] = useState("")
  const [invCpu, setInvCpu] = useState("")
  const [invMin, setInvMin] = useState("")

  // Add pooja
  const [pName, setPName] = useState("")
  const [pPrice, setPPrice] = useState("")
  const [pDesc, setPDesc] = useState("")

  // Map items to pooja
  const [mapPoojaId, setMapPoojaId] = useState("")
  const [mapRows, setMapRows] = useState([{ item_id: "", quantity_used: "" }])
  const selectedPooja = useMemo(
    () => poojas.find((p) => String(p.id) === String(mapPoojaId)),
    [poojas, mapPoojaId],
  )

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [inv, p] = await Promise.all([
        api.get("/api/inventory"),
        api.get("/api/poojas/all"),
      ])
      setInventory(inv.data || [])
      setPoojas(p.data || [])
      if ((p.data || []).length && !mapPoojaId) setMapPoojaId(String(p.data[0].id))
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedPooja) return
    const items = selectedPooja.items || []
    if (items.length) {
      setMapRows(
        items.map((it) => ({
          item_id: String(it.item_id),
          quantity_used: String(it.quantity_used),
        })),
      )
    } else {
      setMapRows([{ item_id: "", quantity_used: "" }])
    }
  }, [selectedPooja])

  const addInventory = async (e) => {
    e.preventDefault()
    setError("")
    try {
      await api.post("/api/inventory/add", {
        name: invName,
        unit: invUnit,
        current_stock: invStock === "" ? 0 : Number(invStock),
        cost_per_unit: invCpu === "" ? 0 : Number(invCpu),
        minimum_stock_alert: invMin === "" ? 0 : Number(invMin),
      })
      setInvName("")
      setInvStock("")
      setInvCpu("")
      setInvMin("")
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.message || "Failed to add inventory item")
    }
  }

  const addPooja = async (e) => {
    e.preventDefault()
    setError("")
    try {
      await api.post("/api/poojas/add", {
        name: pName,
        price: pPrice === "" ? 0 : Number(pPrice),
        description: pDesc,
        is_active: true,
      })
      setPName("")
      setPPrice("")
      setPDesc("")
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.message || "Failed to add pooja")
    }
  }

  const saveMapping = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const cleaned = mapRows
        .filter((r) => r.item_id && r.quantity_used !== "")
        .map((r) => ({ item_id: Number(r.item_id), quantity_used: Number(r.quantity_used) }))
      await api.put(`/api/poojas/${Number(mapPoojaId)}/items`, { items: cleaned })
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.message || "Failed to save mapping")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        subtitle="Manage poojas and inventory"
        right={
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Add inventory item">
          <form className="space-y-3" onSubmit={addInventory}>
            <Field label="Name">
              <Input value={invName} onChange={(e) => setInvName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Field label="Unit">
                  <Select value={invUnit} onChange={(e) => setInvUnit(e.target.value)}>
                    <option value="kg">kg</option>
                    <option value="litre">litre</option>
                    <option value="piece">piece</option>
                    <option value="bundle">bundle</option>
                  </Select>
                </Field>
              </div>
              <div>
                <Field label="Stock">
                  <Input value={invStock} onChange={(e) => setInvStock(e.target.value)} />
                </Field>
              </div>
              <div>
                <Field label="Min alert">
                  <Input value={invMin} onChange={(e) => setInvMin(e.target.value)} />
                </Field>
              </div>
            </div>
            <Field label="Cost per unit (₹)">
              <Input value={invCpu} onChange={(e) => setInvCpu(e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <Button>
                Add item
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Add pooja">
          <form className="space-y-3" onSubmit={addPooja}>
            <Field label="Name">
              <Input value={pName} onChange={(e) => setPName(e.target.value)} />
            </Field>
            <Field label="Price (₹)">
              <Input value={pPrice} onChange={(e) => setPPrice(e.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={3} />
            </Field>
            <div className="flex justify-end">
              <Button>
                Add pooja
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card title="Map inventory items to pooja">
        {loading ? (
          <div className="text-sm text-slate-600">Loading…</div>
        ) : (
          <form className="space-y-4" onSubmit={saveMapping}>
            <div>
              <Field label="Pooja">
                <Select value={mapPoojaId} onChange={(e) => setMapPoojaId(e.target.value)}>
                  {poojas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{money(p.price)})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="space-y-2">
              {mapRows.map((r, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Select
                    value={r.item_id}
                    onChange={(e) => {
                      const next = [...mapRows]
                      next[idx] = { ...next[idx], item_id: e.target.value }
                      setMapRows(next)
                    }}
                  >
                    <option value="">Select item</option>
                    {inventory.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unit})
                      </option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Qty used"
                    value={r.quantity_used}
                    onChange={(e) => {
                      const next = [...mapRows]
                      next[idx] = { ...next[idx], quantity_used: e.target.value }
                      setMapRows(next)
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMapRows((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={mapRows.length <= 1}
                    >
                      Remove
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMapRows((prev) => [...prev, { item_id: "", quantity_used: "" }])}
                    >
                      Add row
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="secondary">
                Save mapping
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

