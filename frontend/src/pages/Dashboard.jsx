import { useEffect, useMemo, useState } from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"

import { useApi } from "../api/hooks"
import Stat from "../components/Stat.jsx"
import Card from "../components/Card.jsx"
import PageHeader from "../components/ui/PageHeader.jsx"
import { Select } from "../components/ui/Input.jsx"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function formatMoney(n) {
  return `₹${Number(n || 0).toFixed(2)}`
}

export default function Dashboard() {
  const api = useApi()
  const [summary, setSummary] = useState(null)
  const [chart, setChart] = useState(null)
  const [popular, setPopular] = useState([])
  const [rangeDays, setRangeDays] = useState(30)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [s, c, p] = await Promise.all([
        api.get("/api/dashboard/summary"),
        api.get(`/api/dashboard/chart?range=${rangeDays}`),
        api.get("/api/dashboard/popular"),
      ])
      if (!alive) return
      setSummary(s.data)
      setChart(c.data)
      setPopular(p.data || [])
    })()
    return () => {
      alive = false
    }
  }, [api, rangeDays])

  const barData = useMemo(() => {
    if (!chart) return null
    return {
      labels: chart.labels,
      datasets: [
        {
          label: "Revenue",
          data: chart.revenue,
          backgroundColor: "rgba(79,70,229,0.6)",
          borderRadius: 6,
        },
      ],
    }
  }, [chart])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Revenue, cost, profit and trends"
        right={
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Range</span>
            <Select
              className="w-36"
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Revenue (all time)"
          value={formatMoney(summary?.totals?.revenue)}
        />
        <Stat label="Cost (all time)" value={formatMoney(summary?.totals?.cost)} />
        <Stat
          label="Profit (all time)"
          value={formatMoney(summary?.totals?.profit)}
        />
        <Stat
          label="Poojas"
          value={summary?.total_poojas?.all_time ?? "—"}
          sub={`Today: ${summary?.total_poojas?.today ?? "—"} · This month: ${
            summary?.total_poojas?.this_month ?? "—"
          }`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Revenue by day">
            {barData ? (
              <div className="h-[320px]">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { grid: { color: "rgba(148,163,184,0.25)" } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="text-sm text-slate-600">Loading…</div>
            )}
          </Card>
        </div>
        <Card title="Popular poojas">
          <div className="space-y-2">
            {popular?.length ? (
              popular.map((p) => (
                <div
                  key={p.pooja_name}
                  className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2"
                >
                  <div className="text-sm font-medium text-slate-900">
                    {p.pooja_name}
                  </div>
                  <div className="text-sm text-slate-600">{p.count}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-600">
                No data yet. Create a bill to start.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

